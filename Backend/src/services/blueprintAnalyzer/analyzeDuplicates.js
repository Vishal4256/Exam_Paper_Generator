import Fuse from 'fuse.js';

export const analyzeDuplicates = (dbQuestionsBySection) => {
    // Flatten all selected potential questions
    const allQuestions = [];
    dbQuestionsBySection.forEach(sec => {
        if (sec && Array.isArray(sec)) {
            allQuestions.push(...sec);
        }
    });

    const issues = [];
    const duplicatesFound = [];

    // Early exit if < 2 questions
    if (allQuestions.length < 2) {
        return { duplicateCount: 0, issues, duplicates: [] };
    }

    // Set up Fuse for fuzzy matching
    const fuse = new Fuse(allQuestions, {
        keys: ['plainText', 'questionText'],
        includeScore: true,
        threshold: 0.2 // A score of 0.0 is perfect match, 0.2 is very close
    });

    const processedIds = new Set();

    allQuestions.forEach(q => {
        if (processedIds.has(q._id.toString())) return; // skip already flagged as duplicate

        // Search for matches
        const qText = q.plainText || q.questionText || '';
        const results = fuse.search(qText);

        // Filter out the question itself and find close matches
        const matches = results.filter(r => 
            r.item._id.toString() !== q._id.toString() &&
            r.item.subject.toLowerCase() === q.subject.toLowerCase()
        );

        if (matches.length > 0) {
            // Take the closest match
            const bestMatch = matches[0];
            const confidence = Math.round((1 - bestMatch.score) * 100);

            duplicatesFound.push({
                question1: qText,
                question2: bestMatch.item.plainText || bestMatch.item.questionText,
                similarity: confidence,
                q1Id: q._id,
                q2Id: bestMatch.item._id
            });
            
            processedIds.add(q._id.toString());
            processedIds.add(bestMatch.item._id.toString());
        }
    });

    if (duplicatesFound.length > 0) {
        issues.push(`Detected ${duplicatesFound.length} potential duplicate pair(s) in the available pool.`);
    }

    return {
        duplicateCount: duplicatesFound.length,
        duplicates: duplicatesFound,
        issues
    };
};
