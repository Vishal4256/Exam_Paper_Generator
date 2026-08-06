import { GoogleGenAI } from '@google/genai';
import OpenAI from 'openai';

// Helper to get AI response
const getAIResponse = async (prompt) => {
    let geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey === 'your_gemini_api_key_here' || !geminiKey) geminiKey = null;

    let aiPromise;

    if (geminiKey) {
        const ai = new GoogleGenAI({ apiKey: geminiKey });
        aiPromise = ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        }).then(res => res.text);
    } else if (process.env.OPENAI_API_KEY) {
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        aiPromise = openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.7,
        }).then(res => res.choices[0].message.content);
    } else {
        throw new Error("No AI Key available for suggestions.");
    }

    // Enforce a strict 5-second timeout for the AI response
    const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("AI generation timed out after 5000ms.")), 5000);
    });

    return Promise.race([aiPromise, timeoutPromise]);
};

export const generateSuggestions = async (analysisResults) => {
    try {
        const prompt = `
        You are an expert academic Exam Blueprint Analyzer.
        Review the following analysis data for a generated exam blueprint.
        
        Analysis Data:
        ${JSON.stringify(analysisResults, null, 2)}
        
        Provide actionable suggestions to improve the exam quality.
        Categorize them into:
        1. critical (must fix to generate a valid exam, e.g., missing questions, extreme time limits).
        2. warnings (potential issues, e.g., missing topics, duplicate questions).
        3. recommendations (best practices, e.g., diversify question types, balance difficulty).
        
        Return ONLY a valid JSON object matching this schema exactly, with NO markdown block wrapping:
        {
            "critical": ["string"],
            "warnings": ["string"],
            "recommendations": ["string"]
        }
        `;

        const responseText = await getAIResponse(prompt);
        const cleanJson = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
        return JSON.parse(cleanJson);
    } catch (error) {
        console.error("AI Suggestions Error:", error.message);
        // Fallback deterministic suggestions if AI fails or is unconfigured
        const fallback = { critical: [], warnings: [], recommendations: [] };
        
        if (analysisResults.availability?.status === 'Insufficient') {
            fallback.critical.push("Insufficient questions available in the database for the requested blueprint.");
        }
        if (analysisResults.duplicates?.duplicateCount > 0) {
            fallback.warnings.push(`Review the ${analysisResults.duplicates.duplicateCount} duplicate question pairs.`);
        }
        if (analysisResults.difficulty?.balance === 'Poor') {
            fallback.recommendations.push("Rebalance the difficulty distribution (aim for ~30% Easy, ~50% Medium, ~20% Hard).");
        }
        if (analysisResults.coverage?.coverageScore < 100) {
            fallback.warnings.push(`Some topics are missing from the available questions.`);
        }

        return fallback;
    }
};
