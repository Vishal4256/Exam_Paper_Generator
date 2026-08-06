import mongoose from 'mongoose';
import Question from '../models/Question.model.js';
import Exam from '../models/Exam.model.js';
import ImportHistory from '../models/ImportHistory.model.js';

// Simple in-memory cache: { [userId]: { data, timestamp } }
const cache = {};
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export const invalidateAnalyticsCache = (userId) => {
    if (userId && cache[userId]) {
        delete cache[userId];
    }
};

export const getAnalyticsDashboard = async (req, res) => {
    try {
        const userId = req.user.id;
        const now = Date.now();

        // Check cache
        if (cache[userId] && (now - cache[userId].timestamp < CACHE_TTL)) {
            return res.status(200).json({ success: true, data: cache[userId].data, cached: true });
        }

        const userObjectId = new mongoose.Types.ObjectId(userId);
        
        // Define date ranges for trends (Last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // 1. QUESTION ANALYTICS ($facet for high performance)
        const questionAgg = await Question.aggregate([
            { $match: { user: userObjectId } },
            {
                $facet: {
                    // Overall Stats & Quality Health
                    overview: [
                        {
                            $group: {
                                _id: null,
                                total: { $sum: 1 },
                                recentCount: { $sum: { $cond: [{ $gte: ['$createdAt', thirtyDaysAgo] }, 1, 0] } },
                                aiGeneratedCount: { $sum: { $cond: [{ $eq: ['$source', 'ai'] }, 1, 0] } },
                                aiRecentCount: { $sum: { $cond: [{ $and: [{ $eq: ['$source', 'ai'] }, { $gte: ['$createdAt', thirtyDaysAgo] }] }, 1, 0] } },
                                sumQuality: { $sum: '$qualityScore' },
                                countQuality: { $sum: { $cond: [{ $ne: ['$qualityScore', null] }, 1, 0] } },
                                maxQuality: { $max: '$qualityScore' },
                                minQuality: { $min: { $cond: [{ $ne: ['$qualityScore', null] }, '$qualityScore', 100] } },
                                below60Count: { $sum: { $cond: [{ $lt: ['$qualityScore', 60] }, 1, 0] } },
                                sumTime: { $sum: '$estimatedTime' },
                                countTime: { $sum: { $cond: [{ $ne: ['$estimatedTime', null] }, 1, 0] } },
                                missingExplanations: { $sum: { $cond: [{ $eq: ['$explanation.plainText', ''] }, 1, 0] } }
                            }
                        }
                    ],
                    // Quality Histogram ($bucket)
                    qualityBuckets: [
                        { $match: { qualityScore: { $ne: null } } },
                        {
                            $bucket: {
                                groupBy: "$qualityScore",
                                boundaries: [0, 60, 70, 80, 90, 101], // 101 because top is exclusive
                                default: "Unknown",
                                output: { count: { $sum: 1 } }
                            }
                        }
                    ],
                    // Subject breakdown
                    subjects: [
                        {
                            $group: {
                                _id: "$subject",
                                count: { $sum: 1 },
                                avgQuality: { $avg: "$qualityScore" },
                                // Assigning numeric value to difficulty for average: Easy=1, Medium=2, Hard=3
                                avgDiff: {
                                    $avg: {
                                        $switch: {
                                            branches: [
                                                { case: { $eq: ['$difficulty', 'Easy'] }, then: 1 },
                                                { case: { $eq: ['$difficulty', 'Medium'] }, then: 2 },
                                                { case: { $eq: ['$difficulty', 'Hard'] }, then: 3 }
                                            ],
                                            default: null
                                        }
                                    }
                                }
                            }
                        }
                    ],
                    // Topic breakdown
                    topics: [
                        { $match: { topic: { $ne: '' } } },
                        { $group: { _id: "$topic", count: { $sum: 1 } } },
                        { $sort: { count: -1 } }
                    ]
                }
            }
        ]);

        // 2. EXAM ANALYTICS
        const examAgg = await Exam.aggregate([
            { $match: { user: userObjectId } },
            {
                $facet: {
                    overview: [
                        {
                            $group: {
                                _id: null,
                                total: { $sum: 1 },
                                recentCount: { $sum: { $cond: [{ $gte: ['$createdAt', thirtyDaysAgo] }, 1, 0] } }
                            }
                        }
                    ]
                }
            }
        ]);

        // 3. IMPORT ANALYTICS
        const importAgg = await ImportHistory.aggregate([
            { $match: { user: userObjectId } },
            {
                $facet: {
                    overview: [
                        {
                            $group: {
                                _id: null,
                                total: { $sum: 1 },
                                recentCount: { $sum: { $cond: [{ $gte: ['$createdAt', thirtyDaysAgo] }, 1, 0] } },
                                totalQuestionsSaved: { $sum: "$questionsSaved" },
                                totalDuplicatesRemoved: { $sum: "$duplicatesRemoved" }
                            }
                        }
                    ]
                }
            }
        ]);

        // --- Data Extraction ---
        const qData = questionAgg[0];
        const qOverview = qData.overview[0] || {};
        const eOverview = examAgg[0]?.overview[0] || {};
        const iOverview = importAgg[0]?.overview[0] || {};

        // Calculate trends (mock percentage if total === recent, etc. Proper math: (recent / (total-recent)) )
        const calculateTrend = (total, recent) => {
            const previous = total - recent;
            if (previous === 0) return recent > 0 ? 100 : 0;
            return Math.round((recent / previous) * 100);
        };

        const totalQuestions = qOverview.total || 0;
        const avgQuality = qOverview.countQuality ? Math.round(qOverview.sumQuality / qOverview.countQuality) : 0;

        // Map Quality Buckets
        const bucketMap = {
            "0": "Poor (<60)",
            "60": "Average (60-69)",
            "70": "Good (70-79)",
            "80": "Very Good (80-89)",
            "90": "Excellent (90-100)"
        };
        const qualityDistribution = qData.qualityBuckets.map(b => ({
            name: bucketMap[b._id.toString()] || "Unknown",
            count: b.count,
            minBoundary: b._id
        })).sort((a,b) => b.minBoundary - a.minBoundary); // Excellent first

        // Calculate AI Health Center Priorities
        const actions = [];
        
        if (qOverview.below60Count > 0) {
            actions.push({
                id: 'improve-quality',
                priority: 'High',
                title: `Improve ${qOverview.below60Count} low-quality questions`,
                actionUrl: '/questions?qualityMin=0&qualityMax=59'
            });
        }

        if (qOverview.missingExplanations > 0) {
            actions.push({
                id: 'add-explanations',
                priority: 'Medium',
                title: `Add missing explanations to ${qOverview.missingExplanations} questions`,
                actionUrl: '/questions?missingExplanation=true'
            });
        }

        // Topics with < 10 questions
        const lowTopics = qData.topics.filter(t => t.count < 10).slice(0, 2);
        lowTopics.forEach(t => {
            actions.push({
                id: `add-topic-${t._id}`,
                priority: 'High',
                title: `Add more questions for "${t._id}" (Only ${t.count} available)`,
                actionUrl: '/add-question'
            });
        });

        const dashboardData = {
            overview: {
                questions: { total: totalQuestions, recent: qOverview.recentCount || 0, trend: calculateTrend(totalQuestions, qOverview.recentCount || 0) },
                exams: { total: eOverview.total || 0, recent: eOverview.recentCount || 0, trend: calculateTrend(eOverview.total || 0, eOverview.recentCount || 0) },
                imports: { total: iOverview.total || 0, recent: iOverview.recentCount || 0, trend: calculateTrend(iOverview.total || 0, iOverview.recentCount || 0) },
                aiGenerated: { total: qOverview.aiGeneratedCount || 0, recent: qOverview.aiRecentCount || 0, trend: calculateTrend(qOverview.aiGeneratedCount || 0, qOverview.aiRecentCount || 0) }
            },
            questionHealth: {
                averageQuality: avgQuality,
                highestQuality: qOverview.maxQuality || 0,
                lowestQuality: qOverview.minQuality || 0,
                below60: qOverview.below60Count || 0,
                averageSolveTime: qOverview.countTime ? (qOverview.sumTime / qOverview.countTime).toFixed(1) : 0
            },
            subjects: qData.subjects.map(s => ({
                subject: s._id || 'Uncategorized',
                count: s.count,
                avgQuality: Math.round(s.avgQuality || 0),
                coverage: Math.round((s.count / totalQuestions) * 100),
                avgDifficulty: s.avgDiff ? (s.avgDiff < 1.5 ? 'Easy' : s.avgDiff < 2.5 ? 'Medium' : 'Hard') : 'Medium'
            })).sort((a,b) => b.count - a.count),
            topics: qData.topics.slice(0,10).map(t => ({ name: t._id, count: t.count })),
            quality: qualityDistribution,
            actions: actions,
            weeklyReport: {
                questionsAdded: qOverview.recentCount || 0,
                examsGenerated: eOverview.recentCount || 0,
                overallHealth: avgQuality,
                topRecommendation: actions.length > 0 ? actions[0].title : "Your Question Bank is in great shape!"
            }
        };

        // Cache the result
        cache[userId] = {
            data: dashboardData,
            timestamp: now
        };

        res.status(200).json({ success: true, data: dashboardData, cached: false });
    } catch (err) {
        console.error("Analytics Error:", err);
        res.status(500).json({ msg: "Failed to generate analytics", error: err.message });
    }
};
