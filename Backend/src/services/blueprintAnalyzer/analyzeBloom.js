const profiles = {
    'Placement': { Remember: 20, Understand: 25, Apply: 35, Analyze: 15, Evaluate: 5, Create: 0 },
    'University': { Remember: 25, Understand: 30, Apply: 20, Analyze: 15, Evaluate: 5, Create: 5 },
    'School': { Remember: 40, Understand: 30, Apply: 20, Analyze: 10, Evaluate: 0, Create: 0 },
    'Default': { Remember: 30, Understand: 25, Apply: 20, Analyze: 15, Evaluate: 5, Create: 5 }
};

export const analyzeBloom = (dbQuestionsBySection, requestedProfile = 'Default') => {
    let totalQuestions = 0;
    const distribution = { Remember: 0, Understand: 0, Apply: 0, Analyze: 0, Evaluate: 0, Create: 0 };
    const issues = [];

    dbQuestionsBySection.forEach(questions => {
        if (!questions) return;
        questions.forEach(q => {
            totalQuestions++;
            const level = q.bloomLevel || 'Remember';
            if (distribution[level] !== undefined) {
                distribution[level]++;
            } else {
                distribution['Remember']++; // fallback
            }
        });
    });

    const profileTarget = profiles[requestedProfile] || profiles['Default'];
    const actualPercentages = {};
    const chartData = [];
    
    let varianceScore = 100;

    Object.keys(distribution).forEach(level => {
        const count = distribution[level];
        const pct = totalQuestions > 0 ? Math.round((count / totalQuestions) * 100) : 0;
        actualPercentages[level] = pct;
        
        const target = profileTarget[level];
        const variance = Math.abs(pct - target);
        
        // Deduct points based on variance. 
        // Small variations are okay, severe variations (>15%) trigger issues.
        varianceScore -= (variance * 0.5);

        if (variance > 15) {
            issues.push(`Bloom's Level "${level}" is at ${pct}%, but target profile expects ~${target}%.`);
        }

        chartData.push({
            level,
            actual: pct,
            target
        });
    });

    // Floor variance score at 0
    varianceScore = Math.max(0, Math.round(varianceScore));

    return {
        distribution: actualPercentages,
        chartData,
        varianceScore,
        profileUsed: requestedProfile,
        issues
    };
};
