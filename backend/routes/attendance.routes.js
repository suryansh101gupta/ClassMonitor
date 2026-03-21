import express from 'express';
const router = express.Router();

// Ensure you include the .js extension!
import { receiveFrameData } from '../controllers/attendance.controller.js';

router.post('/frame-result', receiveFrameData);

export default router;