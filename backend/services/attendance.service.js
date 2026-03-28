import { client } from "../config/redis.js";
import db from "../config/mysql.js";

// Process window-based attendance data
export async function processWindowData(lectureId, windowId, students, totalFrames) {
  const windowKey = `lecture:${lectureId}:window:${windowId}`;
  const processedWindowsKey = `lecture:${lectureId}:processed_windows`;

  console.log("[SERVICE] processWindowData:", { lectureId, windowId, studentCount: students.length, totalFrames });

  try {
    // Check idempotency - skip if window already processed
    const isProcessed = await client.sIsMember(processedWindowsKey, String(windowId));
    if (isProcessed) {
      console.log(`[SERVICE] Window ${windowId} already processed, skipping`);
      return;
    }

    // Store student counts for this window
    if (students.length > 0) {
      const pipeline = client.multi();
      
      for (const student of students) {
        const { roll_no, count } = student;
        pipeline.hSet(windowKey, String(roll_no), String(count));
      }
      
      await pipeline.exec();
    }

    // Mark window as processed
    await client.sAdd(processedWindowsKey, String(windowId));

    // Set TTL for window data (2 hours)
    await client.expire(windowKey, 7200);
    await client.expire(processedWindowsKey, 7200);

    console.log(`[SERVICE] Window ${windowId} processed successfully`);

  } catch (error) {
    console.error(`[SERVICE] Error processing window ${windowId}:`, error);
    throw error;
  }
}

// Get all window data for a lecture
export async function getAllWindowData(lectureId) {
  const pattern = `lecture:${lectureId}:window:*`;
  const windowKeys = await client.keys(pattern);
  
  const windowData = {};
  for (const key of windowKeys) {
    const windowId = key.split(':').pop();
    const data = await client.hGetAll(key);
    if (Object.keys(data).length > 0) {
      windowData[windowId] = data;
    }
  }
  
  return windowData;
}

// Get total number of processed windows for a lecture
export async function getProcessedWindowCount(lectureId) {
  const key = `lecture:${lectureId}:processed_windows`;
  return await client.sCard(key);
}

// Calculate attendance based on window presence ratio
export async function calculateAttendanceFromWindows(lectureId, totalWindows, presenceThreshold = 0.3, attendanceThreshold = 0.6) {
  const windowData = await getAllWindowData(lectureId);
  const processedCount = await getProcessedWindowCount(lectureId);
  
  console.log(`[SERVICE] Calculating attendance for lecture ${lectureId}:`, {
    totalWindows,
    processedWindows: processedCount,
    windowsWithData: Object.keys(windowData).length
  });

  // If no windows processed, return empty result
  if (processedCount === 0) {
    return {};
  }

  const attendanceResults = {};
  
  // Collect all unique students across all windows
  const allStudents = new Set();
  for (const windowData of Object.values(windowData)) {
    Object.keys(windowData).forEach(rollNo => allStudents.add(rollNo));
  }

  // Calculate attendance for each student
  for (const rollNo of allStudents) {
    let presentWindows = 0;
    
    // Check each window for student presence
    for (const [windowId, windowData] of Object.entries(windowData)) {
      const frameCount = parseInt(windowData[rollNo] || "0");
      const totalFrames = parseInt(Object.values(windowData).reduce((sum, count) => sum + parseInt(count), 0));
      
      if (totalFrames > 0) {
        const presenceRatio = frameCount / totalFrames;
        if (presenceRatio >= presenceThreshold) {
          presentWindows++;
        }
      }
    }
    
    const attendanceRatio = presentWindows / processedCount;
    const status = attendanceRatio >= attendanceThreshold ? 1 : 0;
    
    attendanceResults[rollNo] = {
      presentWindows,
      totalWindows: processedCount,
      attendanceRatio,
      status
    };
  }

  return attendanceResults;
}

// Legacy functions for backward compatibility
export async function updateStudentCounts(lectureId, studentIds) {
  console.log("[SERVICE] Legacy updateStudentCounts called - consider migrating to window-based system");
  const key = `lecture:${lectureId}`;
  const uniqueStudents = [...new Set(studentIds)];
  
  const promises = uniqueStudents.map(id =>
    client.hIncrBy(key, String(id), 1)
  );

  await Promise.all(promises);
  await client.expire(key, 7200);
}

export async function getLectureCounts(lectureId) {
  const key = `lecture:${lectureId}`;
  return await client.hGetAll(key);
}

export async function clearLecture(lectureId) {
  // Clear all window data
  const pattern = `lecture:${lectureId}:*`;
  const keys = await client.keys(pattern);
  
  if (keys.length > 0) {
    await client.del(keys);
    console.log(`[SERVICE] Cleared ${keys.length} keys for lecture ${lectureId}`);
  }
}

// Store individual window results in SQL for analytics (optional)
export async function storeWindowResults(lectureId, windowId, students, totalFrames, presenceThreshold = 0.3) {
  try {
    const windowResults = [];
    
    for (const student of students) {
      const { roll_no, count } = student;
      const presenceRatio = totalFrames > 0 ? count / totalFrames : 0;
      const status = presenceRatio >= presenceThreshold ? 1 : 0;
      
      // Get student_id from roll_no (this would need a lookup)
      const [studentData] = await db.query(
        'SELECT student_id FROM students WHERE roll_no = ?',
        [roll_no]
      );
      
      if (studentData.length > 0) {
        windowResults.push([
          lectureId,
          studentData[0].student_id,
          windowId,
          status,
          count,
          totalFrames,
          presenceRatio
        ]);
      }
    }
    
    if (windowResults.length > 0) {
      await db.query(`
        INSERT INTO window_attendance 
        (lecture_id, student_id, window_id, status, frame_count, total_frames, presence_ratio)
        VALUES ?
      `, [windowResults]);
      
      console.log(`[SERVICE] Stored ${windowResults.length} window results for window ${windowId}`);
    }
    
  } catch (error) {
    console.error(`[SERVICE] Error storing window results for window ${windowId}:`, error);
    // Don't throw error - this is optional functionality
  }
}