import express from 'express';
import { createSubject } from '../controllers/subjectController.js';

const subjectRouter = express.Router();

subjectRouter.post('/create-sub', createSubject);

export default subjectRouter;