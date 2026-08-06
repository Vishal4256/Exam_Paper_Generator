export const analyzeDifficulty = (sections, requestedDifficulty) => {
    let easy = 0, medium = 0, hard = 0, total = 0;

    // Calculate based on explicit section difficulties
    sections.forEach(sec => {
        const count = parseInt(sec.questionCount) || 0;
        const diff = sec.difficulty || 'Medium'; // default
        if (diff === 'Easy') easy += count;
        else if (diff === 'Hard') hard += count;
        else if (diff === 'Medium') medium += count;
        else if (diff === 'Mixed' || diff === 'All') {
            // Distribute mixed evenly or conventionally (30/50/20)
            easy += Math.round(count * 0.3);
            hard += Math.round(count * 0.2);
            medium += (count - Math.round(count * 0.3) - Math.round(count * 0.2));
        }
    });

    total = easy + medium + hard;

    if (total === 0) {
        return {
            easyPct: 0, mediumPct: 0, hardPct: 0,
            balance: 'Unknown',
            issues: []
        };
    }

    const easyPct = Math.round((easy / total) * 100);
    const mediumPct = Math.round((medium / total) * 100);
    const hardPct = Math.round((hard / total) * 100);

    const issues = [];
    let balance = 'Excellent';

    if (hardPct > 40) {
        balance = 'Poor';
        issues.push('The exam is heavily skewed towards Hard questions (>40%).');
    } else if (easyPct > 60) {
        balance = 'Poor';
        issues.push('The exam is heavily skewed towards Easy questions (>60%).');
    } else if (hardPct === 0 && easyPct === 0) {
        balance = 'Fair';
        issues.push('Lack of variation (100% Medium).');
    } else if (hardPct > 25 || easyPct > 40) {
        balance = 'Good';
    }

    return {
        easyPct,
        mediumPct,
        hardPct,
        easyCount: easy,
        mediumCount: medium,
        hardCount: hard,
        balance,
        issues
    };
};
