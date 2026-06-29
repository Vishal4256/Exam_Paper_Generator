import fs from 'fs';
import pdf from 'pdf-parse/lib/pdf-parse.js';
import tesseract from 'tesseract.js';

export const extractTextFromFile = async (file, ocrLang = 'eng') => {
    try {
        let extractedText = '';

        if (file.mimetype === 'application/pdf') {
            const dataBuffer = fs.readFileSync(file.path);
            const data = await pdf(dataBuffer);
            extractedText = data.text;
        } else if (file.mimetype.startsWith('image/')) {
            const { data: { text } } = await tesseract.recognize(file.path, ocrLang);
            extractedText = text;
        } else {
            throw new Error('Unsupported file type for extraction.');
        }

        return extractedText;
    } catch (err) {
        console.error('Error during extraction:', err);
        throw new Error(`Failed to extract text from file: ${err.message}`);
    } finally {
        // ALWAYS delete the temp file
        if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
        }
    }
};

export const processMultipleFiles = async (files, ocrLang = 'eng') => {
    let combinedText = '';
    for (const file of files) {
        const text = await extractTextFromFile(file, ocrLang);
        combinedText += `\n--- Content from ${file.originalname} ---\n${text}\n`;
    }
    return combinedText.trim();
};
