import cron from "node-cron";
import db from "../config/mysql.js";
import { client } from "../config/redis.js";
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
        // 2. Get Redis data
        const data = await client.hGetAll(`lecture:${lectureId}`);

        console.log("Finalizing lecture:", lectureId);
        console.log("[SCHED] finalize lecture:", lectureId, "redis hash fields:", Object.keys(data).length);

        // 3. Get all students (IMPORTANT)
        const [students] = await db.query(`
          SELECT student_id, roll_no FROM students WHERE class_id = ?
        `, [classId]);

        // Start transaction for atomic operations
        await db.query("START TRANSACTION");
        
        let successCount = 0;
        for (let student of students) {
          try {
            const studentId = student?.student_id ?? null;
            if (!studentId) {
              console.warn("[SCHED] finalize: missing student_id", student);
              continue;
            }

            // Redis stores string → convert
            const count = parseInt(data[String(student.roll_no)] || "0");

            // 4. Apply threshold logic
            const status = count >= 3 ? 1 : 0;

            // 5. Insert attendance with duplicate prevention
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
        
        // 7. Mark lecture processed
        await db.query(`
          UPDATE lectures SET processed = 1 WHERE lecture_id = ?
        `, [lectureId]);
        
        // Commit transaction if all operations succeeded
        await db.query("COMMIT");
        
        // 6. Cleanup Redis (after successful commit)
        await client.del(`lecture:${lectureId}`);
        
        console.log(`Lecture finalized: ${lectureId}, processed ${successCount} students`);
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