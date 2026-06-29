import ImportHistory from '../models/ImportHistory.model.js';

export const getHistory = async (req, res) => {
    try {
        const query = { user: req.user.id };
        if (req.query.subject) query.subject = new RegExp(req.query.subject, 'i');
        
        const history = await ImportHistory.find(query).sort({ createdAt: -1 });
        res.status(200).json({ success: true, history });
    } catch (error) {
        res.status(500).json({ success: false, msg: "Failed to fetch history." });
    }
};

export const deleteHistory = async (req, res) => {
    try {
        await ImportHistory.findOneAndDelete({ _id: req.params.id, user: req.user.id });
        res.status(200).json({ success: true, msg: "History deleted." });
    } catch (error) {
        res.status(500).json({ success: false, msg: "Failed to delete history." });
    }
};
