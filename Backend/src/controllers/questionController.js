import Question from '../models/Question.model.js';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { sanitizeTipTapJson } from '../utils/sanitize.js';
import { runQualityAnalysis } from '../services/questionQualityAnalyzer/qualityAnalyzer.js';
import { invalidateAnalyticsCache } from './analyticsController.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const wrapText = (text) => {
    if (!text) return { content: { type: 'doc', content: [] }, plainText: '', htmlCache: '' };
    if (typeof text === 'object' && text.content) return text;
    return {
        content: {
            type: 'doc',
            content: [{ type: 'paragraph', content: [{ type: 'text', text: String(text) }] }]
        },
        plainText: String(text),
        htmlCache: `<p>${String(text)}</p>`
    };
};

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

        // We can't just check `opt.trim()` since options are now RichText objects
        options = options.filter(opt => {
            if (typeof opt === 'string') return opt.trim() !== '';
            return opt && opt.plainText && opt.plainText.trim() !== '';
        });

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
            questionText: sanitizeTipTapJson(questionText),
            options: sanitizeTipTapJson(options),
            correctAnswer: sanitizeTipTapJson(correctAnswer),
            subject,
            difficulty,
            topic,
            marks,
            explanation: sanitizeTipTapJson(explanation),
            tags: parsedTags,
            source,
            image: imagePath,
            required: required === undefined ? true : required === 'true' || required === true,
            shuffleOptions: shuffleOptions === 'true' || shuffleOptions === true,
            status: status || 'active'
        });

        const question = await newQuestion.save();
        
        invalidateAnalyticsCache(req.user.id);
        
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
        if (updateData.questionText) updateData.questionText = sanitizeTipTapJson(updateData.questionText);
        if (updateData.options) updateData.options = sanitizeTipTapJson(updateData.options);
        if (updateData.correctAnswer) updateData.correctAnswer = sanitizeTipTapJson(updateData.correctAnswer);
        if (updateData.explanation) updateData.explanation = sanitizeTipTapJson(updateData.explanation);

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
        
        invalidateAnalyticsCache(req.user.id);
        
        res.json(updated);
    } catch (err) {
        console.error('Update question error:', err);
        res.status(500).json({ msg: "Server Error", error: err.message });
    }
};

