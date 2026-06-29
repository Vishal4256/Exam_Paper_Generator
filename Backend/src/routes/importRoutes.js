import express from 'express';
import { aiUpload } from '../middleware/aiImportUpload.js';
import { 
    extractText, 
    analyzeText, 
    generateQuestions, 
    saveBulkQuestions,
    exportPDF,
    exportDOCX,
    checkSimilarity
} from '../controllers/importController.js';
import auth from '../middleware/authMiddleware.js';

const router = express.Router();

// All AI Import routes are protected by auth middleware
router.use(auth);

// File upload handles array of files, field name 'files', max 10
router.post('/extract-text', aiUpload.array('files', 10), extractText);

router.post('/analyze-text', analyzeText);
router.post('/generate-questions', generateQuestions);
router.post('/check-similarity', checkSimilarity);
router.post('/save', saveBulkQuestions);
router.post('/export/pdf', exportPDF);
router.post('/export/docx', exportDOCX);

export default router;
