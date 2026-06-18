import Question from '../models/Question.model.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const addQuestion = async (req, res) => {
    try {
        let {
            questionText, correctAnswer, subject, difficulty, type, topic, marks, explanation, tags, source, required, shuffleOptions, status
        } = req.body;
        
        type = type || 'MCQ';
        difficulty = difficulty || 'Medium';
        source = source || 'manual';
        marks = marks ? Number(marks) : 1;

        let options = [];
        if (typeof req.body.options === 'string') {
            try { options = JSON.parse(req.body.options); } catch (e) { options = [req.body.options]; }
        } else if (Array.isArray(req.body.options)) {
            options = req.body.options;
        }

        options = options.filter(opt => opt && opt.trim() !== '');

        let parsedTags = [];
        if (typeof tags === 'string') {
            try { parsedTags = JSON.parse(tags); } catch(e) { parsedTags = tags.split(',').map(t=>t.trim()); }
        } else if (Array.isArray(tags)) {
            parsedTags = tags;
        }

        if (type === 'MCQ' && options.length < 2) {
            return res.status(400).json({ msg: "At least 2 options are required for MCQ" });
        }

        let imagePath = null;
        if (req.file) {
            imagePath = `/uploads/${req.file.filename}`;
        }

        const newQuestion = new Question({
            user: req.user.id,
            type,
            questionText,
            options,
            correctAnswer,
            subject,
            difficulty,
            topic,
            marks,
            explanation,
            tags: parsedTags,
            source,
            image: imagePath,
            required: required === undefined ? true : required === 'true' || required === true,
            shuffleOptions: shuffleOptions === 'true' || shuffleOptions === true,
            status: status || 'active'
        });

        const question = await newQuestion.save();
        res.status(201).json(question);
    } catch (err) {
        if (req.file) {
            const filePath = path.join(__dirname, '../../uploads', req.file.filename);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }
        console.error('Add question error:', err);
        res.status(500).json({ msg: "Server Error", error: err.message });
    }
};

const updateQuestion = async (req, res) => {
    try {
        const question = await Question.findOne({ _id: req.params.id, user: req.user.id });
        if (!question) return res.status(404).json({ msg: "Question not found" });

        const updateData = { ...req.body };
        
        if (updateData.options && typeof updateData.options === 'string') {
            try { updateData.options = JSON.parse(updateData.options); } catch(e) {}
        }
        if (updateData.tags && typeof updateData.tags === 'string') {
            try { updateData.tags = JSON.parse(updateData.tags); } catch(e) { updateData.tags = updateData.tags.split(','); }
        }

        if (req.file) {
            if (question.image) {
                const oldPath = path.join(__dirname, '../../', question.image);
                if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
            }
            updateData.image = `/uploads/${req.file.filename}`;
        }

        const updated = await Question.findByIdAndUpdate(req.params.id, updateData, { new: true });
        res.json(updated);
    } catch (err) {
        console.error('Update question error:', err);
        res.status(500).json({ msg: "Server Error", error: err.message });
    }
};

const getQuestions = async (req, res) => {
    try {
        const { subject, difficulty, type, search, page = 1, limit = 50 } = req.query;
        let query = { user: req.user.id };
        
        if (subject && subject !== 'All') query.subject = subject;
        if (difficulty && difficulty !== 'All') query.difficulty = difficulty;
        if (type && type !== 'All') query.type = type;
        if (search) {
            query.questionText = { $regex: search, $options: 'i' };
        }
        
        const skip = (page - 1) * limit;
        const total = await Question.countDocuments(query);
        const questions = await Question.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit));
            
        res.json({
            questions,
            total,
            page: Number(page),
            pages: Math.ceil(total / limit)
        });
    } catch (err) {
        res.status(500).json({ msg: "Server Error", error: err.message });
    }
};

