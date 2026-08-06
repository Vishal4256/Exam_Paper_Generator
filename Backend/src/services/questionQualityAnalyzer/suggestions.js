import { GoogleGenAI } from '@google/genai';
import OpenAI from 'openai';

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
        throw new Error("No AI Key available.");
    }

    const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("AI generation timed out after 5000ms.")), 5000);
    });

    return Promise.race([aiPromise, timeoutPromise]);
};

export const generateSuggestions = async (plainText, currentDifficulty, currentBloom, otherIssues) => {
    const fallback = { critical: [], warnings: [], recommendations: [] };
    
    // Automatically carry over non-AI issues
    if (otherIssues && otherIssues.length > 0) {
        fallback.warnings.push(...otherIssues);
    }

    if (!plainText) {
        fallback.critical.push("Question text is empty.");
        return fallback;
    }

    try {
        const prompt = `
        You are an expert academic evaluator. Read the following question and provide suggestions for improving its quality.
        Consider its readability, clarity, difficulty (${currentDifficulty}), and cognitive level (${currentBloom}).
        Also consider these known issues: ${JSON.stringify(otherIssues || [])}
        
        Question: "${plainText}"
        
        Provide actionable suggestions to improve the question.
        Categorize them into:
        1. critical (must fix, e.g. ambiguous wording, no real question being asked).
        2. warnings (potential issues, e.g. overly complex vocabulary).
        3. recommendations (best practices, e.g. 'Add image', 'Split into two questions', 'Increase difficulty').
        
        Return ONLY a valid JSON object matching this schema exactly, with NO markdown block wrapping:
        {
            "critical": ["string"],
            "warnings": ["string"],
            "recommendations": ["string"]
        }
        `;

        const responseText = await getAIResponse(prompt);
        const cleanJson = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleanJson);
        
        // Merge AI findings with deterministic findings
        parsed.warnings = [...new Set([...(parsed.warnings || []), ...fallback.warnings])];
        return parsed;

    } catch (error) {
        console.error("Suggestions AI Error:", error.message);
        return fallback;
    }
};
