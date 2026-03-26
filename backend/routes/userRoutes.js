import express from 'express';
import { getUploadUrl, isAuthenticated, login, logout, register, resetPassword, sendResetOtp, sendVerifyOtp, updatePhoto, verifyEmail, getClasses, getAttendanceByLecture } from '../controllers/userController.js';
import userAuth from '../middlewares/userAuth.js';


const userRouter = express.Router();

userRouter.post('/register', register);

userRouter.post('/login', login);

userRouter.post('/logout', logout);

userRouter.post('/send-verify-otp', userAuth, sendVerifyOtp);

userRouter.post('/verify-account', userAuth, verifyEmail);

userRouter.get('/is-auth', userAuth, isAuthenticated);

userRouter.post('/send-reset-otp', sendResetOtp);

userRouter.post('/reset-password', resetPassword);

userRouter.post("/get-upload-url", userAuth, getUploadUrl);

userRouter.post("/update-photo", userAuth, updatePhoto);

userRouter.get("/classes", getClasses);

userRouter.get('/get-attendance', userAuth, getAttendanceByLecture);


export default userRouter;