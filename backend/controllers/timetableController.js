import lectureModel from "../models/timetableModel.js";
import classModel from "../models/classModel.js";
import pool from "../config/mysql.js";

export const saveTimetable = async (req, res) => {
    try {
        const { classId, events } = req.body;

        if (!classId || !events || !Array.isArray(events) || events.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Class ID and events array are required"
            });
        }

        // Validate class exists
        const classExists = await classModel.findById(classId);
        if (!classExists) {
            return res.status(404).json({
                success: false,
                message: "Class not found"
            });
        }

        // Process events to match SQL schema with generated lecture IDs
        const processedEvents = events.map((event, index) => {
            const startDate = new Date(event.start_time);
            const lectureDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
            
            return {
                lecture_id: `lecture_${classId}_${Date.now()}_${index}`,
                class_id: classId,
                subject_id: event.subject_id,
                teacher_id: event.teacher_id,
                lecture_date: lectureDate,
                start_time: startDate.toTimeString().slice(0, 8), // HH:MM:SS format
                end_time: new Date(event.end_time).toTimeString().slice(0, 8),
                created_at: new Date(),
                processed: 0
            };
        });

        // Delete existing lectures for this class
        await lectureModel.deleteMany({ class_id: classId });

        // Insert new events
        const savedEvents = await lectureModel.insertMany(processedEvents);

        try {
            // Sync with MySQL - First delete existing lectures for this class
            const deleteSql = `DELETE FROM lectures WHERE class_id = ?`;
            await pool.execute(deleteSql, [classId]);

            // Insert new lectures with generated lecture IDs
            const insertSql = `
                INSERT INTO lectures (lecture_id, class_id, subject_id, teacher_id, lecture_date, start_time, end_time, created_at, processed)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            for (const event of processedEvents) {
                await pool.execute(insertSql, [
                    event.lecture_id,
                    event.class_id,
                    event.subject_id,
                    event.teacher_id,
                    event.lecture_date,
                    event.start_time,
                    event.end_time,
                    event.created_at,
                    event.processed
                ]);
            }

            return res.json({
                success: true,
                message: "Lectures saved successfully",
                eventsCount: savedEvents.length,
                classId: classId,
                lectureIds: processedEvents.map(e => e.lecture_id)
            });

        } catch (sqlError) {
            // Rollback MongoDB changes
            await lectureModel.deleteMany({ class_id: classId });
            
            console.error("MySQL Error:", sqlError);
            return res.status(500).json({
                success: false,
                message: "Failed to save lectures to database"
            });
        }

    } catch (error) {
        console.error("Lecture save error:", error);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const getTimetableByClass = async (req, res) => {
    try {
        const { classId } = req.params;

        if (!classId) {
            return res.status(400).json({
                success: false,
                message: "Class ID is required"
            });
        }

        const lectureEvents = await lectureModel.find({ class_id: classId })
            .populate('class_id', 'name')
            .populate('subject_id', 'name')
            .populate('teacher_id', 'name email');

        if (!lectureEvents || lectureEvents.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No lectures found for this class"
            });
        }

        res.status(200).json({
            success: true,
            data: lectureEvents
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching timetable',
            error: error.message
        });
    }
};

export const getAllTimetables = async (req, res) => {
    try {
        const lectures = await lectureModel.find({})
            .populate('class_id', 'name')
            .populate('subject_id', 'name')
            .populate('teacher_id', 'name');

        res.status(200).json({
            success: true,
            data: lectures
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching timetables',
            error: error.message
        });
    }
};
