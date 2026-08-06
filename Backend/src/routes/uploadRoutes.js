import { Router } from 'express';
import auth from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';

const router = Router();

// @route   POST /api/upload
// @desc    Upload an image for the Rich Text Editor
router.post('/', auth, upload.single('image'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ msg: 'No file uploaded' });
        }
        
        // This is a local upload for now. 
        // Can be easily swapped to return a Cloudinary URL if the middleware is updated to use multer-storage-cloudinary.
        const imageUrl = `/uploads/${req.file.filename}`;
        
        res.status(200).json({ url: imageUrl });
    } catch (error) {
        console.error('Image upload error:', error);
        res.status(500).json({ msg: 'Server Error during upload', error: error.message });
    }
});

export default router;
