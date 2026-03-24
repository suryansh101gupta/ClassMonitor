import subjectModel from "../models/subjectModel.js";
import pool from "../config/mysql.js";
import { invalidateCache } from "../middlewares/redis_middleware.js";

export const createSubject = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Missing fields"
      });
    }

    const normalizedName = name.trim().toUpperCase();

    // Check duplicate
    const existing = await subjectModel.findOne({ name: normalizedName });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Subject already exists"
      });
    }

    // Save in Mongo
    const subject = new subjectModel({
      name: normalizedName
    });

    const savedSubject = await subject.save();

    try {
      // Sync with MySQL
      const sql = `
        INSERT INTO subjects (subject_id, subject_name)
        VALUES (?, ?)
      `;

      await pool.execute(sql, [
        savedSubject._id.toString(),
        name
      ]);

      // Invalidate cache after successful save
      await invalidateCache("all_subjects");

      return res.status(201).json({
        success: true,
        subject_id: savedSubject._id,
        subject_name: savedSubject.name
      });

    } catch (sqlError) {
      // Rollback Mongo
      await subjectModel.findByIdAndDelete(savedSubject._id);

      console.log(sqlError)

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

export const getAllSubjects = async (req, res) => {
  try {
    const subjects = await subjectModel.find({}, '_id name'); 
    // only fetch _id and name

    res.status(200).json({
      success: true,
      data: subjects
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching subjects',
      error: error.message
    });
  }
};