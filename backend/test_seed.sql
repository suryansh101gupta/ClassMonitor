-- ============================================================
-- ClassMonitor — SMART TEST SEED v2
-- Auto-detects your student's class_id and inserts lectures
-- Run EACH section separately in MySQL Workbench
-- ============================================================
USE attendance_system;

-- ============================================================
-- SECTION A: Verify what you have right now
-- ============================================================

-- A1. See all students (find your roll_no and class_id)
SELECT student_id, roll_no, name, class_id FROM students;

-- A2. See which class_ids have lectures in the past
SELECT class_id, COUNT(*) AS lecture_count, MIN(lecture_date) AS first, MAX(lecture_date) AS last
FROM lectures
WHERE lecture_date <= CURDATE()
GROUP BY class_id;

-- A3. See which class_ids have lectures at all (future too)
SELECT class_id, COUNT(*) AS total_lectures, MIN(lecture_date), MAX(lecture_date)
FROM lectures GROUP BY class_id;

-- A4. What teachers exist?
SELECT teacher_id, name FROM teachers;

-- ============================================================
-- SECTION B: Set your variables (EDIT THESE)
-- ============================================================

-- After running A1, put your roll_no here:
SET @MY_ROLL_NO = '101';   -- ← YOUR roll_no (from students table)

-- This auto-fetches the class_id already stored in MySQL for that student:
SET @MY_CLASS   = (SELECT class_id FROM students WHERE roll_no = @MY_ROLL_NO);
SET @MY_STUDENT = (SELECT student_id FROM students WHERE roll_no = @MY_ROLL_NO);
SET @MY_TEACHER = (SELECT teacher_id FROM teachers ORDER BY created_at LIMIT 1);

SELECT
  CONCAT('roll_no=',  IFNULL(@MY_ROLL_NO, 'NULL')) AS roll_no,
  CONCAT('class_id=', IFNULL(@MY_CLASS,   'NULL')) AS class_id,
  CONCAT('student_id=',IFNULL(@MY_STUDENT,'NULL')) AS student_id,
  CONCAT('teacher_id=',IFNULL(@MY_TEACHER,'NULL')) AS teacher_id;

-- ============================================================
-- SECTION C: Wipe old conflicting data for this class (safe)
-- ============================================================

-- Remove attendance for this class's lectures first (FK order)
DELETE a FROM attendance a
JOIN lectures l ON a.lecture_id = l.lecture_id
WHERE l.class_id = @MY_CLASS;

-- Remove lectures for this class
DELETE FROM lectures WHERE class_id = @MY_CLASS;

-- Confirm clean slate
SELECT COUNT(*) AS remaining_lectures FROM lectures WHERE class_id = @MY_CLASS;

-- ============================================================
-- SECTION D: Insert lectures for the student's class
--   Using past dates (all <= today = 2026-06-28) so the
--   lecture_date <= CURDATE() filter picks them all up.
-- ============================================================

INSERT INTO lectures (class_id, subject_id, teacher_id, lecture_date, start_time, end_time) VALUES
-- HPC (subject 1) — 10 lectures
(@MY_CLASS, 1, @MY_TEACHER, '2026-06-01', '09:00:00', '10:00:00'),
(@MY_CLASS, 1, @MY_TEACHER, '2026-06-03', '09:00:00', '10:00:00'),
(@MY_CLASS, 1, @MY_TEACHER, '2026-06-05', '09:00:00', '10:00:00'),
(@MY_CLASS, 1, @MY_TEACHER, '2026-06-08', '09:00:00', '10:00:00'),
(@MY_CLASS, 1, @MY_TEACHER, '2026-06-10', '09:00:00', '10:00:00'),
(@MY_CLASS, 1, @MY_TEACHER, '2026-06-12', '09:00:00', '10:00:00'),
(@MY_CLASS, 1, @MY_TEACHER, '2026-06-15', '09:00:00', '10:00:00'),
(@MY_CLASS, 1, @MY_TEACHER, '2026-06-17', '09:00:00', '10:00:00'),
(@MY_CLASS, 1, @MY_TEACHER, '2026-06-19', '09:00:00', '10:00:00'),
(@MY_CLASS, 1, @MY_TEACHER, '2026-06-22', '09:00:00', '10:00:00'),
-- DL (subject 2) — 8 lectures
(@MY_CLASS, 2, @MY_TEACHER, '2026-06-02', '10:00:00', '11:00:00'),
(@MY_CLASS, 2, @MY_TEACHER, '2026-06-04', '10:00:00', '11:00:00'),
(@MY_CLASS, 2, @MY_TEACHER, '2026-06-06', '10:00:00', '11:00:00'),
(@MY_CLASS, 2, @MY_TEACHER, '2026-06-09', '10:00:00', '11:00:00'),
(@MY_CLASS, 2, @MY_TEACHER, '2026-06-11', '10:00:00', '11:00:00'),
(@MY_CLASS, 2, @MY_TEACHER, '2026-06-13', '10:00:00', '11:00:00'),
(@MY_CLASS, 2, @MY_TEACHER, '2026-06-16', '10:00:00', '11:00:00'),
(@MY_CLASS, 2, @MY_TEACHER, '2026-06-18', '10:00:00', '11:00:00'),
-- NLP (subject 3) — 7 lectures
(@MY_CLASS, 3, @MY_TEACHER, '2026-06-01', '11:00:00', '12:00:00'),
(@MY_CLASS, 3, @MY_TEACHER, '2026-06-04', '11:00:00', '12:00:00'),
(@MY_CLASS, 3, @MY_TEACHER, '2026-06-07', '11:00:00', '12:00:00'),
(@MY_CLASS, 3, @MY_TEACHER, '2026-06-11', '11:00:00', '12:00:00'),
(@MY_CLASS, 3, @MY_TEACHER, '2026-06-14', '11:00:00', '12:00:00'),
(@MY_CLASS, 3, @MY_TEACHER, '2026-06-18', '11:00:00', '12:00:00'),
(@MY_CLASS, 3, @MY_TEACHER, '2026-06-21', '11:00:00', '12:00:00'),
-- BI (subject 4) — 6 lectures
(@MY_CLASS, 4, @MY_TEACHER, '2026-06-02', '13:00:00', '14:00:00'),
(@MY_CLASS, 4, @MY_TEACHER, '2026-06-05', '13:00:00', '14:00:00'),
(@MY_CLASS, 4, @MY_TEACHER, '2026-06-09', '13:00:00', '14:00:00'),
(@MY_CLASS, 4, @MY_TEACHER, '2026-06-12', '13:00:00', '14:00:00'),
(@MY_CLASS, 4, @MY_TEACHER, '2026-06-16', '13:00:00', '14:00:00'),
(@MY_CLASS, 4, @MY_TEACHER, '2026-06-20', '13:00:00', '14:00:00'),
-- PR (subject 5) — 6 lectures
(@MY_CLASS, 5, @MY_TEACHER, '2026-06-03', '14:00:00', '15:00:00'),
(@MY_CLASS, 5, @MY_TEACHER, '2026-06-06', '14:00:00', '15:00:00'),
(@MY_CLASS, 5, @MY_TEACHER, '2026-06-10', '14:00:00', '15:00:00'),
(@MY_CLASS, 5, @MY_TEACHER, '2026-06-13', '14:00:00', '15:00:00'),
(@MY_CLASS, 5, @MY_TEACHER, '2026-06-17', '14:00:00', '15:00:00'),
(@MY_CLASS, 5, @MY_TEACHER, '2026-06-24', '14:00:00', '15:00:00');

