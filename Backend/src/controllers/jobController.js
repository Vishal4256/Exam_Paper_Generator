import ProcessingJob from '../models/ProcessingJob.model.js';
import ImportHistory from '../models/ImportHistory.model.js';
import { processMultipleFiles } from '../services/aiImportService.js';
import { GoogleGenAI } from '@google/genai';
import OpenAI from 'openai';
import fs from 'fs';

// AI Helper
const getAIResponse = async (prompt) => {
    let geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey === 'your_api_key_here' || !geminiKey) geminiKey = null;

    if (geminiKey) {
        const ai = new GoogleGenAI({ apiKey: geminiKey });
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text;
    } else {
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.7,
        });
        return response.choices[0].message.content;
    }
};

const updateJob = async (jobId, data) => {
    return await ProcessingJob.findByIdAndUpdate(jobId, data, { new: true });
};

const runExtractTask = async (jobId, files, ocrLang) => {
    try {
        await updateJob(jobId, { status: 'Running OCR', currentStage: 'Extracting text from documents...', progress: 30 });
        
        const extractedText = await processMultipleFiles(files, ocrLang);
        
        // Analyze text
        await updateJob(jobId, { status: 'Extracting Text', currentStage: 'Analyzing document structure...', progress: 70 });
        
        let analysis = null;
        if (extractedText.length > 0) {
            const prompt = `
                Analyze the following academic content.
                Return ONLY a valid JSON object matching this schema, no markdown blocks:
                {
                    "subject": "string",
                    "topics": ["string", "string"],
                    "difficultyDistribution": {"Easy": "XX%", "Medium": "XX%", "Hard": "XX%"},
                    "estimatedQuestionCount": number
                }
                Content:
                ${extractedText.substring(0, 50000)}
            `;
            try {
                const responseText = await getAIResponse(prompt);
                const cleanJson = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
                analysis = JSON.parse(cleanJson);
            } catch (e) {
                console.error("Analysis failed during job:", e);
            }
        }

        const jobDoc = await ProcessingJob.findById(jobId).populate('user');
        
        await updateJob(jobId, { 
            status: 'Completed', 
            currentStage: 'Text extraction complete!', 
            progress: 100,
            result: { extractedText, analysis }
        });

        // Save to History
        if (files.length > 0) {
            await ImportHistory.create({
                user: jobDoc.user._id,
                fileName: files.map(f => f.originalname).join(', '),
                fileType: 'Document',
                subject: analysis?.subject || 'Uncategorized',
                extractedText,
                processingStatus: 'Completed'
            });
        }

    } catch (error) {
        console.error("Job Extract Error:", error);
        await updateJob(jobId, { status: 'Failed', currentStage: 'Error during extraction', errorMessage: error.message });
    } finally {
        // Cleanup temp files
        files.forEach(file => {
            if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
        });
    }
};

const runGenerateTask = async (jobId, text, options) => {
    try {
        await updateJob(jobId, { status: 'Generating Questions', currentStage: 'AI is writing questions...', progress: 40 });
        
        let prompt = "";
        const mode = options.generationMode || 'New';
        const subject = options.subject || 'Derived from context';
        const marks = options.marks || 1;

        const commonSchema = `
        Return ONLY a valid JSON array matching this schema exactly, no markdown blocks:
        [{
            "questionText": "The actual question",
            "options": ["Option A", "Option B", "Option C", "Option D"],
            "correctAnswer": "Exact correct string or text answer",
            "type": "MCQ or Short Answer or Long Answer or Coding",
            "difficulty": "Easy, Medium, or Hard",
            "subject": "${subject}",
            "topic": "Derived from context",
            "marks": ${marks},
            "explanation": "Short explanation",
            "bloomLevel": "Remember, Understand, Apply, Analyze, Evaluate, or Create",
            "qualityScore": "1-10 rating of question quality"
        }]`;
        
        if (mode === 'PYQ' || mode === 'Extract') {
            prompt = `
                Analyze the following content.
                Extract the individual questions directly from the text.
                Do NOT generate new questions.
                ${commonSchema}
                
                Content:
                ${text.substring(0, 50000)}
            `;
        } else {
            prompt = `
                You are an expert academic question generator.
                Generate exactly ${options.count || 10} questions from the following text.
                Generation Mode: ${mode}.
                Question Type preference: ${options.type || 'Mixed'}.
                Difficulty preference: ${options.difficulty || 'Mixed'}.
                
                ${commonSchema}
                
                Content:
                ${text.substring(0, 50000)}
            `;
        }

        const responseText = await getAIResponse(prompt);
        await updateJob(jobId, { progress: 80, currentStage: 'Formatting questions...' });
        
        const cleanJson = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
        const questions = JSON.parse(cleanJson);

        const jobDoc = await ProcessingJob.findById(jobId).populate('user');

        await updateJob(jobId, { 
            status: 'Completed', 
            currentStage: 'Generation complete!', 
            progress: 100,
            result: { generatedQuestions: questions }
        });

        // Save to History (if it's purely a generation task without a file uploaded just now, it will track it)
        await ImportHistory.create({
            user: jobDoc.user._id,
            fileName: 'AI Generation Task',
            fileType: 'AI Generated',
            subject: subject,
            generatedQuestions: questions,
            processingStatus: 'Completed'
        });

    } catch (error) {
        console.error("Job Generate Error:", error);
        await updateJob(jobId, { status: 'Failed', currentStage: 'Error generating questions', errorMessage: error.message });
    }
};

export const createJob = async (req, res) => {
    try {
        const { action, ocrLang, text, options } = req.body;
        
        if (action === 'extract' && (!req.files || req.files.length === 0)) {
            return res.status(400).json({ success: false, msg: "No files uploaded." });
        }
        if (action === 'generate' && !text) {
            return res.status(400).json({ success: false, msg: "No text provided for generation." });
        }

        const job = new ProcessingJob({
            user: req.user.id,
            status: 'Queued',
            progress: 5,
            currentStage: action === 'extract' ? 'Files uploaded, queued for processing...' : 'Queued for generation...'
        });
        await job.save();

        // Run async
        if (action === 'extract') {
            runExtractTask(job._id, req.files, ocrLang || 'eng');
        } else if (action === 'generate') {
            const parsedOptions = typeof options === 'string' ? JSON.parse(options) : options;
            runGenerateTask(job._id, text, parsedOptions);
        } else {
            return res.status(400).json({ success: false, msg: "Invalid action." });
        }

        res.status(202).json({ success: true, jobId: job._id });
    } catch (error) {
        console.error("Job creation error:", error);
        res.status(500).json({ success: false, msg: "Failed to create job: " + error.message });
    }
};

export const getJobStatus = async (req, res) => {
    try {
        const job = await ProcessingJob.findOne({ _id: req.params.jobId, user: req.user.id });
        if (!job) return res.status(404).json({ success: false, msg: "Job not found." });
        
        res.status(200).json({ success: true, job });
    } catch (error) {
        res.status(500).json({ success: false, msg: "Failed to fetch job: " + error.message });
    }
};

export const deleteJob = async (req, res) => {
    try {
        const job = await ProcessingJob.findOneAndDelete({ _id: req.params.jobId, user: req.user.id });
        if (!job) return res.status(404).json({ success: false, msg: "Job not found." });
        
        res.status(200).json({ success: true, msg: "Job deleted." });
    } catch (error) {
        res.status(500).json({ success: false, msg: "Failed to delete job: " + error.message });
    }
};
