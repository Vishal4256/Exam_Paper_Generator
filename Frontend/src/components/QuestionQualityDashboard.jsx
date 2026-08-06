import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, CheckCircle, Info, BookOpen, Clock, Copy, BrainCircuit, Activity, BarChart2, Wand2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import api from '../utils/axiosConfig';

const QuestionQualityDashboard = ({ isOpen, onClose, analysisData, loading, currentPlainText, currentHtml, onApplyImprovement }) => {
    const [activeTab, setActiveTab] = useState('overview');
    const [improving, setImproving] = useState(false);
    const [improvedHtml, setImprovedHtml] = useState(null);

    if (!isOpen) return null;

    const tabs = [
        { id: 'overview', label: 'Overview', icon: Activity },
        { id: 'readability', label: 'Readability', icon: BookOpen },
        { id: 'difficulty', label: 'Difficulty', icon: BarChart2 },
        { id: 'bloom', label: 'Bloom', icon: BrainCircuit },
        { id: 'timing', label: 'Timing', icon: Clock },
        { id: 'duplicates', label: 'Duplicates', icon: Copy },
        { id: 'suggestions', label: 'Suggestions', icon: AlertTriangle }
    ];

    const getStatusColor = (status) => {
        if (status === 'Excellent' || status === 'Good') return 'bg-green-100 text-green-700 border-green-200';
        if (status === 'Fair') return 'bg-yellow-100 text-yellow-700 border-yellow-200';
        return 'bg-red-100 text-red-700 border-red-200';
    };

    const handleImprove = async () => {
        setImproving(true);
        try {
            const res = await api.post('/ai/improve-question', {
                questionHtml: currentHtml,
                analysisData
            });
            setImprovedHtml(res.data.html);
        } catch (err) {
            console.error("Failed to improve question", err);
        } finally {
            setImproving(false);
        }
    };

    const handleAccept = () => {
        if (onApplyImprovement) onApplyImprovement(improvedHtml);
        setImprovedHtml(null);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="quality-dashboard-title">
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-5xl flex flex-col overflow-hidden max-h-[90vh]"
            >
                {/* Header */}
                <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
                    <div>
                        <h2 id="quality-dashboard-title" className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Activity className="w-5 h-5 text-indigo-600" />
                            Question Quality Dashboard
                        </h2>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {loading ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-12 min-h-[400px]">
                        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Analyzing Question...</h3>
                    </div>
                ) : !analysisData ? (
                    <div className="flex-1 flex items-center justify-center p-12 text-gray-500">No analysis data available.</div>
                ) : (
                    <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                        {/* Sidebar */}
                        <div className="w-full md:w-64 border-r border-gray-100 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-800/30 flex flex-row md:flex-col overflow-x-auto shrink-0">
                            <div className="p-6 border-b border-gray-100 dark:border-gray-800 text-center shrink-0">
                                <div className="text-sm font-medium text-gray-500 mb-1">Overall Quality</div>
                                <div className="text-5xl font-extrabold text-gray-900 dark:text-white mb-2">
                                    {analysisData.overall}
                                </div>
                                <div className={`text-xs font-bold px-3 py-1 inline-block rounded-full border ${getStatusColor(analysisData.status)}`}>
                                    {analysisData.status}
                                </div>
                            </div>
                            
                            <div className="p-2 flex md:flex-col gap-1 overflow-x-auto">
                                {tabs.map(tab => {
                                    const Icon = tab.icon;
                                    return (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id)}
                                            className={`px-4 py-3 text-left rounded-xl text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-3 ${
                                                activeTab === tab.id 
                                                ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' 
                                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                                            }`}
                                        >
                                            <Icon className="w-4 h-4 opacity-70" />
                                            {tab.label}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Content Area */}
                        <div className="flex-1 overflow-y-auto p-6 bg-white dark:bg-gray-900">
                            <AnimatePresence mode="wait">
                                
                                {/* OVERVIEW */}
                                {activeTab === 'overview' && (
                                    <motion.div key="overview" initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}}>
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Category Scores</h3>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
                                            {Object.entries(analysisData.categoryScores).map(([key, score]) => (
                                                <div key={key} className="p-4 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 flex flex-col items-center justify-center text-center">
                                                    <div className="text-xs text-gray-500 uppercase tracking-wider mb-1 font-semibold">{key}</div>
                                                    <div className={`text-2xl font-bold ${score >= 80 ? 'text-green-600' : score >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                                                        {score}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}

                                {/* READABILITY */}
                                {activeTab === 'readability' && (
                                    <motion.div key="readability" initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}}>
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Readability Metrics</h3>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                                                <div className="text-xs text-gray-500 mb-1">Sentence Count</div>
                                                <div className="text-xl font-bold">{analysisData.readability.sentenceCount}</div>
                                            </div>
                                            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                                                <div className="text-xs text-gray-500 mb-1">Avg Words/Sentence</div>
                                                <div className="text-xl font-bold">{analysisData.readability.avgWordsPerSentence}</div>
                                            </div>
                                            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                                                <div className="text-xs text-gray-500 mb-1">Longest Sentence</div>
                                                <div className="text-xl font-bold">{analysisData.readability.longestSentence}</div>
                                            </div>
                                            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                                                <div className="text-xs text-gray-500 mb-1">Passive Voice</div>
                                                <div className={`text-xl font-bold ${analysisData.readability.passiveVoiceDetected ? 'text-yellow-600' : 'text-green-600'}`}>
                                                    {analysisData.readability.passiveVoiceDetected ? 'Detected' : 'None'}
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {analysisData.readability.issues?.length > 0 && (
                                            <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-xl border border-red-100">
                                                <ul className="list-disc pl-5 space-y-1">
                                                    {analysisData.readability.issues.map((msg, i) => <li key={i} className="text-sm">{msg}</li>)}
                                                </ul>
                                            </div>
                                        )}
                                        {analysisData.readability.recommendations?.length > 0 && (
                                            <div className="p-4 bg-indigo-50 text-indigo-700 rounded-xl border border-indigo-100">
                                                <ul className="list-disc pl-5 space-y-1">
                                                    {analysisData.readability.recommendations.map((msg, i) => <li key={i} className="text-sm">{msg}</li>)}
                                                </ul>
                                            </div>
                                        )}
                                    </motion.div>
                                )}

                                {/* DIFFICULTY */}
                                {activeTab === 'difficulty' && (
                                    <motion.div key="difficulty" initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}}>
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Difficulty Analysis</h3>
                                        <div className="flex gap-8 items-center justify-center p-8 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
                                            <div className="text-center flex-1">
                                                <div className="text-sm text-gray-500 mb-2 font-semibold uppercase tracking-wider">AI Predicted</div>
                                                <div className={`text-4xl font-extrabold ${analysisData.difficulty.predictedDifficulty === 'Hard' ? 'text-red-500' : analysisData.difficulty.predictedDifficulty === 'Medium' ? 'text-yellow-500' : 'text-green-500'}`}>
                                                    {analysisData.difficulty.predictedDifficulty}
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {analysisData.difficulty.mismatchDetected && (
                                            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl flex gap-3">
                                                <AlertTriangle className="w-6 h-6 text-yellow-600 shrink-0" />
                                                <div>
                                                    <div className="font-bold text-yellow-800 text-sm">Difficulty Mismatch Detected</div>
                                                    <div className="text-sm text-yellow-700 mt-1">The manually assigned difficulty does not match the AI's prediction. Consider reviewing the question's complexity.</div>
                                                </div>
                                            </div>
                                        )}
                                    </motion.div>
                                )}

                                {/* BLOOM */}
                                {activeTab === 'bloom' && (
                                    <motion.div key="bloom" initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}}>
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Bloom's Taxonomy</h3>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="p-6 bg-indigo-50 border border-indigo-100 dark:bg-indigo-900/20 dark:border-indigo-800 rounded-2xl text-center">
                                                <div className="text-sm text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-wider mb-2">Primary Classification</div>
                                                <div className="text-3xl font-extrabold text-indigo-700 dark:text-indigo-300 mb-1">{analysisData.bloom.primary.level}</div>
                                                <div className="text-sm text-indigo-600/80 font-medium">Confidence: {analysisData.bloom.primary.confidence}%</div>
                                            </div>

                                            {analysisData.bloom.alternative && (
                                                <div className="p-6 bg-gray-50 border border-gray-100 dark:bg-gray-800 dark:border-gray-700 rounded-2xl text-center opacity-70">
                                                    <div className="text-sm text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider mb-2">Alternative</div>
                                                    <div className="text-2xl font-bold text-gray-700 dark:text-gray-300 mb-1">{analysisData.bloom.alternative.level}</div>
                                                    <div className="text-sm text-gray-500 font-medium">Confidence: {analysisData.bloom.alternative.confidence}%</div>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}

                                {/* TIMING */}
                                {activeTab === 'timing' && (
                                    <motion.div key="timing" initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}}>
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Estimated Solve Time</h3>
                                        
                                        <div className="flex gap-4 mb-6">
                                            <div className="flex-1 p-6 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 text-center">
                                                <div className="text-sm text-gray-500 font-medium mb-1">Estimated</div>
                                                <div className="text-4xl font-extrabold text-gray-900 dark:text-white">{analysisData.timing.estimatedMinutes} <span className="text-xl text-gray-400">min</span></div>
                                            </div>
                                            <div className="flex-1 p-6 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 text-center">
                                                <div className="text-sm text-gray-500 font-medium mb-1">Assigned Marks</div>
                                                <div className="text-4xl font-extrabold text-gray-900 dark:text-white">{analysisData.timing.marks}</div>
                                            </div>
                                        </div>

                                        {(analysisData.timing.issues?.length > 0 || analysisData.timing.recommendations?.length > 0) && (
                                            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                                                {analysisData.timing.issues?.map((msg, i) => (
                                                    <div key={`i-${i}`} className="text-sm text-yellow-800 font-medium flex items-start gap-2 mb-2">
                                                        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                                                        {msg}
                                                    </div>
                                                ))}
                                                {analysisData.timing.recommendations?.map((msg, i) => (
                                                    <div key={`r-${i}`} className="text-sm text-yellow-700 flex items-start gap-2">
                                                        <Info className="w-4 h-4 shrink-0 mt-0.5" />
                                                        {msg}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </motion.div>
                                )}

                                {/* DUPLICATES */}
                                {activeTab === 'duplicates' && (
                                    <motion.div key="duplicates" initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}}>
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Duplicate Detection</h3>
                                        
                                        <div className="mb-6">
                                            <div className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Duplicate Probability</div>
                                            <div className="flex items-center gap-4">
                                                <div className="flex-1 h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                                    <div 
                                                        className={`h-full ${analysisData.duplicates.duplicateProbability > 80 ? 'bg-red-500' : analysisData.duplicates.duplicateProbability > 50 ? 'bg-yellow-500' : 'bg-green-500'}`}
                                                        style={{ width: `${analysisData.duplicates.duplicateProbability}%` }}
                                                    />
                                                </div>
                                                <span className="font-bold text-xl">{analysisData.duplicates.duplicateProbability}%</span>
                                            </div>
                                        </div>

                                        <h4 className="font-bold text-gray-900 dark:text-white mb-3">Similar Questions in Bank</h4>
                                        <div className="space-y-3">
                                            {analysisData.duplicates.similarQuestions?.length === 0 ? (
                                                <p className="text-gray-500 text-sm">No similar questions found.</p>
                                            ) : (
                                                analysisData.duplicates.similarQuestions.map((sq, i) => (
                                                    <div key={i} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-indigo-300 transition-colors cursor-pointer" onClick={() => window.open(`/questions/${sq.id}`, '_blank')}>
                                                        <div className="flex justify-between items-start gap-4 mb-2">
                                                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-2">{sq.text}</div>
                                                            <span className="shrink-0 text-xs font-bold px-2 py-1 bg-red-100 text-red-700 rounded">{sq.probability}% Match</span>
                                                        </div>
                                                        <div className="text-xs text-indigo-600 font-medium">Click to view question</div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </motion.div>
                                )}

                                {/* SUGGESTIONS */}
                                {activeTab === 'suggestions' && (
                                    <motion.div key="suggestions" initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}}>
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Actionable Feedback</h3>
                                        
                                        <div className="space-y-4 mb-6">
                                            {/* Critical, Warnings, Recommendations (existing rendering) */}
                                            {analysisData.suggestions?.critical?.length > 0 && (
                                                <div className="bg-red-50 dark:bg-red-900/20 p-5 rounded-2xl border border-red-100 dark:border-red-800/50">
                                                    <h4 className="text-sm font-bold text-red-800 dark:text-red-400 flex items-center gap-2 mb-3">
                                                        <AlertTriangle className="w-5 h-5" /> Critical Issues
                                                    </h4>
                                                    <ul className="space-y-2">
                                                        {analysisData.suggestions.critical.map((s,i) => (
                                                            <li key={i} className="flex gap-2 text-sm text-red-700 dark:text-red-300">
                                                                <span className="mt-1">•</span>
                                                                <span>{s}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}

                                            {analysisData.suggestions?.warnings?.length > 0 && (
                                                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-5 rounded-2xl border border-yellow-100 dark:border-yellow-800/50">
                                                    <h4 className="text-sm font-bold text-yellow-800 dark:text-yellow-400 flex items-center gap-2 mb-3">
                                                        <Info className="w-5 h-5" /> Warnings
                                                    </h4>
                                                    <ul className="space-y-2">
                                                        {analysisData.suggestions.warnings.map((s,i) => (
                                                            <li key={i} className="flex gap-2 text-sm text-yellow-700 dark:text-yellow-300">
                                                                <span className="mt-1">•</span>
                                                                <span>{s}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}

                                            {analysisData.suggestions?.recommendations?.length > 0 && (
                                                <div className="bg-green-50 dark:bg-green-900/20 p-5 rounded-2xl border border-green-100 dark:border-green-800/50">
                                                    <h4 className="text-sm font-bold text-green-800 dark:text-green-400 flex items-center gap-2 mb-3">
                                                        <CheckCircle className="w-5 h-5" /> Recommendations
                                                    </h4>
                                                    <ul className="space-y-2">
                                                        {analysisData.suggestions.recommendations.map((s,i) => (
                                                            <li key={i} className="flex gap-2 text-sm text-green-700 dark:text-green-300">
                                                                <span className="mt-1">•</span>
                                                                <span>{s}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>

                                        {/* AI Improvement Section */}
                                        <div className="mt-8 border-t border-gray-100 dark:border-gray-800 pt-6">
                                            {!improvedHtml ? (
                                                <button 
                                                    onClick={handleImprove}
                                                    disabled={improving || !currentHtml}
                                                    className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                                                >
                                                    {improving ? (
                                                        <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Improving...</>
                                                    ) : (
                                                        <><Wand2 className="w-5 h-5" /> One-Click AI Improve</>
                                                    )}
                                                </button>
                                            ) : (
                                                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
                                                    <div className="flex items-center gap-2 mb-4 text-indigo-700 dark:text-indigo-400">
                                                        <Wand2 className="w-5 h-5" />
                                                        <h4 className="font-bold">AI Improved Version</h4>
                                                    </div>
                                                    
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                                        <div>
                                                            <div className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Original</div>
                                                            <div className="p-4 bg-white dark:bg-gray-900 border border-red-100 dark:border-red-900/30 rounded-xl text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap opacity-75">
                                                                {currentPlainText}
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <div className="text-xs font-bold uppercase tracking-wider text-indigo-500 mb-2">Improved</div>
                                                            <div 
                                                                className="p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl text-sm text-gray-900 dark:text-gray-100 prose prose-sm max-w-none"
                                                                dangerouslySetInnerHTML={{ __html: improvedHtml }}
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="flex justify-end gap-3">
                                                        <button 
                                                            onClick={() => setImprovedHtml(null)}
                                                            className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                                                        >
                                                            Reject
                                                        </button>
                                                        <button 
                                                            onClick={handleAccept}
                                                            className="px-6 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium shadow-sm flex items-center gap-2"
                                                        >
                                                            <CheckCircle className="w-4 h-4" /> Accept Changes
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}

                            </AnimatePresence>
                        </div>
                    </div>
                )}
            </motion.div>
        </div>
    );
};

export default QuestionQualityDashboard;
