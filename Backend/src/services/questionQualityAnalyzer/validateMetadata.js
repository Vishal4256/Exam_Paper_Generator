export const validateMetadata = (questionData) => {
    let score = 100;
    const issues = [];
    const recommendations = [];

    const { type, answer, explanation, options, topic } = questionData;

    // Check Answer
    if (!answer || answer.toString().trim() === '') {
        issues.push("Missing correct answer.");
        score -= 25;
    }

    // Check Explanation
    if (!explanation || explanation.toString().trim() === '') {
        recommendations.push("Add an explanation for the correct answer to improve quality.");
        score -= 10;
    }

    // Check Options for MCQ
    if (type === 'MCQ' || type === 'Multiple Choice') {
        if (!options || !Array.isArray(options) || options.length === 0) {
            issues.push("MCQ question is missing options.");
            score -= 30;
        } else if (options.length < 4) {
            recommendations.push(`Question has only ${options.length} option(s). Consider adding up to 4 options.`);
            score -= 5;
        } else if (options.length > 5) {
            recommendations.push(`Question has ${options.length} options. Consider reducing to 4 or 5 options.`);
            score -= 5;
        }

        // Check for empty options
        const emptyOptions = options.filter(opt => !opt.text || opt.text.trim() === '');
        if (emptyOptions.length > 0) {
            issues.push(`Found ${emptyOptions.length} empty option(s).`);
            score -= 15;
        }
    }

    // Check Topic
    if (!topic || topic.trim() === '') {
        issues.push("Missing topic categorization.");
        score -= 10;
    }

    if (score < 0) score = 0;

    let status = 'Good';
    if (score < 80) status = 'Fair';
    if (score < 50) status = 'Poor';

    return {
        score,
        status,
        issues,
        recommendations
    };
};
