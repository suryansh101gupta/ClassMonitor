import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import teacherModel from "../models/teacher_model.js";
import pool from "../config/mysql.js";
import { invalidateCache } from "../middlewares/redis_middleware.js";

export const registerTeacher = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.json({ success: false, message: "missing details" });
    }

    // 1. Check existing
    const existing = await teacherModel.findOne({ email });
    if (existing) {
      console.log("existing password:", existing?.password);
      return res.status(400).json({ msg: "Teacher already exists" });
    }

    // 2. Hash password
    const hashedPassword = await bcrypt.hash(password, 7);

    // 3. Save in MongoDB
    const teacher = new teacherModel({
      name,
      email,
      password: hashedPassword,
      subjects: [] // initially empty
    });

    const savedTeacher = await teacher.save();

    try{
    // 4. Insert into MySQL
        const sql = `
        INSERT INTO teachers (teacher_id, name, email)
        VALUES (?, ?, ?)
        `;

        const [result] = await pool.execute(sql, [
            savedTeacher._id.toString(),
            name,
            email
        ]);

        // Invalidate cache after successful save
        await invalidateCache("all_teachers");

        const token = jwt.sign({ id: savedTeacher._id, role: "teacher" }, process.env.JWT_SECRET, {
            expiresIn: "7d",
        });

        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        const teacherResponse = {
            id: savedTeacher._id,
            name: savedTeacher.name,
            email: savedTeacher.email,
            subjects: savedTeacher.subjects
        };

        return res.status(201).json({
            success: true,
            message: "teacher registered successfully in both DBs",
            teacher: teacherResponse,
            mysqlId: result.insertId,
            token: token
        });

    } catch (mysqlError) {
      console.error("MySQL Error:", mysqlError);

      // ROLLBACK Mongo
      try {
        await teacherModel.findByIdAndDelete(savedTeacher._id);
      } catch (rollbackErr) {
        console.error("Rollback failed:", rollbackErr);
        }

      return res.status(500).json({
        success: false,
        message: "Registration failed (MySQL error)",
      });
    }
  } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};

export const loginTeacher = async (req, res) => {
  console.log("req.body:", req.body);
  const { email, password } = req.body;

  if (!email || !password) {
    return res.json({
      success: false,
      message: "email and password are required",
    });
  }

  try {
    const teacher = await teacherModel.findOne({ email }).select("+password");

    if (!teacher) {
      return res.json({ success: false, message: "teacher does not exist" });
    }

    const isMatch = await bcrypt.compare(password, teacher.password);
    

    if (!isMatch) {
      return res.json({ success: false, message: "Invalid Email or Password" });
    }

    const token = jwt.sign({ id: teacher._id, role: "teacher" } , process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({ success: true, message: "logged in" });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};

export const logoutTeacher = async (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
    });

    return res.status(200).json({
      success: true,
      message: "Teacher logged out successfully"
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

export const getAllTeachers = async(req, res) => {
  try{
    const teachers = await teacherModel.find({}, '_id name');

    res.status(200).json({
      success: true,
      data: teachers
    })
  }catch(error){
    res.status(500).json({
      success: false,
      message: 'Error fetching teachers',
      error: error.message
    });
  }
}

export const getStudentsByLecture = async (req, res) => {
  try {
    const {
      lecture_date,
      class_id,
      subject_id,
      start_time,
      end_time,
    } = req.query;

    const teacher_id = req.userId;

    let query = `
      SELECT a.student_id, a.status, l.lecture_id
      FROM lectures l
      JOIN attendance a ON l.lecture_id = a.lecture_id
      WHERE 1=1
    `;

    let values = [];

    if (lecture_date) {
      query += " AND l.lecture_date = ?";
      values.push(lecture_date);
    }

    if (class_id) {
      query += " AND l.class_id = ?";
      values.push(class_id);
    }

    if (subject_id) {
      query += " AND l.subject_id = ?";
      values.push(subject_id);
    }

    if (teacher_id) {
      query += " AND l.teacher_id = ?";
      values.push(teacher_id);
    }

    if (start_time) {
      query += " AND l.start_time >= ?";
      values.push(start_time);
    }

    if (end_time) {
      query += " AND l.end_time <= ?";
      values.push(end_time);
    }

    const [rows] = await pool.execute(query, values);

    return res.status(200).json({
      success: true,
      count: rows.length,
      data: rows,
    });

  } catch (error) {
    console.error("Error fetching attendance:", error);
    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

export const getLectures = async(req, res) => {
  try{
    const {
      class_id,
      start_date,
      end_date
    } = req.query;

    const teacher_id = req.userId;

    let query = `
      SELECT lecture_id, class_id, subject_id, lecture_date, start_time, end_time
      FROM lectures
      WHERE teacher_id = ?
    `;

    let values = [teacher_id];

    if(class_id){
      query += ` AND class_id = ?`;
      values.push(class_id);
    }

    if(start_date && end_date){
      query += ` AND lecture_date BETWEEN ? AND ?`;
      values.push(start_date, end_date);
    }else if(start_date){
      query += ` AND lecture_date >= ?`;
      values.push(start_date);
    }else if (end_date) {
      query += ` AND lecture_date <= ?`;
      values.push(end_date);
    }

    const [rows] = await pool.execute(query, values);

    return res.status(200).json({
      success: true,
      count: rows.length,
      data: rows,
    });

  }catch(error){
    console.error("Error fetching Timetable:", error);
    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
}