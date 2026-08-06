import Fuse from 'fuse.js';

export const detectDuplicates = (plainText, allQuestions, currentQuestionId) => {
    if (!plainText || !allQuestions || allQuestions.length === 0) {
        return {
            score: 100,
            duplicateProbability: 0,
            similarQuestions: []
        };
    }

    // Set up Fuse for fuzzy matching
    const fuse = new Fuse(allQuestions, {
        keys: ['plainText', 'questionText'],
        includeScore: true,
        threshold: 0.3
    });

    const results = fuse.search(plainText);

    // Filter out the current question itself (if editing)
    const matches = results.filter(r => 
        !currentQuestionId || r.item._id.toString() !== currentQuestionId.toString()
    );

    let maxProbability = 0;
    const similarQuestions = [];
    
    matches.slice(0, 3).forEach(match => {
        const confidence = Math.round((1 - match.score) * 100);
        if (confidence > maxProbability) {
            maxProbability = confidence;
        }

        similarQuestions.push({
            id: match.item._id,
            text: match.item.plainText || match.item.questionText,
            probability: confidence
        });
    });

    let score = 100;
    if (maxProbability > 85) score = 20; // Very likely duplicate
    else if (maxProbability > 60) score = 60; // Somewhat similar
    else if (maxProbability > 40) score = 85; 

    return {
        score,
        duplicateProbability: maxProbability,
        similarQuestions
    };
};
