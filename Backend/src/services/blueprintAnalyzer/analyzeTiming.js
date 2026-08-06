export const analyzeTiming = (sections, totalDurationLimit) => {
    let estimatedTime = 0;
    const issues = [];
    const breakdown = [];

    // Base time estimates (in minutes) based on Type & Difficulty
    const baseEstimates = {
        'MCQ': { 'Easy': 1, 'Medium': 1.5, 'Hard': 2.5 },
        'Short Answer': { 'Easy': 3, 'Medium': 5, 'Hard': 8 },
        'Long Answer': { 'Easy': 10, 'Medium': 15, 'Hard': 20 },
        'Coding': { 'Easy': 10, 'Medium': 20, 'Hard': 30 },
        'True/False': { 'Easy': 0.5, 'Medium': 1, 'Hard': 1.5 }
    };

    sections.forEach(sec => {
        const count = parseInt(sec.questionCount) || 0;
        const type = sec.type || 'MCQ';
        const difficulty = sec.difficulty && sec.difficulty !== 'Mixed' && sec.difficulty !== 'All' ? sec.difficulty : 'Medium';
        
        if (count > 0) {
            const timePerQ = (baseEstimates[type] && baseEstimates[type][difficulty]) ? baseEstimates[type][difficulty] : 2;
            const totalForSection = count * timePerQ;
            estimatedTime += totalForSection;

            // Add to breakdown if not already present
            const existing = breakdown.find(b => b.type === type);
            if (existing) {
                existing.totalTime += totalForSection;
                existing.count += count;
            } else {
                breakdown.push({ type, count, totalTime: totalForSection, averagePerQ: timePerQ });
            }
        }
    });

    // Recalculate averages for breakdown
    breakdown.forEach(b => {
        b.averagePerQ = parseFloat((b.totalTime / b.count).toFixed(1));
    });

    const recommendedDuration = Math.ceil(estimatedTime / 5) * 5; // Round to nearest 5 mins

    // Compare with provided duration limits
    const providedDuration = parseInt(totalDurationLimit) || 0;
    
    if (providedDuration > 0) {
        if (estimatedTime > providedDuration * 1.1) {
            issues.push(`Estimated time (${Math.round(estimatedTime)} min) exceeds the provided duration (${providedDuration} min).`);
        } else if (estimatedTime < providedDuration * 0.5) {
            issues.push(`The exam is too short for the provided duration. Estimated time is only ${Math.round(estimatedTime)} min.`);
        }
    }

    return {
        estimatedTime: Math.round(estimatedTime),
        recommendedDuration,
        providedDuration,
        breakdown,
        issues
    };
};
