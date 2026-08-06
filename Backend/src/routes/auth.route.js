import express, { Router } from 'express';
import { 
    register, 
    login, 
    forgotPassword, 
    resetPassword,
    getMe,
    updateSettings,
    updatePassword
} from '../controllers/authControllers.js';
import auth from '../middleware/authMiddleware.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// Registration routes
router.post('/register', authLimiter, register);

// Login route
router.post('/login', authLimiter, login);

// Password reset routes
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password/:token', resetPassword);

// Protected routes
router.get('/me', auth, getMe);
router.put('/settings', auth, updateSettings);
router.put('/password', auth, updatePassword);

export default router;