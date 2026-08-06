import { analyzeReadability } from './analyzeReadability.js';
import { estimateTime } from './estimateTime.js';
import { detectDuplicates } from './detectDuplicates.js';
import { validateMetadata } from './validateMetadata.js';
import { predictDifficulty } from './predictDifficulty.js';
import { classifyBloom } from './classifyBloom.js';
import { generateSuggestions } from './suggestions.js';
import { calculateScore } from './calculateScore.js';

export const runQualityAnalysis = async (questionData, allQuestions = []) => {
    // 1. Run Deterministic Analyzers (Parallel & Fast)
    const [readability, timing, duplicates, metadata] = await Promise.all([
        Promise.resolve(analyzeReadability(questionData.plainText)),
        Promise.resolve(estimateTime(questionData.type, questionData.difficulty, questionData.marks, questionData.plainText)),
        Promise.resolve(detectDuplicates(questionData.plainText, allQuestions, questionData._id)),
        Promise.resolve(validateMetadata(questionData))
    ]);

    // Aggregate deterministic issues to guide the AI
    const deterministicIssues = [
        ...(readability.issues || []),
        ...(timing.issues || []),
        ...(metadata.issues || []),
        ...(readability.recommendations || []),
        ...(timing.recommendations || []),
        ...(metadata.recommendations || [])
    ];

    // 2. Run AI Analyzers (Parallel)
    const [difficulty, bloom, suggestions] = await Promise.all([
        predictDifficulty(questionData.plainText, questionData.difficulty),
        classifyBloom(questionData.plainText, questionData.bloomLevel),
        generateSuggestions(questionData.plainText, questionData.difficulty, questionData.bloomLevel, deterministicIssues)
    ]);

    // Add any specific AI warnings to suggestions
    if (difficulty.warnings?.length > 0) suggestions.warnings.push(...difficulty.warnings);
    if (bloom.warnings?.length > 0) suggestions.warnings.push(...bloom.warnings);

    const results = { difficulty, readability, timing, bloom, duplicates, metadata };

    // 3. Aggregate Score
    const scoreData = calculateScore(results);

    // 4. Return Standard API Payload
    return {
        overall: scoreData.overall,
        status: scoreData.status,
        categoryScores: scoreData.categories,
        difficulty,
        readability,
        timing,
        bloom,
        duplicates,
        metadata,
        suggestions
    };
};
