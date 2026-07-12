import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Sparkles, ChevronRight, Save, X } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../utils/axiosConfig';

const AddQuestionWorkspace = ({ onClose, editingId, initialData }) => {
    const [isSaving, setIsSaving] = useState(false);
    const [aiLoading, setAiLoading] = useState(false);
    const [activeAiAction, setActiveAiAction] = useState(null);

    // Form State with backward compatibility defaults
    const [formData, setFormData] = useState({
        subject: initialData?.subject || '',
        topic: initialData?.topic || '',
        type: initialData?.type || 'MCQ',
        difficulty: initialData?.difficulty || 'Medium',
        questionText: initialData?.questionText || '',
        options: initialData?.options?.length === 4 ? initialData.options : 
                 (initialData?.options?.length > 0 ? [...initialData.options, '', '', '', ''].slice(0, 4) : ['', '', '', '']),
        correctAnswer: initialData?.correctAnswer || '',
        explanation: initialData?.explanation || '',
        
        // Hidden fields for backend compatibility
        chapter: '',
        subTopic: '',
        bloomLevel: initialData?.bloomLevel || 'Remember',
        marks: initialData?.marks || 1,
        estimatedTime: 2,
        tags: initialData?.tags || [],
        language: 'English',
        status: initialData?.status || 'active',
        negativeMarks: 0,
        source: initialData?.source || 'manual'
    });

    const handleOptionChange = (index, value) => {
        const newOptions = [...formData.options];
        newOptions[index] = value;
        
        // If the correct answer is the old option value and it changes, we might want to update it, 
        // but it's easier to just let the user re-select if they change the text.
        setFormData({ ...formData, options: newOptions });
    };

    const handleGenerateQuestion = async () => {
        if (!formData.subject.trim() || !formData.topic.trim()) {
            return toast.error("Please enter Subject and Topic first.");
        }
        
        setAiLoading(true);
        setActiveAiAction('generate');
        try {
            const payload = {
                subject: formData.subject,
                topic: formData.topic,
                difficulty: formData.difficulty,
                type: formData.type,
                count: 1
            };
            const response = await api.post('/ai/generate', payload);
            const generated = response.data.questions[0];
            
            if (generated) {
                setFormData(prev => ({
                    ...prev,
                    questionText: generated.questionText,
                    options: generated.options?.length === 4 ? generated.options : (generated.options?.length > 0 ? [...generated.options, '', '', '', ''].slice(0, 4) : prev.options),
                    correctAnswer: generated.correctAnswer || '',
                    explanation: generated.explanation || '',
                    source: 'ai'
                }));
                toast.success('Question generated successfully!');
            }
        } catch (error) {
            console.error("Error generating question:", error);
            toast.error(error.response?.data?.msg || "Failed to generate question. Please try again.");
        } finally {
            setAiLoading(false);
            setActiveAiAction(null);
        }
    };

    const handleImproveQuestion = async () => {
        if (!formData.questionText.trim()) return toast.error("Please enter a question first.");
        
        setAiLoading(true);
        setActiveAiAction('improve');
        try {
            const response = await api.post('/ai/improve-question', { questionText: formData.questionText });
            if (response.data.text) {
                setFormData(prev => ({ ...prev, questionText: response.data.text }));
                toast.success('Question improved!');
            }
        } catch (error) {
            toast.error(error.response?.data?.msg || "Failed to improve question.");
        } finally {
            setAiLoading(false);
            setActiveAiAction(null);
        }
    };

    const handleSimplifyQuestion = async () => {
        if (!formData.questionText.trim()) return toast.error("Please enter a question first.");
        
        setAiLoading(true);
        setActiveAiAction('simplify');
        try {
            const response = await api.post('/ai/simplify-question', { questionText: formData.questionText });
            if (response.data.text) {
                setFormData(prev => ({ ...prev, questionText: response.data.text }));
                toast.success('Question simplified!');
            }
        } catch (error) {
            toast.error(error.response?.data?.msg || "Failed to simplify question.");
        } finally {
            setAiLoading(false);
            setActiveAiAction(null);
        }
    };

    const handleGenerateOptions = async () => {
        if (!formData.questionText.trim()) return toast.error("Please enter a question first.");
        if (formData.type !== 'MCQ') return toast.error("Options can only be generated for MCQ type.");
        
        setAiLoading(true);
        setActiveAiAction('options');
        try {
            const response = await api.post('/ai/generate-options', { 
                questionText: formData.questionText,
                subject: formData.subject,
                topic: formData.topic
            });
            if (response.data.options && response.data.options.length === 4) {
                setFormData(prev => ({ 
                    ...prev, 
                    options: response.data.options,
                    correctAnswer: response.data.correctAnswer
                }));
                toast.success('Options generated!');
            }
        } catch (error) {
            toast.error(error.response?.data?.msg || "Failed to generate options.");
        } finally {
            setAiLoading(false);
            setActiveAiAction(null);
        }
    };

    const handleSave = async (e) => {
        if(e) e.preventDefault();
        
        // Strip out HTML tags from question text in case it came from the old rich text editor
        let cleanQuestionText = formData.questionText;
        // Simple HTML strip if it looks like HTML
        if (cleanQuestionText.includes('<') && cleanQuestionText.includes('>')) {
            const temp = document.createElement("div");
            temp.innerHTML = cleanQuestionText;
            cleanQuestionText = temp.textContent || temp.innerText || "";
        }

        if (!cleanQuestionText.trim()) return toast.error('Question text is required');
        if (!formData.subject.trim()) return toast.error('Subject is required');

        if (formData.type === 'MCQ') {
            const filledOptions = formData.options.filter(o => o.trim() !== '');
            if (filledOptions.length < 2) return toast.error('At least 2 options are required for MCQ');
            if (!formData.correctAnswer) return toast.error('Please select the correct answer');
        } else {
            if (!formData.correctAnswer.trim()) return toast.error('Correct Answer is required');
        }

        setIsSaving(true);
        try {
            // Encode custom fields into tags for backward compatibility with db model
            const encodedTags = [
                ...formData.tags,
                `chapter:${formData.chapter}`,
                `subTopic:${formData.subTopic}`,
                `estTime:${formData.estimatedTime}`,
                `language:${formData.language}`,
                `negativeMarks:${formData.negativeMarks}`
            ].filter(t => t && !t.endsWith(':'));

            const payload = new FormData();
            payload.append('questionText', cleanQuestionText);
            payload.append('subject', formData.subject);
            payload.append('topic', formData.topic);
            payload.append('difficulty', formData.difficulty);
            payload.append('type', formData.type);
            payload.append('marks', formData.marks);
            payload.append('bloomLevel', formData.bloomLevel);
            payload.append('explanation', formData.explanation);
            payload.append('status', formData.status);
            payload.append('source', formData.source);
            payload.append('tags', JSON.stringify(encodedTags));

            if (formData.type === 'MCQ') {
                payload.append('options', JSON.stringify(formData.options));
                payload.append('correctAnswer', formData.correctAnswer);
            } else {
                payload.append('correctAnswer', formData.correctAnswer);
            }

            if (editingId) {
                await api.put(`/questions/${editingId}`, payload, { headers: { 'Content-Type': 'multipart/form-data' } });
                toast.success('Question updated successfully!');
            } else {
                await api.post('/questions', payload, { headers: { 'Content-Type': 'multipart/form-data' } });
                toast.success('Question added successfully!');
            }
            
            onClose();
        } catch (err) {
            console.error(err);
            toast.error('Failed to save question.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="w-full min-h-screen bg-gray-50 dark:bg-gray-900 font-sans flex flex-col"
        >
            {/* Header */}
            <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center shadow-sm sticky top-0 z-50">
                <button 
                    onClick={onClose}
                    className="p-2 -ml-2 mr-3 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                    {editingId ? 'Edit Question' : 'Add New Question'}
                </h1>
            </header>

            {/* Main Content Workspace */}
            <div className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 flex flex-col lg:flex-row gap-8">
                
                {/* Left Form Area */}
                <form onSubmit={handleSave} className="flex-1 space-y-6">
                    
                    {/* Top Row: Subject, Topic, Type, Difficulty */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Subject *</label>
                            <input 
                                type="text" 
                                value={formData.subject} 
                                onChange={e => setFormData({...formData, subject: e.target.value})} 
                                className="w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-3 border text-sm" 
                                placeholder="e.g. Physics" 
                                required 
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Topic</label>
                            <input 
                                type="text" 
                                value={formData.topic} 
                                onChange={e => setFormData({...formData, topic: e.target.value})} 
                                className="w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-3 border text-sm" 
                                placeholder="e.g. Thermodynamics" 
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Question Type *</label>
                            <select 
                                value={formData.type} 
                                onChange={e => setFormData({...formData, type: e.target.value})} 
                                className="w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-3 border text-sm"
                            >
                                <option value="MCQ">Multiple Choice</option>
                                <option value="Short Answer">Short Answer</option>
                                <option value="Long Answer">Long Answer</option>
                                <option value="True/False">True / False</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Difficulty</label>
                            <select 
                                value={formData.difficulty} 
                                onChange={e => setFormData({...formData, difficulty: e.target.value})} 
                                className="w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-3 border text-sm"
                            >
                                <option value="Easy">Easy</option>
                                <option value="Medium">Medium</option>
                                <option value="Hard">Hard</option>
                            </select>
                        </div>
                    </div>

                    {/* Question Box */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                        <label className="block text-lg font-bold text-gray-900 dark:text-white mb-3">Question</label>
                        <textarea 
                            value={formData.questionText}
                            onChange={e => setFormData({...formData, questionText: e.target.value})}
                            placeholder="Type your question here..."
                            className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 p-4 text-base min-h-[150px] resize-y outline-none transition-all"
                            required
                        />
                    </div>

                    {/* Options Box (If MCQ) */}
                    {(formData.type === 'MCQ' || formData.type === 'True/False') ? (
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                            <label className="block text-lg font-bold text-gray-900 dark:text-white mb-4">Options</label>
                            
                            <div className="space-y-4 mb-6">
                                {formData.options.map((opt, index) => (
                                    <div key={index} className="flex items-center gap-4">
                                        <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-lg font-bold text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600">
                                            {String.fromCharCode(65 + index)}
                                        </div>
                                        <input 
                                            type="text" 
                                            value={opt} 
                                            onChange={e => handleOptionChange(index, e.target.value)} 
                                            placeholder={`Option ${String.fromCharCode(65 + index)}`}
                                            className="flex-1 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 p-3 outline-none"
                                        />
                                    </div>
                                ))}
                            </div>

                            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Correct Answer *</label>
                                <select 
                                    value={formData.correctAnswer} 
                                    onChange={e => setFormData({...formData, correctAnswer: e.target.value})}
                                    className="w-full max-w-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-3"
                                    required
                                >
                                    <option value="" disabled>Select correct option...</option>
                                    {formData.options.map((opt, index) => (
                                        opt.trim() && <option key={index} value={opt}>Option {String.fromCharCode(65 + index)} ({opt})</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                            <label className="block text-lg font-bold text-gray-900 dark:text-white mb-3">Correct Answer</label>
                            <textarea 
                                value={formData.correctAnswer}
                                onChange={e => setFormData({...formData, correctAnswer: e.target.value})}
                                placeholder="Type the correct answer here..."
                                className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 p-4 text-base min-h-[100px] resize-y outline-none"
                                required
                            />
                        </div>
                    )}

                    {/* Explanation Box */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                        <label className="block text-lg font-bold text-gray-900 dark:text-white mb-3">Explanation (Optional)</label>
                        <textarea 
                            value={formData.explanation}
                            onChange={e => setFormData({...formData, explanation: e.target.value})}
                            placeholder="Explain why the answer is correct..."
                            className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 p-4 text-base min-h-[100px] resize-y outline-none"
                        />
                    </div>

                    {/* Bottom Action Buttons */}
                    <div className="flex justify-end gap-4 pt-4 pb-12">
                        <button 
                            type="button" 
                            onClick={onClose}
                            className="px-8 py-3 rounded-xl font-bold text-gray-600 dark:text-gray-300 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors text-lg"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            disabled={isSaving}
                            className="px-8 py-3 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-md flex items-center gap-2 text-lg disabled:opacity-70"
                        >
                            {isSaving ? <Sparkles className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                            {formData.source === 'ai' ? 'Save to Question Bank' : 'Save Question'}
                        </button>
                    </div>

                </form>

                {/* Right Sidebar - AI Help */}
                <div className="w-full lg:w-80 flex-shrink-0">
                    <div className="bg-indigo-600 rounded-3xl p-6 shadow-xl sticky top-24 text-white">
                        <div className="flex items-center gap-2 mb-6">
                            <Sparkles className="w-6 h-6 text-yellow-300" />
                            <h3 className="text-xl font-bold">AI Help</h3>
                        </div>
                        
                        <div className="space-y-3">
                            <button 
                                type="button" 
                                onClick={handleGenerateQuestion} 
                                disabled={aiLoading} 
                                className="w-full bg-white/10 hover:bg-white/20 border border-white/20 px-4 py-3 rounded-xl text-left font-bold transition-all flex items-center justify-between group disabled:opacity-50"
                            >
                                Generate Question
                                {activeAiAction === 'generate' ? <Sparkles className="w-5 h-5 animate-spin" /> : <ChevronRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-all" />}
                            </button>
                            <button 
                                type="button" 
                                onClick={handleImproveQuestion} 
                                disabled={aiLoading || !formData.questionText} 
                                className="w-full bg-white/10 hover:bg-white/20 border border-white/20 px-4 py-3 rounded-xl text-left font-bold transition-all flex items-center justify-between group disabled:opacity-50"
                            >
                                Improve Question
                                {activeAiAction === 'improve' ? <Sparkles className="w-5 h-5 animate-spin" /> : <ChevronRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-all" />}
                            </button>
                            <button 
                                type="button" 
                                onClick={handleSimplifyQuestion} 
                                disabled={aiLoading || !formData.questionText} 
                                className="w-full bg-white/10 hover:bg-white/20 border border-white/20 px-4 py-3 rounded-xl text-left font-bold transition-all flex items-center justify-between group disabled:opacity-50"
                            >
                                Simplify Question
                                {activeAiAction === 'simplify' ? <Sparkles className="w-5 h-5 animate-spin" /> : <ChevronRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-all" />}
                            </button>
                            <button 
                                type="button" 
                                onClick={handleGenerateOptions} 
                                disabled={aiLoading || formData.type !== 'MCQ'} 
                                className="w-full bg-white/10 hover:bg-white/20 border border-white/20 px-4 py-3 rounded-xl text-left font-bold transition-all flex items-center justify-between group disabled:opacity-50"
                            >
                                Generate Options
                                {activeAiAction === 'options' ? <Sparkles className="w-5 h-5 animate-spin" /> : <ChevronRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-all" />}
                            </button>
                        </div>
                        <p className="mt-6 text-indigo-200 text-sm font-medium">
                            Use AI to quickly draft questions, rewrite existing text, or generate plausible distractors for your options.
                        </p>
                    </div>
                </div>

            </div>
        </motion.div>
    );
};

export default AddQuestionWorkspace;
