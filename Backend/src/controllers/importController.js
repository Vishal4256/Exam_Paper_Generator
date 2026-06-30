import { processMultipleFiles } from '../services/aiImportService.js';
import { GoogleGenAI } from '@google/genai';
import OpenAI from 'openai';
import Question from '../models/Question.model.js';
import PDFDocument from 'pdfkit';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import Fuse from 'fuse.js';

// Helper to get AI response
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

export const extractText = async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ success: false, msg: "No files uploaded." });
        }
        
        const ocrLang = req.body.ocrLang || 'eng';
        const extractedText = await processMultipleFiles(req.files, ocrLang);
        res.status(200).json({ success: true, text: extractedText });
    } catch (error) {
        console.error("Extraction error:", error);
        res.status(500).json({ success: false, msg: "Extraction failed: " + error.message });
    }
};

export const analyzeText = async (req, res) => {
    try {
        const { text } = req.body;
        if (!text) return res.status(400).json({ success: false, msg: "No text provided." });

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
            ${text.substring(0, 50000)}
        `;

        const responseText = await getAIResponse(prompt);
        const cleanJson = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
        const analysis = JSON.parse(cleanJson);
        
        res.status(200).json({ success: true, analysis });
    } catch (error) {
        console.error("Analysis error:", error);
        res.status(500).json({ success: false, msg: "Analysis failed: " + error.message });
    }
};

export const generateQuestions = async (req, res) => {
    try {
        let { text, options } = req.body; 
        if (!text) return res.status(400).json({ success: false, msg: "No text provided." });

        // Processing limit for large documents
        if (text.length > 50000) {
            text = text.substring(0, 50000);
        }

        let prompt = "";
        const mode = options.generationMode || 'New'; // New, Extract, Mixed, PYQ
        const subject = options.subject || 'Derived from context';
        const marks = options.marks || 1;

        const commonSchema = `
        Return ONLY a valid JSON array matching this schema exactly, no markdown blocks:
        [{
            "questionText": "The actual question",
            "options": ["Option A", "Option B", "Option C", "Option D"], // For MCQ. Empty array [] for other types.
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
                Do NOT generate new questions, just parse and format the existing ones.
                Categorize their difficulty (Easy, Medium, Hard), type, and estimate Bloom's Taxonomy level.
                ${commonSchema}
                
                Content:
                ${text}
            `;
        } else {
            prompt = `
                You are an expert academic question generator.
                Generate exactly ${options.count || 10} questions from the following text.
                Generation Mode: ${mode} (If Mixed, blend extracted questions with new ones).
                Question Type preference: ${options.type || 'Mixed'}.
                Difficulty preference: ${options.difficulty || 'Mixed'}.
                Estimate Bloom's Taxonomy level for each question.
                
                ${commonSchema}
                
                Content:
                ${text}
            `;
        }

        const responseText = await getAIResponse(prompt);
        const cleanJson = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
        const questions = JSON.parse(cleanJson);
        
        res.status(200).json({ success: true, questions });
    } catch (error) {
        console.error("Generation error:", error);
        res.status(500).json({ success: false, msg: "Generation failed: " + error.message });
    }
};

export const checkSimilarity = async (req, res) => {
    try {
        const { questions } = req.body;
        if (!questions || !Array.isArray(questions)) return res.status(400).json({ success: false, msg: "Invalid questions" });

        // Optimization: Get unique subjects from incoming questions
        const uniqueSubjects = [...new Set(questions.map(q => q.subject).filter(Boolean))];
        const query = { user: req.user.id };
        if (uniqueSubjects.length > 0) {
            // Include case-insensitive regex for subjects to be safe
            query.subject = { $in: uniqueSubjects.map(s => new RegExp(`^${s}$`, 'i')) };
        }

        // Fetch optimized subset of questions
        const existingQs = await Question.find(query, 'questionText subject difficulty').lean();
        
        const fuse = new Fuse(existingQs, {
            keys: ['questionText'],
            includeScore: true,
            threshold: 0.5 // Allow broader search to capture down to 50% match
        });

        const results = questions.map(q => {
            const matches = fuse.search(q.questionText || '');
            let isSimilar = false;
            let similarityScore = 0;
            let similarityLevel = "Low";
            let similarQuestionId = null;
            let similarQuestionText = null;
            let similarQuestionSubject = null;

            if (matches.length > 0) {
                // Convert distance to percentage (1 - distance) * 100
                similarityScore = Math.round((1 - matches[0].score) * 100);
                
                if (similarityScore > 50) {
                    isSimilar = true;
                    similarQuestionId = matches[0].item._id.toString();
                    similarQuestionText = matches[0].item.questionText;
                    similarQuestionSubject = matches[0].item.subject;
                    
                    if (similarityScore >= 80) similarityLevel = "High";
                    else similarityLevel = "Medium";
                }
            }

            return {
                ...q,
                isSimilar,
                similarityScore,
                similarityLevel,
                similarQuestionId,
                similarQuestionText,
                similarQuestionSubject
            };
        });

        res.status(200).json({ success: true, results });
    } catch (error) {
        console.error("Similarity check error:", error);
        res.status(500).json({ success: false, msg: "Failed to check similarity." });
    }
};

export const saveBulkQuestions = async (req, res) => {
    try {
        const { questions } = req.body;
        if (!questions || !Array.isArray(questions)) {
            return res.status(400).json({ success: false, msg: "Invalid questions payload." });
        }

        const savedQuestions = [];
        let duplicates = 0;

        for (const q of questions) {
            // Check for duplicate by questionText (case-insensitive) and subject
            const existing = await Question.findOne({
                user: req.user.id,
                subject: { $regex: new RegExp(`^${q.subject}$`, 'i') },
                questionText: { $regex: new RegExp(`^${q.questionText}$`, 'i') }
            });

            if (existing) {
                duplicates++;
                continue;
            }

            const newQ = new Question({
                user: req.user.id,
                type: q.type || 'MCQ',
                questionText: q.questionText,
                options: q.options || [],
                correctAnswer: q.correctAnswer || '',
                subject: q.subject || 'General',
                difficulty: q.difficulty || 'Medium',
                topic: q.topic || '',
                marks: q.marks || 1,
                explanation: q.explanation || '',
                source: 'ai'
            });

            await newQ.save();
            savedQuestions.push(newQ);
        }

        res.status(201).json({
            success: true,
            msg: `Successfully saved ${savedQuestions.length} questions. ${duplicates} duplicates skipped.`,
            savedCount: savedQuestions.length,
            duplicates
        });
    } catch (error) {
        console.error("Save bulk error:", error);
        res.status(500).json({ success: false, msg: "Failed to save questions: " + error.message });
    }
};

export const exportPDF = async (req, res) => {
    try {
        const { questions } = req.body;
        
        const doc = new PDFDocument();
        res.setHeader('Content-disposition', 'attachment; filename="Generated_Questions.pdf"');
        res.setHeader('Content-type', 'application/pdf');
        
        doc.pipe(res);
        
        doc.fontSize(20).text('Generated Questions', { align: 'center' });
        doc.moveDown();
        
        questions.forEach((q, index) => {
            doc.fontSize(14).text(`Q${index + 1}. ${q.questionText}`);
            if (q.options && q.options.length > 0) {
                q.options.forEach((opt, i) => {
                    doc.fontSize(12).text(`   ${String.fromCharCode(65 + i)}) ${opt}`);
                });
            }
            doc.moveDown();
            doc.fontSize(12).text(`Answer: ${q.correctAnswer}`);
            doc.fontSize(10).text(`Subject: ${q.subject} | Topic: ${q.topic} | Difficulty: ${q.difficulty}`);
            doc.fontSize(10).text(`Marks: ${q.marks || 1} | Bloom Level: ${q.bloomLevel || 'N/A'} | Quality: ${q.qualityScore || 'N/A'}/10`);
            doc.moveDown(2);
        });
        
        doc.end();
    } catch (error) {
        res.status(500).json({ success: false, msg: "Failed to export PDF" });
    }
};

export const exportDOCX = async (req, res) => {
    try {
        const { questions } = req.body;
        
        const children = [
            new Paragraph({
                text: "Generated Questions",
                heading: HeadingLevel.HEADING_1,
            })
        ];
        
        questions.forEach((q, index) => {
            children.push(new Paragraph({
                text: `Q${index + 1}. ${q.questionText}`,
                heading: HeadingLevel.HEADING_2,
            }));
            
            if (q.options && q.options.length > 0) {
                q.options.forEach((opt, i) => {
                    children.push(new Paragraph({
                        text: `${String.fromCharCode(65 + i)}) ${opt}`,
                    }));
                });
            }
            
            children.push(new Paragraph({
                text: `Answer: ${q.correctAnswer}`,
            }));
            children.push(new Paragraph({
                text: `Subject: ${q.subject} | Topic: ${q.topic} | Difficulty: ${q.difficulty}`,
            }));
            children.push(new Paragraph({
                text: `Marks: ${q.marks || 1} | Bloom Level: ${q.bloomLevel || 'N/A'} | Quality: ${q.qualityScore || 'N/A'}/10`,
            }));
            children.push(new Paragraph({ text: "" }));
        });
        
        const doc = new Document({
            sections: [{
                properties: {},
                children: children
            }]
        });
        
        const b64string = await Packer.toBase64String(doc);
        const buffer = Buffer.from(b64string, 'base64');
        
        res.setHeader('Content-disposition', 'attachment; filename="Generated_Questions.docx"');
        res.setHeader('Content-type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.send(buffer);
    } catch (error) {
        res.status(500).json({ success: false, msg: "Failed to export DOCX" });
    }
};
