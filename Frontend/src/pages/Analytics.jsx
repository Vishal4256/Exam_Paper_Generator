import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
    BarChart3, Activity, Target, ShieldAlert, Sparkles, TrendingUp, TrendingDown,
    Clock, CheckCircle, AlertTriangle, Info, BookOpen, Layers
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/axiosConfig';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';

const Analytics = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const res = await api.get('/analytics');
                setData(res.data.data);
            } catch (err) {
                console.error("Failed to fetch analytics", err);
            } finally {
                setLoading(false);
            }
        };
        fetchAnalytics();
    }, []);

    if (loading) {
        return (
            <div className="flex-1 p-8 flex items-center justify-center min-h-[500px]">
                <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!data) return <div className="p-8 text-center text-gray-500">Failed to load analytics.</div>;

    const { overview, questionHealth, subjects, topics, quality, actions, weeklyReport } = data;

    const renderTrend = (trend) => {
        if (trend > 0) return <span className="text-green-600 dark:text-green-400 flex items-center text-xs font-bold"><TrendingUp className="w-3 h-3 mr-1"/> {trend}%</span>;
        if (trend < 0) return <span className="text-red-600 dark:text-red-400 flex items-center text-xs font-bold"><TrendingDown className="w-3 h-3 mr-1"/> {Math.abs(trend)}%</span>;
        return <span className="text-gray-500 text-xs font-bold">—</span>;
    };

    const getPriorityColor = (priority) => {
        if (priority === 'High') return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:border-red-800 dark:text-red-400';
        if (priority === 'Medium') return 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:border-yellow-800 dark:text-yellow-400';
        return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-400';
    };

    const getPriorityIcon = (priority) => {
        if (priority === 'High') return <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />;
        if (priority === 'Medium') return <Info className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />;
        return <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
    };

    return (
        <div className="flex-1 p-8 bg-gray-50 dark:bg-gray-900 min-h-screen overflow-y-auto">
            <div className="max-w-7xl mx-auto space-y-8">
                
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
                            <BarChart3 className="w-8 h-8 text-indigo-600" />
                            Operations Center
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">Platform analytics and intelligent health monitoring.</p>
                    </div>
                </div>

                {/* Weekly Report (Executive Summary) */}
                <motion.div 
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <Sparkles className="w-32 h-32" />
                    </div>
                    <h2 className="text-lg font-bold text-indigo-100 mb-6 uppercase tracking-wider">This Week's Executive Summary</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 relative z-10">
                        <div>
                            <div className="text-indigo-200 text-sm font-medium mb-1">Questions Added</div>
                            <div className="text-3xl font-black">{weeklyReport.questionsAdded}</div>
                        </div>
                        <div>
                            <div className="text-indigo-200 text-sm font-medium mb-1">Exams Generated</div>
                            <div className="text-3xl font-black">{weeklyReport.examsGenerated}</div>
                        </div>
                        <div>
                            <div className="text-indigo-200 text-sm font-medium mb-1">Overall Health</div>
                            <div className="text-3xl font-black">{weeklyReport.overallHealth}/100</div>
                        </div>
                        <div className="col-span-2 md:col-span-1">
                            <div className="text-indigo-200 text-sm font-medium mb-1">Top Recommendation</div>
                            <div className="text-lg font-bold leading-tight">{weeklyReport.topRecommendation}</div>
                        </div>
                    </div>
                </motion.div>

                {/* 1. Overview Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {[
                        { label: 'Total Questions', value: overview.questions.total, recent: `+${overview.questions.recent} this month`, trend: overview.questions.trend },
                        { label: 'Exams Generated', value: overview.exams.total, recent: `+${overview.exams.recent} this month`, trend: overview.exams.trend },
                        { label: 'AI Generated', value: overview.aiGenerated.total, recent: `+${overview.aiGenerated.recent} this month`, trend: overview.aiGenerated.trend },
                        { label: 'Total Imports', value: overview.imports.total, recent: `+${overview.imports.recent} this month`, trend: overview.imports.trend }
                    ].map((stat, i) => (
                        <motion.div key={i} initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} transition={{delay: i*0.05}} className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                            <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">{stat.label}</div>
                            <div className="text-3xl font-black text-gray-900 dark:text-white mb-2">{stat.value.toLocaleString()}</div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-400 font-medium">{stat.recent}</span>
                                {renderTrend(stat.trend)}
                            </div>
                        </motion.div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Left Column: AI Health Center & Quality Bank */}
                    <div className="lg:col-span-2 space-y-8">
                        
                        {/* AI Health Center */}
                        <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                            <div className="flex items-center gap-3 mb-6 border-b border-gray-100 dark:border-gray-700 pb-4">
                                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl text-indigo-600 dark:text-indigo-400">
                                    <Activity className="w-5 h-5" />
                                </div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">AI Health Center</h2>
                            </div>
                            
                            {actions.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    <CheckCircle className="w-12 h-12 mx-auto text-green-400 mb-3" />
                                    <p className="font-medium text-gray-900 dark:text-white">All Clear!</p>
                                    <p className="text-sm">Your question bank is in excellent health.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {actions.map((act, i) => (
                                        <div 
                                            key={act.id} 
                                            onClick={() => navigate(act.actionUrl)}
                                            className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 hover:border-indigo-300 dark:hover:border-indigo-700 cursor-pointer transition-all hover:shadow-md group"
                                        >
                                            <div className="flex items-center gap-4">
                                                {getPriorityIcon(act.priority)}
                                                <div>
                                                    <div className="font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{act.title}</div>
                                                </div>
                                            </div>
                                            <span className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${getPriorityColor(act.priority)}`}>
                                                {act.priority}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Subject & Topic Coverage */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                                <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2"><BookOpen className="w-4 h-4 text-indigo-500"/> Subject Coverage</h3>
                                <div className="space-y-4">
                                    {subjects.slice(0,5).map(s => (
                                        <div key={s.subject}>
                                            <div className="flex justify-between text-sm mb-1">
                                                <span className="font-medium text-gray-700 dark:text-gray-300">{s.subject}</span>
                                                <span className="font-bold text-indigo-600 dark:text-indigo-400">{s.coverage}%</span>
                                            </div>
                                            <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                                                <div className="bg-indigo-600 h-2 rounded-full" style={{ width: `${s.coverage}%` }}></div>
                                            </div>
                                            <div className="text-[10px] text-gray-400 mt-1 text-right">Avg Qual: {s.avgQuality} • Diff: {s.avgDifficulty}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            
                            <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                                <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2"><Layers className="w-4 h-4 text-purple-500"/> Topic Heatmap</h3>
                                <div className="flex flex-wrap gap-2">
                                    {topics.map(t => {
                                        // Dynamic opacity based on count (just for visual heatmap effect)
                                        const intensity = Math.min(100, Math.max(20, t.count * 10));
                                        return (
                                            <div 
                                                key={t.name}
                                                className="px-3 py-1.5 rounded-lg text-sm font-medium text-white cursor-default"
                                                style={{ backgroundColor: `rgba(79, 70, 229, ${intensity/100})`, border: '1px solid rgba(0,0,0,0.1)' }}
                                                title={`${t.count} questions`}
                                            >
                                                {t.name} <span className="opacity-75 text-xs ml-1">({t.count})</span>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* Right Column: Health Stats & Quality Breakdown */}
                    <div className="space-y-8">
                        
                        {/* Question Bank Health Stats */}
                        <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                            <h3 className="font-bold text-gray-900 dark:text-white mb-4">Question Bank Health</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-800 text-center">
                                    <div className="text-3xl font-black text-indigo-600">{questionHealth.averageQuality}</div>
                                    <div className="text-xs font-bold text-gray-500 mt-1 uppercase">Avg Quality</div>
                                </div>
                                <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-800 text-center">
                                    <div className="text-3xl font-black text-gray-700 dark:text-gray-200">{questionHealth.averageSolveTime}m</div>
                                    <div className="text-xs font-bold text-gray-500 mt-1 uppercase">Avg Solve Time</div>
                                </div>
                                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-2xl border border-green-100 dark:border-green-800/30 text-center">
                                    <div className="text-2xl font-black text-green-700 dark:text-green-400">{questionHealth.highestQuality}</div>
                                    <div className="text-xs font-bold text-green-600/70 mt-1 uppercase">Highest Score</div>
                                </div>
                                <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-100 dark:border-red-800/30 text-center">
                                    <div className="text-2xl font-black text-red-700 dark:text-red-400">{questionHealth.lowestQuality}</div>
                                    <div className="text-xs font-bold text-red-600/70 mt-1 uppercase">Lowest Score</div>
                                </div>
                            </div>
                        </div>

                        {/* Quality Analytics */}
                        <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                            <h3 className="font-bold text-gray-900 dark:text-white mb-4">Quality Distribution</h3>
                            <div className="space-y-3">
                                {quality.map((q, i) => {
                                    const totalScored = quality.reduce((acc, curr) => acc + curr.count, 0);
                                    const percentage = totalScored > 0 ? Math.round((q.count / totalScored) * 100) : 0;
                                    let barColor = 'bg-gray-200';
                                    if (q.name.includes('Excellent')) barColor = 'bg-green-500';
                                    else if (q.name.includes('Very Good')) barColor = 'bg-green-400';
                                    else if (q.name.includes('Good')) barColor = 'bg-yellow-400';
                                    else if (q.name.includes('Average')) barColor = 'bg-orange-400';
                                    else if (q.name.includes('Poor')) barColor = 'bg-red-500';

                                    return (
                                        <div key={i} className="flex items-center gap-3">
                                            <div className="w-32 text-xs font-bold text-gray-600 dark:text-gray-400 truncate">{q.name}</div>
                                            <div className="flex-1 bg-gray-100 dark:bg-gray-700 h-3 rounded-full overflow-hidden">
                                                <div className={`${barColor} h-full rounded-full`} style={{ width: `${percentage}%` }}></div>
                                            </div>
                                            <div className="w-12 text-right text-sm font-bold text-gray-900 dark:text-white">{q.count}</div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default Analytics;
