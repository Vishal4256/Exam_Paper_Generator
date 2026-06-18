import { Router } from "express";
import { generateExam, getExams, getExam, downloadExamPDF, downloadAnswerKeyPDF, deleteExam, bulkDeleteExams } from "../controllers/examController.js";
import auth from "../middleware/authMiddleware.js";

const router = Router();

// @route   POST /api/exams/generate
// @desc    Generate a randomized exam paper
router.post('/generate', auth, generateExam);

// @route   GET /api/exams
// @desc    Get all exams for the logged-in user
router.get('/', auth, getExams);

// @route   GET /api/exams/:id
// @desc    Get single exam by ID
router.get('/:id', auth, getExam);

// @route   GET /api/exams/:id/pdf
// @desc    Download exam as PDF
router.get('/:id/pdf', auth, downloadExamPDF);

// @route   GET /api/exams/:id/answer-key
// @desc    Download answer key as PDF
router.get('/:id/answer-key', auth, downloadAnswerKeyPDF);

// @route   DELETE /api/exams/bulk
// @desc    Delete multiple exams
router.delete('/bulk', auth, bulkDeleteExams);

// @route   DELETE /api/exams/:id
// @desc    Delete an exam
router.delete('/:id', auth, deleteExam);

export default router;