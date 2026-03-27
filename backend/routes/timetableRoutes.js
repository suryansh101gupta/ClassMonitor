import express from 'express';
import { saveTimetable, getTimetableByClass, getAllTimetables, editTimetable } from '../controllers/timetableController.js';
import adminAuth from '../middlewares/adminAuth.js';

const timetableRouter = express.Router();

timetableRouter.post('/save-timetable', adminAuth, saveTimetable);

timetableRouter.get('/get-timetable/:classId', adminAuth, getTimetableByClass);

timetableRouter.get('/get-all-timetables', adminAuth, getAllTimetables);

timetableRouter.put('/edit-lecture/:lectureId', adminAuth, editTimetable);

export default timetableRouter;
