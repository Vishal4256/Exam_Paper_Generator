export const estimateTime = (questionType, predictedDifficulty, marks, plainText) => {
    let estimatedMinutes = 1.5; // default

    const type = questionType || 'MCQ';
    const diff = predictedDifficulty || 'Medium';
    
    // Base time estimates (in minutes) based on Type & Difficulty
    const baseEstimates = {
        'MCQ': { 'Easy': 1, 'Medium': 1.5, 'Hard': 2.5 },
        'Short Answer': { 'Easy': 3, 'Medium': 5, 'Hard': 8 },
        'Long Answer': { 'Easy': 10, 'Medium': 15, 'Hard': 20 },
        'Coding': { 'Easy': 10, 'Medium': 20, 'Hard': 30 },
        'Case Study': { 'Easy': 8, 'Medium': 12, 'Hard': 18 },
        'True/False': { 'Easy': 0.5, 'Medium': 1, 'Hard': 1.5 }
    };

    if (baseEstimates[type] && baseEstimates[type][diff]) {
        estimatedMinutes = baseEstimates[type][diff];
    } else {
        // Fallback heuristics
        if (type.includes('Coding')) estimatedMinutes = 15;
        else if (type.includes('Long')) estimatedMinutes = 10;
        else estimatedMinutes = 2;
    }

    // Add extra time if the question itself is extremely long to read (e.g. over 150 words)
    const wordCount = (plainText || '').split(/\s+/).length;
    if (wordCount > 150) {
        estimatedMinutes += 1;
    }

    const issues = [];
    const recommendations = [];

    let score = 100;

    // Compare against marks
    const providedMarks = parseInt(marks) || 0;
    
    if (providedMarks > 0) {
        const timePerMark = estimatedMinutes / providedMarks;
        
        // Generally, 1.5 to 2.5 minutes per mark is a healthy balance.
        if (timePerMark > 4) {
            issues.push(`Too difficult/time-consuming for a ${providedMarks}-mark question.`);
            recommendations.push(`Consider increasing the marks or simplifying the question.`);
            score -= 20;
        } else if (timePerMark < 0.5) {
            issues.push(`Marks may be too high for a question that takes ~${Math.round(estimatedMinutes)} min.`);
            recommendations.push(`Consider reducing the marks to align with the required effort.`);
            score -= 15;
        }
    }

    if (score < 0) score = 0;

    return {
        score,
        estimatedMinutes,
        marks: providedMarks,
        issues,
        recommendations
    };
};
