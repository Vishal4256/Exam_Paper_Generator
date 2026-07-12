import express from 'express';
import { generateAIQuestions, improveQuestion, simplifyQuestion, generateOptions } from '../controllers/aiController.js';
import auth from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/generate', auth, generateAIQuestions);
router.post('/improve-question', auth, improveQuestion);
router.post('/simplify-question', auth, simplifyQuestion);
router.post('/generate-options', auth, generateOptions);

export default router;
