import bcrypt from 'bcrypt';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import User from '../models/User.model.js';

// 1. Register User
const register = async (req, res) => {
    try {
        console.log("STEP 1 - Register request received");
        const { name, email, password } = req.body;

        console.log("STEP 2 - Input validated"); 

        const existingUser = await User.findOne({ email });
        console.log("STEP 3 - Existing user checked");
        
        if (existingUser) {
            return res.status(409).json({ success: false, msg: "An account with this email already exists.", message: "An account with this email already exists." });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            name,
            email,
            password: hashedPassword
        });
        await newUser.save();
        console.log("STEP 4 - User saved");

        return res.status(201).json({ success: true, message: "Registration successful. Please login." });

    } catch (err) {
        console.error(`ERROR in register(): ${err.message}\n${err.stack}`);
        return res.status(500).json({ success: false, msg: "Registration Failed: " + err.message, message: err.message });
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

        // Log the link to the console for testing purposes
        console.log(`Password Reset Link for ${email}: ${resetLink}`);

        console.log("STEP 3 - Response sent");
        return res.status(200).json({
            msg: "Password reset link generated.",
            resetLink // Included in response for testing since email is disabled
        });

    } catch (err) {
        console.error(`ERROR in forgotPassword(): ${err.message}\n${err.stack}`);
        return res.status(500).json({ msg: "Server Error: " + err.message });
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
    login, 
    forgotPassword, 
    resetPassword,
    getMe,
    updateSettings,
    updatePassword
};