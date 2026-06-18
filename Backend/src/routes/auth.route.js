import express, { Router } from 'express';
import { 
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
} from '../controllers/authControllers.js';
import auth from '../middleware/authMiddleware.js';

const router = Router();

// Registration routes
router.post('/register', register);
router.post('/verify-email-otp', verifyEmailOTP);
router.post('/resend-verification-otp', resendVerificationOTP);

// Login route
router.post('/login', login);

// Password reset routes
router.post('/forgot-password', forgotPassword);
router.post('/verify-password-reset-otp', verifyPasswordResetOTP);
router.post('/reset-password', resetPassword);

// Protected routes
router.get('/me', auth, getMe);
router.put('/settings', auth, updateSettings);
router.put('/password', auth, updatePassword);

export default router;