-- Confirm lectures inserted
SELECT subject_id, COUNT(*) AS inserted
FROM lectures WHERE class_id = @MY_CLASS
GROUP BY subject_id;

-- ============================================================
-- SECTION E: Insert attendance for YOUR student
--   HPC: 8/10 = 80%   DL: 6/8 = 75%   NLP: 4/7 = 57%
--   BI:  3/6 = 50%    PR: 6/6 = 100%
-- ============================================================

-- HPC: absent on 08-Jun and 22-Jun
INSERT INTO attendance (lecture_id, student_id, status)
SELECT l.lecture_id, @MY_STUDENT,
  CASE WHEN l.lecture_date IN ('2026-06-08','2026-06-22') THEN 0 ELSE 1 END
FROM lectures l
WHERE l.class_id = @MY_CLASS AND l.subject_id = 1;

-- DL: absent on 13-Jun and 16-Jun
INSERT INTO attendance (lecture_id, student_id, status)
SELECT l.lecture_id, @MY_STUDENT,
  CASE WHEN l.lecture_date IN ('2026-06-13','2026-06-16') THEN 0 ELSE 1 END
FROM lectures l
WHERE l.class_id = @MY_CLASS AND l.subject_id = 2;

-- NLP: absent on 07-Jun, 14-Jun, 21-Jun
INSERT INTO attendance (lecture_id, student_id, status)
SELECT l.lecture_id, @MY_STUDENT,
  CASE WHEN l.lecture_date IN ('2026-06-07','2026-06-14','2026-06-21') THEN 0 ELSE 1 END
FROM lectures l
WHERE l.class_id = @MY_CLASS AND l.subject_id = 3;

-- BI: absent on 09-Jun, 16-Jun, 20-Jun
INSERT INTO attendance (lecture_id, student_id, status)
SELECT l.lecture_id, @MY_STUDENT,
  CASE WHEN l.lecture_date IN ('2026-06-09','2026-06-16','2026-06-20') THEN 0 ELSE 1 END
FROM lectures l
WHERE l.class_id = @MY_CLASS AND l.subject_id = 4;

-- PR: all present
INSERT INTO attendance (lecture_id, student_id, status)
SELECT l.lecture_id, @MY_STUDENT, 1
FROM lectures l
WHERE l.class_id = @MY_CLASS AND l.subject_id = 5;

-- Also link teacher to subjects (needed for teacher page)
INSERT IGNORE INTO teacher_subject (teacher_id, subject_id) VALUES
  (@MY_TEACHER, 1), (@MY_TEACHER, 2), (@MY_TEACHER, 3),
  (@MY_TEACHER, 4), (@MY_TEACHER, 5);

-- ============================================================
-- SECTION F: VERIFY — should match frontend
-- ============================================================
SELECT s.subject_name,
       COUNT(*)                                           AS total,
       SUM(a.status)                                      AS attended,
       SUM(1 - a.status)                                  AS absent,
       ROUND(SUM(a.status)/COUNT(*)*100, 1)               AS pct
FROM attendance a
JOIN lectures l ON a.lecture_id = l.lecture_id
JOIN subjects s ON l.subject_id = s.subject_id
WHERE a.student_id = @MY_STUDENT
  AND l.class_id   = @MY_CLASS
  AND l.lecture_date <= CURDATE()
GROUP BY s.subject_name
ORDER BY s.subject_name;

-- VERIFY — teacher page: all students in the class
SELECT st.roll_no, st.name AS student,
       s.subject_name,
       COUNT(*) AS total, SUM(a.status) AS present
FROM attendance a
JOIN lectures  l  ON a.lecture_id = l.lecture_id
JOIN students  st ON a.student_id = st.student_id
JOIN subjects  s  ON l.subject_id = s.subject_id
WHERE l.class_id   = @MY_CLASS
  AND l.teacher_id = @MY_TEACHER
GROUP BY st.roll_no, st.name, s.subject_name
ORDER BY st.roll_no;
