import bcrypt from 'bcrypt';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import User from '../models/User.model.js';
import PendingUser from '../models/PendingUser.model.js';
import { sendPasswordResetLink, sendVerificationEmail } from '../utils/emailService.js';

// 1. Register User
const register = async (req, res) => {
    try {
        const reqStartTime = performance.now();
        console.log("STEP 1 - Register request received");
        const { name, email, password } = req.body;

        const valTime = performance.now();
        // validation & DB check omitted from steps to match exact user requirement

        const existingUser = await User.findOne({ email }).lean();
        const dbTime = performance.now();
        
        if (existingUser) {
            return res.status(409).json({ success: false, msg: "An account with this email already exists.", message: "An account with this email already exists." });
        }
        
        // Generate a 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpTime = performance.now();
        console.log(`STEP 2 - OTP generated (Took ${(otpTime - dbTime).toFixed(2)}ms)`);

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
        const saveTime = performance.now();
        console.log(`STEP 3 - Pending user saved (Took ${(saveTime - otpTime).toFixed(2)}ms)`);
        
        res.status(200).json({ success: true, message: "OTP sent to email. Please verify.", email });
        
        const totalTime = performance.now();

        // Send email asynchronously in the background
        Promise.resolve().then(async () => {
            console.log("STEP 4 - Sending Gmail OTP");
            const emailStartTime = performance.now();
            const result = await sendVerificationEmail(email, otp);
            const emailEndTime = performance.now();
            
            if (!result.success) {
                console.error("Background email sending failed:");
                console.error(result.fullError || result.error);
            } else {
                console.log(`STEP 5 - Gmail OTP sent successfully (Took ${(emailEndTime - emailStartTime).toFixed(2)}ms)`);
            }
        }).catch(err => {
            console.error("Background email process error:", err);
        });

    } catch (err) {
        console.error(`ERROR in register(): ${err.message}\n${err.stack}`);
        if (!res.headersSent) {
            return res.status(500).json({ success: false, msg: "Registration Failed: " + err.message, message: err.message });
        }
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
        return res.status(201).json({ success: true, message: "Account verified and created successfully.", token, user: { id: newUser._id, name: newUser.name, email: newUser.email, role: newUser.role } });

    } catch (err) {
        console.error(`ERROR in verifyOTP(): ${err.message}\n${err.stack}`);
        return res.status(500).json({ success: false, msg: "Server Error: " + err.message, message: "Server Error: " + err.message });
    }
};

// 3. Resend OTP
const resendOTP = async (req, res) => {
    try {
        console.log("STEP 1 - resendOTP request received");
        const { email } = req.body;
        
        const pendingUser = await PendingUser.findOne({ email });
        if (!pendingUser) {
            return res.status(400).json({ success: false, msg: "Session expired. Please register again.", message: "Session expired. Please register again." });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        
        pendingUser.otp = otp;
        pendingUser.otpExpires = Date.now() + 10 * 60 * 1000;
        await pendingUser.save();
        console.log("STEP 2 - Pending user updated with new OTP");

        res.status(200).json({ success: true, message: "OTP resent successfully." });

        Promise.resolve().then(async () => {
            console.log("STEP 3 - Sending Gmail OTP");
            const result = await sendVerificationEmail(email, otp);
            if (!result.success) {
                console.error("Background email sending failed:");
                console.error(result.fullError || result.error);
            } else {
                console.log("STEP 4 - Gmail OTP sent successfully");
            }
        }).catch(err => {
            console.error("Background email process error:", err);
        });

    } catch (err) {
        console.error(`ERROR in resendOTP(): ${err.message}\n${err.stack}`);
        if (!res.headersSent) {
            return res.status(500).json({ success: false, msg: "Failed to resend OTP: " + err.message, message: "Failed to resend OTP: " + err.message });
        }
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
        return res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
    } catch (err) {
        console.error(`ERROR in login(): ${err.message}\n${err.stack}`);
        return res.status(500).json({ msg: "Server Error: " + err.message });
    }
};

// 5. Forgot Password - Send Reset Link
const forgotPassword = async (req, res) => {
    try {
        console.log("STEP 1 - forgotPassword request received");
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
        console.log("STEP 2 - User saved with reset token");

        // Construct reset link
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const resetLink = `${frontendUrl}/reset-password/${token}`;

        res.status(200).json({
            msg: "Password reset link sent to your email"
        });

        // Send Email
        Promise.resolve().then(async () => {
            console.log("STEP 3 - Sending Gmail Link");
            const result = await sendPasswordResetLink(email, resetLink);
            if (!result.success) {
                console.error("Background email sending failed:");
                console.error(result.fullError || result.error);
            } else {
                console.log("STEP 4 - Gmail Link sent successfully");
            }
        }).catch(err => {
            console.error("Background email process error:", err);
        });

    } catch (err) {
        console.error(`ERROR in forgotPassword(): ${err.message}\n${err.stack}`);
        if (!res.headersSent) {
            return res.status(500).json({ msg: "Server Error: " + err.message });
        }
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

        return res.status(200).json({ msg: "Password has been updated successfully" });

    } catch (err) {
        console.error(`ERROR in resetPassword(): ${err.message}\n${err.stack}`);
        return res.status(500).json({ msg: "Server Error: " + err.message });
    }
};

// 8. Get current user profile
const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) return res.status(404).json({ msg: "User not found" });
        return res.json(user);
    } catch (err) {
        console.error(`ERROR in getMe(): ${err.message}\n${err.stack}`);
        return res.status(500).json({ msg: "Server Error" });
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
        return res.json(user);
    } catch (err) {
        console.error(`ERROR in updateSettings(): ${err.message}\n${err.stack}`);
        return res.status(500).json({ msg: "Server Error" });
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

        return res.json({ msg: "Password updated successfully" });
    } catch (err) {
        console.error(`ERROR in updatePassword(): ${err.message}\n${err.stack}`);
        return res.status(500).json({ msg: "Server Error" });
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