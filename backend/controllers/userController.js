import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import userModel from "../models/userModel.js";
import transporter from "../config/nodemailer.js";
import crypto from "crypto";
import {
  EMAIL_VERIFY_TEMPLATE,
  PASSWORD_RESET_TEMPLATE,
} from "../config/emailtemplates.js";

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

    const hashedPassword = await bcrypt.hash(password, 10);

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
        class_id,
      ]);

      const token = jwt.sign({ id: savedUser._id }, process.env.JWT_SECRET, {
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

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
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
    const { fileName, fileType } = req.body;
    const userId = req.userId;

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
