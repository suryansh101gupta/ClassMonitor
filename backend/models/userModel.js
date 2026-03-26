import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    roll_no: {
        type: Number,
        required: true,
        unique: true
    },
    class_id:{
        type: String
    },
    password: {
        type: String,
        required: true
    },
    s3key: {
        type: String,
        default: ''
    },
    photoUrl: {
        type: String,
        default: ''
    },
    verifyOtp: {
        type: String,
        default: ''
    },
    verifiedOtpExpireAt: {
        type: Number,
        default: 0
    },
    isAccountVerified: {
        type: Boolean,
        default: false
    },
    resetOtp: {
        type: String,
        default: ''
    },
    resetOtpExpireAt: {
        type: Number,
        default: 0
    },
    faceEncoding: { 
        type: [Number], 
        default: [] 
    },
    faceProcessed: {
        type: Boolean,
        default: false
    },
    faceProcessedAt: {
        type: Date,
        default: null
    },
    faceProcessingError: {
        type: String,
        default: ''
    },
    photoUploaded: {
        type: Boolean,
        default: false
    },
    photoVersion: {
        type: Number,
        default: 0
    }
})

userSchema.index({ faceProcessed: 1, photoUploaded: 1 });
<<<<<<< HEAD
userSchema.index({ name: "text", email: "text" });
=======

>>>>>>> fae32d8 (Initial commit - teacher dashboard)

const userModel = mongoose.models.user || mongoose.model('user', userSchema);

export default userModel;