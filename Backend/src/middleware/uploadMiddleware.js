import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        // Generate unique filename: timestamp-random-originalname
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'question-' + uniqueSuffix + ext);
    }
});

// File filter - strictly allow images only for the Rich Text Editor
const fileFilter = (req, file, cb) => {
    const allowedExts = /jpeg|jpg|png|webp/;
    const allowedMimes = /^image\/(jpeg|png|webp)$/;
    
    const extname = allowedExts.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedMimes.test(file.mimetype);

    // Prevent executing scripts disguised as images
    if (file.originalname.includes('.php') || file.originalname.includes('.js') || file.originalname.includes('.html')) {
        return cb(new Error('Invalid file extension'), false);
    }

    if (extname && mimetype) {
        return cb(null, true);
    } else {
        cb(new Error('Security Error: Only valid image files (JPG, PNG, WEBP) are allowed.'));
    }
};

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: fileFilter
});

export default upload;

