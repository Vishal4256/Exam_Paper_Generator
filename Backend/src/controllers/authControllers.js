import bcrypt from 'bcrypt';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import User from '../models/User.model.js';
import { sendVerificationOTP, sendPasswordResetOTP, generateOTP } from '../utils/emailService.js';

// 1. Register User - Send OTP
const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Check if user exists
        let user = await User.findOne({ email });
        if (user) {
            if (user.isEmailVerified) {
                return res.status(400).json({ msg: "User already exists" });
            } else {
                // User exists but not verified, update OTP
                const otp = generateOTP();
                user.emailVerificationOTP = otp;
                user.emailVerificationOTPExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
                user.name = name;
                // Update password if provided
                if (password) {
                    const salt = await bcrypt.genSalt(10);
                    user.password = await bcrypt.hash(password, salt);
                }
                await user.save();
                
                // Send OTP email
                await sendVerificationOTP(email, otp);
                return res.status(200).json({ msg: "OTP sent to your email. Please verify to complete registration." });
            }
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Generate OTP
        const otp = generateOTP();

        // Create new user with unverified email
        user = new User({ 
            name, 
            email, 
            password: hashedPassword,
            emailVerificationOTP: otp,
            emailVerificationOTPExpires: Date.now() + 10 * 60 * 1000 // 10 minutes
        });
        await user.save();

        // Send OTP email
        await sendVerificationOTP(email, otp);

        res.status(201).json({ msg: "OTP sent to your email. Please verify to complete registration." });
    } catch (err) {
        console.error('Registration error:', err);
        res.status(500).json({ msg: "Server Error: " + err.message });
    }
};

// 2. Verify Email OTP
const verifyEmailOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ msg: "User not found" });
        }

        if (user.isEmailVerified) {
            return res.status(400).json({ msg: "Email already verified" });
        }

        // Check if OTP matches and hasn't expired
        if (user.emailVerificationOTP !== otp) {
            return res.status(400).json({ msg: "Invalid OTP" });
        }

        if (user.emailVerificationOTPExpires < Date.now()) {
            return res.status(400).json({ msg: "OTP has expired. Please request a new one." });
        }

        // Verify email
        user.isEmailVerified = true;
        user.emailVerificationOTP = undefined;
        user.emailVerificationOTPExpires = undefined;
        await user.save();

        res.status(200).json({ msg: "Email verified successfully. You can now login." });
    } catch (err) {
        console.error('OTP verification error:', err);
        res.status(500).json({ msg: "Server Error: " + err.message });
    }
};

// 3. Resend Verification OTP
const resendVerificationOTP = async (req, res) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ msg: "User not found" });
        }

        if (user.isEmailVerified) {
            return res.status(400).json({ msg: "Email already verified" });
        }

        // Generate new OTP
        const otp = generateOTP();
        user.emailVerificationOTP = otp;
        user.emailVerificationOTPExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
        await user.save();

        // Send OTP email
        await sendVerificationOTP(email, otp);

        res.status(200).json({ msg: "OTP resent to your email" });
    } catch (err) {
        console.error('Resend OTP error:', err);
        res.status(500).json({ msg: "Server Error: " + err.message });
    }
};

// 4. Login User
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ msg: "Invalid Credentials" });

        // Check if email is verified
        if (!user.isEmailVerified) {
            return res.status(400).json({ msg: "Please verify your email before logging in" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ msg: "Invalid Credentials" });

        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ msg: "Server Error: " + err.message });
    }
};

// 5. Forgot Password - Send OTP
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ msg: "User with this email does not exist" });
        }

        // Generate OTP
        const otp = generateOTP();
        user.forgotPasswordOTP = otp;
        user.forgotPasswordOTPExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
        await user.save();

        // Send OTP email
        await sendPasswordResetOTP(email, otp);

        res.status(200).json({
            msg: "Password reset OTP sent to your email"
        });

    } catch (err) {
        console.error('Forgot password error:', err);
        res.status(500).json({ msg: "Server Error: " + err.message });
    }
};

// 6. Verify Password Reset OTP
const verifyPasswordResetOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ msg: "User not found" });
        }

        // Check if OTP matches and hasn't expired
        if (user.forgotPasswordOTP !== otp) {
            return res.status(400).json({ msg: "Invalid OTP" });
        }

        if (user.forgotPasswordOTPExpires < Date.now()) {
            return res.status(400).json({ msg: "OTP has expired. Please request a new one." });
        }

        // OTP is valid, return success (frontend will then allow password reset)
        res.status(200).json({ msg: "OTP verified successfully. You can now reset your password." });
    } catch (err) {
        console.error('Verify password reset OTP error:', err);
        res.status(500).json({ msg: "Server Error: " + err.message });
    }
};

// 7. Reset Password (after OTP verification)
const resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ msg: "User not found" });
        }

        // Verify OTP again for security
        if (user.forgotPasswordOTP !== otp) {
            return res.status(400).json({ msg: "Invalid OTP" });
        }

        if (user.forgotPasswordOTPExpires < Date.now()) {
            return res.status(400).json({ msg: "OTP has expired. Please request a new one." });
        }

        // Hash the new password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);

        // Clear the OTP fields
        user.forgotPasswordOTP = undefined;
        user.forgotPasswordOTPExpires = undefined;

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
    verifyEmailOTP, 
    resendVerificationOTP,
    login, 
    forgotPassword, 
    verifyPasswordResetOTP,
    resetPassword,
    getMe,
    updateSettings,
    updatePassword
};