import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import userModel from "../models/userModel.js";
import transporter from "../config/nodemailer.js";
import crypto from "crypto";
import {
  EMAIL_VERIFY_TEMPLATE,
  PASSWORD_RESET_TEMPLATE,
} from "../config/emailTemplates.js";

import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import s3 from "../config/s3.js";

import pool from "../config/mysql.js";

export const register = async (req, res) => {
  // console.log("req.body:", req.body);
  const { name, email, password, roll_no, class_id } = req.body;

  if (!name || !email || !password || !roll_no || !class_id) {
    return res.json({ success: false, message: "missing details" });
  }

  try {
    const existingUser = await userModel.findOne({
      $or: [{ email }, { roll_no }],
    });

    if (existingUser) {
      return res.json({ success: false, message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 7);

    const user = new userModel({
      name,
      email,
      password: hashedPassword,
      roll_no,
      class_id,
    });

    const savedUser = await user.save();

    try {
      const sql = `
        INSERT INTO students (roll_no, name, email, class_id)
        VALUES (?, ?, ?, ?)
     `;

      const [result] = await pool.execute(sql, [
        roll_no,
        name,
        email,
        String(class_id),
      ]);

      const token = jwt.sign({ id: savedUser._id, role: "user" }, process.env.JWT_SECRET, {
        expiresIn: "7d",
      });

      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      const mailOptions = {
        from: process.env.SENDER_EMAIL,
        to: email,
        subject: "Welcome to ClassMonitor",
        text: `Welcome to ClassMonitor. Your account has been created with email-id: ${email}`,
      };

      await transporter.sendMail(mailOptions);

      return res.status(201).json({
        success: true,
        message: "User registered successfully in both DBs",
        user: savedUser,
        mysqlId: result.insertId,
      });
    } catch (mysqlError) {
      console.error("MySQL Error:", mysqlError);

      // ROLLBACK Mongo
      await userModel.findByIdAndDelete(savedUser._id);

      return res.status(500).json({
        success: false,
        message: "Registration failed (MySQL error)",
      });
    }
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};

export const login = async (req, res) => {
  // console.log("req.body:", req.body);
  const { email, password } = req.body;

  if (!email || !password) {
    return res.json({
      success: false,
      message: "email and password are required",
    });
  }

  try {
    const user = await userModel.findOne({ email });

    if (!user) {
      return res.json({ success: false, message: "user does not exist" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.json({ success: false, message: "Invalid Email or Password" });
    }

    const token = jwt.sign({ id: user._id, role: "user" }, process.env.JWT_SECRET, {
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

export const logout = async (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
    });

    return res.json({ success: true, message: "logged out" });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};

export const sendVerifyOtp = async (req, res) => {
  try {
    // console.log("send otp - req.body:", req.body);
    const userId = req.userId;
    const user = await userModel.findById(userId);

    if (user.isAccountVerified) {
      return res.json({ success: false, message: "Account already verified" });
    } else {
      const otp = crypto.randomInt(Math.pow(10, 5), Math.pow(10, 6)).toString();
      user.verifyOtp = otp;
      user.verifiedOtpExpireAt = Date.now() + 5 * 60 * 1000;

      await user.save();

      const mailOption = {
        from: process.env.SENDER_EMAIL,
        to: user.email,
        subject: "Acconut Verification OTP",
        // text: `Your OTP to verify your account is: ${otp}`
        html: EMAIL_VERIFY_TEMPLATE.replace("{{otp}}", otp).replace(
          "{{email}}",
          user.email,
        ),
      };
      await transporter.sendMail(mailOption);
      res.json({ success: true, message: "verification otp sent" });
    }
  } catch (error) {
    return res.json({ success: false, message: `send otp - ${error.message}` });
  }
};

export const verifyEmail = async (req, res) => {
  // defensive logging to help debug clients that send no/invalid body
  // console.log("verifyEmail - req.body:", req.body);
  const { otp } = req.body;
  const userId = req.userId;

  if (!userId || !otp) {
    return res.json({
      success: false,
      message: "Missing Details: userId and otp are required",
    });
  }

  try {
    const user = await userModel.findById(userId);
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    // check OTP exists and matches
    if (user.verifyOtp === "" || user.verifyOtp !== otp) {
      return res.json({ success: false, message: "Invalid OTP" });
    }

    // check expiry
    if (user.verifiedOtpExpireAt < Date.now()) {
      return res.json({ success: false, message: "OTP expired" });
    }

    user.isAccountVerified = true;

    user.verifyOtp = "";
    user.verifiedOtpExpireAt = 0;

    await user.save();

    return res.json({ success: true, message: "Email verified successfully" });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};

export const isAuthenticated = async (req, res) => {
  try {
    return res.json({ success: true, message: "User logged in" });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};

export const sendResetOtp = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.json({ success: false, message: "email required" });
  }

  try {
    const user = await userModel.findOne({ email });

    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    const otp = crypto.randomInt(Math.pow(10, 5), Math.pow(10, 6)).toString();
    user.resetOtp = otp;
    user.resetOtpExpireAt = Date.now() + 5 * 60 * 1000;

    await user.save();

    const mailOption = {
      from: process.env.SENDER_EMAIL,
      to: user.email,
      subject: "Password Reset OTP",
      // text: `Your OTP for resetting account password is: ${otp}`
      html: PASSWORD_RESET_TEMPLATE.replace("{{otp}}", otp).replace(
        "{{email}}",
        user.email,
      ),
    };
    await transporter.sendMail(mailOption);

    res.json({ success: true, message: "Reset otp sent" });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};

export const resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;

  if (!email || !otp || !newPassword) {
    return res.json({ success: false, message: "some details missing" });
  }

  try {
    const user = await userModel.findOne({ email });

    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    if (user.resetOtp === "" || user.resetOtp !== otp) {
      return res.json({ success: false, message: "Invalid OTP" });
    }

    if (user.resetOtpExpireAt < Date.now()) {
      return res.json({ success: false, message: "OTP expired" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;

    user.resetOtp = "";
    user.resetOtpExpireAt = 0;

    await user.save();

    return res.json({
      success: true,
      message: "new password created and saved",
    });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};

export const getUploadUrl = async (req, res) => {
  try {
    const { fileName, fileType, fileSize } = req.body;
    const userId = req.userId;

    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

    if (fileSize > MAX_SIZE) {
      return res.status(400).json({ success: false, message: "File too large" });
    }
    
    if (!ALLOWED_TYPES.includes(fileType.toLowerCase())) {
      return res.status(400).json({ success: false, message: "Invalid file type" });
    }


    if (!fileName || !fileType) {
      return res.status(400).json({
        success: false,
        message: "Missing file metadata",
      });
    }

    // Unique S3 key per upload (timestamp + random suffix to avoid collisions)
    const ext = (fileName.split(".").pop() || "jpg").toLowerCase();
    const timestamp = Date.now();
    const random = crypto.randomBytes(4).toString("hex");
    const s3Key = `students/${userId}/${timestamp}_${random}.${ext}`;

    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: s3Key,
      ContentType: fileType,
    });

    const fileUrl = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Key}`;

    const uploadUrl = await getSignedUrl(s3, command, {
      expiresIn: 60,
    });

    return res.json({
      success: true,
      uploadUrl,
      fileUrl,
      s3Key,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updatePhoto = async (req, res) => {
  try {
    const userId = req.body.userId || req.userId;
    const { s3Key, photoUrl } = req.body;

    if (!s3Key) {
      return res.status(400).json({
        success: false,
        message: "s3Key is required",
      });
    }

    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Store S3 key and full URL (face-service can extract key from URL or use s3Key)
    user.s3key = s3Key;
    user.photoUrl =
      photoUrl ||
      `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Key}`;
    user.photoUploaded = true;

    // Reset face processing state for new photo
    user.faceProcessed = false;
    user.faceEncoding = [];
    user.faceProcessedAt = null;

    // Increment version so change stream and consumers see a new photo
    user.photoVersion = (user.photoVersion || 0) + 1;

    await user.save();

    return res.json({
      success: true,
      message:
        "Photo uploaded successfully. Face processing will happen shortly.",
    });
  } catch (error) {
    console.error("Photo update error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Error updating photo",
      error: error.message,
    });
  }
};

export const getClasses = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      "SELECT class_id, class_name FROM classes ORDER BY class_id ASC",
    );

    return res.json({
      success: true,
      classes: rows,
    });
  } catch (error) {
    return res.json({
      success: false,
      message: error.message,
    });
  }
};

export const getAttendanceByLecture = async (req, res) => {
  try {
    const {
      lecture_date,
      subject_id,
      start_time,
      end_time,
    } = req.query;

    const user_id = req.userId;

    const { class_id } = await userModel.findOne({ _id: user_id });

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

    if (user_id) {
      query += " AND a.student_id = ?";
      values.push(user_id);
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

export const getAttendanceByRange = async (req, res) => {
  try {
    const {
      from_date,
      to_date,
      subject_id
    } = req.query;

    const user_id = req.userId;

    // Get class_id from MongoDB user
    const user = await userModel.findOne({ _id: user_id });
    const class_id = user?.class_id;

    let query = `
      SELECT a.student_id, a.status, l.lecture_id, l.lecture_date
      FROM lectures l
      JOIN attendance a ON l.lecture_id = a.lecture_id
      WHERE 1=1
    `;

    let values = [];

    // Date Range Filter
    if (from_date && to_date) {
      query += " AND l.lecture_date BETWEEN ? AND ?";
      values.push(from_date, to_date);
    }

    if (class_id) {
      query += " AND l.class_id = ?";
      values.push(class_id);
    }

    if (subject_id) {
      query += " AND l.subject_id = ?";
      values.push(subject_id);
    }

    if (user_id) {
      query += " AND a.student_id = ?";
      values.push(user_id);
    }

    // if (start_time) {
    //   query += " AND l.start_time >= ?";
    //   values.push(start_time);
    // }

    // if (end_time) {
    //   query += " AND l.end_time <= ?";
    //   values.push(end_time);
    // }

    const [rows] = await pool.execute(query, values);

    return res.status(200).json({
      success: true,
      count: rows.length,
      data: rows,
    });

  } catch (error) {
    console.error("Error fetching attendance by range:", error);
    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

export const getUserTimetableByClass = async(req, res) =>{
  try{
    const {
      start_date,
      end_date
    } = req.query

    const user_id = req.userId;
    const user = await userModel.findOne({ _id: user_id });
    const class_id = user?.class_id;

    let query = `
    SELECT lecture_id, class_id, subject_id, lecture_date, start_time, end_time
    FROM lectures
    WHERE class_id = ?
    `
    let values = [class_id];

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

// NEW: Per-subject attendance summary for the student (all time)
export const getAttendanceSummary = async (req, res) => {
  try {
    const user_id = req.userId;
    const user = await userModel.findOne({ _id: user_id });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const class_id = user.class_id;

    console.log('[ATTEND SUMMARY] MongoDB user:', { roll_no: user.roll_no, class_id, typeof_class_id: typeof class_id });

    // Get MySQL student_id using roll_no
    const [studentRows] = await pool.execute(
      "SELECT student_id FROM students WHERE roll_no = ?",
      [String(user.roll_no)]
    );
    console.log('[ATTEND SUMMARY] studentRows:', studentRows);
    if (!studentRows.length) {
      return res.status(404).json({ success: false, message: "Student not found in MySQL" });
    }
    const student_id = studentRows[0].student_id;

    // Total lectures per subject for this class (up to today)
    const [totalRows] = await pool.execute(
      `SELECT l.subject_id, s.subject_name,
              COUNT(*) AS total_lectures
       FROM lectures l
       JOIN subjects s ON l.subject_id = s.subject_id
       WHERE l.class_id = ?
         AND l.lecture_date <= CURDATE()
       GROUP BY l.subject_id, s.subject_name`,
      [class_id]
    );
    console.log('[ATTEND SUMMARY] totalRows (lectures per subject):', totalRows);

    // Attended lectures per subject for this student
    const [attendedRows] = await pool.execute(
      `SELECT l.subject_id,
              COUNT(*) AS attended
       FROM attendance a
       JOIN lectures l ON a.lecture_id = l.lecture_id
       WHERE a.student_id = ?
         AND a.status = 1
         AND l.class_id = ?
         AND l.lecture_date <= CURDATE()
       GROUP BY l.subject_id`,
      [student_id, class_id]
    );

    const attendedMap = {};
    attendedRows.forEach(r => { attendedMap[r.subject_id] = r.attended; });

    const subjects = totalRows.map(r => {
      const attended = attendedMap[r.subject_id] || 0;
      const percentage = r.total_lectures > 0
        ? parseFloat(((attended / r.total_lectures) * 100).toFixed(1))
        : 0;
      return {
        subject_id: r.subject_id,
        subject_name: r.subject_name,
        total_lectures: r.total_lectures,
        attended_lectures: attended,
        percentage,
      };
    });

    const overallTotal = subjects.reduce((s, r) => s + r.total_lectures, 0);
    const overallAttended = subjects.reduce((s, r) => s + r.attended_lectures, 0);
    const overallPercentage = overallTotal > 0
      ? parseFloat(((overallAttended / overallTotal) * 100).toFixed(1))
      : 0;

    return res.status(200).json({
      success: true,
      subjects,
      overall: {
        total_lectures: overallTotal,
        attended_lectures: overallAttended,
        percentage: overallPercentage,
      },
    });
  } catch (error) {
    console.error("Error in getAttendanceSummary:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

// NEW: Date-range attendance detail for the student, optionally filtered by subject
export const getAttendanceDetail = async (req, res) => {
  try {
    const { from_date, to_date, subject_id } = req.query;
    const user_id = req.userId;

    if (!from_date || !to_date) {
      return res.status(400).json({ success: false, message: "from_date and to_date are required" });
    }

    const user = await userModel.findOne({ _id: user_id });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const class_id = user.class_id;

    const [studentRows] = await pool.execute(
      "SELECT student_id FROM students WHERE roll_no = ?",
      [String(user.roll_no)]
    );
    if (!studentRows.length) {
      return res.status(404).json({ success: false, message: "Student not found in MySQL" });
    }
    const student_id = studentRows[0].student_id;

    // All lectures in date range for this class
    let lectureQuery = `
      SELECT l.lecture_id, l.subject_id, s.subject_name,
             l.lecture_date, l.start_time, l.end_time
      FROM lectures l
      JOIN subjects s ON l.subject_id = s.subject_id
      WHERE l.class_id = ?
        AND l.lecture_date BETWEEN ? AND ?
    `;
    const lectureValues = [class_id, from_date, to_date];
    if (subject_id) {
      lectureQuery += " AND l.subject_id = ?";
      lectureValues.push(subject_id);
    }
    lectureQuery += " ORDER BY l.lecture_date ASC, l.start_time ASC";
    const [lectures] = await pool.execute(lectureQuery, lectureValues);

    if (!lectures.length) {
      return res.status(200).json({ success: true, data: [], subjects: [] });
    }

    // Attendance records for this student for those lectures
    const lectureIds = lectures.map(l => l.lecture_id);
    const placeholders = lectureIds.map(() => "?").join(",");
    const [attendanceRows] = await pool.execute(
      `SELECT lecture_id, status FROM attendance WHERE student_id = ? AND lecture_id IN (${placeholders})`,
      [student_id, ...lectureIds]
    );

    const attendanceMap = {};
    attendanceRows.forEach(r => { attendanceMap[r.lecture_id] = r.status; });

    const data = lectures.map(l => ({
      lecture_id: l.lecture_id,
      subject_id: l.subject_id,
      subject_name: l.subject_name,
      lecture_date: l.lecture_date,
      start_time: l.start_time,
      end_time: l.end_time,
      status: attendanceMap[l.lecture_id] !== undefined ? attendanceMap[l.lecture_id] : null,
    }));

    // Unique subjects in range
    const subjectMap = {};
    lectures.forEach(l => { subjectMap[l.subject_id] = l.subject_name; });
    const subjects = Object.entries(subjectMap).map(([id, name]) => ({ subject_id: Number(id), subject_name: name }));

    return res.status(200).json({ success: true, data, subjects });
  } catch (error) {
    console.error("Error in getAttendanceDetail:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};