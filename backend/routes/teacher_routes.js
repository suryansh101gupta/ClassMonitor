import express from 'express';
import { registerTeacher, loginTeacher, getAllTeachers, logoutTeacher } from '../controllers/teacher_controller.js';
import teacherAuth from '../middlewares/teacherAuth.js'
import adminAuth from '../middlewares/adminAuth.js';
<<<<<<< HEAD
import { cacheMiddleware } from '../middlewares/redis_middleware.js';
=======
>>>>>>> fae32d8 (Initial commit - teacher dashboard)

const teacherRouter = express.Router();

teacherRouter.post('/register', registerTeacher);

<<<<<<< HEAD
teacherRouter.post('/login', loginTeacher);

teacherRouter.post('/logout', teacherAuth, logoutTeacher);

teacherRouter.get('/get-all-teachers', adminAuth, cacheMiddleware("all_teachers", 60), getAllTeachers);
=======
teacherRouter.post('/login', teacherAuth, loginTeacher);

teacherRouter.post('/logout', teacherAuth, logoutTeacher);

teacherRouter.get('/get-all-teachers', getAllTeachers);
>>>>>>> fae32d8 (Initial commit - teacher dashboard)

export default teacherRouter;