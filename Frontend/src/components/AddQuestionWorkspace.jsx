import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ChevronLeft, Save, UploadCloud, CheckCircle2, Play, 
    Sparkles, RefreshCw, Eye, Edit3, Image as ImageIcon, 
    Link as LinkIcon, List, Type, Heading, Code, 
    AlignLeft, AlignCenter, AlignRight, Underline, Bold, Italic, 
    MoreHorizontal, Move, GripVertical, Plus, Minus,
    Activity, Clock, FileText, Settings, X, Tag, BookOpen, Layers,
    Check, ChevronRight
} from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../utils/axiosConfig';

const AddQuestionWorkspace = ({ onClose, editingId, initialData }) => {
    // Basic State
    const [activeTab, setActiveTab] = useState('edit'); // edit | preview
    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState(null);
    const [aiLoading, setAiLoading] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        subject: initialData?.subject || '',
        topic: initialData?.topic || '',
        chapter: '',
        subTopic: '',
        type: initialData?.type || 'MCQ',
        difficulty: initialData?.difficulty || 'Medium',
        bloomLevel: initialData?.bloomLevel || 'Remember',
        marks: initialData?.marks || 1,
        estimatedTime: 2,
        tags: initialData?.tags || [],
        language: 'English',
        status: initialData?.status || 'active',
        questionText: initialData?.questionText || '',
        options: initialData?.options?.length > 0 ? initialData.options : ['', '', '', ''],
        correctAnswer: initialData?.correctAnswer || '',
        explanation: initialData?.explanation || '',
        negativeMarks: 0
    });

    const [currentTag, setCurrentTag] = useState('');

    // Rich Text Editor Ref
    const editorRef = useRef(null);

    // Set editor initial content safely
    useEffect(() => {
        if (editorRef.current && formData.questionText && editorRef.current.innerHTML !== formData.questionText) {
            editorRef.current.innerHTML = formData.questionText;
        }
    }, []);

    // Auto-save simulation
    useEffect(() => {
        const timer = setTimeout(() => {
            if (formData.questionText || formData.subject) {
                setLastSaved(new Date());
            }
        }, 3000);
        return () => clearTimeout(timer);
    }, [formData]);

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                handleSave('draft');
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [formData]);

    const handleExecCommand = (command, value = null) => {
        document.execCommand(command, false, value);
        if (editorRef.current) {
            setFormData({ ...formData, questionText: editorRef.current.innerHTML });
        }
    };

    const handleAddTag = (e) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            if (currentTag.trim() && !formData.tags.includes(currentTag.trim())) {
                setFormData({ ...formData, tags: [...formData.tags, currentTag.trim()] });
            }
            setCurrentTag('');
        }
    };

    const removeTag = (tagToRemove) => {
        setFormData({ ...formData, tags: formData.tags.filter(t => t !== tagToRemove) });
    };

    const handleOptionChange = (index, value) => {
        const newOptions = [...formData.options];
        newOptions[index] = value;
        setFormData({ ...formData, options: newOptions });
    };



    const simulateAiAction = (actionName) => {
        setAiLoading(true);
        toast.info(`${actionName} in progress...`);
        setTimeout(() => {
            setAiLoading(false);
            if (actionName === 'Simplify Question') {
                setFormData(prev => ({ 
                    ...prev, 
                    questionText: prev.questionText + '<br/><br/><i>[AI: Simplified Version]</i>' 
                }));
                if (editorRef.current) editorRef.current.innerHTML += '<br/><br/><i>[AI: Simplified Version]</i>';
            }
            toast.success(`${actionName} completed!`);
        }, 2000);
    };

    const calculateStats = () => {
        const text = formData.questionText.replace(/<[^>]*>?/gm, ''); // strip HTML
        const words = text.trim() ? text.trim().split(/\s+/).length : 0;
        const chars = text.length;
        const readTime = Math.max(1, Math.ceil(words / 200)); // 200 wpm
        
        let difficultyScore = 50;
        if (formData.difficulty === 'Easy') difficultyScore = 20;
        if (formData.difficulty === 'Hard') difficultyScore = 80;

        return { words, chars, readTime, difficultyScore };
    };

    const stats = calculateStats();

    const handleSave = async (status = 'active') => {
        if (!formData.questionText.trim()) return toast.error('Question text is required');
        if (!formData.subject.trim()) return toast.error('Subject is required');

        if (formData.type === 'MCQ') {
            const filledOptions = formData.options.filter(o => o.trim() !== '');
            if (filledOptions.length < 2) return toast.error('At least 2 options are required for MCQ');
            if (!formData.correctAnswer && status === 'active') return toast.error('Please select the correct answer');
        } else {
            if (!formData.correctAnswer.trim() && status === 'active') return toast.error('Answer / Rubric is required');
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
            payload.append('questionText', formData.questionText);
            payload.append('subject', formData.subject);
            payload.append('topic', formData.topic);
            payload.append('difficulty', formData.difficulty);
            payload.append('type', formData.type);
            payload.append('marks', formData.marks);
            payload.append('bloomLevel', formData.bloomLevel);
            payload.append('explanation', formData.explanation);
            payload.append('status', status);
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
                toast.success(status === 'draft' ? 'Draft saved successfully!' : 'Question published successfully!');
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
            className="w-full min-h-[calc(100vh-100px)] bg-gray-50 dark:bg-zinc-950 flex flex-col font-sans"
        >
            {/* Top Action Bar */}
            <header className="sticky top-0 z-50 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-zinc-800 px-6 py-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={onClose}
                        className="p-2 -ml-2 rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
                            {editingId ? 'Edit Question' : 'Add New Question'}
                        </h1>
                        <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 mt-0.5">
                            {lastSaved ? (
                                <><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Auto-saved at {lastSaved.toLocaleTimeString()}</>
                            ) : (
                                <><RefreshCw className="w-3.5 h-3.5 animate-spin opacity-50" /> Unsaved changes</>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex bg-gray-100 dark:bg-zinc-800 p-1 rounded-xl mr-2">
                        <button 
                            onClick={() => setActiveTab('edit')}
                            className={`px-4 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'edit' ? 'bg-white dark:bg-zinc-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
                        >
                            <Edit3 className="w-4 h-4" /> Edit
                        </button>
                        <button 
                            onClick={() => setActiveTab('preview')}
                            className={`px-4 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'preview' ? 'bg-white dark:bg-zinc-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
                        >
                            <Eye className="w-4 h-4" /> Preview
                        </button>
                    </div>

                    <button 
                        onClick={() => handleSave('draft')}
                        disabled={isSaving}
                        className="px-4 py-2 rounded-xl text-sm font-bold text-gray-700 dark:text-gray-300 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-all shadow-sm flex items-center gap-2"
                    >
                        <Save className="w-4 h-4" /> Save Draft
                    </button>
                    <button 
                        onClick={() => handleSave('active')}
                        disabled={isSaving}
                        className="px-6 py-2 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 flex items-center gap-2"
                    >
                        <UploadCloud className="w-4 h-4" /> Publish
                    </button>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
                {/* Main Content Area */}
                <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
                    <div className="max-w-4xl mx-auto space-y-8">
                        
                        {/* Tab Content */}
                        {activeTab === 'edit' ? (
                            <motion.div 
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                className="space-y-8"
                            >
                                {/* Metadata Section */}
                                <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-gray-200 dark:border-zinc-800 shadow-sm">
                                    <div className="flex items-center gap-2 mb-6 text-gray-900 dark:text-white font-bold">
                                        <Layers className="w-5 h-5 text-indigo-500" /> 
                                        <h2>Question Information</h2>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                        {/* Row 1 */}
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">Subject *</label>
                                            <input type="text" value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} className="w-full bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm font-medium dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all" placeholder="e.g. Physics" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">Topic</label>
                                            <input type="text" value={formData.topic} onChange={e => setFormData({...formData, topic: e.target.value})} className="w-full bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm font-medium dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all" placeholder="e.g. Thermodynamics" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">Chapter</label>
                                            <input type="text" value={formData.chapter} onChange={e => setFormData({...formData, chapter: e.target.value})} className="w-full bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm font-medium dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all" placeholder="e.g. Chapter 4" />
                                        </div>
                                        
                                        {/* Row 2 */}
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">Type *</label>
                                            <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm font-medium dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all cursor-pointer">
                                                <option value="MCQ">Multiple Choice</option>
                                                <option value="Short Answer">Short Answer</option>
                                                <option value="Long Answer">Long Answer</option>
                                                <option value="True/False">True / False</option>
                                            </select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">Difficulty</label>
                                            <select value={formData.difficulty} onChange={e => setFormData({...formData, difficulty: e.target.value})} className="w-full bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm font-medium dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all cursor-pointer">
                                                <option value="Easy">Easy</option><option value="Medium">Medium</option><option value="Hard">Hard</option>
                                            </select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">Bloom's Taxonomy</label>
                                            <select value={formData.bloomLevel} onChange={e => setFormData({...formData, bloomLevel: e.target.value})} className="w-full bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm font-medium dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all cursor-pointer">
                                                <option value="Remember">Remember</option><option value="Understand">Understand</option><option value="Apply">Apply</option>
                                                <option value="Analyze">Analyze</option><option value="Evaluate">Evaluate</option><option value="Create">Create</option>
                                            </select>
                                        </div>

                                        {/* Row 3 */}
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">Marks / Est. Time</label>
                                            <div className="flex gap-2">
                                                <input type="number" min="1" value={formData.marks} onChange={e => setFormData({...formData, marks: e.target.value})} className="w-1/2 bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm font-medium dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/50" placeholder="Marks" title="Marks" />
                                                <input type="number" min="1" value={formData.estimatedTime} onChange={e => setFormData({...formData, estimatedTime: e.target.value})} className="w-1/2 bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm font-medium dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/50" placeholder="Min" title="Estimated Time (mins)" />
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">Language</label>
                                            <select value={formData.language} onChange={e => setFormData({...formData, language: e.target.value})} className="w-full bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm font-medium dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all cursor-pointer">
                                                <option value="English">English</option><option value="Spanish">Spanish</option><option value="French">French</option>
                                            </select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">Tags</label>
                                            <div className="relative">
                                                <input 
                                                    type="text" 
                                                    value={currentTag} 
                                                    onChange={e => setCurrentTag(e.target.value)}
                                                    onKeyDown={handleAddTag}
                                                    className="w-full bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-xl pl-9 pr-4 py-2.5 text-sm font-medium dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/50" 
                                                    placeholder="Press Enter to add..." 
                                                />
                                                <Tag className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Tags Display */}
                                    {formData.tags.length > 0 && (
                                        <div className="mt-4 flex flex-wrap gap-2">
                                            {formData.tags.map(tag => (
                                                <span key={tag} className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-lg text-xs font-bold border border-indigo-100 dark:border-indigo-800/50">
                                                    {tag}
                                                    <button type="button" onClick={() => removeTag(tag)} className="hover:text-indigo-900 dark:hover:text-indigo-100"><X className="w-3 h-3" /></button>
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Rich Text Editor */}
                                <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-gray-200 dark:border-zinc-800 shadow-sm overflow-hidden flex flex-col">
                                    <div className="bg-gray-50 dark:bg-zinc-950/50 border-b border-gray-200 dark:border-zinc-800 p-3 flex flex-wrap items-center gap-2">
                                        <div className="flex bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg overflow-hidden shadow-sm">
                                            <button type="button" onClick={() => handleExecCommand('bold')} className="p-2.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"><Bold className="w-4 h-4" /></button>
                                            <button type="button" onClick={() => handleExecCommand('italic')} className="p-2.5 border-l border-gray-200 dark:border-zinc-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"><Italic className="w-4 h-4" /></button>
                                            <button type="button" onClick={() => handleExecCommand('underline')} className="p-2.5 border-l border-gray-200 dark:border-zinc-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"><Underline className="w-4 h-4" /></button>
                                        </div>
                                        <div className="w-px h-6 bg-gray-200 dark:bg-zinc-800 mx-1"></div>
                                        <div className="flex bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg overflow-hidden shadow-sm">
                                            <button type="button" onClick={() => handleExecCommand('insertUnorderedList')} className="p-2.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"><List className="w-4 h-4" /></button>
                                            <button type="button" onClick={() => handleExecCommand('justifyLeft')} className="p-2.5 border-l border-gray-200 dark:border-zinc-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"><AlignLeft className="w-4 h-4" /></button>
                                            <button type="button" onClick={() => handleExecCommand('justifyCenter')} className="p-2.5 border-l border-gray-200 dark:border-zinc-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"><AlignCenter className="w-4 h-4" /></button>
                                        </div>
                                        <div className="w-px h-6 bg-gray-200 dark:bg-zinc-800 mx-1"></div>
                                        <div className="flex bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg overflow-hidden shadow-sm">
                                            <button type="button" onClick={() => toast.info('Image upload mocked')} className="p-2.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"><ImageIcon className="w-4 h-4" /></button>
                                            <button type="button" onClick={() => toast.info('Link insertion mocked')} className="p-2.5 border-l border-gray-200 dark:border-zinc-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"><LinkIcon className="w-4 h-4" /></button>
                                            <button type="button" onClick={() => handleExecCommand('formatBlock', 'PRE')} className="p-2.5 border-l border-gray-200 dark:border-zinc-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"><Code className="w-4 h-4" /></button>
                                        </div>
                                    </div>
                                    <div 
                                        ref={editorRef}
                                        contentEditable
                                        onInput={(e) => setFormData({...formData, questionText: e.currentTarget.innerHTML})}
                                        className="p-6 min-h-[250px] outline-none text-gray-900 dark:text-white prose dark:prose-invert max-w-none focus:ring-inset focus:ring-2 focus:ring-indigo-500/20 transition-all bg-white dark:bg-zinc-900 rounded-b-3xl"
                                        placeholder="Type your question content here..."
                                        style={{ emptyCells: 'show' }}
                                    />
                                </div>

                                {/* Options / Answer Section */}
                                <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-gray-200 dark:border-zinc-800 shadow-sm">
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center gap-2 text-gray-900 dark:text-white font-bold">
                                            <CheckCircle2 className="w-5 h-5 text-indigo-500" /> 
                                            <h2>{formData.type === 'MCQ' ? 'Options & Marking' : 'Answer Key & Rubric'}</h2>
                                        </div>
                                    </div>

                                    {formData.type === 'MCQ' || formData.type === 'True/False' ? (
                                        <div className="space-y-4">
                                            {formData.options.map((opt, i) => (
                                                <div key={i} className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${formData.correctAnswer === opt && opt ? 'border-indigo-500 bg-indigo-50/20 dark:bg-indigo-900/10' : 'border-gray-100 dark:border-zinc-800 hover:border-gray-200 dark:hover:border-zinc-700'}`}>
                                                    <div className="cursor-grab text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><GripVertical className="w-5 h-5" /></div>
                                                    
                                                    <button 
                                                        type="button"
                                                        onClick={() => setFormData({...formData, correctAnswer: opt})}
                                                        className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all flex-shrink-0 ${formData.correctAnswer === opt && opt ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-gray-300 dark:border-zinc-600 text-transparent hover:border-indigo-400'}`}
                                                    >
                                                        <Check className="w-4 h-4" strokeWidth={3} />
                                                    </button>
                                                    
                                                    <div className="flex-1 bg-gray-50 dark:bg-zinc-950 rounded-xl border border-gray-200 dark:border-zinc-800 px-4 py-3 flex items-center gap-3">
                                                        <span className="text-xs font-bold text-gray-400 w-5">{String.fromCharCode(65+i)}.</span>
                                                        <input 
                                                            type="text" 
                                                            value={opt} 
                                                            onChange={(e) => handleOptionChange(i, e.target.value)} 
                                                            className="flex-1 bg-transparent outline-none text-sm font-medium dark:text-white"
                                                            placeholder={`Option ${i+1}`}
                                                        />
                                                        <button type="button" className="text-gray-400 hover:text-indigo-600 transition-colors"><ImageIcon className="w-4 h-4" /></button>
                                                    </div>
                                                </div>
                                            ))}
                                            
                                            {formData.type === 'MCQ' && (
                                                <button 
                                                    type="button"
                                                    onClick={() => setFormData({...formData, options: [...formData.options, '']})}
                                                    className="flex items-center gap-2 text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 px-4 py-3 rounded-xl transition-colors w-full justify-center border border-dashed border-indigo-200 dark:border-indigo-800"
                                                >
                                                    <Plus className="w-4 h-4" /> Add Option
                                                </button>
                                            )}
                                        </div>
                                    ) : (
                                        <textarea 
                                            value={formData.correctAnswer} 
                                            onChange={e => setFormData({...formData, correctAnswer: e.target.value})}
                                            className="w-full bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-2xl p-5 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/50 min-h-[150px] dark:text-white"
                                            placeholder="Provide the exact answer or marking rubric here..."
                                        />
                                    )}

                                    <div className="mt-8 space-y-4">
                                        <div>
                                            <label className="text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider mb-2 block">Explanation (Optional)</label>
                                            <textarea 
                                                value={formData.explanation} 
                                                onChange={e => setFormData({...formData, explanation: e.target.value})}
                                                className="w-full bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm font-medium dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/50 min-h-[80px]"
                                                placeholder="Explain why the answer is correct..."
                                            />
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <label className="text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">Negative Marks</label>
                                            <input 
                                                type="number" step="0.25" min="0" 
                                                value={formData.negativeMarks} 
                                                onChange={e => setFormData({...formData, negativeMarks: e.target.value})}
                                                className="w-24 bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm font-medium dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/50"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ) : (
                            /* Preview Tab */
                            <motion.div 
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                className="bg-white dark:bg-zinc-900 rounded-3xl p-8 border border-gray-200 dark:border-zinc-800 shadow-xl max-w-3xl mx-auto"
                            >
                                <div className="flex justify-between items-start mb-8 border-b border-gray-100 dark:border-zinc-800 pb-6">
                                    <div>
                                        <h3 className="text-sm font-bold text-indigo-600 dark:text-indigo-400 mb-1">{formData.subject} • {formData.topic}</h3>
                                        <div className="flex gap-2">
                                            <span className="px-2.5 py-1 bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-300 text-xs font-bold rounded-md">{formData.difficulty}</span>
                                            <span className="px-2.5 py-1 bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-300 text-xs font-bold rounded-md">{formData.marks} Marks</span>
                                        </div>
                                    </div>
                                    <span className="text-gray-400 text-sm font-medium">Q.1</span>
                                </div>

                                <div className="prose dark:prose-invert max-w-none mb-10 text-gray-900 dark:text-gray-100 font-medium leading-relaxed text-lg" dangerouslySetInnerHTML={{ __html: formData.questionText || '<span class="text-gray-400 italic">Question text will appear here...</span>' }} />

                                {formData.type === 'MCQ' || formData.type === 'True/False' ? (
                                    <div className="space-y-3">
                                        {formData.options.filter(o => o).map((opt, i) => (
                                            <div key={i} className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 dark:border-zinc-700 hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors cursor-pointer bg-gray-50/50 dark:bg-zinc-800/50">
                                                <div className="w-8 h-8 rounded-lg bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 flex items-center justify-center font-bold text-gray-600 dark:text-gray-300 text-sm shadow-sm">{String.fromCharCode(65+i)}</div>
                                                <span className="text-gray-800 dark:text-gray-200 font-medium">{opt}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="w-full h-32 bg-gray-50 dark:bg-zinc-800/50 rounded-xl border-2 border-dashed border-gray-200 dark:border-zinc-700 flex items-center justify-center">
                                        <span className="text-gray-400 font-medium text-sm">Student answer area</span>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </div>
                </div>

                {/* Right Sidebar */}
                <div className="w-80 bg-white/50 dark:bg-zinc-900/50 border-l border-gray-200 dark:border-zinc-800 p-6 flex flex-col gap-6 overflow-y-auto backdrop-blur-xl">
                    
                    {/* AI Assistant Panel */}
                    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl p-5 shadow-lg shadow-indigo-500/20 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 text-white mb-4">
                                <Sparkles className="w-5 h-5" />
                                <h3 className="font-bold">AI Assistant</h3>
                            </div>
                            
                            <div className="space-y-2">
                                <button type="button" onClick={() => simulateAiAction('Improve Question')} disabled={aiLoading} className="w-full text-left px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-colors border border-white/10 flex justify-between items-center group">
                                    Improve Question <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </button>
                                <button type="button" onClick={() => simulateAiAction('Simplify Question')} disabled={aiLoading} className="w-full text-left px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-colors border border-white/10 flex justify-between items-center group">
                                    Simplify Content <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </button>
                                <button type="button" onClick={() => simulateAiAction('Grammar Check')} disabled={aiLoading} className="w-full text-left px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-colors border border-white/10 flex justify-between items-center group">
                                    Grammar Check <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </button>
                                <button type="button" onClick={() => simulateAiAction('Generate Distractors')} disabled={aiLoading} className="w-full text-left px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-colors border border-white/10 flex justify-between items-center group">
                                    Generate Distractors <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Statistics Panel */}
                    <div className="bg-white dark:bg-zinc-900 rounded-3xl p-5 border border-gray-200 dark:border-zinc-800 shadow-sm">
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <Activity className="w-4 h-4 text-indigo-500" /> Content Statistics
                        </h3>
                        
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Word Count</span>
                                <span className="text-sm font-bold text-gray-900 dark:text-white">{stats.words}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Read Time</span>
                                <span className="text-sm font-bold text-gray-900 dark:text-white">~{stats.readTime} min</span>
                            </div>
                            
                            <div className="pt-3 border-t border-gray-100 dark:border-zinc-800">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Difficulty Score</span>
                                    <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{stats.difficultyScore}/100</span>
                                </div>
                                <div className="h-1.5 w-full bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                    <div 
                                        className={`h-full transition-all duration-1000 ${stats.difficultyScore < 40 ? 'bg-emerald-500' : stats.difficultyScore < 70 ? 'bg-yellow-500' : 'bg-red-500'}`} 
                                        style={{ width: `${stats.difficultyScore}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Metadata summary */}
                    <div className="bg-indigo-50 dark:bg-indigo-900/10 rounded-3xl p-5 border border-indigo-100 dark:border-indigo-900/30">
                         <div className="flex items-start gap-3">
                            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-xl">
                                <BookOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-1">Academic Standard</h4>
                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 leading-relaxed">
                                    This question aligns with the <strong className="text-indigo-600 dark:text-indigo-400">{formData.bloomLevel}</strong> level of Bloom's Taxonomy.
                                </p>
                            </div>
                         </div>
                    </div>

                </div>
            </div>
        </motion.div>
    );
};

export default AddQuestionWorkspace;
