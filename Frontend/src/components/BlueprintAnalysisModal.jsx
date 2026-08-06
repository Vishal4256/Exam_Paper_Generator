import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertTriangle, Info, Settings, RefreshCw, BarChart2, Clock, CheckSquare } from 'lucide-react';
import { 
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import api from '../utils/axiosConfig';
import { toast } from 'react-toastify';

const BlueprintAnalysisModal = ({ 
    isOpen, 
    onClose, 
    initialBlueprint, 
    examMode,
    subject,
    selectedTopics,
    duration,
    difficulty,
    onGenerateAnyway,
    onOptimizeComplete 
}) => {
    const [activeTab, setActiveTab] = useState('overview');
    const [analysisData, setAnalysisData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [localBlueprint, setLocalBlueprint] = useState(JSON.parse(JSON.stringify(initialBlueprint)));
    const [isOptimizing, setIsOptimizing] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setLocalBlueprint(JSON.parse(JSON.stringify(initialBlueprint)));
            analyze(initialBlueprint);
        }
    }, [isOpen]);

    const analyze = async (blueprintData) => {
        setLoading(true);
        try {
            const payload = {
                examMode,
                subject,
                blueprint: blueprintData,
                selectedTopics,
                duration,
                difficulty,
                examProfile: 'Default'
            };
            const res = await api.post('/exams/analyze-blueprint', payload);
            setAnalysisData(res.data);
        } catch (err) {
            console.error("Analysis Error:", err);
            toast.error(err.response?.data?.msg || "Failed to analyze blueprint.");
        } finally {
            setLoading(false);
        }
    };

    const handleOptimize = async () => {
        setIsOptimizing(true);
        try {
            const payload = {
                blueprint: localBlueprint,
                analysisResults: analysisData
            };
            const res = await api.post('/exams/optimize-blueprint', payload);
            const optimized = res.data.optimizedBlueprint;
            setLocalBlueprint(optimized);
            await analyze(optimized);
            toast.success("Blueprint optimized successfully.");
        } catch (err) {
            toast.error("Failed to optimize blueprint.");
        } finally {
            setIsOptimizing(false);
        }
    };

    const handleSimulatorChange = (index, field, value) => {
        const updated = [...localBlueprint];
        updated[index][field] = value;
        setLocalBlueprint(updated);
    };

    const runSimulation = () => {
        analyze(localBlueprint);
    };

    if (!isOpen) return null;

    const tabs = [
        { id: 'overview', label: 'Overview' },
        { id: 'difficulty', label: 'Difficulty' },
        { id: 'coverage', label: 'Coverage' },
        { id: 'marks', label: 'Marks' },
        { id: 'timing', label: 'Timing' },
        { id: 'simulator', label: 'Simulator' }
    ];

    const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="blueprint-analysis-title">
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-5xl flex flex-col overflow-hidden max-h-[90vh]"
            >
                {/* Header */}
                <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
                    <div>
                        <h2 id="blueprint-analysis-title" className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <BarChart2 className="w-6 h-6 text-indigo-600" />
                            Blueprint Analysis
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">Review and optimize your exam configuration</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {loading ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-12 min-h-[400px]">
                        <RefreshCw className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Analyzing Blueprint...</h3>
                        <p className="text-gray-500">Evaluating difficulty, coverage, and estimated time</p>
                    </div>
                ) : !analysisData ? (
                    <div className="flex-1 flex items-center justify-center p-12 text-red-500">Failed to load analysis.</div>
                ) : (
                    <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                        {/* Sidebar Navigation */}
                        <div className="w-full md:w-64 border-r border-gray-100 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-800/30 flex flex-row md:flex-col overflow-x-auto shrink-0">
                            <div className="p-4 border-b border-gray-100 dark:border-gray-800 text-center shrink-0">
                                <div className="text-4xl font-extrabold text-indigo-600 mb-1">
                                    {analysisData.score}/100
                                </div>
                                <div className={`text-sm font-medium px-3 py-1 inline-block rounded-full ${
                                    analysisData.status === 'Excellent' || analysisData.status === 'Good' ? 'bg-green-100 text-green-700' :
                                    analysisData.status === 'Fair' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                                }`}>
                                    {analysisData.status} Quality
                                </div>
                            </div>
                            
                            <div className="p-2 flex md:flex-col gap-1 overflow-x-auto">
                                {tabs.map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`px-4 py-3 text-left rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${
                                            activeTab === tab.id 
                                            ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' 
                                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                                        }`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Content Area */}
                        <div className="flex-1 overflow-y-auto p-6 bg-white dark:bg-gray-900">
                            <AnimatePresence mode="wait">
                                {/* OVERVIEW TAB */}
                                {activeTab === 'overview' && (
                                    <motion.div key="overview" initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}}>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                                            {[
                                                { label: 'Available Qs', value: `${analysisData.availability?.totalAvailable} / ${analysisData.availability?.totalRequested}`, icon: CheckSquare },
                                                { label: 'Coverage', value: `${analysisData.coverage?.coverageScore}%`, icon: BarChart2 },
                                                { label: 'Est. Time', value: `${analysisData.timing?.estimatedTime}m`, icon: Clock },
                                                { label: 'Duplicates', value: analysisData.duplicates?.duplicateCount || 0, icon: AlertTriangle }
                                            ].map((stat, i) => (
                                                <div key={i} className="bg-gray-50 dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700">
                                                    <div className="flex items-center gap-2 text-gray-500 mb-2">
                                                        <stat.icon className="w-4 h-4" />
                                                        <span className="text-sm font-medium">{stat.label}</span>
                                                    </div>
                                                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Suggestions */}
                                        <div className="space-y-4">
                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">AI Suggestions</h3>
                                            
                                            {analysisData.suggestions?.critical?.length > 0 && (
                                                <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl border border-red-100 dark:border-red-800">
                                                    <h4 className="text-sm font-bold text-red-800 dark:text-red-400 flex items-center gap-2 mb-2">
                                                        <AlertTriangle className="w-4 h-4" /> Critical
                                                    </h4>
                                                    <ul className="list-disc pl-5 space-y-1 text-sm text-red-700 dark:text-red-300">
                                                        {analysisData.suggestions.critical.map((s,i) => <li key={i}>{s}</li>)}
                                                    </ul>
                                                </div>
                                            )}

                                            {analysisData.suggestions?.warnings?.length > 0 && (
                                                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-xl border border-yellow-100 dark:border-yellow-800">
                                                    <h4 className="text-sm font-bold text-yellow-800 dark:text-yellow-400 flex items-center gap-2 mb-2">
                                                        <Info className="w-4 h-4" /> Warnings
                                                    </h4>
                                                    <ul className="list-disc pl-5 space-y-1 text-sm text-yellow-700 dark:text-yellow-300">
                                                        {analysisData.suggestions.warnings.map((s,i) => <li key={i}>{s}</li>)}
                                                    </ul>
                                                </div>
                                            )}

                                            {analysisData.suggestions?.recommendations?.length > 0 && (
                                                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl border border-green-100 dark:border-green-800">
                                                    <h4 className="text-sm font-bold text-green-800 dark:text-green-400 flex items-center gap-2 mb-2">
                                                        <CheckCircle className="w-4 h-4" /> Recommendations
                                                    </h4>
                                                    <ul className="list-disc pl-5 space-y-1 text-sm text-green-700 dark:text-green-300">
                                                        {analysisData.suggestions.recommendations.map((s,i) => <li key={i}>{s}</li>)}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}

                                {/* DIFFICULTY TAB */}
                                {activeTab === 'difficulty' && (
                                    <motion.div key="difficulty" initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}}>
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Difficulty Distribution</h3>
                                        <div className="h-64 mb-8">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={[
                                                    { name: 'Easy', count: analysisData.difficulty.easyCount },
                                                    { name: 'Medium', count: analysisData.difficulty.mediumCount },
                                                    { name: 'Hard', count: analysisData.difficulty.hardCount }
                                                ]}>
                                                    <XAxis dataKey="name" />
                                                    <YAxis />
                                                    <Tooltip />
                                                    <Bar dataKey="count" fill="#4f46e5" radius={[4,4,0,0]}>
                                                        {
                                                            [0,1,2].map((entry, index) => (
                                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                            ))
                                                        }
                                                    </Bar>
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                        <div className={`p-4 rounded-xl text-sm font-medium ${analysisData.difficulty.balance === 'Excellent' || analysisData.difficulty.balance === 'Good' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                            Balance Status: {analysisData.difficulty.balance}
                                        </div>
                                    </motion.div>
                                )}

                                {/* COVERAGE TAB */}
                                {activeTab === 'coverage' && (
                                    <motion.div key="coverage" initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}}>
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Topic Coverage Heatmap</h3>
                                        <div className="space-y-4">
                                            {analysisData.coverage?.heatmap?.map((item, index) => (
                                                <div key={index}>
                                                    <div className="flex justify-between text-sm font-medium mb-1">
                                                        <span className="text-gray-700 dark:text-gray-300">{item.topic}</span>
                                                        <span className={item.count > 0 ? "text-indigo-600" : "text-red-500"}>
                                                            {item.count > 0 ? `${item.count} questions` : 'Missing'}
                                                        </span>
                                                    </div>
                                                    <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                                        <div 
                                                            className={`h-full ${item.count > 0 ? 'bg-indigo-500' : 'bg-red-500'}`} 
                                                            style={{ width: `${Math.max(5, item.percentage)}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                            {(!analysisData.coverage?.heatmap || analysisData.coverage.heatmap.length === 0) && (
                                                <div className="text-gray-500 text-center py-8">No specific topics selected.</div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}

                                {/* MARKS TAB */}
                                {activeTab === 'marks' && (
                                    <motion.div key="marks" initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}}>
                                         <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Marks Analysis</h3>
                                         <div className="grid grid-cols-2 gap-4 mb-8">
                                            <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800 text-center">
                                                <div className="text-3xl font-bold text-indigo-700 dark:text-indigo-400">{analysisData.marks.totalMarks}</div>
                                                <div className="text-sm font-medium text-indigo-600">Total Marks</div>
                                            </div>
                                            <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-xl border border-emerald-100 dark:border-emerald-800 text-center">
                                                <div className="text-3xl font-bold text-emerald-700 dark:text-emerald-400">{analysisData.marks.averageMarks}</div>
                                                <div className="text-sm font-medium text-emerald-600">Avg. per Question</div>
                                            </div>
                                         </div>
                                         <div className="h-64">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={analysisData.marks.distribution}>
                                                    <XAxis dataKey="label" />
                                                    <YAxis />
                                                    <Tooltip />
                                                    <Bar dataKey="count" fill="#8b5cf6" radius={[4,4,0,0]} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </motion.div>
                                )}

                                {/* TIMING TAB */}
                                {activeTab === 'timing' && (
                                    <motion.div key="timing" initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}}>
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Timing & Duration</h3>
                                        <div className="flex flex-col md:flex-row gap-8 mb-8">
                                            <div className="flex-1 bg-gray-50 dark:bg-gray-800 rounded-2xl p-6 text-center border border-gray-100 dark:border-gray-700">
                                                <div className="text-sm text-gray-500 font-medium mb-1">Estimated Student Time</div>
                                                <div className="text-4xl font-extrabold text-gray-900 dark:text-white mb-2">{analysisData.timing.estimatedTime} min</div>
                                            </div>
                                            <div className="flex-1 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl p-6 text-center border border-indigo-100 dark:border-indigo-800">
                                                <div className="text-sm text-indigo-600 font-medium mb-1">Recommended Duration</div>
                                                <div className="text-4xl font-extrabold text-indigo-700 dark:text-indigo-400 mb-2">{analysisData.timing.recommendedDuration} min</div>
                                            </div>
                                        </div>
                                        <h4 className="font-medium text-gray-900 dark:text-white mb-4">Breakdown by Question Type</h4>
                                        <div className="space-y-3">
                                            {analysisData.timing.breakdown?.map((b, i) => (
                                                <div key={i} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                                                    <div>
                                                        <span className="font-medium text-gray-900 dark:text-white">{b.type}</span>
                                                        <span className="text-sm text-gray-500 ml-2">({b.count} questions)</span>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="font-medium text-gray-900 dark:text-white">{b.totalTime} min total</div>
                                                        <div className="text-xs text-gray-500">~{b.averagePerQ} min/q</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}

                                {/* SIMULATOR TAB */}
                                {activeTab === 'simulator' && (
                                    <motion.div key="simulator" initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}}>
                                        <div className="flex justify-between items-center mb-6">
                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">What-If Simulator</h3>
                                            <button 
                                                onClick={runSimulation}
                                                className="px-4 py-2 bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 rounded-lg text-sm font-medium hover:bg-indigo-200 transition-colors flex items-center gap-2"
                                            >
                                                <RefreshCw className="w-4 h-4" /> Re-Analyze
                                            </button>
                                        </div>
                                        <p className="text-sm text-gray-500 mb-6">Tweak the blueprint values below and re-analyze to see how it affects your Quality Score.</p>
                                        
                                        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                                            {localBlueprint.map((section, idx) => (
                                                <div key={idx} className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                                                    <h4 className="font-medium text-gray-900 dark:text-white mb-3">Section {idx+1}: {section.sectionName || 'Unnamed'}</h4>
                                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                        <div>
                                                            <label className="block text-xs text-gray-500 mb-1">Questions</label>
                                                            <input 
                                                                type="number" 
                                                                min="0"
                                                                value={section.questionCount}
                                                                onChange={(e) => handleSimulatorChange(idx, 'questionCount', e.target.value)}
                                                                className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs text-gray-500 mb-1">Marks</label>
                                                            <input 
                                                                type="number" 
                                                                min="1"
                                                                value={section.marksPerQuestion}
                                                                onChange={(e) => handleSimulatorChange(idx, 'marksPerQuestion', e.target.value)}
                                                                className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs text-gray-500 mb-1">Difficulty</label>
                                                            <select 
                                                                value={section.difficulty}
                                                                onChange={(e) => handleSimulatorChange(idx, 'difficulty', e.target.value)}
                                                                className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                                            >
                                                                <option value="Mixed">Mixed</option>
                                                                <option value="Easy">Easy</option>
                                                                <option value="Medium">Medium</option>
                                                                <option value="Hard">Hard</option>
                                                            </select>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                )}

                {/* Footer Actions */}
                {!loading && analysisData && (
                    <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 flex flex-wrap justify-end gap-3 shrink-0">
                        <button 
                            onClick={onClose}
                            className="px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
                        >
                            Back to Edit
                        </button>
                        
                        <button 
                            onClick={handleOptimize}
                            disabled={isOptimizing}
                            className="px-5 py-2.5 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50"
                        >
                            {isOptimizing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                            Optimize Automatically
                        </button>

                        <button 
                            onClick={() => {
                                onOptimizeComplete(localBlueprint);
                                onGenerateAnyway();
                            }}
                            disabled={analysisData.availability?.status === 'Insufficient'}
                            className="px-5 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title={analysisData.availability?.status === 'Insufficient' ? 'Insufficient questions to generate' : 'Proceed with generation'}
                        >
                            Generate Exam
                        </button>
                    </div>
                )}
            </motion.div>
        </div>
    );
};

export default BlueprintAnalysisModal;
