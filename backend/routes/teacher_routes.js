import express from 'express';
import { registerTeacher, loginTeacher, getAllTeachers, logoutTeacher, getStudentsByLecture, getLectures } from '../controllers/teacher_controller.js';
import teacherAuth from '../middlewares/teacherAuth.js'
import adminAuth from '../middlewares/adminAuth.js';
import { cacheMiddleware } from '../middlewares/redis_middleware.js';

const teacherRouter = express.Router();

teacherRouter.post('/register', registerTeacher);

teacherRouter.post('/login', loginTeacher);

teacherRouter.post('/logout', teacherAuth, logoutTeacher);

teacherRouter.get('/get-all-teachers', cacheMiddleware("all_teachers", 60), getAllTeachers);

teacherRouter.get('/get-attendance', teacherAuth, getStudentsByLecture);

teacherRouter.get('/get-lectures', teacherAuth, getLectures);

export default teacherRouter;