export const calculateScore = (results) => {
    // Expected modules: difficulty, coverage, duplicates, marks, timing, blooms, availability
    const weights = {
        difficulty: 0.25,
        coverage: 0.25,
        duplicates: 0.15,
        marks: 0.10,
        timing: 0.10,
        blooms: 0.15
    };

    let totalScore = 0;

    // 1. Difficulty Score (0-100)
    let difficultyScore = 100;
    if (results.difficulty?.balance === 'Poor') difficultyScore = 40;
    else if (results.difficulty?.balance === 'Fair') difficultyScore = 70;
    else if (results.difficulty?.balance === 'Good') difficultyScore = 90;
    
    totalScore += (difficultyScore * weights.difficulty);

    // 2. Coverage Score (0-100)
    let coverageScore = results.coverage?.coverageScore || 0;
    totalScore += (coverageScore * weights.coverage);

    // 3. Duplicates Score (0-100)
    let duplicatesScore = 100;
    const dupCount = results.duplicates?.duplicateCount || 0;
    if (dupCount > 0) {
        // Deduct 15 points per duplicate pair
        duplicatesScore = Math.max(0, 100 - (dupCount * 15));
    }
    totalScore += (duplicatesScore * weights.duplicates);

    // 4. Marks Score (0-100)
    let marksScore = 100;
    if (results.marks?.issues && results.marks.issues.length > 0) {
        marksScore = Math.max(0, 100 - (results.marks.issues.length * 20));
    }
    totalScore += (marksScore * weights.marks);

    // 5. Timing Score (0-100)
    let timingScore = 100;
    if (results.timing?.issues && results.timing.issues.length > 0) {
        timingScore = Math.max(0, 100 - (results.timing.issues.length * 20));
    }
    totalScore += (timingScore * weights.timing);

    // 6. Blooms Score (0-100)
    let bloomsScore = results.blooms?.varianceScore || 100;
    totalScore += (bloomsScore * weights.blooms);

    const finalScore = Math.round(totalScore);

    // Overall Status
    let status = 'Excellent';
    if (finalScore < 50) status = 'Poor';
    else if (finalScore < 75) status = 'Fair';
    else if (finalScore < 90) status = 'Good';

    return {
        overallScore: finalScore,
        status,
        breakdown: {
            difficulty: difficultyScore,
            coverage: coverageScore,
            duplicates: duplicatesScore,
            marks: marksScore,
            timing: timingScore,
            blooms: bloomsScore
        }
    };
};
