import express from 'express';
import { createSubject, getAllSubjects } from '../controllers/subjectController.js';
import adminAuth from '../middlewares/adminAuth.js';

const subjectRouter = express.Router();

subjectRouter.post('/create-sub', createSubject);

subjectRouter.get('/get-all-subjects', getAllSubjects);

export default subjectRouter;