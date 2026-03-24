import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import adminModel from "../models/adminModel.js";
import teacherModel from "../models/teacher_model.js";
import subjectModel from "../models/subjectModel.js";
import pool from "../config/mysql.js";


export const registerAdmin = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: "Missing details" });
    }

    const existing = await adminModel.findOne({ email });
    if (existing) {
      return res.status(400).json({ success: false, message: "Admin already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 7);

    const admin = await adminModel.create({
      name,
      email,
      password: hashedPassword
    });

    const token = jwt.sign({ id: admin._id, role: "admin" }, process.env.JWT_SECRET, {
      expiresIn: "7d"
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
    });

    res.status(201).json({
      success: true,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email
      }
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const stats = await adminModel.find({ email }).explain("executionStats");

    console.log(stats);


    const admin = await adminModel.findOne({ email });
    if (!admin) {
      return res.status(400).json({ success: false, message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Invalid credentials" });
    }

    const token = jwt.sign({ id: admin._id, role: "admin" }, process.env.JWT_SECRET, {
      expiresIn: "7d"
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
    });

    res.json({
      success: true,
      token: token,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email
      }
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// export const assignSubjectToTeacher = async (req, res) => {
//   try {
//     const { teacherId, subjectId } = req.body;

//     // 1. Validate teacher
//     const teacher = await teacherModel.findById(teacherId);
//     if (!teacher) {
//       return res.status(404).json({ success: false, message: "Teacher not found" });
//     }

//     // 2. Validate subject
//     const subject = await subjectModel.findById(subjectId);
//     if (!subject) {
//       return res.status(404).json({ success: false, message: "Subject not found" });
//     }

//     // 3. Prevent duplicate (Mongo)
//     if (teacher.subjects.includes(subjectId)) {
//       return res.status(400).json({
//         success: false,
//         message: "Subject already assigned"
//       });
//     }

//     // 4. Update Mongo
//     teacher.subjects.push(subjectId);
//     await teacher.save();

//     try {
//       // 5. Update SQL mapping
//       const sql = `
//         INSERT INTO teacher_subject (teacher_id, subject_id)
//         VALUES (?, ?)
//       `;

//       await pool.execute(sql, [teacherId, subjectId]);

//       return res.json({
//         success: true,
//         message: "Subject assigned successfully"
//       });

//     } catch (sqlError) {
//       // Rollback Mongo
//       teacher.subjects = teacher.subjects.filter(
//         (id) => id.toString() !== subjectId
//       );
//       await teacher.save();

//       return res.status(500).json({
//         success: false,
//         message: "SQL Error"
//       });
//     }

//   } catch (err) {
//     return res.status(500).json({
//       success: false,
//       message: err.message
//     });
//   }
// };

export const assignSubjectToTeacher = async (req, res) => {
  try {
    const { teacherId, subjectIds } = req.body;

    if (!teacherId || !subjectIds || !Array.isArray(subjectIds) || subjectIds.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: "Teacher ID and array of subject IDs are required" 
      });
    }

    // 1. Validate teacher
    const teacher = await teacherModel.findById(teacherId);
    if (!teacher) {
      return res.status(404).json({ success: false, message: "Teacher not found" });
    }

    // 2. Validate all subjects
    const subjects = await subjectModel.find({ '_id': { $in: subjectIds } });
    if (subjects.length !== subjectIds.length) {
      return res.status(404).json({ 
        success: false, 
        message: "One or more subjects not found" 
      });
    }

    // 3. Filter out already assigned subjects
    const newSubjectIds = subjectIds.filter(id => !teacher.subjects.includes(id));
    
    if (newSubjectIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "All specified subjects are already assigned"
      });
    }

    // 4. Update Mongo
    teacher.subjects.push(...newSubjectIds);
    await teacher.save();

    try {
      // 5. Update SQL mapping for new subjects only
      const placeholders = newSubjectIds.map(() => '(?, ?)').join(', ');
      const values = newSubjectIds.flatMap(subjectId => [teacherId, subjectId]);
      
      const sql = `
        INSERT INTO teacher_subject (teacher_id, subject_id)
        VALUES ${placeholders}
      `;

      await pool.execute(sql, values);

      return res.json({
        success: true,
        message: `${newSubjectIds.length} subjects assigned successfully`,
        assignedSubjects: newSubjectIds
      });

    } catch (sqlError) {
      // Rollback Mongo
      teacher.subjects = teacher.subjects.filter(
        id => !newSubjectIds.includes(id.toString())
      );
      await teacher.save();

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

export const logoutAdmin = async (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
    });

    return res.status(200).json({
      success: true,
      message: "Admin logged out successfully"
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

export const isAdminAuthenticated = async (req, res) => {
  try {
    return res.json({ success: true, message: "Admin logged in" });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};