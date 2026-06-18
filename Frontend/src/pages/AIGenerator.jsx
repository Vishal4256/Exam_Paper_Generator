import React, { useState } from 'react';
import api from '../utils/axiosConfig';
import { Sparkles, Save, RefreshCw, BookOpen, Layers, BarChart, Target, List } from 'lucide-react';
import { toast } from 'react-toastify';

const AIGenerator = () => {
    const [formData, setFormData] = useState({
        subject: '',
        topic: '',
        difficulty: 'Medium',
        type: 'MCQ',
        count: 5
    });
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [generatedQuestions, setGeneratedQuestions] = useState([]);
    const [editingIndex, setEditingIndex] = useState(null);
    const [subjects, setSubjects] = useState([]);

    React.useEffect(() => {
        const fetchSubjects = async () => {
            try {
                const res = await api.get('/questions');
                const allQuestionsData = res.data.questions || res.data;
                const uniqueSubjects = [...new Set(allQuestionsData.map(q => q.subject))];
                setSubjects(uniqueSubjects);
            } catch (err) {
                console.error('Error fetching subjects:', err);
            }
        };
        fetchSubjects();
    }, []);

    const handleGenerate = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await api.post('/ai/generate', formData);
            setGeneratedQuestions(res.data.questions || res.data);
            toast.success('Questions generated successfully!');
        } catch (err) {
            toast.error(err.response?.data?.msg || 'Failed to generate questions. Check API Key.');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveToBank = async () => {
        if (generatedQuestions.length === 0) return;
        setSaving(true);
        try {
            const questionsToSave = generatedQuestions.map(q => ({
                ...q,
                source: 'ai'
            }));
            await api.post('/questions/bulk', { questions: questionsToSave });
            toast.success('All questions saved to Question Bank!');
            setGeneratedQuestions([]);
        } catch (err) {
            toast.error('Failed to save some or all questions.');
        } finally {
            setSaving(false);
        }
    };

    const handleRegenerateSingle = async (idx) => {
        const toastId = toast.loading('Regenerating question...');
        try {
            const reqData = { ...formData, count: 1 };
            const res = await api.post('/ai/generate', reqData);
            const newQ = (res.data.questions || res.data)[0];
            
            const updated = [...generatedQuestions];
            updated[idx] = newQ;
            setGeneratedQuestions(updated);
            
            toast.update(toastId, { render: 'Question regenerated!', type: 'success', isLoading: false, autoClose: 3000 });
        } catch (err) {
            toast.update(toastId, { render: 'Failed to regenerate question', type: 'error', isLoading: false, autoClose: 3000 });
        }
    };

    const handleDeleteSingle = (idx) => {
        const updated = generatedQuestions.filter((_, i) => i !== idx);
        setGeneratedQuestions(updated);
        toast.info('Question removed from preview');
    };

    const handleSaveSingle = async (idx) => {
        const qToSave = generatedQuestions[idx];
        try {
            await api.post('/questions', { ...qToSave, source: 'ai' });
            toast.success('Question saved to bank!');
            handleDeleteSingle(idx); // Remove from preview after save
        } catch (err) {
            toast.error('Failed to save question');
        }
    };

    return (
        <div className="max-w-[1400px] mx-auto pb-8">
            <div className="mb-8">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-1">AI Question Generator</h1>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Harness the power of AI to instantly create high-quality academic questions.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Configuration Panel */}
                <div className="lg:col-span-4 space-y-6">
                    <form onSubmit={handleGenerate} className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-5">
                        <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                                <BookOpen className="w-3 h-3" /> Subject
                            </label>
                            <input 
                                required 
                                type="text" 
                                list="ai-subjects"
                                placeholder="e.g., DBMS, Physics"
                                value={formData.subject} 
                                onChange={(e) => setFormData({ ...formData, subject: e.target.value })} 
                                className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-500/20 focus:bg-white dark:focus:bg-gray-800 transition-all"
                            />
                            <datalist id="ai-subjects">
                                {subjects.map(s => <option key={s} value={s} />)}
                            </datalist>
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                                <Layers className="w-3 h-3" /> Topic
                            </label>
                            <input 
                                required 
                                type="text" 
                                placeholder="e.g., Normalization, Quantum Mechanics"
                                value={formData.topic} 
                                onChange={(e) => setFormData({ ...formData, topic: e.target.value })} 
                                className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-500/20 focus:bg-white dark:focus:bg-gray-800 transition-all"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                                    <BarChart className="w-3 h-3" /> Difficulty
                                </label>
                                <select 
                                    value={formData.difficulty} 
                                    onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })} 
                                    className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-500/20 focus:bg-white dark:focus:bg-gray-800 transition-all"
                                >
                                    <option value="Easy">Easy</option>
                                    <option value="Medium">Medium</option>
                                    <option value="Hard">Hard</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                                    <Target className="w-3 h-3" /> Type
                                </label>
                                <select 
                                    value={formData.type} 
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value })} 
                                    className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-500/20 focus:bg-white dark:focus:bg-gray-800 transition-all"
                                >
                                    <option value="MCQ">MCQ</option>
                                    <option value="Short Answer">Short Answer</option>
                                    <option value="Long Answer">Long Answer</option>
                                    <option value="True/False">True/False</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                                <List className="w-3 h-3" /> Number of Questions
                            </label>
                            <input 
                                required 
                                type="number" 
                                min="1" 
                                max="20"
                                value={formData.count} 
                                onChange={(e) => setFormData({ ...formData, count: Number(e.target.value) })} 
                                className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-500/20 focus:bg-white dark:focus:bg-gray-800 transition-all"
                            />
                        </div>

                        <button 
                            type="submit" 
                            disabled={loading} 
                            className="w-full bg-indigo-600 text-white font-bold py-3.5 rounded-xl hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 mt-4"
                        >
                            {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                            {loading ? 'Generating...' : 'Generate with AI'}
                        </button>
                    </form>
                </div>

                {/* Preview Panel */}
                <div className="lg:col-span-8">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-xl overflow-hidden min-h-[500px] flex flex-col">
                        <div className="bg-gray-50/80 dark:bg-gray-700/50 px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                            <h3 className="font-bold text-gray-900 dark:text-white text-sm flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Generated Preview
                            </h3>
                            {generatedQuestions.length > 0 && (
                                <button 
                                    onClick={handleSaveToBank}
                                    disabled={saving}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-sm transition-all flex items-center gap-2"
                                >
                                    {saving ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                                    {saving ? 'Saving...' : 'Save to Bank'}
                                </button>
                            )}
                        </div>

                        <div className="flex-1 p-6 overflow-y-auto custom-scrollbar bg-white dark:bg-gray-900">
                            {generatedQuestions.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4">
                                    <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center">
                                        <Sparkles className="w-8 h-8 text-gray-300 dark:text-gray-600" />
                                    </div>
                                    <p className="text-sm font-medium">Configure options and click generate</p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {generatedQuestions.map((q, idx) => (
                                        <div key={idx} className="border border-gray-100 dark:border-gray-700 rounded-xl p-5 bg-gray-50/30 dark:bg-gray-800/30 hover:border-indigo-100 dark:hover:border-indigo-500/30 transition-colors">
                                            <div className="flex gap-3 mb-4">
                                                <span className="font-black text-indigo-600 dark:text-indigo-400">Q{idx + 1}.</span>
                                                <div className="flex-1">
                                                    {editingIndex === idx ? (
                                                        <textarea 
                                                            className="w-full text-sm font-bold text-gray-800 dark:text-gray-200 mb-4 p-2 border dark:border-gray-600 rounded bg-transparent outline-none"
                                                            value={q.questionText}
                                                            onChange={(e) => {
                                                                const updated = [...generatedQuestions];
                                                                updated[idx].questionText = e.target.value;
                                                                setGeneratedQuestions(updated);
                                                            }}
                                                        />
                                                    ) : (
                                                        <p className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-4">{q.questionText}</p>
                                                    )}
                                                    
                                                    {q.options && q.options.length > 0 && (
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                                                            {q.options.map((opt, oIdx) => (
                                                                <div 
                                                                    key={oIdx} 
                                                                    className={`border rounded-lg px-4 py-2.5 text-xs font-semibold flex items-center ${opt === q.correctAnswer ? 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300'}`}
                                                                >
                                                                    <span className="mr-2">{String.fromCharCode(65 + oIdx)}.</span>
                                                                    {editingIndex === idx ? (
                                                                        <input 
                                                                            type="text" 
                                                                            className="flex-1 bg-transparent border-b border-gray-300 outline-none px-1"
                                                                            value={opt}
                                                                            onChange={(e) => {
                                                                                const updated = [...generatedQuestions];
                                                                                updated[idx].options[oIdx] = e.target.value;
                                                                                setGeneratedQuestions(updated);
                                                                            }}
                                                                        />
                                                                    ) : (
                                                                        opt
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                    
                                                    <div className="bg-indigo-50/50 dark:bg-indigo-900/20 rounded-lg p-4 border border-indigo-50/80 dark:border-indigo-800 mb-4">
                                                        <div className="text-[10px] font-black text-indigo-400 uppercase tracking-wider mb-1">Correct Answer & Explanation</div>
                                                        {editingIndex === idx ? (
                                                            <input 
                                                                type="text" 
                                                                className="w-full text-xs font-bold text-gray-900 dark:text-white mb-2 p-1 border dark:border-gray-600 rounded bg-transparent outline-none"
                                                                value={q.correctAnswer}
                                                                onChange={(e) => {
                                                                    const updated = [...generatedQuestions];
                                                                    updated[idx].correctAnswer = e.target.value;
                                                                    setGeneratedQuestions(updated);
                                                                }}
                                                            />
                                                        ) : (
                                                            <p className="text-xs font-bold text-gray-900 dark:text-white mb-2">{q.correctAnswer}</p>
                                                        )}
                                                        
                                                        {editingIndex === idx ? (
                                                            <textarea 
                                                                className="w-full text-xs font-medium text-gray-600 dark:text-gray-400 leading-relaxed p-1 border dark:border-gray-600 rounded bg-transparent outline-none"
                                                                value={q.explanation}
                                                                onChange={(e) => {
                                                                    const updated = [...generatedQuestions];
                                                                    updated[idx].explanation = e.target.value;
                                                                    setGeneratedQuestions(updated);
                                                                }}
                                                            />
                                                        ) : (
                                                            <p className="text-xs font-medium text-gray-600 dark:text-gray-400 leading-relaxed">{q.explanation}</p>
                                                        )}
                                                    </div>
                                                    
                                                    <div className="flex items-center gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                                                        {editingIndex === idx ? (
                                                            <button onClick={() => setEditingIndex(null)} className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 px-3 py-1.5 rounded-lg transition-colors">Done</button>
                                                        ) : (
                                                            <button onClick={() => setEditingIndex(idx)} className="text-xs font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 px-3 py-1.5 rounded-lg transition-colors">Edit</button>
                                                        )}
                                                        <button onClick={() => handleRegenerateSingle(idx)} className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 px-3 py-1.5 rounded-lg transition-colors">Regenerate</button>
                                                        <button onClick={() => handleSaveSingle(idx)} className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 px-3 py-1.5 rounded-lg transition-colors">Save Single</button>
                                                        <button onClick={() => handleDeleteSingle(idx)} className="text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 px-3 py-1.5 rounded-lg transition-colors ml-auto">Delete</button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AIGenerator;
