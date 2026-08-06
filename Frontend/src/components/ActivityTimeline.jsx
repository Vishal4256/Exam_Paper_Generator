import React, { useState, useEffect } from 'react';
import api from '../utils/axiosConfig';
import { FileText, Database, Sparkles, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const ActivityTimeline = () => {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchActivity();
    }, []);

    const fetchActivity = async () => {
        try {
            setLoading(true);
            const [examsRes, questionsRes, historyRes] = await Promise.all([
                api.get('/exams').catch(() => ({ data: [] })),
                api.get('/questions').catch(() => ({ data: { questions: [] } })),
                api.get('/history/imports').catch(() => ({ data: { history: [] } })) // Assuming this route exists, or similar
            ]);

            const exams = examsRes.data || [];
            const questions = questionsRes.data.questions || questionsRes.data || [];
            const history = historyRes.data.history || [];

            const combined = [];

            // Add Exams
            exams.forEach(exam => {
                combined.push({
                    id: exam._id,
                    type: 'exam',
                    title: 'Exam Generated',
                    description: `Generated ${exam.examTitle} (${exam.subject || 'No Subject'})`,
                    date: new Date(exam.generatedAt || exam.createdAt),
                    icon: <FileText className="w-4 h-4 text-emerald-500" />
                });
            });

            // Add Questions (Group by day to avoid spamming the timeline if many were added)
            // For now, let's just add the 10 most recent questions individually
            const sortedQuestions = [...questions].sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 10);
            sortedQuestions.forEach(q => {
                combined.push({
                    id: q._id,
                    type: 'question',
                    title: 'Question Added',
                    description: `Added a ${q.difficulty} ${q.type} question in ${q.subject}`,
                    date: new Date(q.createdAt),
                    icon: <Database className="w-4 h-4 text-blue-500" />
                });
            });

            // Add Imports
            history.forEach(h => {
                combined.push({
                    id: h._id,
                    type: 'import',
                    title: 'Questions Imported',
                    description: `Imported questions from ${h.fileName || 'file'}`,
                    date: new Date(h.createdAt),
                    icon: <Sparkles className="w-4 h-4 text-purple-500" />
                });
            });

            combined.sort((a, b) => b.date - a.date);
            setActivities(combined.slice(0, 20)); // Keep top 20
        } catch (err) {
            console.error("Failed to fetch activity:", err);
            setError("Failed to load timeline.");
        } finally {
            setLoading(false);
        }
    };

    const isToday = (date) => {
        const today = new Date();
        return date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
    };

    const isYesterday = (date) => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        return date.getDate() === yesterday.getDate() && date.getMonth() === yesterday.getMonth() && date.getFullYear() === yesterday.getFullYear();
    };

    const formatGroup = (date) => {
        if (isToday(date)) return 'Today';
        if (isYesterday(date)) return 'Yesterday';
        return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    };

    // Group activities
    const groupedActivities = activities.reduce((acc, activity) => {
        const group = formatGroup(activity.date);
        if (!acc[group]) acc[group] = [];
        acc[group].push(activity);
        return acc;
    }, {});

    if (loading) {
        return (
            <div className="space-y-4 animate-pulse">
                {[1, 2, 3].map(i => (
                    <div key={i} className="flex gap-4">
                        <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full shrink-0"></div>
                        <div className="flex-1 space-y-2 py-1">
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center gap-2 text-red-500 text-sm p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <AlertCircle className="w-4 h-4" />
                {error}
            </div>
        );
    }

    if (activities.length === 0) {
        return (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Sparkles className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-sm font-medium">No recent activity</p>
                <p className="text-xs mt-1">Generate an exam or add questions to see them here.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {Object.keys(groupedActivities).map((group, groupIndex) => (
                <div key={group}>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">{group}</h4>
                    <div className="space-y-4">
                        {groupedActivities[group].map((activity, index) => (
                            <motion.div 
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                                key={activity.id} 
                                className="flex gap-4 relative group"
                            >
                                {/* Timeline Line */}
                                {(index !== groupedActivities[group].length - 1 || groupIndex !== Object.keys(groupedActivities).length - 1) && (
                                    <div className="absolute left-4 top-8 bottom-[-16px] w-px bg-gray-200 dark:bg-gray-700 group-hover:bg-indigo-300 dark:group-hover:bg-indigo-500/50 transition-colors"></div>
                                )}
                                
                                {/* Icon */}
                                <div className="w-8 h-8 rounded-full bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 shadow-sm flex items-center justify-center shrink-0 z-10 group-hover:border-indigo-100 dark:group-hover:border-indigo-900/50 transition-colors">
                                    {activity.icon}
                                </div>
                                
                                {/* Content */}
                                <div className="flex-1 pb-4">
                                    <div className="flex items-baseline justify-between gap-2">
                                        <p className="text-sm font-bold text-gray-900 dark:text-white">{activity.title}</p>
                                        <span className="text-[10px] font-medium text-gray-400">
                                            {activity.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                                        {activity.description}
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ActivityTimeline;
