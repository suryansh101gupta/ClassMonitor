import cron from "node-cron";
import db from "../config/mysql.js";
import { calculateAttendanceFromWindows, clearLecture } from "../services/attendance.service.js";
import "../globals.js";

// runs every minute
cron.schedule("* * * * *", async () => {
  try {
    // Use global class_id if available, otherwise default to 3
    const classId = global.activeClassId || 3;
    
    // 1. Find lectures that ended
    const [lectures] = await db.query(`
      SELECT lecture_id
      FROM lectures
      WHERE class_id = ?
      AND end_time <= CURTIME()
      AND DATE(lecture_date) = CURDATE()
      AND processed = 0
    `, [classId]);

    for (let lecture of lectures) {
      const lectureId = lecture?.lecture_id ?? null;
      if (!lectureId) {
        console.warn("[SCHED] finalize: missing lecture_id", lecture);
        continue;
      }

      try {
        console.log(`[SCHED] Finalizing lecture ${lectureId} using window-based system`);

        // 2. Get all students for the class
        const [students] = await db.query(`
          SELECT student_id, roll_no FROM students WHERE class_id = ?
        `, [classId]);

        // 3. Calculate attendance using window-based system
        const attendanceResults = await calculateAttendanceFromWindows(lectureId, 0, 0.3, 0.6);
        
        console.log(`[SCHED] Window-based results for lecture ${lectureId}:`, 
          Object.keys(attendanceResults).length, "students processed");

        // Start transaction for atomic operations
        await db.query("START TRANSACTION");
        
        let successCount = 0;
        for (let student of students) {
          try {
            const studentId = student?.student_id ?? null;
            const rollNo = student?.roll_no ?? null;
            
            if (!studentId || !rollNo) {
              console.warn("[SCHED] finalize: missing student data", student);
              continue;
            }

            // Get attendance result from window calculation
            const result = attendanceResults[String(rollNo)];
            let status = 0; // Default to absent
            
            if (result) {
              status = result.status;
              console.log(`[SCHED] Student ${rollNo}: present=${result.presentWindows}/${result.totalWindows} (${(result.attendanceRatio * 100).toFixed(1)}%) -> ${status ? 'PRESENT' : 'ABSENT'}`);
            } else {
              console.log(`[SCHED] Student ${rollNo}: no window data -> ABSENT`);
            }

            // 4. Insert attendance with duplicate prevention
            await db.query(`
              INSERT IGNORE INTO attendance (student_id, lecture_id, status)
              VALUES (?, ?, ?)
            `, [studentId, lectureId, status]);
            
            successCount++;
          } catch (studentErr) {
            console.error(`[SCHED] finalize: error processing student ${student?.student_id}:`, studentErr);
            // Continue with other students even if one fails
          }
        }
        
        // 5. Mark lecture processed
        await db.query(`
          UPDATE lectures SET processed = 1 WHERE lecture_id = ?
        `, [lectureId]);
        
        // Commit transaction if all operations succeeded
        await db.query("COMMIT");
        
        // 6. Cleanup Redis (after successful commit)
        await clearLecture(lectureId);
        
        console.log(`[SCHED] Lecture ${lectureId} finalized: ${successCount} students processed using window-based system`);

      } catch (lectureErr) {
        // Rollback transaction on error
        await db.query("ROLLBACK");
        console.error(`[SCHED] finalize: failed to finalize lecture ${lectureId}:`, lectureErr);
      }
    }

  } catch (err) {
    console.error("Finalize error:", err);
  }
});