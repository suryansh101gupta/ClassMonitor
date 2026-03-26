import express from 'express';
import { createSubject, getAllSubjects } from '../controllers/subjectController.js';
import adminAuth from '../middlewares/adminAuth.js';
<<<<<<< HEAD
import { cacheMiddleware } from '../middlewares/redis_middleware.js';

const subjectRouter = express.Router();

subjectRouter.post('/create-sub', adminAuth, createSubject);

subjectRouter.get('/get-all-subjects', adminAuth, cacheMiddleware("all_subjects", 60), getAllSubjects);
=======

const subjectRouter = express.Router();

subjectRouter.post('/create-sub', createSubject);

subjectRouter.get('/get-all-subjects', getAllSubjects);
>>>>>>> fae32d8 (Initial commit - teacher dashboard)

export default subjectRouter;