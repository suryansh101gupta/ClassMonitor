import express from 'express';
import { registerTeacher, loginTeacher } from '../controllers/teacher_controller.js';
import teacherAuth from '../middlewares/teacherAuth.js'

const teacherRouter = express.Router();

teacherRouter.post('/register', registerTeacher);

teacherRouter.post('/login', teacherAuth, loginTeacher);

teacherRouter.post('/logout', teacherAuth, loginTeacher);

export default teacherRouter;