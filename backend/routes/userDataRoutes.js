import express from 'express';
import userAuth from '../middlewares/userAuth.js';
import { getUserData } from '../controllers/userDataController.js';

const userDataRouter = express.Router();

userDataRouter.get('/data', userAuth, getUserData);

export default userDataRouter;