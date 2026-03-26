import express from 'express';
import { createClass, getAllClasses } from '../controllers/classController.js';
import adminAuth from '../middlewares/adminAuth.js';
<<<<<<< HEAD
import { cacheMiddleware } from '../middlewares/redis_middleware.js';
=======
>>>>>>> fae32d8 (Initial commit - teacher dashboard)

const classRouter = express.Router();

classRouter.post('/create-class', adminAuth, createClass);

<<<<<<< HEAD
classRouter.get('/get-all-classes', cacheMiddleware("all_classes", 60), getAllClasses);
=======
classRouter.get('/get-all-classes', getAllClasses);
>>>>>>> fae32d8 (Initial commit - teacher dashboard)

export default classRouter;
