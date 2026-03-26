import express from 'express';
import adminAuth from '../middlewares/adminAuth.js';
import { getAdminData } from '../controllers/adminDataController.js';

const adminDataRouter = express.Router();

adminDataRouter.get('/data', adminAuth, getAdminData);

export default adminDataRouter;