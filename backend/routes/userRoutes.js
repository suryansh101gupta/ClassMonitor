import express from 'express';
import { login, logout, register, sendVerifyOtp, verifyEmail } from '../controllers/userController.js';
import userAuth from '../middlewares/userAuth.js';


const userRouter = express.Router();

userRouter.post('/register', register);

userRouter.post('/login', login);

userRouter.post('/logout', logout);

userRouter.post('/send-verify-otp', userAuth, sendVerifyOtp);

userRouter.post('/verify-account', userAuth, verifyEmail);

export default userRouter;