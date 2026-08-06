import express from 'express';
import { getAnalyticsDashboard } from '../controllers/analyticsController.js';
import auth from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', auth, getAnalyticsDashboard);

export default router;
