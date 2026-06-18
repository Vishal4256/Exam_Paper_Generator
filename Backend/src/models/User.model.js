import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    emailVerificationOTP: {
        type: String,
        default: undefined
    },
    emailVerificationOTPExpires: {
        type: Date,
        default: undefined
    },
    forgotPasswordOTP: {
        type: String,
        default: undefined
    },
    forgotPasswordOTPExpires: {
        type: Date,
        default: undefined
    },
    theme: {
        type: String,
        enum: ['light', 'dark'],
        default: 'light'
    },
    profilePicture: {
        type: String,
        default: ''
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    resetPasswordToken: {
        type: String,
        default: undefined
    },
    resetPasswordExpires: {
        type: Date,
        default: undefined
    }
});

export default mongoose.model('User', UserSchema);