const getQuestion = async (req, res) => {
    try {
        const question = await Question.findOne({ _id: req.params.id, user: req.user.id });
        if (!question) return res.status(404).json({ msg: "Question not found" });
        res.json(question);
    } catch (err) {
        res.status(500).json({ msg: "Server Error", error: err.message });
    }
};

const deleteQuestion = async (req, res) => {
    try {
        const question = await Question.findOne({ _id: req.params.id, user: req.user.id });
        if (!question) return res.status(404).json({ msg: "Question not found" });

        if (question.image) {
            const imagePath = path.join(__dirname, '../../', question.image);
            if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
        }

        await Question.findByIdAndDelete(req.params.id);
        res.json({ msg: "Question deleted successfully" });
    } catch (err) {
        res.status(500).json({ msg: "Server Error", error: err.message });
    }
};

import csv from 'csv-parser';

const bulkImportQuestions = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ msg: "Please upload a CSV file" });
        }

        const results = [];
        const filePath = path.join(__dirname, '../../uploads', req.file.filename);

        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', async () => {
                try {
                    let importedCount = 0;
                    for (const row of results) {
                        if (!row.questionText || !row.correctAnswer || !row.subject) continue;

                        const exists = await Question.findOne({ questionText: row.questionText, user: req.user.id });
                        if (exists) continue; // Prevent duplicates

                        const options = row.options ? row.options.split('|').map(o => o.trim()) : [];
                        const tags = row.tags ? row.tags.split('|').map(t => t.trim()) : [];

                        const newQ = new Question({
                            user: req.user.id,
                            type: row.type || 'MCQ',
                            questionText: row.questionText,
                            options: options,
                            correctAnswer: row.correctAnswer,
                            subject: row.subject,
                            difficulty: row.difficulty || 'Medium',
                            topic: row.topic || '',
                            marks: row.marks ? Number(row.marks) : 1,
                            explanation: row.explanation || '',
                            tags: tags,
                            source: 'manual'
                        });

                        await newQ.save();
                        importedCount++;
                    }

                    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
                    
                    res.json({ msg: `Successfully imported ${importedCount} questions` });
                } catch (err) {
                    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
                    console.error("Bulk import processing error:", err);
                    res.status(500).json({ msg: "Error processing CSV data" });
                }
            })
            .on('error', (error) => {
                if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
                res.status(500).json({ msg: "Error reading CSV file", error: error.message });
            });

    } catch (err) {
        if (req.file) {
            const filePath = path.join(__dirname, '../../uploads', req.file.filename);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }
        console.error('Bulk import error:', err);
        res.status(500).json({ msg: "Server Error", error: err.message });
    }
};
const bulkAddQuestions = async (req, res) => {
    try {
        const questions = req.body.questions || req.body;
        if (!Array.isArray(questions)) {
            return res.status(400).json({ msg: "Expected an array of questions" });
        }

        let importedCount = 0;
        for (const row of questions) {
            if (!row.questionText || !row.correctAnswer || !row.subject) continue;

            const exists = await Question.findOne({ questionText: row.questionText, user: req.user.id });
            if (exists) continue; // Prevent duplicates

            const newQ = new Question({
                user: req.user.id,
                type: row.type || 'MCQ',
                questionText: row.questionText,
                options: row.options || [],
                correctAnswer: row.correctAnswer,
                subject: row.subject,
                difficulty: row.difficulty || 'Medium',
                topic: row.topic || '',
                marks: row.marks ? Number(row.marks) : 1,
                explanation: row.explanation || '',
                tags: row.tags || [],
                source: row.source || 'ai'
            });

            await newQ.save();
            importedCount++;
        }

        res.status(201).json({ msg: `Successfully imported ${importedCount} questions` });
    } catch (err) {
        console.error('Bulk add error:', err);
        res.status(500).json({ msg: "Server Error", error: err.message });
    }
};

export { addQuestion, updateQuestion, getQuestions, getQuestion, deleteQuestion, bulkImportQuestions, bulkAddQuestions };