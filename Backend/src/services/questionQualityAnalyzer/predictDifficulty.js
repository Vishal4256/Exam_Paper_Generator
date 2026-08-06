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
            temperature: 0.2,
        }).then(res => res.choices[0].message.content);
    } else {
        throw new Error("No AI Key available.");
    }

    const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("AI generation timed out after 5000ms.")), 5000);
    });

    return Promise.race([aiPromise, timeoutPromise]);
};

export const predictDifficulty = async (plainText, currentDifficulty) => {
    if (!plainText) {
        return { score: 100, predictedDifficulty: currentDifficulty || 'Medium', mismatchDetected: false };
    }

    try {
        const prompt = `
        You are an expert academic evaluator. 
        Read the following question and predict its difficulty level out of: Easy, Medium, Hard.
        
        Question: "${plainText}"
        
        Return ONLY the word Easy, Medium, or Hard. Nothing else.
        `;

        const responseText = await getAIResponse(prompt);
        const predicted = responseText.trim().replace(/[^a-zA-Z]/g, '');
        
        let normalizedPredicted = 'Medium';
        if (/easy/i.test(predicted)) normalizedPredicted = 'Easy';
        if (/hard/i.test(predicted)) normalizedPredicted = 'Hard';

        const mismatchDetected = currentDifficulty && currentDifficulty !== normalizedPredicted;
        let score = 100;
        const warnings = [];

        if (mismatchDetected) {
            score -= 15;
            warnings.push(`Difficulty mismatch detected. Stored: ${currentDifficulty}, AI Predicted: ${normalizedPredicted}.`);
        }

        return {
            score,
            predictedDifficulty: normalizedPredicted,
            mismatchDetected,
            warnings
        };
    } catch (error) {
        console.error("Difficulty Prediction AI Error:", error.message);
        return {
            score: 100,
            predictedDifficulty: currentDifficulty || 'Medium',
            mismatchDetected: false,
            warnings: []
        };
    }
};
