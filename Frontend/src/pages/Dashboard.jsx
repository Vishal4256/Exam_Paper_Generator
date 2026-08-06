import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/axiosConfig';
import { useAuth } from '../context/AuthContext';
import { Plus, Sparkles, FileText, CheckCircle2, Calendar, Clock, ArrowRight, Play, Database } from 'lucide-react';
import ActivityTimeline from '../components/ActivityTimeline';

const Dashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    
    const [stats, setStats] = useState({
        totalQuestions: 0,
        totalExams: 0,
        subjects: 0,
        recentExams: []
    });
    const [loading, setLoading] = useState(true);
    const [draft, setDraft] = useState(null);

    useEffect(() => {
        fetchStats();
        checkDraft();
    }, []);

    const checkDraft = () => {
        try {
            const stored = localStorage.getItem('exam_draft');
            if (stored) {
                const parsed = JSON.parse(stored);
                if (parsed && (parsed.draft || parsed.examTitle)) {
                    setDraft(parsed);
                }
            }
        } catch (err) {
            console.error(err);
        }
    };

    const fetchStats = async () => {
        try {
            setLoading(true);
            const [questionsRes, examsRes] = await Promise.all([
                api.get('/questions').catch(() => ({ data: { questions: [] } })),
                api.get('/exams').catch(() => ({ data: [] }))
            ]);

            const questions = questionsRes.data.questions || questionsRes.data || [];
            const exams = examsRes.data || [];
            const subjects = new Set(questions.map(q => q.subject)).size;

            setStats({
                totalQuestions: questions.length,
                totalExams: exams.length,
                subjects: subjects,
                recentExams: exams.slice(0, 4)
            });
        } catch (err) {
            console.error('Error fetching stats:', err);
        } finally {
            setLoading(false);
        }
    };

    // Calculate dynamic greeting
    const hour = new Date().getHours();
    const greeting = hour < 12 ? "Good Morning" : hour < 18 ? "Good Afternoon" : "Good Evening";
    const dateOptions = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' };

    const StatSkeleton = () => (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm animate-pulse h-32 flex flex-col justify-between">
            <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            <div>
                <div className="w-24 h-3 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                <div className="w-16 h-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
        </div>
    );

    return (
        <div className="max-w-[1400px] mx-auto space-y-6 pb-12">
            
            {/* Welcome Area */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-gradient-to-br from-indigo-600 to-violet-700 p-8 rounded-3xl shadow-lg shadow-indigo-600/20 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full blur-2xl -ml-10 -mb-10"></div>
                
                <div className="relative z-10">
                    <div className="flex items-center gap-2 text-indigo-100 mb-2 font-medium">
                        <Calendar className="w-4 h-4" />
                        <span>Today: {new Date().toLocaleDateString('en-US', dateOptions)}</span>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-black mb-2">Welcome, {user?.name?.split(' ')[0] || 'User'} 👋</h1>
                    <p className="text-lg text-indigo-100">{greeting}! Ready to create your next exam?</p>
                </div>
                
                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto relative z-10 mt-4 md:mt-0">
                    <Link to="/generate" className="flex-1 md:flex-none justify-center bg-white text-indigo-600 hover:bg-gray-50 px-5 py-3.5 rounded-xl text-sm font-bold shadow-sm transition-transform active:scale-95 flex items-center gap-2">
                        <Sparkles className="w-4 h-4" /> Generate Exam
                    </Link>
                    <Link to="/questions" className="flex-1 md:flex-none justify-center bg-indigo-500/30 hover:bg-indigo-500/50 backdrop-blur-sm border border-indigo-400/30 text-white px-5 py-3.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2">
                        <Database className="w-4 h-4" /> Question Bank
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                
                {/* Left Column (Main Content) */}
                <div className="xl:col-span-2 space-y-6">
                    
                    {/* Continue Working & Quick Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Continue Working Card */}
                        {draft ? (
                            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col justify-between group relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                                            <Clock className="w-3.5 h-3.5" /> Continue Working
                                        </h3>
                                        <span className="px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-[10px] font-bold uppercase rounded-md">Draft</span>
                                    </div>
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1 truncate">
                                        {draft.draft?.examTitle || draft.examTitle || 'Untitled Exam'}
                                    </h2>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        {draft.draft?.selectedSubject || draft.selectedSubject || 'No Subject'}
                                    </p>
                                </div>
                                <div className="mt-6 flex items-center justify-between">
                                    <p className="text-xs text-gray-400 font-medium">
                                        Last edited: {draft.draftUpdatedAt ? new Date(draft.draftUpdatedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Recently'}
                                    </p>
                                    <button onClick={() => navigate('/generate')} className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-4 py-2 rounded-lg text-xs font-bold hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors flex items-center gap-2 shadow-md">
                                        <Play className="w-3 h-3 fill-current" /> Resume
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center text-center h-full min-h-[160px]">
                                <Sparkles className="w-8 h-8 text-gray-300 dark:text-gray-600 mb-3" />
                                <p className="text-sm font-bold text-gray-500 dark:text-gray-400">No active drafts.</p>
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Start a new exam to see it here.</p>
                            </div>
                        )}

                        {/* Top Stats */}
                        <div className="grid grid-cols-2 gap-4">
                            {loading ? <StatSkeleton /> : (
                                <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col justify-between">
                                    <div className="w-8 h-8 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg flex items-center justify-center mb-4">
                                        <Database className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Questions</p>
                                        <p className="text-2xl font-black text-gray-900 dark:text-white">{stats.totalQuestions}</p>
                                    </div>
                                </div>
                            )}
                            
                            {loading ? <StatSkeleton /> : (
                                <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col justify-between">
                                    <div className="w-8 h-8 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg flex items-center justify-center mb-4">
                                        <FileText className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Exams</p>
                                        <p className="text-2xl font-black text-gray-900 dark:text-white">{stats.totalExams}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Recent Exams List */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                        <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-700/20">
                            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <FileText className="w-4 h-4 text-indigo-500" /> Recent Exams
                            </h3>
                            <Link to="/exams" className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1 group">
                                View All <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </div>
                        
                        {loading ? (
                            <div className="divide-y divide-gray-100 dark:divide-gray-700">
                                {[1,2,3].map(i => (
                                    <div key={i} className="p-4 flex justify-between animate-pulse">
                                        <div className="space-y-2">
                                            <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
                                            <div className="h-3 w-24 bg-gray-100 dark:bg-gray-800 rounded"></div>
                                        </div>
                                        <div className="h-8 w-20 bg-gray-100 dark:bg-gray-800 rounded"></div>
                                    </div>
                                ))}
                            </div>
                        ) : stats.recentExams.length === 0 ? (
                            <div className="p-12 text-center">
                                <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 border border-dashed border-gray-200 dark:border-gray-700">
                                    <FileText className="w-8 h-8 text-gray-300 dark:text-gray-600" />
                                </div>
                                <h4 className="text-gray-900 dark:text-white font-bold mb-1">No exams found</h4>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">You haven't generated any exams yet. Start by generating an AI exam or building from your Question Bank.</p>
                                <Link to="/generate" className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md transition-all">
                                    <Plus className="w-4 h-4" /> Create First Exam
                                </Link>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-50 dark:divide-gray-700">
                                {stats.recentExams.map((exam) => (
                                    <div key={exam._id} className="p-4 hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors flex items-center justify-between group">
                                        <div>
                                            <Link to={`/exams/${exam._id}`} className="text-sm font-bold text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                                                {exam.examTitle}
                                            </Link>
                                            <div className="flex items-center gap-3 mt-1">
                                                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{exam.subject || '-'}</span>
                                                <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600"></span>
                                                <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">{new Date(exam.generatedAt).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                        <Link to={`/exams/${exam._id}`} className="opacity-0 group-hover:opacity-100 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm hover:border-indigo-500 hover:text-indigo-600 transition-all">
                                            Open
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column (Sidebar timeline) */}
                <div className="xl:col-span-1">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6 sticky top-24">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <Clock className="w-4 h-4 text-indigo-500" /> Recent Activity
                            </h3>
                        </div>
                        <div className="max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                            <ActivityTimeline />
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Embedded CSS for custom scrollbar */}
            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background-color: rgba(156, 163, 175, 0.3);
                    border-radius: 20px;
                }
                .dark .custom-scrollbar::-webkit-scrollbar-thumb {
                    background-color: rgba(75, 85, 99, 0.5);
                }
            `}</style>
        </div>
    );
};

export default Dashboard;