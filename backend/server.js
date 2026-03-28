import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import cookieparser from 'cookie-parser';
import userRouter from './routes/userRoutes.js';

import connectDB from "./config/mongodb.js";
import userDataRouter from './routes/userDataRoutes.js';
import { connectRedis } from "./config/redis.js";
import attendanceRoutes from "./routes/attendance.routes.js";
import "./globals.js";
import "./scheduler/lecture.scheduler.js";
import "./scheduler/finalize.scheduler.js";

import teacherRouter from "./routes/teacher_routes.js";
import adminRouter from './routes/adminRoutes.js';
import subjectRouter from './routes/subjectRoutes.js';
import adminDataRouter from './routes/adminDataRoutes.js';
import classRouter from './routes/classRoutes.js';
import timetableRouter from './routes/timetableRoutes.js';

const app = express();
const port = process.env.PORT || 4000;
connectDB();

connectRedis();

// const allowedOrigins = 'http://localhost:4000'

app.set("trust proxy", 1);

app.use(express.json());
app.use(cookieparser());
app.use(cors({origin:'https://class-monitor-two.vercel.app/', credentials:true}));
app.use(express.urlencoded({ extended: true }));

// API Endpoints
app.get("/", (req, res) => res.send("API working"));

app.use('/user', userRouter);

app.use('/user-data', userDataRouter);

// app.use('/teacher', userRouter);

app.use("/attendance", attendanceRoutes);

app.use('/teachers', teacherRouter);

app.use('/admin', adminRouter);

app.use('/admin-data', adminDataRouter);

app.use("/subjects", subjectRouter);

app.use("/classes", classRouter);

app.use("/timetable", timetableRouter);

global.activeLectureId = null;

app.listen(port, "0.0.0.0",() => console.log(`Server started on PORT : ${port}`));