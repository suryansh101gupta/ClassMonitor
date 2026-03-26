import express from 'express';
import { createClass, getAllClasses } from '../controllers/classController.js';
import adminAuth from '../middlewares/adminAuth.js';

const classRouter = express.Router();

classRouter.post('/create-class', adminAuth, createClass);

classRouter.get('/get-all-classes', getAllClasses);

export default classRouter;
