-- ============================================================
-- ClassMonitor — STEP BY STEP SINGLE-BLOCK SEED
-- Run ALL of this as ONE selection in MySQL Workbench
-- (Ctrl+A then Ctrl+Enter, or click "Run Script")
-- ============================================================
USE attendance_system;

-- ── STEP 1: Show table schemas ───────────────────────────────
SELECT TABLE_NAME, COLUMN_NAME, COLUMN_TYPE, COLUMN_KEY
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = 'attendance_system'
  AND TABLE_NAME IN ('teachers','lectures','students','attendance')
ORDER BY TABLE_NAME, ORDINAL_POSITION;

-- ── STEP 2: Show current data counts ────────────────────────
SELECT 'students'  AS tbl, COUNT(*) AS cnt FROM students  UNION ALL
SELECT 'teachers',          COUNT(*)       FROM teachers   UNION ALL
SELECT 'lectures',          COUNT(*)       FROM lectures   UNION ALL
SELECT 'attendance',        COUNT(*)       FROM attendance;

-- ── STEP 3: Show all students ────────────────────────────────
SELECT student_id, roll_no, name, class_id FROM students;

-- ── STEP 4: Show all teachers ────────────────────────────────
SELECT teacher_id, name, email FROM teachers;

-- ── STEP 5: Show lectures grouped by class ───────────────────
SELECT class_id, COUNT(*) AS lecture_count,
       MIN(lecture_date) AS earliest, MAX(lecture_date) AS latest
FROM lectures GROUP BY class_id;

-- ── STEP 6: Show past lectures grouped by class ──────────────
SELECT class_id, COUNT(*) AS past_lecture_count
FROM lectures WHERE lecture_date <= CURDATE() GROUP BY class_id;

-- ── STEP 7: Show attendance grouped by class ─────────────────
SELECT l.class_id, COUNT(*) AS attendance_rows, SUM(a.status) AS present_count
FROM attendance a JOIN lectures l ON a.lecture_id = l.lecture_id
GROUP BY l.class_id;
