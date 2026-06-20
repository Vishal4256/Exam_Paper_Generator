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

const router = Router();

// Registration routes
router.post('/register', (req, res, next) => {
    console.log(`[ROUTE] POST /auth/register body:`, req.body);
    next();
}, register);

// Login route
router.post('/login', login);

// Password reset routes
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);

// Protected routes
router.get('/me', auth, getMe);
router.put('/settings', auth, updateSettings);
router.put('/password', auth, updatePassword);

export default router;