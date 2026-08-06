import { analyzeAvailability } from './analyzeAvailability.js';
import { analyzeDifficulty } from './analyzeDifficulty.js';
import { analyzeCoverage } from './analyzeCoverage.js';
import { analyzeMarks } from './analyzeMarks.js';
import { analyzeTiming } from './analyzeTiming.js';
import { analyzeBloom } from './analyzeBloom.js';
import { analyzeQuestionTypes } from './analyzeQuestionTypes.js';
import { analyzeDuplicates } from './analyzeDuplicates.js';
import { calculateScore } from './calculateScore.js';
import { generateSuggestions } from './suggestions.js';

export const runBlueprintAnalysis = async (blueprint, dbQuestionsBySection, reqBody) => {
    
    // Run individual analysis modules
    const availability = analyzeAvailability(blueprint, dbQuestionsBySection);
    const difficulty = analyzeDifficulty(blueprint, reqBody.difficulty);
    const coverage = analyzeCoverage(blueprint, reqBody.selectedTopics, dbQuestionsBySection);
    const marks = analyzeMarks(blueprint);
    const timing = analyzeTiming(blueprint, reqBody.duration);
    const blooms = analyzeBloom(dbQuestionsBySection, reqBody.examProfile || 'Default');
    const questionTypes = analyzeQuestionTypes(blueprint);
    const duplicates = analyzeDuplicates(dbQuestionsBySection);

    const preliminaryResults = {
        availability,
        difficulty,
        coverage,
        marks,
        timing,
        blooms,
        questionTypes,
        duplicates
    };

    // Calculate final score based on module outputs
    const scoreData = calculateScore(preliminaryResults);
    
    // Generate AI suggestions (or fallback)
    const suggestions = await generateSuggestions(preliminaryResults);

    // Construct final payload
    return {
        score: scoreData.overallScore,
        status: scoreData.status,
        difficulty,
        coverage,
        availability,
        duplicates,
        timing,
        marks,
        blooms,
        questionTypes,
        suggestions
    };
};
