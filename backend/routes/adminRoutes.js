import express from 'express';
import { registerAdmin, loginAdmin, assignSubjectToTeacher } from '../controllers/adminController.js';
import { adminAuth } from '../middlewares/adminAuth.js';

const adminRouter = express.Router();

adminRouter.post('/register', registerAdmin);

adminRouter.post('/login', adminAuth, loginAdmin);

adminRouter.post('/logout', adminAuth, loginAdmin);

adminRouter.post('/assign-sub-teacher', adminAuth, assignSubjectToTeacher);

export default adminRouter;