const getQuestions = async (req, res) => {
    try {
        const { subject, topic, subTopic, difficulty, type, status, bloomLevel, tags, search, sort, page = 1, limit = 50, qualityMin, qualityMax, missingExplanation } = req.query;
        // Cast the user ID to an ObjectId so it matches in aggregation pipelines
        let query = { user: new mongoose.Types.ObjectId(req.user.id) };
        


        // Helper to handle comma-separated values for multi-select
        const parseMulti = (val) => val.split(',').map(v => v.trim()).filter(Boolean);

        if (subject && subject !== 'All') query.subject = { $in: parseMulti(subject) };
        if (topic) query.topic = { $in: parseMulti(topic) };
        if (subTopic) query.subTopic = { $in: parseMulti(subTopic) };
        if (difficulty && difficulty !== 'All') query.difficulty = { $in: parseMulti(difficulty) };
        if (type && type !== 'All') query.type = { $in: parseMulti(type) };
        if (status) query.status = { $in: parseMulti(status) };
        if (bloomLevel) query.bloomLevel = { $in: parseMulti(bloomLevel) };
        if (tags) query.tags = { $in: parseMulti(tags) };

        if (qualityMin !== undefined || qualityMax !== undefined) {
            const condition = {};
            if (qualityMin !== undefined) condition.$gte = Number(qualityMin);
            if (qualityMax !== undefined) condition.$lte = Number(qualityMax);
            
            if (qualityMax !== undefined && Number(qualityMax) < 60) {
                query.$or = [
                    { qualityScore: condition },
                    { qualityScore: null }
                ];
            } else {
                query.qualityScore = condition;
            }
        }

        if (missingExplanation === 'true') {
            query['explanation.plainText'] = '';
        }

        if (search) {
            // Using regex for partial matching (very useful for type-ahead), backed by indexes where possible
            const regex = new RegExp(search.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), 'i');
            query.$or = [
                { questionText: regex },
                { 'questionText.plainText': regex },
                { subject: regex },
                { topic: regex },
                { subTopic: regex },
                { explanation: regex },
                { 'explanation.plainText': regex },
                { difficulty: regex },
                { type: regex },
                { bloomLevel: regex },
                { tags: regex },
                { keywords: regex }
            ];
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
        const absoluteTotal = await Question.countDocuments({ user: new mongoose.Types.ObjectId(req.user.id) });

        // ── DIAGNOSTIC: counts + sample doc ─────────────────────────────
        const globalTotal = await Question.countDocuments({});
        const sampleDoc = await Question.findOne({});
        console.log('Total docs in collection (all users):', globalTotal);
        console.log('Matched by query (owned):', total);
        console.log('absoluteTotal:', absoluteTotal);
        if (sampleDoc) {
            console.log('Sample doc _id:', sampleDoc._id.toString());
            console.log('Sample doc user field:', sampleDoc.user);
            console.log('Sample doc user field type:', typeof sampleDoc.user);
            console.log('Sample doc user.toString():', sampleDoc.user?.toString?.());
            console.log('IDs match?', sampleDoc.user?.toString() === req.user.id);
        }
        console.log('Full query filter:', JSON.stringify(query));
        console.log('══════════════════════════════════════════════════════\n');
        // ────────────────────────────────────────────────────────────────
        
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

const getFilteredQuestionIds = async (req, res) => {
    try {
        const { subject, topic, subTopic, difficulty, type, status, bloomLevel, tags, search, qualityMin, qualityMax, missingExplanation } = req.query;
        let query = { user: new mongoose.Types.ObjectId(req.user.id) };
        
        const parseMulti = (val) => val.split(',').map(v => v.trim()).filter(Boolean);

        if (subject && subject !== 'All') query.subject = { $in: parseMulti(subject) };
        if (topic) query.topic = { $in: parseMulti(topic) };
        if (subTopic) query.subTopic = { $in: parseMulti(subTopic) };
        if (difficulty && difficulty !== 'All') query.difficulty = { $in: parseMulti(difficulty) };
        if (type && type !== 'All') query.type = { $in: parseMulti(type) };
        if (status) query.status = { $in: parseMulti(status) };
        if (bloomLevel) query.bloomLevel = { $in: parseMulti(bloomLevel) };
        if (tags) query.tags = { $in: parseMulti(tags) };

        if (qualityMin !== undefined || qualityMax !== undefined) {
            const condition = {};
            if (qualityMin !== undefined) condition.$gte = Number(qualityMin);
            if (qualityMax !== undefined) condition.$lte = Number(qualityMax);
            
            if (qualityMax !== undefined && Number(qualityMax) < 60) {
                query.$or = [
                    { qualityScore: condition },
                    { qualityScore: null }
                ];
            } else {
                query.qualityScore = condition;
            }
        }

        if (missingExplanation === 'true') {
            query['explanation.plainText'] = '';
        }

        if (search) {
            const regex = new RegExp(search.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), 'i');
            query.$or = [
                { questionText: regex },
                { 'questionText.plainText': regex },
                { subject: regex },
                { topic: regex },
                { subTopic: regex },
                { explanation: regex },
                { 'explanation.plainText': regex },
                { difficulty: regex },
                { type: regex },
                { bloomLevel: regex },
                { tags: regex },
                { keywords: regex }
            ];
        }

        const questions = await Question.find(query).select('_id');
        const ids = questions.map(q => q._id);
        res.json({ ids });
    } catch (err) {
        console.error('Fetch filtered IDs error:', err);
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
        
        invalidateAnalyticsCache(req.user.id);
        
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
        
        invalidateAnalyticsCache(req.user.id);
        
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

        const allowedUpdates = ['subject', 'difficulty', 'bloomLevel', 'status', 'topic', 'subTopic'];
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
        
        invalidateAnalyticsCache(req.user.id);
        
        res.json({ msg: `Successfully updated ${result.modifiedCount} questions.` });
    } catch (err) {
        console.error('Bulk update error:', err);
        res.status(500).json({ msg: "Server Error", error: err.message });
    }
};

const bulkUpdateTags = async (req, res) => {
    try {
        const { ids, tags, action } = req.body; // action: 'add', 'remove', 'replace'
        if (!ids || !Array.isArray(ids) || ids.length === 0 || !tags || !Array.isArray(tags) || !action) {
            return res.status(400).json({ msg: "Invalid request. Provide ids, tags array, and action." });
        }

        let updateOp;
        if (action === 'add') {
            updateOp = { $addToSet: { tags: { $each: tags } } };
        } else if (action === 'remove') {
            updateOp = { $pullAll: { tags: tags } };
        } else if (action === 'replace') {
            updateOp = { $set: { tags: tags } };
        } else {
            return res.status(400).json({ msg: "Invalid action." });
        }

        const result = await Question.updateMany(
            { _id: { $in: ids }, user: req.user.id },
            updateOp
        );
        
        invalidateAnalyticsCache(req.user.id);
        
        res.json({ msg: `Successfully updated tags for ${result.modifiedCount} questions.` });
    } catch (err) {
        console.error('Bulk tag update error:', err);
        res.status(500).json({ msg: "Server Error", error: err.message });
    }
};

const bulkDuplicateQuestions = async (req, res) => {
    try {
        const { ids } = req.body;
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ msg: "Invalid request. Provide ids array." });
        }

        const questions = await Question.find({ _id: { $in: ids }, user: req.user.id }).lean();
        
        if (questions.length === 0) {
            return res.status(404).json({ msg: "No valid questions found to duplicate." });
        }

        const duplicates = questions.map(q => {
            const { _id, createdAt, updatedAt, __v, ...rest } = q;
            return {
                ...rest,
                questionText: typeof q.questionText === 'object' 
                    ? { ...q.questionText, plainText: `${q.questionText.plainText} (Copy)` }
                    : `${q.questionText} (Copy)`,
                status: 'draft', // Usually good practice to make copies drafts initially
                createdAt: new Date()
            };
        });

        const result = await Question.insertMany(duplicates);
        
        invalidateAnalyticsCache(req.user.id);
        
        res.status(201).json({ msg: `Successfully duplicated ${result.length} questions.` });
    } catch (err) {
        console.error('Bulk duplicate error:', err);
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
                                questionText: wrapText(questionText.trim()),
                                options: options.map(o => wrapText(o)),
                                correctAnswer: correctAnswer.trim(),
                                subject: subject.trim(),
                                difficulty: difficulty,
                                topic: row.topic ? row.topic.trim() : '',
                                marks: row.marks ? Number(row.marks) : 1,
                                explanation: wrapText(row.explanation ? row.explanation.trim() : ''),
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

            const plainQuestionText = typeof row.questionText === 'object' ? row.questionText.plainText : row.questionText;
            const exists = await Question.findOne({ 'questionText.plainText': plainQuestionText, user: req.user.id });
            if (exists) continue; // Prevent duplicates

            const newQ = new Question({
                user: req.user.id,
                type: row.type || 'MCQ',
                questionText: sanitizeTipTapJson(wrapText(row.questionText)),
                options: (row.options || []).map(o => sanitizeTipTapJson(wrapText(o))),
                correctAnswer: sanitizeTipTapJson(wrapText(row.correctAnswer)),
                subject: row.subject,
                difficulty: row.difficulty || 'Medium',
                topic: row.topic || '',
                marks: row.marks ? Number(row.marks) : 1,
                explanation: sanitizeTipTapJson(wrapText(row.explanation || '')),
                tags: row.tags || [],
                source: row.source || 'ai'
            });

            await newQ.save();
            importedCount++;
        }

        invalidateAnalyticsCache(req.user.id);

        res.status(201).json({ msg: `Successfully imported ${importedCount} questions` });
    } catch (err) {
        console.error('Bulk add error:', err);
        res.status(500).json({ msg: "Server Error", error: err.message });
    }
};

const analyzeQuestionQuality = async (req, res) => {
    try {
        const { questionData } = req.body;
        if (!questionData || !questionData.plainText) {
            return res.status(400).json({ msg: "Question plain text is required." });
        }

        // Fetch all questions for duplicate detection context
        const allQuestions = await Question.find({ user: req.user.id }, 'plainText questionText subject');
        
        const analysis = await runQualityAnalysis(questionData, allQuestions);
        return res.status(200).json(analysis);
    } catch (err) {
        console.error("Quality Analysis Error:", err);
        return res.status(500).json({ msg: "Failed to analyze question quality.", error: err.message });
    }
};

export { addQuestion, updateQuestion, getQuestions, getFilteredQuestionIds, getQuestion, deleteQuestion, bulkImportQuestions, bulkAddQuestions, bulkDeleteQuestions, bulkUpdateQuestions, bulkUpdateTags, bulkDuplicateQuestions, analyzeQuestionQuality };