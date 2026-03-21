import cron from "node-cron";
import db from "../config/mysql.js"; // your mysql connection
import "../globals.js";

// run every minute
cron.schedule("* * * * *", async () => {
  try {
    // Use global class_id if available, otherwise default to 3
    const classId = global.activeClassId || 3;
    
    const [rows] = await db.query(`
      SELECT * FROM lectures
      WHERE DATE(lecture_date) = CURDATE()
      AND start_time <= CURTIME()
      AND end_time >= CURTIME()
      AND class_id = ?
      LIMIT 1
    `, [classId]);

    console.log("[SCHED] lecture check ran. found:", rows.length);
    if (rows[0]) console.log("[SCHED] lecture row keys:", Object.keys(rows[0]));

    if (rows.length > 0) {
      const lectureId =
        rows[0].lecture_id ??
        null;

      global.activeLectureId = lectureId;
      console.log("Active lecture:", global.activeLectureId);
    } else {
      global.activeLectureId = null;
      console.log("No active lecture");
    }

  } catch (err) {
    console.error("Scheduler error:", err);
  }
});