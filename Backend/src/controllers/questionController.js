import Question from '../models/Question.model.js';
import mongoose from 'mongoose';
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
        const { subject, difficulty, type, search, sort, page = 1, limit = 50 } = req.query;
        // Cast the user ID to an ObjectId so it matches in aggregation pipelines
        let query = { user: new mongoose.Types.ObjectId(req.user.id) };
        
        if (subject && subject !== 'All') query.subject = subject;
        if (difficulty && difficulty !== 'All') query.difficulty = difficulty;
        if (type && type !== 'All') query.type = type;
        if (search) {
            query.questionText = { $regex: search, $options: 'i' };
        }
        
        const sortOptions = {
            newest: { createdAt: -1 },
            oldest: { createdAt: 1 },
            az: { subject: 1 },
            za: { subject: -1 },
            difficulty_asc: { difficultyRank: 1, createdAt: -1 },
            difficulty_desc: { difficultyRank: -1, createdAt: -1 },
            type_asc: { type: 1 },
            type_desc: { type: -1 }
        };
        
        const sortOption = sortOptions[sort] || sortOptions.newest;
        
        const skip = (page - 1) * limit;
        const total = await Question.countDocuments(query);
        const absoluteTotal = await Question.countDocuments({ user: req.user.id });
        
        let questions;
        if (sort === 'difficulty_asc' || sort === 'difficulty_desc') {
            const sortDir = sort === 'difficulty_asc' ? 1 : -1;
            questions = await Question.aggregate([
                { $match: query },
                {
                    $addFields: {
                        difficultyRank: {
                            $switch: {
                                branches: [
                                    { case: { $eq: ["$difficulty", "Easy"] }, then: 1 },
                                    { case: { $eq: ["$difficulty", "Medium"] }, then: 2 },
                                    { case: { $eq: ["$difficulty", "Hard"] }, then: 3 }
                                ],
                                default: 0
                            }
                        }
                    }
                },
                { $sort: { difficultyRank: sortDir, createdAt: -1 } },
                { $skip: skip },
                { $limit: Number(limit) }
            ]);
        } else {
            questions = await Question.find(query)
                .sort(sortOption)
                .skip(skip)
                .limit(Number(limit));
        }

        res.json({
            questions,
            totalPages: Math.ceil(total / limit),
            currentPage: Number(page),
            totalQuestions: total,
            absoluteTotal: absoluteTotal
        });
    } catch (err) {
        console.error('Fetch questions error:', err);
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

const bulkDeleteQuestions = async (req, res) => {
    try {
        const { ids } = req.body;
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ msg: "Invalid request. Please provide an array of IDs." });
        }
        
        // Find all images first to delete from filesystem
        const questions = await Question.find({ _id: { $in: ids }, user: req.user.id });
        for (const q of questions) {
            if (q.image) {
                const imagePath = path.join(__dirname, '../../', q.image);
                if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
            }
        }

        const result = await Question.deleteMany({ _id: { $in: ids }, user: req.user.id });
        res.json({ msg: `Successfully deleted ${result.deletedCount} questions.` });
    } catch (err) {
        console.error('Bulk delete error:', err);
        res.status(500).json({ msg: "Server Error", error: err.message });
    }
};

