import mongoose from "mongoose";

const PendingUserSchema = new mongoose.Schema({
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
    otp: {
        type: String,
        required: true
    },
    otpExpires: {
        type: Date,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: '10m' // Document will be automatically deleted after 10 minutes
    }
});

export default mongoose.model('PendingUser', PendingUserSchema);
