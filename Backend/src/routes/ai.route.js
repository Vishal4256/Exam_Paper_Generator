import express from 'express';
import { generateAIQuestions } from '../controllers/aiController.js';
import auth from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/generate', auth, generateAIQuestions);

export default router;
