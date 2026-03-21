import express from 'express';
import { registerAdmin, loginAdmin, assignSubjectToTeacher, isAdminAuthenticated, logoutAdmin } from '../controllers/adminController.js';
import { adminAuth } from '../middlewares/adminAuth.js';

const adminRouter = express.Router();

adminRouter.post('/register', registerAdmin);

adminRouter.post('/login', loginAdmin);

adminRouter.get('/is-admin-auth', adminAuth, isAdminAuthenticated);

adminRouter.post('/logout', adminAuth, logoutAdmin);

adminRouter.post('/assign-sub-teacher', adminAuth, assignSubjectToTeacher);

export default adminRouter;