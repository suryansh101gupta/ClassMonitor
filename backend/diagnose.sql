-- ============================================================
-- ClassMonitor — DIAGNOSTIC QUERIES
-- Run these one by one in MySQL to find why results are empty
-- ============================================================
USE attendance_system;

-- ── 1. What students are in MySQL? ──────────────────────────
SELECT student_id, roll_no, name, class_id FROM students;

-- ── 2. What classes exist? ──────────────────────────────────
SELECT * FROM classes;

-- ── 3. What lectures exist? (latest 20 by date) ─────────────
SELECT lecture_id, class_id, subject_id, teacher_id, lecture_date
FROM lectures
ORDER BY lecture_date DESC
LIMIT 20;

-- ── 4. How many lectures per class? ─────────────────────────
SELECT class_id, COUNT(*) AS lecture_count,
       MIN(lecture_date) AS earliest,
       MAX(lecture_date) AS latest
FROM lectures
GROUP BY class_id;

-- ── 5. How many lectures per class that are in the PAST? ────
SELECT class_id, COUNT(*) AS past_lectures
FROM lectures
WHERE lecture_date <= CURDATE()
GROUP BY class_id;

-- ── 6. What attendance records exist? ───────────────────────
SELECT a.attendance_id, a.student_id, a.lecture_id, a.status,
       l.class_id, l.subject_id, l.lecture_date
FROM attendance a
JOIN lectures l ON a.lecture_id = l.lecture_id
LIMIT 30;

-- ── 7. Replace '101' with YOUR actual roll_no ───────────────
-- Find which student_id your roll_no maps to:
SET @my_roll_no = '101';    -- ← CHANGE THIS to match your registered roll_no
SET @my_class   = 3;        -- ← CHANGE THIS to match your class_id (integer)

SELECT student_id, roll_no, name, class_id
FROM students
WHERE roll_no = @my_roll_no;

-- ── 8. Check lectures exist for your class ──────────────────
SELECT subject_id, COUNT(*) AS lectures, MAX(lecture_date) AS last_date
FROM lectures
WHERE class_id = @my_class AND lecture_date <= CURDATE()
GROUP BY subject_id;

-- ── 9. Check attendance exists for your student ─────────────
SET @my_student_id = (SELECT student_id FROM students WHERE roll_no = @my_roll_no);
SELECT CONCAT('student_id = ', IFNULL(@my_student_id, 'NOT FOUND')) AS debug;

SELECT l.subject_id, COUNT(*) AS total_records, SUM(a.status) AS present_count
FROM attendance a
JOIN lectures l ON a.lecture_id = l.lecture_id
WHERE a.student_id = @my_student_id
GROUP BY l.subject_id;

-- ── 10. Full summary query (what the API runs) ───────────────
-- If this returns rows, the API SHOULD work.
-- If it returns empty, the data issue is confirmed.
SELECT l.subject_id, s.subject_name, COUNT(*) AS total_lectures
FROM lectures l
JOIN subjects s ON l.subject_id = s.subject_id
WHERE l.class_id  = @my_class
  AND l.lecture_date <= CURDATE()
GROUP BY l.subject_id, s.subject_name;

-- ── 11. What teachers are registered in MySQL? ───────────────
SELECT teacher_id, name, email FROM teachers;

-- ── 12. What lectures does the first teacher own? ────────────
SET @first_teacher = (SELECT teacher_id FROM teachers ORDER BY created_at LIMIT 1);
SELECT class_id, subject_id, COUNT(*) AS lecture_count, MAX(lecture_date) AS latest
FROM lectures
WHERE teacher_id = @first_teacher
GROUP BY class_id, subject_id;
