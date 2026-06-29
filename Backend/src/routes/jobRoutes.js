import express from 'express';
import { createJob, getJobStatus, deleteJob } from '../controllers/jobController.js';
import auth from '../middleware/authMiddleware.js';
import multer from 'multer';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

router.post('/create', auth, upload.array('files', 10), createJob);
router.get('/:jobId', auth, getJobStatus);
router.delete('/:jobId', auth, deleteJob);

export default router;
