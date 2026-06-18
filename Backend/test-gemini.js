import dotenv from 'dotenv';
dotenv.config();
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function test() {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: 'say hi',
        });
        console.log("SUCCESS:", response.text);
    } catch (err) {
        console.error("ERROR:", err.message);
    }
}
test();
