import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams, useBlocker, useLocation } from 'react-router-dom';
import api from '../utils/axiosConfig';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    AlertTriangle, Plus, Layout, ArrowRight, ArrowLeft, Save, Sparkles, Check, X, BarChart2
} from 'lucide-react';

// Components
import Stepper from '../components/Stepper';
import SectionCard from '../components/SectionCard';
import ExamPreview from '../components/ExamPreview';
import BlueprintAnalysisModal from '../components/BlueprintAnalysisModal';
import InstitutionCombobox from '../components/InstitutionCombobox';
import NumericInput from '../components/NumericInput';

// Hooks
import { useExamDraft, isDraftMeaningful } from '../hooks/useExamDraft';
import { useNotifications } from '../context/NotificationsContext';

const GenerateExam = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const editId = searchParams.get('editId');
    const location = useLocation();

    const [loading, setLoading] = useState(false);
    
    // Draft Hook
    const {
        draftData: formData,
        updateDraft,
        saveDraft,
        restoreDraft,
        clearDraft,
        markDraftAsResumed,
        lastSavedTime,
        isSaving,
        hasUnsavedChanges,
        hasExistingDraft
    } = useExamDraft();

    const { addNotification } = useNotifications();

    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                saveDraft(true, false);
                addNotification({
                    type: 'success',
                    title: 'Draft Saved',
                    message: 'Your progress has been manually saved.'
                });
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [saveDraft, addNotification]);

    const currentStep = formData.currentStep || 1;
    const setCurrentStep = (step) => updateDraft({ currentStep: step });

    // Dropdown Data
    const [subjectsList, setSubjectsList] = useState([]);
    const [topicsBySubject, setTopicsBySubject] = useState({});
    const [institutionOptions, setInstitutionOptions] = useState([
        'Springfield High School', 
        'Delhi Public School', 
        "St. Xavier's College", 
        'National Public School', 
        'Kendriya Vidyalaya'
    ]);

    // Modal states
    const [showResumeModal, setShowResumeModal] = useState(false);
    const [showLeaveModal, setShowLeaveModal] = useState(false);
    const [isRestoring, setIsRestoring] = useState(false);
    const [showRestoreBanner, setShowRestoreBanner] = useState(false);
    const [showPostGenerateModal, setShowPostGenerateModal] = useState(false);
    const [showBlueprintModal, setShowBlueprintModal] = useState(false);
    const [generatedExamId, setGeneratedExamId] = useState(null);

    // Fetch master data on mount
    useEffect(() => {
        fetchInitialData();
    }, []);

    // Draft modal check on mount
    useEffect(() => {
        if (!editId && hasExistingDraft) {
            setShowResumeModal(true);
        }
    }, [editId, hasExistingDraft]);

    // Navigation Protection
    const blocker = useBlocker(
        ({ currentLocation, nextLocation }) =>
            hasUnsavedChanges &&
            currentLocation.pathname !== nextLocation.pathname &&
            !nextLocation.pathname.startsWith('/exams/')
    );

    useEffect(() => {
        if (blocker.state === 'blocked') {
            setShowLeaveModal(true);
        }
    }, [blocker.state]);

    useEffect(() => {
        const handleBeforeUnload = (e) => {
            if (hasUnsavedChanges) {
                e.preventDefault();
                e.returnValue = ''; // Standard browser prompt
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [hasUnsavedChanges]);

    // Accessibility: Escape key closes modals
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                if (showLeaveModal) {
                    setShowLeaveModal(false);
                    blocker.reset?.();
                } else if (showResumeModal) {
                    handleStartNew();
                } else if (showPostGenerateModal) {
                    handlePostGenerateAction(false); // Default to discard on escape
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [showLeaveModal, showResumeModal, showPostGenerateModal, blocker]);


    const fetchInitialData = async () => {
        try {
            const [qRes, instRes] = await Promise.all([
                api.get('/questions', { params: { limit: 10000 } }),
                api.get('/settings/institution').catch(() => ({ data: null }))
            ]);
            
            const questions = qRes.data.questions || [];
            const uniqueSubjects = [...new Set(questions.map(q => q.subject))];
            setSubjectsList(uniqueSubjects);
            
            const topicsMap = {};
            questions.forEach(q => {
                if (!topicsMap[q.subject]) topicsMap[q.subject] = new Set();
                if (q.topic) topicsMap[q.subject].add(q.topic);
            });
            Object.keys(topicsMap).forEach(k => { topicsMap[k] = [...topicsMap[k]]; });
            setTopicsBySubject(topicsMap);

            if (editId) {
                const examRes = await api.get(`/exams/${editId}`);
                const exam = examRes.data;
                const subjectsArr = Array.isArray(exam.subject) ? exam.subject : exam.subject ? exam.subject.split(',').map(s=>s.trim()) : [];
                updateDraft({
                    selectedSubject: subjectsArr.length > 0 ? subjectsArr[0] : '',
                    examTitle: exam.examTitle,
                    institutionName: exam.collegeName || exam.institutionName || '',
                    department: exam.department || '',
                    courseCode: exam.courseCode || '',
                    selectedTopics: exam.selectedTopics || {},
                    duration: exam.duration || 180,
                    totalMarks: exam.totalMarks || 100,
                    blueprint: exam.blueprint || [],
                    currentStep: 1
                }, true);
            } else if (instRes.data && !hasExistingDraft && !isDraftMeaningful(formData)) {
                // Only pre-fill defaults if we aren't loading a draft
                const defaults = instRes.data;
                updateDraft({
                    institutionName: defaults.institutionName || formData.institutionName,
                    department: defaults.department || formData.department,
                    examTitle: defaults.defaultExamTitle || formData.examTitle
                }, true);
                
                if (defaults.institutionName) {
                    setInstitutionOptions(prev => {
                        if (!prev.includes(defaults.institutionName)) {
                            return [defaults.institutionName, ...prev];
                        }
                        return prev;
                    });
                }
            }
        } catch (err) {
            console.error('Fetch error:', err);
        }
    };

    const handleChange = (field, value) => {
        updateDraft({ [field]: value });
    };

    const handleTopicToggle = (topic) => {
        const sub = formData.selectedSubject;
        if (!sub) return;
        const curTopics = formData.selectedTopics[sub] || [];
        const newTopics = curTopics.includes(topic) 
            ? curTopics.filter(t => t !== topic)
            : [...curTopics, topic];
        handleChange('selectedTopics', { ...formData.selectedTopics, [sub]: newTopics });
    };

    // --- Section Handlers ---
    const addSection = () => {
        const newSec = {
            sectionName: `Section ${String.fromCharCode(65 + formData.blueprint.length)}`,
            type: 'MCQ',
            difficulty: 'Medium',
            questionCount: 5,
            optionalQuestions: '',
            marksPerQuestion: 1,
            topics: ''
        };
        handleChange('blueprint', [...formData.blueprint, newSec]);
    };

    const updateSection = (index, updatedSection) => {
        const newBlueprint = [...formData.blueprint];
        newBlueprint[index] = updatedSection;
        handleChange('blueprint', newBlueprint);
    };

    const deleteSection = (index) => {
        handleChange('blueprint', formData.blueprint.filter((_, i) => i !== index));
    };

    const moveSection = (index, direction) => {
        if (direction === 'up' && index > 0) {
            const newBp = [...formData.blueprint];
            [newBp[index - 1], newBp[index]] = [newBp[index], newBp[index - 1]];
            handleChange('blueprint', newBp);
        } else if (direction === 'down' && index < formData.blueprint.length - 1) {
            const newBp = [...formData.blueprint];
            [newBp[index + 1], newBp[index]] = [newBp[index], newBp[index + 1]];
            handleChange('blueprint', newBp);
        }
    };

    const duplicateSection = (index) => {
        const secToCopy = { ...formData.blueprint[index], sectionName: `${formData.blueprint[index].sectionName} (Copy)` };
        const newBp = [...formData.blueprint];
        newBp.splice(index + 1, 0, secToCopy);
        handleChange('blueprint', newBp);
    };

    // --- Stats Calculation ---
    const stats = useMemo(() => {
        let qCount = 0;
        let totalM = 0;
        formData.blueprint.forEach(s => {
            qCount += Number(s.questionCount) || 0;
            totalM += (Number(s.questionCount) || 0) * (Number(s.marksPerQuestion) || 0);
        });
        return { qCount, totalM, sections: formData.blueprint.length };
    }, [formData.blueprint]);

    useEffect(() => {
        if (formData.totalMarks !== stats.totalM) {
            handleChange('totalMarks', stats.totalM);
        }
    }, [stats.totalM]);

    // --- Navigation & Validation UX ---
    const highlightError = (id, message) => {
        const el = document.getElementById(id);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.focus();
            el.classList.add('ring-2', 'ring-red-500', 'border-red-500');
            setTimeout(() => el.classList.remove('ring-2', 'ring-red-500', 'border-red-500'), 3000);
        }
        toast.error(message);
    };

    const handleNext = () => {
        if (currentStep === 1) {
            if (!formData.institutionName) return highlightError('input-institution', "Institution is required.");
            if (!formData.examTitle) return highlightError('input-examTitle', "Paper Title is required.");
            if (!formData.selectedSubject) return highlightError('input-subject', "Subject is required.");
            if (!formData.duration || formData.duration <= 0) return highlightError('input-duration', "Valid duration is required.");
            setCurrentStep(2);
        } else if (currentStep === 2) {
            if (formData.blueprint.length === 0) {
                toast.error("Please add at least one section.");
                return;
            }
            const invalidIndex = formData.blueprint.findIndex(s => !s.sectionName || !s.questionCount || !s.marksPerQuestion);
            if (invalidIndex !== -1) {
                if (!formData.blueprint[invalidIndex].sectionName) {
                    highlightError(`section-name-${invalidIndex}`, "Section Name is required.");
                } else {
                    toast.error(`Please fill in all required fields for Section ${invalidIndex + 1}.`);
                }
                return;
            }
            setCurrentStep(3);
        }
    };

    const handleGenerate = async () => {
        if (loading) return;
        setLoading(true);
        try {
            const payload = {
                ...formData,
                collegeName: formData.institutionName,
                subject: formData.selectedSubject,
                difficultyMix: { easy: 30, medium: 50, hard: 20 }
            };
            const res = await api.post('/exams/generate', payload);
            setGeneratedExamId(res.data._id);
            setShowPostGenerateModal(true);
        } catch (err) {
            toast.error(err.response?.data?.msg || 'Failed to generate exam');
        } finally {
            setLoading(false);
        }
    };

    const handlePostGenerateAction = (keepDraft) => {
        if (!keepDraft) {
            clearDraft();
            addNotification({
                type: 'info',
                title: 'Draft Deleted',
                message: 'The draft has been discarded.'
            });
        } else {
            markDraftAsResumed();
            addNotification({
                type: 'success',
                title: 'Draft Kept',
                message: 'The draft has been saved for future use.'
            });
        }
        setShowPostGenerateModal(false);
        addNotification({
            type: 'success',
            title: 'Exam Generated',
            message: 'Your exam paper was generated successfully.'
        });
        toast.success('Exam generated successfully!');
        navigate(`/exams/${generatedExamId}`);
    };

    const handleResumeDraft = () => {
        setIsRestoring(true);
        setShowResumeModal(false);
        
        setTimeout(() => {
            const success = restoreDraft();
            setIsRestoring(false);
            if (success) {
                setShowRestoreBanner(true);
                setTimeout(() => setShowRestoreBanner(false), 5000);
            }
        }, 800); // Simulate loading for smoother UX
    };

    const handleStartNew = () => {
        clearDraft();
        setShowResumeModal(false);
    };

    // --- Renderers ---

    if (isRestoring) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50/50">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                    <p className="text-gray-600 font-medium">Restoring your draft...</p>
                </div>
            </div>
        );
    }

    const renderStep1 = () => (
        <motion.div 
            key="step1"
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}
            className="max-w-[850px] mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-8"
        >
            <div className="border-b border-gray-100 pb-4">
                <h2 className="text-2xl font-bold text-gray-900">Basic Information</h2>
                <p className="text-gray-500 text-sm mt-1">Provide the core details to format your question paper header.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-gray-700 mb-2">Institution / School Name *</label>
                    <InstitutionCombobox 
                        id="input-institution"
                        value={formData.institutionName}
                        onChange={(val) => handleChange('institutionName', val)}
                        options={institutionOptions}
                    />
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Paper Title *</label>
                    <input 
                        id="input-examTitle"
                        type="text" 
                        placeholder="e.g. Mid Term Examination"
                        value={formData.examTitle}
                        onChange={(e) => handleChange('examTitle', e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 font-medium outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    />
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Board / University</label>
                    <input 
                        id="input-department"
                        type="text" 
                        placeholder="e.g. CBSE, ICSE, State Board"
                        value={formData.department}
                        onChange={(e) => handleChange('department', e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 font-medium outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    />
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Class / Grade</label>
                    <input 
                        id="input-courseCode"
                        type="text" 
                        placeholder="e.g. Class 10, Grade 12"
                        value={formData.courseCode}
                        onChange={(e) => handleChange('courseCode', e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 font-medium outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    />
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Subject Name *</label>
                    <select 
                        id="input-subject"
                        value={formData.selectedSubject}
                        onChange={(e) => handleChange('selectedSubject', e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 font-medium outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none"
                    >
                        <option value="" disabled>Select a subject</option>
                        {subjectsList.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>

                <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-gray-700 mb-2">Topics / Chapters (Optional)</label>
                    {formData.selectedSubject ? (
                        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                            <div className="flex flex-wrap gap-2">
                                {(topicsBySubject[formData.selectedSubject] || []).length > 0 ? (
                                    topicsBySubject[formData.selectedSubject].map(t => {
                                        const isSelected = (formData.selectedTopics[formData.selectedSubject] || []).includes(t);
                                        return (
                                            <button 
                                                key={t} type="button"
                                                onClick={() => handleTopicToggle(t)}
                                                className={`px-4 py-2 text-sm font-bold rounded-lg border transition-all flex items-center gap-2 ${
                                                    isSelected ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white border-gray-300 text-gray-600 hover:border-indigo-400 hover:text-indigo-600'
                                                }`}
                                            >
                                                {t} {isSelected && <Check className="w-3.5 h-3.5" />}
                                            </button>
                                        );
                                    })
                                ) : (
                                    <p className="text-sm text-gray-500 italic py-2">No specific topics found for this subject. AI will draw from the entire syllabus.</p>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center">
                            <p className="text-sm text-gray-500 italic">Please select a subject first to view its topics.</p>
                        </div>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Time Duration (Minutes) *</label>
                    <NumericInput 
                        id="input-duration"
                        min={1}
                        placeholder="e.g. 180"
                        value={formData.duration}
                        onChange={(val) => handleChange('duration', val)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 font-medium outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    />
                </div>

                <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-gray-700 mb-2">General Instructions (Optional)</label>
                    <textarea 
                        id="input-instructions"
                        placeholder="e.g. All questions are compulsory. Use of calculators is prohibited."
                        value={formData.instructions}
                        onChange={(e) => handleChange('instructions', e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all h-24 resize-y"
                    ></textarea>
                </div>
            </div>
        </motion.div>
    );

    const renderStep2 = () => (
        <motion.div 
            key="step2"
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}
            className="max-w-[850px] mx-auto space-y-6"
        >
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Configure Sections</h2>
                <p className="text-gray-500">Set up the structure and marking scheme of your question paper.</p>
            </div>


            {/* Section Cards */}
            <div className="space-y-6">
                <AnimatePresence>
                    {formData.blueprint.map((sec, i) => (
                        <SectionCard 
                            key={i}
                            section={sec} 
                            index={i} 
                            totalSections={formData.blueprint.length}
                            onChange={updateSection}
                            onDelete={deleteSection}
                            onMoveUp={() => moveSection(i, 'up')}
                            onMoveDown={() => moveSection(i, 'down')}
                            onDuplicate={duplicateSection}
                        />
                    ))}
                </AnimatePresence>

                {formData.blueprint.length === 0 && (
                    <div className="border-2 border-dashed border-gray-300 rounded-2xl p-12 text-center bg-white">
                        <Layout className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-gray-900 mb-1">No sections yet</h3>
                        <p className="text-gray-500 text-sm max-w-sm mx-auto mb-6">Start by adding a section to define the types of questions and marking scheme.</p>
                        <button onClick={addSection} className="mx-auto bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-6 rounded-xl transition-all shadow-md flex items-center gap-2">
                            <Plus className="w-4 h-4" /> Add First Section
                        </button>
                    </div>
                )}
            </div>

            {formData.blueprint.length > 0 && (
                <div className="flex flex-col sm:flex-row gap-4 items-center justify-between mt-8">
                    <button onClick={addSection} className="w-full sm:w-auto bg-white border-2 border-indigo-100 hover:border-indigo-600 text-indigo-700 font-bold py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2">
                        <Plus className="w-5 h-5" /> Add Another Section
                    </button>
                    
                    {/* Paper Summary Card */}
                    <div className="w-full sm:w-auto bg-gray-900 rounded-xl p-4 flex gap-6 text-white shadow-lg">
                        <div>
                            <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Sections</p>
                            <p className="text-xl font-black">{stats.sections}</p>
                        </div>
                        <div className="w-px bg-gray-700"></div>
                        <div>
                            <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Questions</p>
                            <p className="text-xl font-black">{stats.qCount}</p>
                        </div>
                        <div className="w-px bg-gray-700"></div>
                        <div>
                            <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Total Marks</p>
                            <p className="text-xl font-black text-indigo-400">{stats.totalM}</p>
                        </div>
                    </div>
                </div>
            )}
        </motion.div>
    );

    const renderStep3 = () => (
        <motion.div 
            key="step3"
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}
            className="w-full grid grid-cols-1 xl:grid-cols-12 gap-8 max-w-[1400px] mx-auto"
        >
            {/* Left: Review Details */}
            <div className="xl:col-span-7 space-y-6">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8">
                    <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2"><Layout className="w-5 h-5 text-indigo-500" /> Exam Details</h3>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                        <div>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Institution</p>
                            <p className="text-sm font-semibold text-gray-900">{formData.institutionName || '—'}</p>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Board / Univ</p>
                            <p className="text-sm font-semibold text-gray-900">{formData.department || '—'}</p>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Class / Grade</p>
                            <p className="text-sm font-semibold text-gray-900">{formData.courseCode || '—'}</p>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Subject</p>
                            <p className="text-sm font-semibold text-gray-900">{formData.selectedSubject || '—'}</p>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Duration</p>
                            <p className="text-sm font-semibold text-gray-900">{formData.duration} Minute{formData.duration === 1 ? '' : 's'}</p>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Total Marks</p>
                            <p className="text-sm font-black text-indigo-600">{stats.totalM}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                        <h3 className="text-lg font-bold text-gray-900">Section Breakdown</h3>
                        <span className="bg-indigo-50 text-indigo-700 text-xs font-bold px-3 py-1 rounded-full">{stats.sections} Sections</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 text-gray-500 font-bold text-xs uppercase tracking-wider">
                                <tr>
                                    <th className="p-4">Section</th>
                                    <th className="p-4">Type</th>
                                    <th className="p-4 text-center">Questions</th>
                                    <th className="p-4 text-center">Marks/Q</th>
                                    <th className="p-4">Difficulty</th>
                                    <th className="p-4 text-right">Total Marks</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {formData.blueprint.map((sec, i) => (
                                    <tr key={i} className="hover:bg-gray-50">
                                        <td className="p-4 font-bold text-gray-900">{sec.sectionName}</td>
                                        <td className="p-4 font-medium text-gray-600">{sec.type}</td>
                                        <td className="p-4 text-center font-bold">
                                            {sec.questionCount}
                                            {sec.optionalQuestions > 0 && <span className="text-gray-400 text-xs ml-1">(+{sec.optionalQuestions} opt)</span>}
                                        </td>
                                        <td className="p-4 text-center font-medium text-gray-600">{sec.marksPerQuestion}</td>
                                        <td className="p-4">
                                            <span className="bg-gray-100 text-gray-600 px-2.5 py-1 rounded-md text-xs font-bold border border-gray-200">
                                                {sec.difficulty}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right font-black text-gray-900">
                                            {Number(sec.questionCount) * Number(sec.marksPerQuestion)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Right: Live Preview Panel */}
            <div className="xl:col-span-5 hidden md:block">
                <div className="sticky top-6">
                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Sparkles className="w-4 h-4" /> Live Preview
                    </h3>
                    <ExamPreview formData={formData} />
                </div>
            </div>
        </motion.div>
    );

    return (
        <div className="min-h-screen bg-gray-50/50 pb-32">
            
            {/* Recovery Banner */}
            <AnimatePresence>
                {showRestoreBanner && (
                    <motion.div 
                        initial={{ opacity: 0, y: -50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -50 }}
                        className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-green-600 text-white px-6 py-3 rounded-full shadow-xl flex items-center gap-3"
                    >
                        <Check className="w-5 h-5" />
                        <span className="font-bold text-sm">Draft restored successfully. Continue where you left off.</span>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
                <div className="max-w-[1400px] mx-auto pt-6 px-4">
                    <Stepper currentStep={currentStep} onStepClick={setCurrentStep} />
                </div>
            </div>

            <div className="max-w-[1400px] mx-auto p-4 md:p-8 mt-4">
                <AnimatePresence mode="wait">
                    {currentStep === 1 && renderStep1()}
                    {currentStep === 2 && renderStep2()}
                    {currentStep === 3 && renderStep3()}
                </AnimatePresence>
            </div>

            {/* Sticky Bottom Actions */}
            <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-50">
                <div className="max-w-[1400px] mx-auto flex flex-col-reverse sm:flex-row items-center justify-between gap-4">
                    
                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-500 min-w-[160px]">
                        {isSaving ? (
                            <>
                                <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                                <span>Saving...</span>
                            </>
                        ) : lastSavedTime ? (
                            <>
                                <Check className="w-4 h-4 text-green-500" />
                                <span>Saved ✓ <span className="font-normal text-xs ml-1 opacity-70">Last saved: {lastSavedTime}</span></span>
                            </>
                        ) : null}
                    </div>

                    <div className="flex w-full sm:w-auto items-center justify-between sm:justify-center gap-4 flex-1">
                        {currentStep > 1 && (
                            <button 
                                onClick={() => setCurrentStep(currentStep - 1)}
                                className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 px-6 rounded-xl transition-colors flex items-center gap-2 flex-1 sm:flex-none justify-center"
                            >
                                <ArrowLeft className="w-5 h-5" /> Previous
                            </button>
                        )}
                        
                        {currentStep < 3 ? (
                            <button 
                                onClick={handleNext}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-xl transition-colors flex items-center gap-2 shadow-lg shadow-indigo-600/20 flex-1 sm:flex-none justify-center"
                            >
                                Next <ArrowRight className="w-5 h-5" />
                            </button>
                        ) : (
                            <button 
                                onClick={() => setShowBlueprintModal(true)}
                                disabled={loading}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-xl transition-colors flex items-center gap-2 shadow-lg shadow-indigo-600/20 disabled:opacity-70 disabled:cursor-not-allowed flex-1 sm:flex-none justify-center"
                            >
                                <BarChart2 className="w-5 h-5" /> Analyze Blueprint
                            </button>
                        )}
                    </div>
                    
                    {/* Placeholder for layout balance on large screens */}
                    <div className="hidden sm:block min-w-[160px]"></div>
                </div>
            </div>

            {/* Resume Draft Modal */}
            <AnimatePresence>
                {showResumeModal && (
                    <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm"
                    >
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-center"
                        >
                            <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Save className="w-8 h-8" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">Resume Previous Exam?</h3>
                            <p className="text-gray-500 mb-6">We found an unfinished exam.</p>
                            
                            <div className="flex flex-col gap-3">
                                <button 
                                    onClick={handleResumeDraft}
                                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg"
                                >
                                    Continue Editing
                                </button>
                                <button 
                                    onClick={handleStartNew}
                                    className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3.5 rounded-xl transition-all"
                                >
                                    Start New
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Leave Confirmation Modal */}
            <AnimatePresence>
                {showLeaveModal && (
                    <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm"
                    >
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-center border-t-4 border-amber-500"
                        >
                            <div className="w-16 h-16 bg-amber-100 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                <AlertTriangle className="w-8 h-8" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">You have unsaved changes.</h3>
                            <p className="text-gray-500 mb-6">Leave anyway?</p>
                            
                            <div className="flex gap-4">
                                <button 
                                    onClick={() => {
                                        setShowLeaveModal(false);
                                        blocker.reset?.();
                                    }}
                                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3.5 rounded-xl transition-all"
                                >
                                    Stay
                                </button>
                                <button 
                                    onClick={() => {
                                        setShowLeaveModal(false);
                                        blocker.proceed?.();
                                    }}
                                    className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-amber-500/20"
                                >
                                    Leave
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Post-Generate Modal */}
            <AnimatePresence>
                {showPostGenerateModal && (
                    <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm"
                    >
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-center border-t-4 border-green-500"
                        >
                            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Check className="w-8 h-8" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">Question Paper Generated Successfully!</h3>
                            <p className="text-gray-500 mb-6">Would you like to keep this draft for future use?</p>
                            
                            <div className="flex flex-col gap-3">
                                <button 
                                    onClick={() => handlePostGenerateAction(true)}
                                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg"
                                >
                                    Keep Draft
                                </button>
                                <button 
                                    onClick={() => handlePostGenerateAction(false)}
                                    className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3.5 rounded-xl transition-all"
                                >
                                    Discard Draft
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <BlueprintAnalysisModal 
                isOpen={showBlueprintModal}
                onClose={() => setShowBlueprintModal(false)}
                initialBlueprint={formData.blueprint || []}
                examMode={formData.examMode}
                subject={formData.selectedSubject}
                selectedTopics={formData.selectedTopics}
                duration={formData.duration}
                difficulty={formData.difficultyMix?.mixed ? 'Mixed' : 'Medium'}
                onGenerateAnyway={() => {
                    setShowBlueprintModal(false);
                    handleGenerate();
                }}
                onOptimizeComplete={(optimizedBlueprint) => {
                    updateDraft({ blueprint: optimizedBlueprint });
                }}
            />

        </div>
    );
};

export default GenerateExam;