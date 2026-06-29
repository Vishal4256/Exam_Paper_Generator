import express from 'express';
import { saveDraft, getDrafts, deleteDraft } from '../controllers/draftController.js';
import auth from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', auth, saveDraft);
router.get('/', auth, getDrafts);
router.delete('/:id', auth, deleteDraft);

export default router;
