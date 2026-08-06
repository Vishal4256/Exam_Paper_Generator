export const analyzeMarks = (sections) => {
    let totalMarks = 0;
    let totalQuestions = 0;
    let highest = 0;
    let lowest = Infinity;
    const distribution = {};
    const issues = [];

    sections.forEach(sec => {
        const count = parseInt(sec.questionCount) || 0;
        const marks = parseInt(sec.marksPerQuestion) || 1;
        
        if (count > 0) {
            totalMarks += (count * marks);
            totalQuestions += count;

            if (marks > highest) highest = marks;
            if (marks < lowest) lowest = marks;

            if (!distribution[`${marks} mark${marks > 1 ? 's' : ''}`]) {
                distribution[`${marks} mark${marks > 1 ? 's' : ''}`] = 0;
            }
            distribution[`${marks} mark${marks > 1 ? 's' : ''}`] += count;
        }
    });

    if (totalQuestions === 0) lowest = 0;

    const averageMarks = totalQuestions > 0 ? (totalMarks / totalQuestions).toFixed(1) : 0;

    if (totalMarks === 0) {
        issues.push("Total marks for this exam is 0.");
    }
    
    // Convert distribution object to array for frontend
    const distributionArray = Object.keys(distribution).map(key => ({
        label: key,
        count: distribution[key]
    })).sort((a, b) => parseInt(a.label) - parseInt(b.label));

    return {
        totalMarks,
        averageMarks: parseFloat(averageMarks),
        highest,
        lowest,
        distribution: distributionArray,
        issues
    };
};
