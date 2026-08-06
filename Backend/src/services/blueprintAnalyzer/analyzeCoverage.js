export const analyzeCoverage = (sections, selectedTopics, dbQuestionsBySection) => {
    // 1. Gather all requested topics across all subjects
    const allRequestedTopics = new Set();
    if (selectedTopics) {
        Object.values(selectedTopics).forEach(topicsArr => {
            if (Array.isArray(topicsArr)) {
                topicsArr.forEach(t => allRequestedTopics.add(t));
            }
        });
    }

    const coverageMap = {};
    allRequestedTopics.forEach(topic => {
        coverageMap[topic] = 0;
    });

    let totalMatchedTopicsCount = 0;
    let questionsWithTopics = 0;
    const issues = [];

    // 2. Count occurrences of topics in the matched DB questions for the requested sections
    dbQuestionsBySection.forEach(questionsArr => {
        if (!questionsArr || !Array.isArray(questionsArr)) return;
        questionsArr.forEach(q => {
            if (q.topic) {
                // Topic could be comma separated or single string
                const qTopics = typeof q.topic === 'string' ? q.topic.split(',').map(t=>t.trim()) : [q.topic];
                let matched = false;
                qTopics.forEach(qt => {
                    // Match against requested topics (case insensitive)
                    const foundTopic = Array.from(allRequestedTopics).find(rt => rt.toLowerCase() === qt.toLowerCase());
                    if (foundTopic) {
                        coverageMap[foundTopic] += 1;
                        totalMatchedTopicsCount += 1;
                        matched = true;
                    }
                });
                if (matched) questionsWithTopics++;
            }
        });
    });

    // 3. Format result
    const heatmap = [];
    let zeroCoverageCount = 0;

    Object.keys(coverageMap).forEach(topic => {
        const count = coverageMap[topic];
        const percentage = totalMatchedTopicsCount > 0 ? Math.round((count / totalMatchedTopicsCount) * 100) : 0;
        
        heatmap.push({ topic, count, percentage });

        if (count === 0) {
            zeroCoverageCount++;
            issues.push(`Topic "${topic}" is missing from the available questions.`);
        }
    });

    // Sort heatmap by count descending
    heatmap.sort((a, b) => b.count - a.count);

    const totalTopics = allRequestedTopics.size;
    const coveredTopics = totalTopics - zeroCoverageCount;
    const coverageScore = totalTopics > 0 ? Math.round((coveredTopics / totalTopics) * 100) : 100;

    return {
        heatmap,
        coverageScore,
        issues,
        totalTopics,
        coveredTopics
    };
};
