export const analyzeQuestionTypes = (sections) => {
    const distribution = {};
    let totalQuestions = 0;
    const issues = [];

    sections.forEach(sec => {
        const count = parseInt(sec.questionCount) || 0;
        const type = sec.type || 'MCQ';
        
        if (count > 0) {
            totalQuestions += count;
            if (!distribution[type]) {
                distribution[type] = 0;
            }
            distribution[type] += count;
        }
    });

    const chartData = [];
    Object.keys(distribution).forEach(type => {
        const count = distribution[type];
        chartData.push({
            type,
            count,
            percentage: totalQuestions > 0 ? Math.round((count / totalQuestions) * 100) : 0
        });
    });

    if (Object.keys(distribution).length === 1) {
        issues.push(`The exam contains only one question type (${Object.keys(distribution)[0]}). Consider diversifying.`);
    }

    if (totalQuestions === 0) {
        issues.push("No questions defined in the blueprint.");
    }

    return {
        totalQuestions,
        chartData,
        issues
    };
};
