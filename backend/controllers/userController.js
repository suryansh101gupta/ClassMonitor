import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import userModel from '../models/userModel.js';
import transporter from '../config/nodemailer.js'
import crypto  from 'crypto';

export const register = async (req, res) => {
    console.log("req.body:", req.body);
    const {name, email, password} = req.body;

    if(!name || !email || !password){
        return res.json({success: false, message: 'missing details'})
    }

    try{

        const existingUser = await userModel.findOne({email});

        if(existingUser){
            return res.json({success: false, message: 'User already exists'});
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new userModel({name, email, password: hashedPassword});
        await user.save();

        const token = jwt.sign({id: user._id}, process.env.JWT_SECRET, {expiresIn: '7d'});

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        // sending welcome email
        const mailOptions = {
            from: process.env.SENDER_EMAIL,
            to: email,
            subject: 'Welcome to ClassMonitor',
            text: `Welcome to ClassMonitor. Your account has been created with email-id: ${email}`
        }

        await transporter.sendMail(mailOptions);

        return res.json({success: true, message: 'registered'});

    }catch(error){
        res.json({success: false, message: error.message})
    }
}

export const login = async (req, res) => {
    console.log("req.body:", req.body);
    const {email, password} = req.body;

    if(!email || !password){
        return res.json({success: false, message: 'email and password are required'});
    }

    try{

        const user = await userModel.findOne({email});

        if(!user){
            return res.json({success: false, message: 'user does not exist'})
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if(!isMatch){
            return res.json({success: false, message: 'Invalid Email or Password'})
        }

        const token = jwt.sign({id: user._id}, process.env.JWT_SECRET, {expiresIn: '7d'});

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        return res.json({success: true, message: 'logged in'});

    }catch(error){
        return res.json({success: false, message: error.message});
    }
}


export const logout = async (req, res) => {
    try{
        res.clearCookie('token', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict'
        })

        return res.json({success: true, message: 'logged out'})

    }catch(error){
        return res.json({success: false, message: error.message});
    }
}


export const sendVerifyOtp = async (req, res) => {
    try{
        console.log("send otp - req.body:", req.body);
        const userId = req.userId;
        const user = await userModel.findById(userId);

        if(user.isAccountVerified){
            return res.json({success:false, message: "Account already verified"});

        }else{

            const otp = crypto.randomInt(Math.pow(10, 5), Math.pow(10, 6)).toString();
            user.verifyOtp = otp;
            user.verifiedOtpExpireAt = Date.now() + 5 * 60 * 1000;

            await user.save();

            const mailOption = {
                from: process.env.SENDER_EMAIL,
                to: user.email,
                subject: 'Acconut Verification OTP',
                text: `Your OTP to verify your account is: ${otp}`
            }
            await transporter.sendMail(mailOption);
            res.json({ success: true, message: "verification otp sent" });
        }

    }catch(error){
        return res.json({success: false, message: `send otp - ${error.message}`});
    }
}


export const verifyEmail = async (req, res) => {
    // defensive logging to help debug clients that send no/invalid body
    console.log("verifyEmail - req.body:", req.body);
    const { otp } = req.body;
    const userId = req.userId;

    if (!userId || !otp) {
        return res.json({ success: false, message: "Missing Details: userId and otp are required" });
    }

    try{

        const user = await userModel.findById(userId);
        if(!user){
            return res.json({success: false, message: "User not found"});
        }
        
        // check OTP exists and matches
        if (user.verifyOtp === '' || user.verifyOtp !== otp) {
            return res.json({ success: false, message: "Invalid OTP" });
        }

        // check expiry
        if (user.verifiedOtpExpireAt < Date.now()) {
            return res.json({success: false, message: "OTP expired"});
        }

        user.isAccountVerified = true;

        user.verifyOtp = "";
        user.verifiedOtpExpireAt = 0;

        await user.save();

        return res.json({success: true, message: "Email verified successfully"});

    }catch(error){
        return res.json({success: false, message: error.message});
    }
}