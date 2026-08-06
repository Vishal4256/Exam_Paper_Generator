export const analyzeReadability = (plainText) => {
    if (!plainText || typeof plainText !== 'string' || plainText.trim() === '') {
        return {
            status: 'Poor',
            sentenceCount: 0,
            avgWordsPerSentence: 0,
            longestSentence: 0,
            passiveVoiceDetected: false,
            issues: ['Question text is empty.']
        };
    }

    const text = plainText.trim();
    
    // 1. Sentence Count
    // Split by ., !, ? followed by space or end of string.
    const sentences = text.match(/[^.!?]+[.!?]+(?:\s|$)/g) || [text];
    const sentenceCount = sentences.length;

    let totalWords = 0;
    let longestSentence = 0;
    let passiveVoiceDetected = false;

    // Simple heuristic for passive voice: "is/are/was/were/be/been/being" + past participle (ends in "ed")
    const passiveRegex = /\b(is|are|was|were|be|been|being)\b\s+\w+ed\b/i;

    sentences.forEach(sentence => {
        const words = sentence.trim().split(/\s+/).filter(w => w.length > 0);
        totalWords += words.length;
        if (words.length > longestSentence) {
            longestSentence = words.length;
        }

        if (!passiveVoiceDetected && passiveRegex.test(sentence)) {
            passiveVoiceDetected = true;
        }
    });

    const avgWordsPerSentence = sentenceCount > 0 ? Math.round(totalWords / sentenceCount) : 0;
    
    const issues = [];
    const recommendations = [];

    // Length warnings
    if (totalWords < 5) {
        issues.push("Question is very short and may lack necessary context.");
    }

    if (longestSentence > 25) {
        recommendations.push("Split long sentences (over 25 words) into multiple sentences for clarity.");
    }

    if (passiveVoiceDetected) {
        recommendations.push("Passive voice detected. Consider rewriting in active voice for better readability.");
    }

    // Determine status
    let status = 'Good';
    let score = 100;
    if (longestSentence > 35) { status = 'Fair'; score -= 20; }
    if (totalWords < 5) { status = 'Poor'; score -= 30; }
    if (passiveVoiceDetected) { score -= 10; }

    if (score < 0) score = 0;
    if (status === 'Good' && score < 80) status = 'Fair';
    if (score < 50) status = 'Poor';

    return {
        score,
        status,
        sentenceCount,
        avgWordsPerSentence,
        longestSentence,
        passiveVoiceDetected,
        issues,
        recommendations
    };
};
