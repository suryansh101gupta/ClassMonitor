import express from 'express';
import { createClass, getAllClasses } from '../controllers/classController.js';
import adminAuth from '../middlewares/adminAuth.js';
import { cacheMiddleware } from '../middlewares/redis_middleware.js';

const classRouter = express.Router();

classRouter.post('/create-class', adminAuth, createClass);

classRouter.get('/get-all-classes', cacheMiddleware("all_classes", 60), getAllClasses);

export default classRouter;
