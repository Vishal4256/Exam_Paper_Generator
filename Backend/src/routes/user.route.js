import express from 'express';
import auth from '../middleware/authMiddleware.js';
import User from '../models/User.model.js';
import bcrypt from 'bcrypt';

const router = express.Router();

// GET /api/users/profile
router.get('/profile', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) return res.status(404).json({ msg: 'User not found' });
        res.json(user);
    } catch (err) {
        console.error('Profile fetch error:', err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// PUT /api/users/profile
router.put('/profile', auth, async (req, res) => {
    try {
        const { name, theme, profilePicture } = req.body;
        const user = await User.findById(req.user.id).select('-password');
        
        if (!user) return res.status(404).json({ msg: 'User not found' });

        if (name !== undefined) user.name = name;
        if (theme !== undefined) user.theme = theme;
        if (profilePicture !== undefined) user.profilePicture = profilePicture;

        await user.save();
        res.json(user);
    } catch (err) {
        console.error('Profile update error:', err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// PUT /api/users/password
router.put('/password', auth, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await User.findById(req.user.id);
        
        if (!user) return res.status(404).json({ msg: 'User not found' });

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) return res.status(400).json({ msg: 'Incorrect current password' });

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();

        res.json({ msg: 'Password updated successfully' });
    } catch (err) {
        console.error('Password update error:', err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

export default router;
