export const analyzeAvailability = (sections, dbQuestionsBySection) => {
    let totalRequested = 0;
    let totalAvailable = 0;
    const issues = [];

    const sectionDetails = sections.map((section, index) => {
        const requested = parseInt(section.questionCount) || 0;
        const available = dbQuestionsBySection[index]?.length || 0;
        
        totalRequested += requested;
        totalAvailable += available;

        if (available < requested) {
            issues.push(`Section "${section.sectionName || index+1}" requires ${requested} questions, but only ${available} are available.`);
        }

        return {
            sectionName: section.sectionName || `Section ${index + 1}`,
            requested,
            available,
            status: available >= requested ? 'Sufficient' : 'Insufficient'
        };
    });

    const coveragePercentage = totalRequested > 0 ? Math.round((Math.min(totalAvailable, totalRequested) / totalRequested) * 100) : 100;
    
    return {
        totalRequested,
        totalAvailable,
        coveragePercentage,
        status: totalAvailable >= totalRequested && issues.length === 0 ? 'Good' : 'Insufficient',
        issues,
        sectionDetails
    };
};
