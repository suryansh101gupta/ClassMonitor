import express from 'express';
import teacherAuth from '../middlewares/teacherAuth.js';
import { getTeacherData } from '../controllers/teacherDataController.js';

const teacherDataRouter = express.Router();

teacherDataRouter.get('/data', teacherAuth, getTeacherData);

export default teacherDataRouter;