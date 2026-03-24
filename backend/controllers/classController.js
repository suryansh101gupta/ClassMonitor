import classModel from "../models/classModel.js";
import pool from "../config/mysql.js";
import { invalidateCache } from "../middlewares/redis_middleware.js";

export const createClass = async (req, res) => {
    try {
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields"
            });
        }

        // Save in Mongo
        const newClass = new classModel({
            name
        });

        const savedClass = await newClass.save();

        try {
            // Sync with MySQL
            const sql = `
                INSERT INTO classes (class_id, class_name)
                VALUES (?, ?)
            `;

            await pool.execute(sql, [
                savedClass._id.toString(),
                name
            ]);

            // Invalidate cache after successful save
            await invalidateCache("all_classes");

            return res.status(201).json({
                success: true,
                class_id: savedClass._id,
                class_name: savedClass.name
            });

        } catch (sqlError) {
            // Rollback Mongo
            await classModel.findByIdAndDelete(savedClass._id);

            console.log(sqlError);

            return res.status(500).json({
                success: false,
                message: "SQL Error"
            });
        }

    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

export const getAllClasses = async (req, res) => {
    try {
        const classes = await classModel.find({}, '_id name');

        res.status(200).json({
            success: true,
            data: classes
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching classes',
            error: error.message
        });
    }
};
