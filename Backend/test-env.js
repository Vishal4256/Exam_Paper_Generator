import dotenv from 'dotenv';
dotenv.config();

console.log("KEY IS:", JSON.stringify(process.env.GEMINI_API_KEY));
