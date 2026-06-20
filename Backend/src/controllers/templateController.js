import Template from '../models/Template.model.js';

const saveTemplate = async (req, res) => {
    try {
        const { name, subject, marksDistribution, blueprint, duration } = req.body;
        if (!name || !subject || (!marksDistribution && !blueprint)) {
            return res.status(400).json({ msg: "Please provide all required fields" });
        }

        const newTemplate = new Template({
            user: req.user.id,
            name,
            subject,
            marksDistribution,
            blueprint,
            duration
        });

        const saved = await newTemplate.save();
        res.status(201).json(saved);
    } catch (err) {
        res.status(500).json({ msg: "Server Error", error: err.message });
    }
};

const getTemplates = async (req, res) => {
    try {
        const templates = await Template.find({ user: req.user.id }).sort({ createdAt: -1 });
        res.json(templates);
    } catch (err) {
        res.status(500).json({ msg: "Server Error", error: err.message });
    }
};

const deleteTemplate = async (req, res) => {
    try {
        const template = await Template.findOne({ _id: req.params.id, user: req.user.id });
        if (!template) {
            return res.status(404).json({ msg: "Template not found" });
        }
        await Template.findByIdAndDelete(req.params.id);
        res.json({ msg: "Template deleted" });
    } catch (err) {
        res.status(500).json({ msg: "Server Error", error: err.message });
    }
};

export { saveTemplate, getTemplates, deleteTemplate };