const bulkUpdateQuestions = async (req, res) => {
    try {
        const { ids, updateData } = req.body;
        if (!ids || !Array.isArray(ids) || ids.length === 0 || !updateData) {
            return res.status(400).json({ msg: "Invalid request. Provide ids array and updateData object." });
        }

        const allowedUpdates = ['subject', 'difficulty', 'bloomLevel'];
        const sanitizedUpdate = {};
        for (let key of allowedUpdates) {
            if (updateData[key] !== undefined) {
                sanitizedUpdate[key] = updateData[key];
            }
        }

        if (Object.keys(sanitizedUpdate).length === 0) {
            return res.status(400).json({ msg: "No valid fields to update." });
        }

        const result = await Question.updateMany(
            { _id: { $in: ids }, user: req.user.id },
            { $set: sanitizedUpdate }
        );
        
        res.json({ msg: `Successfully updated ${result.modifiedCount} questions.` });
    } catch (err) {
        console.error('Bulk update error:', err);
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
        const errors = [];
        const filePath = path.join(__dirname, '../../uploads', req.file.filename);

        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', async () => {
                try {
                    let importedCount = 0;
                    const validTypes = ['MCQ', 'Short Answer', 'Long Answer', 'True/False', 'Coding'];
                    const validDifficulties = ['Easy', 'Medium', 'Hard'];

                    for (let i = 0; i < results.length; i++) {
                        const row = results[i];
                        const rowNum = i + 2; // Assuming row 1 is header

                        // Handle alternative column names
                        const questionText = row.questionText || row.question || row.Question;
                        const subject = row.subject || row.Subject;
                        let correctAnswer = row.correctAnswer || row.CorrectAnswer;

                        if (!questionText || questionText.trim() === '') {
                            errors.push(`Row ${rowNum}: Missing 'questionText' or 'question'`);
                            continue;
                        }
                        if (!correctAnswer || correctAnswer.trim() === '') {
                            errors.push(`Row ${rowNum}: Missing 'correctAnswer'`);
                            continue;
                        }
                        if (!subject || subject.trim() === '') {
                            errors.push(`Row ${rowNum}: Missing 'subject'`);
                            continue;
                        }

                        const type = row.type && row.type.trim() !== '' ? row.type.trim() : 'MCQ';
                        if (!validTypes.includes(type)) {
                            errors.push(`Row ${rowNum}: Invalid 'type' (${type}). Expected: ${validTypes.join(', ')}`);
                            continue;
                        }

                        const difficulty = row.difficulty && row.difficulty.trim() !== '' ? row.difficulty.trim() : 'Medium';
                        if (!validDifficulties.includes(difficulty)) {
                            errors.push(`Row ${rowNum}: Invalid 'difficulty' (${difficulty}). Expected: ${validDifficulties.join(', ')}`);
                            continue;
                        }

                        const exists = await Question.findOne({ questionText: questionText.trim(), user: req.user.id });
                        if (exists) {
                            errors.push(`Row ${rowNum}: Duplicate 'questionText' already exists in the database`);
                            continue;
                        }

                        // Handle options: either piped "options" column OR "optionA", "optionB" columns
                        let options = [];
                        if (row.options) {
                            options = row.options.split('|').map(o => o.trim()).filter(Boolean);
                        } else {
                            const optA = row.optionA || row.option1;
                            const optB = row.optionB || row.option2;
                            const optC = row.optionC || row.option3;
                            const optD = row.optionD || row.option4;
                            if (optA) options.push(optA.trim());
                            if (optB) options.push(optB.trim());
                            if (optC) options.push(optC.trim());
                            if (optD) options.push(optD.trim());
                        }
                        
                        if (type === 'MCQ' && options.length < 2) {
                            errors.push(`Row ${rowNum}: MCQ requires at least 2 options`);
                            continue;
                        }

                        // Map A,B,C,D to actual option text if provided that way
                        if (type === 'MCQ' && correctAnswer && correctAnswer.trim().length === 1 && /^[A-D]$/i.test(correctAnswer.trim())) {
                            const index = correctAnswer.trim().toUpperCase().charCodeAt(0) - 65; // A -> 0, B -> 1
                            if (options[index]) {
                                correctAnswer = options[index];
                            } else {
                                errors.push(`Row ${rowNum}: Correct answer '${correctAnswer}' points to a missing option`);
                                continue;
                            }
                        } else if (type === 'MCQ' && correctAnswer && correctAnswer.trim().length === 1 && /^[1-4]$/.test(correctAnswer.trim())) {
                            const index = parseInt(correctAnswer.trim()) - 1; // 1 -> 0, 2 -> 1
                            if (options[index]) {
                                correctAnswer = options[index];
                            } else {
                                errors.push(`Row ${rowNum}: Correct answer '${correctAnswer}' points to a missing option`);
                                continue;
                            }
                        }

                        const tags = row.tags ? row.tags.split('|').map(t => t.trim()).filter(Boolean) : [];

                        try {
                            const newQ = new Question({
                                user: req.user.id,
                                type: type,
                                questionText: questionText.trim(),
                                options: options,
                                correctAnswer: correctAnswer.trim(),
                                subject: subject.trim(),
                                difficulty: difficulty,
                                topic: row.topic ? row.topic.trim() : '',
                                marks: row.marks ? Number(row.marks) : 1,
                                explanation: row.explanation ? row.explanation.trim() : '',
                                tags: tags,
                                source: 'manual'
                            });

                            await newQ.save();
                            importedCount++;
                        } catch (saveErr) {
                            errors.push(`Row ${rowNum}: Database save error - ${saveErr.message}`);
                        }
                    }

                    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
                    
                    if (errors.length > 0) {
                        res.status(207).json({ 
                            msg: `Imported ${importedCount} questions, but found ${errors.length} errors. Check console or network tab for details.`, 
                            errors,
                            importedCount
                        });
                        console.warn("CSV Import Errors:", errors);
                    } else {
                        res.json({ msg: `Successfully imported ${importedCount} questions`, importedCount });
                    }
                } catch (err) {
                    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
                    console.error("Bulk import processing error:", err);
                    res.status(500).json({ msg: "Error processing CSV data", error: err.message });
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

export { addQuestion, updateQuestion, getQuestions, getQuestion, deleteQuestion, bulkImportQuestions, bulkAddQuestions, bulkDeleteQuestions, bulkUpdateQuestions };