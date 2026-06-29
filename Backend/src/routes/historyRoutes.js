import express from 'express';
import { getHistory, deleteHistory } from '../controllers/historyController.js';
import auth from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', auth, getHistory);
router.delete('/:id', auth, deleteHistory);

export default router;
