import express from 'express';
import { registerTeacher, loginTeacher, getAllTeachers, logoutTeacher } from '../controllers/teacher_controller.js';
import teacherAuth from '../middlewares/teacherAuth.js'
import adminAuth from '../middlewares/adminAuth.js';

const teacherRouter = express.Router();

teacherRouter.post('/register', registerTeacher);

teacherRouter.post('/login', teacherAuth, loginTeacher);

teacherRouter.post('/logout', teacherAuth, logoutTeacher);

teacherRouter.get('/get-all-teachers', getAllTeachers);

export default teacherRouter;