import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'new_password',
  database: 'attendance_system'
});

const classId = '69d0bf0ec218515d3b26f38c';

try {
  // 1. MySQL current date/time
  const [now] = await pool.query('SELECT NOW() as now, CURDATE() as today, CURTIME() as time');
  console.log('=== MySQL current time ===');
  console.log(now[0]);

  // 2. All lectures for this class
  const [rows] = await pool.query(
    'SELECT lecture_id, class_id, lecture_date, DATE(lecture_date) as date_part, start_time, end_time, processed FROM lectures WHERE class_id = ? ORDER BY lecture_date, start_time',
    [classId]
  );
  console.log(`\n=== Lectures in DB for class ${classId}: ${rows.length} total ===`);
  rows.forEach(r => console.log(r));

  // 3. Check each condition individually
  const [check] = await pool.query(
    `SELECT lecture_id,
       lecture_date,
       start_time, end_time,
       DATE(lecture_date) = CURDATE() AS date_matches,
       start_time <= CURTIME() AS start_passed,
       end_time >= CURTIME() AS not_ended
     FROM lectures WHERE class_id = ?`,
    [classId]
  );
  console.log('\n=== Condition breakdown ===');
  check.forEach(r => console.log(r));

  // 4. The exact scheduler query
  const [active] = await pool.query(
    `SELECT * FROM lectures
     WHERE DATE(lecture_date) = CURDATE()
     AND start_time <= CURTIME()
     AND end_time >= CURTIME()
     AND class_id = ?
     LIMIT 1`,
    [classId]
  );
  console.log('\n=== Scheduler query result ===');
  console.log(active.length > 0 ? active[0] : 'NO ROWS FOUND');

} finally {
  await pool.end();
}
