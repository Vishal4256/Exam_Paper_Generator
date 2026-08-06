export const optimizeBlueprint = (blueprint, analysisResults) => {
    // We clone the blueprint so we can safely mutate it
    const optimized = JSON.parse(JSON.stringify(blueprint));

    optimized.forEach((section, index) => {
        const secAnalysis = analysisResults.availability?.sectionDetails?.[index];
        
        if (secAnalysis && secAnalysis.status === 'Insufficient') {
            // Cap the requested questions to what's available
            section.questionCount = secAnalysis.available.toString();
        }

        // Balance difficulty if currently poorly balanced and difficulty is set to Mixed/All
        // But since sections often dictate fixed difficulty, we can't always change it.
        // If they requested "Mixed", we can change it to specific counts by splitting the section if we wanted,
        // but it's simpler to just ensure we don't ask for more than available.
    });

    return optimized;
};
