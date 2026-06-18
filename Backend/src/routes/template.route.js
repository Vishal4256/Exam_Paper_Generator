import express from 'express';
import { saveTemplate, getTemplates, deleteTemplate } from '../controllers/templateController.js';
import auth from '../middleware/authMiddleware.js';

const router = express.Router();

// @route   POST /api/templates
// @desc    Save a new template
router.post('/', auth, saveTemplate);

// @route   GET /api/templates
// @desc    Get all templates for user
router.get('/', auth, getTemplates);

// @route   DELETE /api/templates/:id
// @desc    Delete a template
router.delete('/:id', auth, deleteTemplate);

export default router;
