import { GoogleGenAI } from '@google/genai';
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const generateAIQuestions = async (req, res) => {
    try {
        const { subject, topic, difficulty, type, count } = req.body;

        if (!subject || !topic || !difficulty || !type || !count) {
            return res.status(400).json({ msg: "Please provide all required fields." });
        }

        let geminiKey = process.env.GEMINI_API_KEY;
        let openaiKey = process.env.OPENAI_API_KEY;

        if (geminiKey === 'your_api_key_here' || geminiKey === '') geminiKey = null;
        if (openaiKey === 'your_api_key_here' || openaiKey === '') openaiKey = null;

        if (!geminiKey && !openaiKey) {
            return res.status(400).json({ msg: "AI API key not configured. Please add a valid API key in your .env file." });
        }

        const prompt = `
            You are an expert academic question generator. 
            Generate exactly ${count} question(s) on the following specifications:
            Subject: ${subject}
            Topic: ${topic}
            Difficulty: ${difficulty}
            Question Type: ${type}
            
            Return the response strictly as a JSON array of objects. Do not include any markdown formatting (like \`\`\`json) or any extra text before or after the JSON array.
            
            Each object in the array MUST match this exact schema:
            {
                "questionText": "The actual question",
                "options": ["Option A", "Option B", "Option C", "Option D"], // Provide exactly 4 string options if type is 'MCQ'. If type is 'True/False', provide exactly ["True", "False"]. If type is 'Short Answer' or 'Long Answer', provide an empty array [].
                "correctAnswer": "The exact string from options that is correct (for MCQ/True-False) or the expected text answer/rubric (for Short/Long Answer)",
                "explanation": "A short explanation of why the answer is correct",
                "type": "${type}",
                "difficulty": "${difficulty}",
                "subject": "${subject}",
                "topic": "${topic}"
            }
        `;

        let aiText = '';

        if (geminiKey) {
            const ai = new GoogleGenAI({ apiKey: geminiKey });
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });
            aiText = response.text;
        } else {
            const openai = new OpenAI({ apiKey: openaiKey });
            const response = await openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [{ role: "user", content: prompt }],
                temperature: 0.7,
            });
            aiText = response.choices[0].message.content;
        }

        // Clean up markdown code blocks if the model still outputs them
        aiText = aiText.replace(/```json/gi, '').replace(/```/g, '').trim();

        let questions;
        try {
            questions = JSON.parse(aiText);
        } catch (parseError) {
            console.error("Failed to parse AI response:", aiText);
            return res.status(500).json({ msg: "AI responded with invalid format. Please regenerate." });
        }

        res.status(200).json({ success: true, questions });
    } catch (error) {
        console.error("Error generating AI questions:", error);
        
        // Handle Google API Key specifically
        if (error.message && error.message.includes("API key not valid")) {
            return res.status(401).json({ msg: "Invalid Gemini API Key. Please check your .env file." });
        }
        
        if (error.message && (error.message.includes("quota") || error.message.includes("limit") || error.status === 429)) {
             return res.status(429).json({ msg: "API limit exceeded." });
        }
        res.status(500).json({ msg: error.message || "Unable to generate questions. Please try again.", error: error.message });
    }
};

export { generateAIQuestions };
