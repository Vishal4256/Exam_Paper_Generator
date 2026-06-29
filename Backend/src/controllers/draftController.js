import Draft from '../models/Draft.model.js';

export const saveDraft = async (req, res) => {
    try {
        const { name, extractedText, generatedQuestions, options } = req.body;
        
        let draft = await Draft.findOne({ user: req.user.id, name });
        
        if (draft) {
            draft.extractedText = extractedText;
            draft.generatedQuestions = generatedQuestions;
            draft.options = options;
        } else {
            draft = new Draft({
                user: req.user.id,
                name: name || 'Untitled Draft',
                extractedText,
                generatedQuestions,
                options
            });
        }
        
        await draft.save();
        res.status(200).json({ success: true, draft, msg: "Draft saved successfully." });
    } catch (error) {
        res.status(500).json({ success: false, msg: "Failed to save draft." });
    }
};

export const getDrafts = async (req, res) => {
    try {
        const drafts = await Draft.find({ user: req.user.id }).sort({ updatedAt: -1 });
        res.status(200).json({ success: true, drafts });
    } catch (error) {
        res.status(500).json({ success: false, msg: "Failed to fetch drafts." });
    }
};

export const deleteDraft = async (req, res) => {
    try {
        await Draft.findOneAndDelete({ _id: req.params.id, user: req.user.id });
        res.status(200).json({ success: true, msg: "Draft deleted." });
    } catch (error) {
        res.status(500).json({ success: false, msg: "Failed to delete draft." });
    }
};
