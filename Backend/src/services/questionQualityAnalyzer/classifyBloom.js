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

export const classifyBloom = async (plainText, currentBloom) => {
    const defaultResponse = {
        score: 100,
        primary: { level: currentBloom || 'Remember', confidence: 100 },
        alternative: null,
        warnings: []
    };

    if (!plainText) return defaultResponse;

    try {
        const prompt = `
        You are an expert academic evaluator. Read the following question and classify it according to Bloom's Taxonomy.
        The levels are: Remember, Understand, Apply, Analyze, Evaluate, Create.
        
        Question: "${plainText}"
        
        Return ONLY a JSON object with this exact structure:
        {
            "primary": { "level": "string", "confidence": number (0-100) },
            "alternative": { "level": "string", "confidence": number (0-100) }
        }
        `;

        const responseText = await getAIResponse(prompt);
        const cleanJson = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleanJson);
        
        let score = 100;
        const warnings = [];

        if (currentBloom && parsed.primary && currentBloom.toLowerCase() !== parsed.primary.level.toLowerCase()) {
            score -= 10;
            warnings.push(`Bloom's Taxonomy mismatch. Stored: ${currentBloom}, Predicted: ${parsed.primary.level}.`);
        }

        return {
            score,
            primary: parsed.primary,
            alternative: parsed.alternative,
            warnings
        };
    } catch (error) {
        console.error("Bloom Classification AI Error:", error.message);
        return defaultResponse;
    }
};
