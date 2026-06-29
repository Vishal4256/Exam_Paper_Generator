import bcrypt from 'bcrypt';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import User from '../models/User.model.js';
import PendingUser from '../models/PendingUser.model.js';
import { sendPasswordResetLink, sendOTPEmail } from '../utils/emailService.js';

// 1. Register User
const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ success: false, msg: "User already exists", message: "User already exists" });
        }
        
        // Generate a 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Send OTP email before creating user/pending user
        await sendOTPEmail(email, otp);

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Delete any existing pending user for this email to replace it
        await PendingUser.deleteMany({ email });

        const pendingUser = new PendingUser({
            name,
            email,
            password: hashedPassword,
            otp,
            otpExpires: Date.now() + 10 * 60 * 1000 // 10 minutes
        });
        await pendingUser.save();
        
        res.status(200).json({ success: true, message: "OTP sent to email. Please verify.", email });

    } catch (err) {
        console.error('Registration error:', err);
        // Do not create pending user if email fails
        res.status(500).json({ success: false, msg: "Registration Failed: " + err.message, message: err.message });
    }
};

// 2. Verify OTP
const verifyOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;

        const pendingUser = await PendingUser.findOne({ email });
        
        if (!pendingUser) {
            return res.status(400).json({ success: false, msg: "Session expired or invalid. Please register again.", message: "Session expired or invalid." });
        }

        if (pendingUser.otp !== otp || pendingUser.otpExpires < Date.now()) {
            return res.status(400).json({ success: false, msg: "Invalid or expired OTP", message: "Invalid or expired OTP" });
        }

        const newUser = new User({
            name: pendingUser.name,
            email: pendingUser.email,
            password: pendingUser.password
        });
        await newUser.save();

        await PendingUser.deleteMany({ email });

        const token = jwt.sign({ id: newUser._id, role: newUser.role }, process.env.JWT_SECRET, { expiresIn: '30d' });
        res.status(201).json({ success: true, message: "Account verified and created successfully.", token, user: { id: newUser._id, name: newUser.name, email: newUser.email, role: newUser.role } });

    } catch (err) {
        console.error('Verify OTP error:', err);
        res.status(500).json({ success: false, msg: "Server Error: " + err.message, message: "Server Error: " + err.message });
    }
};

// 3. Resend OTP
const resendOTP = async (req, res) => {
    try {
        const { email } = req.body;
        
        const pendingUser = await PendingUser.findOne({ email });
        if (!pendingUser) {
            return res.status(400).json({ success: false, msg: "Session expired. Please register again.", message: "Session expired. Please register again." });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        
        await sendOTPEmail(email, otp);

        pendingUser.otp = otp;
        pendingUser.otpExpires = Date.now() + 10 * 60 * 1000;
        await pendingUser.save();

        res.status(200).json({ success: true, message: "OTP resent successfully." });
    } catch (err) {
        console.error('Resend OTP error:', err);
        res.status(500).json({ success: false, msg: "Failed to resend OTP: " + err.message, message: "Failed to resend OTP: " + err.message });
    }
};



// 4. Login User
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ msg: "Invalid Credentials" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ msg: "Invalid Credentials" });

        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '30d' });
        res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ msg: "Server Error: " + err.message });
    }
};

// 5. Forgot Password - Send Reset Link
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ msg: "User with this email does not exist" });
        }

        // Generate Token
        const token = crypto.randomBytes(32).toString('hex');
        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 hour
        await user.save();

        // Construct reset link
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const resetLink = `${frontendUrl}/reset-password/${token}`;

        // Send Email
        await sendPasswordResetLink(email, user.name, resetLink);

        res.status(200).json({
            msg: "Password reset link sent to your email"
        });

    } catch (err) {
        console.error('Forgot password error:', err);
        res.status(500).json({ msg: "Server Error: " + err.message });
    }
};

// 6. Reset Password (after Token verification)
const resetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { password } = req.body;

        const user = await User.findOne({ 
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ msg: "Password reset token is invalid or has expired." });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (isMatch) {
            return res.status(400).json({ msg: "Your new password cannot be the same as your previous password." });
        }

        // Hash the new password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);

        // Clear the token fields
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        await user.save();

        res.status(200).json({ msg: "Password has been updated successfully" });

    } catch (err) {
        console.error('Reset password error:', err);
        res.status(500).json({ msg: "Server Error: " + err.message });
    }
};

// 8. Get current user profile
const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) return res.status(404).json({ msg: "User not found" });
        res.json(user);
    } catch (err) {
        console.error('getMe error:', err);
        res.status(500).json({ msg: "Server Error" });
    }
};

// 9. Update User Settings (Profile, Theme & Institution Settings)
const updateSettings = async (req, res) => {
    try {
        const { name, theme, profilePicture, institutionSettings } = req.body;
        const user = await User.findById(req.user.id).select('-password');
        if (!user) return res.status(404).json({ msg: "User not found" });

        if (name !== undefined) user.name = name;
        if (theme !== undefined) user.theme = theme;
        if (profilePicture !== undefined) user.profilePicture = profilePicture;
        if (institutionSettings !== undefined) user.institutionSettings = institutionSettings;

        await user.save();
        res.json(user);
    } catch (err) {
        console.error('updateSettings error:', err);
        res.status(500).json({ msg: "Server Error" });
    }
};

// 10. Update Password
const updatePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ msg: "User not found" });

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) return res.status(400).json({ msg: "Incorrect current password" });

        const isSame = await bcrypt.compare(newPassword, user.password);
        if (isSame) {
            return res.status(400).json({ msg: "Your new password cannot be the same as your previous password." });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();

        res.json({ msg: "Password updated successfully" });
    } catch (err) {
        console.error('updatePassword error:', err);
        res.status(500).json({ msg: "Server Error" });
    }
};

export { 
    register,
    verifyOTP, 
    resendOTP,
    login, 
    forgotPassword, 
    resetPassword,
    getMe,
    updateSettings,
    updatePassword
};