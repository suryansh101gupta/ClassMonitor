USE attendance_system;

-- 1. What's MySQL's current date and time?
SELECT NOW() AS mysql_now, CURDATE() AS mysql_date, CURTIME() AS mysql_time;

-- 2. Show ALL lectures for this class_id, with their stored dates and times
SELECT lecture_id, class_id, lecture_date, DATE(lecture_date) AS date_part, start_time, end_time, processed
FROM lectures
WHERE class_id = '69d0bf0ec218515d3b26f38c'
ORDER BY lecture_date, start_time;

-- 3. Exactly reproduce the scheduler query to see why it fails
SELECT *, 
  DATE(lecture_date) = CURDATE() AS date_matches,
  start_time <= CURTIME() AS start_passed,
  end_time >= CURTIME() AS not_ended
FROM lectures
WHERE class_id = '69d0bf0ec218515d3b26f38c'
ORDER BY lecture_date, start_time;
