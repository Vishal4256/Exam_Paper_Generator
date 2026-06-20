import bcrypt from 'bcrypt';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import User from '../models/User.model.js';
import { sendPasswordResetLink } from '../utils/emailService.js';

// 1. Register User
const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Check if user exists
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ success: false, msg: "User already exists", message: "User already exists" });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new user
        user = new User({ 
            name, 
            email, 
            password: hashedPassword
        });
        await user.save();

        res.status(201).json({ success: true, message: "Account created successfully. You can now log in.", msg: "Account created successfully. You can now log in." });

    } catch (err) {
        console.error('Registration error:', err);
        res.status(500).json({ success: false, msg: "Server Error: " + err.message, message: "Server Error: " + err.message });
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
    login, 
    forgotPassword, 
    resetPassword,
    getMe,
    updateSettings,
    updatePassword
};