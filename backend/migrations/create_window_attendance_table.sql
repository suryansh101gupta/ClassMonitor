-- Window Attendance Table Migration
-- Stores per-window attendance results for detailed analytics

CREATE TABLE IF NOT EXISTS window_attendance (
    lecture_id VARCHAR(24) NOT NULL,
    student_id VARCHAR(24) NOT NULL,
    window_id INT NOT NULL,
    status TINYINT NOT NULL COMMENT '1 for present, 0 for absent',
    frame_count INT DEFAULT 0 COMMENT 'Number of frames student was detected in this window',
    total_frames INT DEFAULT 0 COMMENT 'Total frames processed in this window',
    presence_ratio DECIMAL(5,4) DEFAULT 0.0000 COMMENT 'frame_count / total_frames',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (lecture_id, student_id, window_id),
    INDEX idx_lecture_student (lecture_id, student_id),
    INDEX idx_lecture_window (lecture_id, window_id),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (lecture_id) REFERENCES lectures(lecture_id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add comments for clarity
ALTER TABLE window_attendance 
    COMMENT = 'Stores per-window attendance data for detailed analytics and debugging';
