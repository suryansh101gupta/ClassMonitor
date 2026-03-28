import express from 'express';
import { createSubject, getAllSubjects } from '../controllers/subjectController.js';
import adminAuth from '../middlewares/adminAuth.js';
import { cacheMiddleware } from '../middlewares/redis_middleware.js';

const subjectRouter = express.Router();

subjectRouter.post('/create-sub', adminAuth, createSubject);

subjectRouter.get('/get-all-subjects', cacheMiddleware("all_subjects", 60), getAllSubjects);

export default subjectRouter;