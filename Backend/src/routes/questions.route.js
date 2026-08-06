import express, { Router } from 'express';
import { addQuestion, updateQuestion, getQuestions, getFilteredQuestionIds, getQuestion, deleteQuestion, bulkImportQuestions, bulkAddQuestions, bulkDeleteQuestions, bulkUpdateQuestions, bulkUpdateTags, bulkDuplicateQuestions, analyzeQuestionQuality } from '../controllers/questionController.js';
import auth from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';

const router = Router();

/**
 * @swagger
 * /api/questions:
 *   post:
 *     summary: Add a new question to the bank
 *     tags: [Questions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Created
 */
// @route   POST /api/questions
// @desc    Add a new question to the bank
router.post('/', auth, upload.single('image'), addQuestion);

// @route   POST /api/questions/bulk
// @desc    Import multiple questions from JSON array
router.post('/bulk', auth, bulkAddQuestions);

// @route   POST /api/questions/bulk-import
// @desc    Import multiple questions from CSV
router.post('/bulk-import', auth, upload.single('file'), bulkImportQuestions);

// @route   POST /api/questions/bulk-delete
// @desc    Delete multiple questions
router.post('/bulk-delete', auth, bulkDeleteQuestions);

// @route   POST /api/questions/bulk-update
// @desc    Update multiple questions
router.post('/bulk-update', auth, bulkUpdateQuestions);

// @route   POST /api/questions/bulk-update-tags
// @desc    Update tags for multiple questions
router.post('/bulk-update-tags', auth, bulkUpdateTags);

// @route   POST /api/questions/bulk-duplicate
// @desc    Duplicate multiple questions
router.post('/bulk-duplicate', auth, bulkDuplicateQuestions);

// @route   POST /api/questions/analyze-quality
// @desc    Analyze question quality
router.post('/analyze-quality', auth, analyzeQuestionQuality);

/**
 * @swagger
 * /api/questions:
 *   get:
 *     summary: Get all questions for the logged-in user
 *     tags: [Questions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: OK
 */
// @route   GET /api/questions
// @desc    Get all questions for the logged-in user
router.get('/', auth, getQuestions);

// @route   GET /api/questions/filtered-ids
// @desc    Get all IDs of questions matching current filters
router.get('/filtered-ids', auth, getFilteredQuestionIds);

/**
 * @swagger
 * /api/questions/{id}:
 *   get:
 *     summary: Get single question by ID
 *     tags: [Questions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: OK
 */
// @route   GET /api/questions/:id
// @desc    Get single question by ID
router.get('/:id', auth, getQuestion);

// @route   PUT /api/questions/:id
// @desc    Update a question
router.put('/:id', auth, upload.single('image'), updateQuestion);

// @route   DELETE /api/questions/:id
// @desc    Delete a question
router.delete('/:id', auth, deleteQuestion);

export default router;