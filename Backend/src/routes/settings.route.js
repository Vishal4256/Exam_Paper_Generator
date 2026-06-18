import express from 'express';
import auth from '../middleware/authMiddleware.js';
import InstitutionSettings from '../models/InstitutionSettings.model.js';

const router = express.Router();

// GET /api/settings/institution
router.get('/institution', auth, async (req, res) => {
    try {
        let settings = await InstitutionSettings.findOne({ user: req.user.id });
        if (!settings) {
            // Return defaults if none exist
            return res.json({
                institutionType: 'College',
                institutionName: '',
                department: '',
                defaultExamTitle: '',
                academicSession: '',
                logoUrl: '',
                instructions: ''
            });
        }
        res.json(settings);
    } catch (err) {
        console.error('Error fetching institution settings:', err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// PUT /api/settings/institution
router.put('/institution', auth, async (req, res) => {
    try {
        const { institutionType, institutionName, department, defaultExamTitle, academicSession, logoUrl, instructions } = req.body;
        
        let settings = await InstitutionSettings.findOne({ user: req.user.id });
        
        if (settings) {
            settings.institutionType = institutionType;
            settings.institutionName = institutionName;
            settings.department = department;
            settings.defaultExamTitle = defaultExamTitle;
            settings.academicSession = academicSession;
            settings.logoUrl = logoUrl;
            settings.instructions = instructions;
            await settings.save();
        } else {
            settings = new InstitutionSettings({
                user: req.user.id,
                institutionType,
                institutionName,
                department,
                defaultExamTitle,
                academicSession,
                logoUrl,
                instructions
            });
            await settings.save();
        }
        
        res.json({ success: true, settings });
    } catch (err) {
        console.error('Error saving institution settings:', err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

export default router;
