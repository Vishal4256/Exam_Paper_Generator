export const calculateScore = (results) => {
    // Expected modules: difficulty, readability, timing, blooms, duplicates, metadata
    const weights = {
        difficulty: 0.15,
        readability: 0.20,
        timing: 0.10,
        blooms: 0.10,
        duplicates: 0.20,
        metadata: 0.25
    };

    let totalScore = 0;

    const diffScore = results.difficulty?.score || 100;
    const readScore = results.readability?.score || 100;
    const timeScore = results.timing?.score || 100;
    const bloomScore = results.bloom?.score || 100;
    const dupScore = results.duplicates?.score || 100;
    const metaScore = results.metadata?.score || 100;

    totalScore += (diffScore * weights.difficulty);
    totalScore += (readScore * weights.readability);
    totalScore += (timeScore * weights.timing);
    totalScore += (bloomScore * weights.blooms);
    totalScore += (dupScore * weights.duplicates);
    totalScore += (metaScore * weights.metadata);

    const finalScore = Math.round(totalScore);

    let status = 'Excellent';
    if (finalScore < 50) status = 'Poor';
    else if (finalScore < 75) status = 'Fair';
    else if (finalScore < 90) status = 'Good';

    return {
        overall: finalScore,
        status,
        categories: {
            difficulty: diffScore,
            readability: readScore,
            timing: timeScore,
            bloom: bloomScore,
            duplicates: dupScore,
            metadata: metaScore
        }
    };
};
