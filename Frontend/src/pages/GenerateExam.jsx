import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../utils/axiosConfig';
import { Sparkles, BookOpen, Target, Save, RotateCcw, Building2, Plus, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

const GenerateExam = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    examMode: 'Single Subject',
    examTitle: 'Advanced Assessment',
    description: '',
    institutionType: 'College',
    institutionName: 'ACADEMIC INTELLIGENCE INSTITUTE',
    department: '',
    subject: '',
    topic: '',
    examDate: '',
    duration: 180,
    academicSession: '',
    courseCode: '',
    logo: '',
    instructions: '',
    examHeaderStyle: 'Style 3',
    blueprint: []
  });

  const [newSection, setNewSection] = useState({
      sectionName: '',
      subject: '', // Added for Multi Subject
      questionCount: '',
      marksPerQuestion: '',
      duration: '',
      topics: '',
      difficulty: 'Mixed',
      type: 'MCQ'
  });
  
  const [subjects, setSubjects] = useState([]);
  const [allQuestions, setAllQuestions] = useState([]);
  const [previewQuestions, setPreviewQuestions] = useState({});
  const [deficits, setDeficits] = useState({});
  const [hasDeficit, setHasDeficit] = useState(false);

  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('editId');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [qRes, tRes] = await Promise.all([
          api.get('/questions'),
          api.get('/templates').catch(() => ({ data: [] }))
      ]);
      const questionsData = qRes.data.questions || qRes.data;
      setAllQuestions(questionsData);
      setTemplates(tRes.data || []);
      
      const uniqueSubjects = [...new Set(questionsData.map(q => q.subject))];
      setSubjects(uniqueSubjects);

      if (editId) {
          try {
              const examRes = await api.get(`/exams/${editId}`);
              const exam = examRes.data;
              setFormData({
                  examMode: exam.examMode || 'Single Subject',
                  examTitle: exam.examTitle,
                  description: exam.description || '',
                  institutionName: exam.collegeName || exam.institutionName || '',
                  institutionType: exam.institutionType || 'College',
                  department: exam.department || '',
                  academicSession: exam.academicSession || '',
                  courseCode: exam.courseCode || '',
                  logo: exam.logo || '',
                  instructions: exam.instructions || '',
                  examHeaderStyle: exam.examHeaderStyle || 'Style 3',
                  subject: exam.subject,
                  topic: exam.topic || '',
                  examDate: exam.examDate ? exam.examDate.split('T')[0] : '',
                  duration: exam.duration,
                  blueprint: exam.blueprint || []
              });
              toast.info("Configuration loaded for editing");
          } catch (e) {
              console.error("Error loading exam for edit", e);
          }
      } else {
          try {
              const instRes = await api.get('/settings/institution');
              if (instRes.data) {
                  const defaults = instRes.data;
                  setFormData(prev => ({
                      ...prev,
                      institutionName: defaults.institutionName || prev.institutionName,
                      institutionType: defaults.institutionType || prev.institutionType,
                      department: defaults.department || prev.department,
                      academicSession: defaults.academicSession || prev.academicSession,
                      logo: defaults.logoUrl || prev.logo,
                      instructions: defaults.instructions || prev.instructions,
                      examTitle: defaults.defaultExamTitle || prev.examTitle,
                      subject: uniqueSubjects.length > 0 && !prev.subject ? uniqueSubjects[0] : prev.subject
                  }));
              }
          } catch(e) {
              if (uniqueSubjects.length > 0 && !formData.subject) {
                  setFormData(prev => ({...prev, subject: uniqueSubjects[0]}));
              }
          }
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    }
  };

  useEffect(() => {
     if (!formData.subject) return;
     const normalizedSubject = formData.subject.trim().toLowerCase();
     const subjectQs = allQuestions.filter(q => q.subject.toLowerCase() === normalizedSubject && q.status !== 'draft');
     
     let groupedPreview = {};
     let curDeficits = {};
     let hasDef = false;

     formData.blueprint.forEach(sec => {
         // Determine which subject to filter by
         const targetSubject = formData.examMode === 'Multi Subject' ? (sec.subject || sec.sectionName) : formData.subject;
         const normalizedTarget = targetSubject.trim().toLowerCase();
         const targetQs = allQuestions.filter(q => q.subject.toLowerCase() === normalizedTarget && q.status !== 'draft');

         let filtered = targetQs.filter(q => q.type === sec.type);
         if (sec.difficulty && sec.difficulty !== 'Mixed' && sec.difficulty !== 'All') {
             filtered = filtered.filter(q => q.difficulty === sec.difficulty);
         }
         if (sec.topics) {
             const topicsArray = sec.topics.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
             if (topicsArray.length > 0) {
                 filtered = filtered.filter(q => q.topic && topicsArray.includes(q.topic.toLowerCase()));
             }
         }
         
         const avail = filtered.length;
         const req = Number(sec.questionCount) || 0;
         
         if (avail < req) {
             hasDef = true;
             curDeficits[sec.sectionName] = { req, avail, missing: req - avail, ...sec };
         }

         const shuffled = [...filtered].sort(() => 0.5 - Math.random());
         groupedPreview[sec.sectionName] = shuffled.slice(0, req);
     });

     setDeficits(curDeficits);
     setHasDeficit(hasDef);
     setPreviewQuestions(groupedPreview);
  }, [formData.subject, formData.examMode, formData.blueprint, allQuestions]);

  const handleAddSection = () => {
      if (!newSection.sectionName || !newSection.questionCount || !newSection.marksPerQuestion) {
          toast.error("Please fill Name, Question Count, and Marks"); return;
      }
      if (formData.examMode === 'Multi Subject' && !newSection.subject) {
          toast.error("Please select a Subject for this section in Multi-Subject mode"); return;
      }
      setFormData({ ...formData, blueprint: [...formData.blueprint, {...newSection}] });
      setNewSection({ sectionName: '', subject: '', questionCount: '', marksPerQuestion: '', duration: '', topics: '', difficulty: 'Mixed', type: 'MCQ' });
  };

  const handleDeleteSection = (index) => {
      const updated = formData.blueprint.filter((_, i) => i !== index);
      setFormData({ ...formData, blueprint: updated });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.blueprint.length === 0) {
        toast.error('Please add at least one section to the blueprint'); return;
    }
    setLoading(true);
    try {
      const payload = {
        ...formData,
        collegeName: formData.institutionName
      };
      const res = await api.post('/exams/generate', payload);
      toast.success('Exam generated successfully!');
      navigate(`/exams/${res.data._id}`);
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed to generate exam');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDefaults = async () => {
      try {
          const defaults = {
              institutionName: formData.institutionName,
              institutionType: formData.institutionType,
              department: formData.department,
              defaultExamTitle: formData.examTitle,
              academicSession: formData.academicSession,
              logoUrl: formData.logo,
              instructions: formData.instructions
          };
          await api.put('/settings/institution', defaults);
          toast.success("Settings saved as default!");
      } catch (e) {
          toast.error("Failed to save defaults");
      }
  };

  const handleSaveTemplate = async () => {
      const name = window.prompt("Enter a name for this template:");
      if (!name) return;
      try {
          const reqData = {
              name,
              subject: formData.subject,
              blueprint: formData.blueprint,
              duration: formData.duration
          };
          await api.post('/templates', reqData);
          toast.success("Template saved successfully!");
          fetchData();
      } catch (err) {
          toast.error("Failed to save template");
      }
  };

  const handleReset = () => {
      if (window.confirm("Are you sure you want to reset all settings?")) {
          setFormData(prev => ({
              ...prev,
              blueprint: []
          }));
      }
  };

  const handleAIGeneration = async () => {
      if (!formData.subject) return toast.error("Select a subject first");
      setAiGenerating(true);
      const toastId = toast.loading("Generating missing questions with AI...");
      
      try {
          let newlyGenerated = [];
          for (const [secName, defInfo] of Object.entries(deficits)) {
              const reqData = {
                  subject: formData.examMode === 'Multi Subject' ? (defInfo.subject || defInfo.sectionName) : formData.subject,
                  topic: defInfo.topics || ((formData.examMode === 'Multi Subject' ? (defInfo.subject || defInfo.sectionName) : formData.subject) + ' General Topics'),
                  difficulty: defInfo.difficulty === 'Mixed' ? 'Medium' : defInfo.difficulty,
                  type: defInfo.type,
                  count: defInfo.missing
              };
              const res = await api.post('/ai/generate', reqData);
              const generated = res.data.questions || res.data;
              newlyGenerated.push(...generated);
          }
          
          if (newlyGenerated.length > 0) {
              const questionsToSave = newlyGenerated.map(q => ({...q, source: 'ai'}));
              await api.post('/questions/bulk', { questions: questionsToSave });
              toast.update(toastId, { render: `Successfully generated and saved ${newlyGenerated.length} missing questions!`, type: 'success', isLoading: false, autoClose: 3000 });
              fetchData();
          }
      } catch (err) {
          console.error(err);
          toast.update(toastId, { render: err.response?.data?.msg || 'Failed to generate questions. Check API Key.', type: 'error', isLoading: false, autoClose: 5000 });
      } finally {
          setAiGenerating(false);
      }
  };

  const totalMarks = formData.blueprint.reduce((sum, sec) => sum + (Number(sec.questionCount) * Number(sec.marksPerQuestion)), 0);
  const totalQuestions = formData.blueprint.reduce((sum, sec) => sum + Number(sec.questionCount), 0);
  const totalCalculatedDuration = formData.blueprint.reduce((sum, sec) => sum + (Number(sec.duration) || 0), 0);

  return (
    <div className="max-w-[1400px] mx-auto pb-8">
        <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-1">Generate Exam</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Configure your automated academic assessment with precision.</p>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            
            {/* Left Column - Configuration */}
            <div className="space-y-6">

                    {/* Institution Settings */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg"><Building2 className="w-5 h-5" /></div>
                                <h3 className="font-bold text-gray-900 dark:text-white">Institution Branding</h3>
                            </div>
                            <button type="button" onClick={handleSaveDefaults} className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1.5 rounded-lg transition-colors">
                                Save As Default
                            </button>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Institution Type</label>
                                <select value={formData.institutionType} onChange={(e) => setFormData({ ...formData, institutionType: e.target.value })} className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-500/20 placeholder-gray-400 dark:placeholder-gray-500">
                                    <option value="School">School</option>
                                    <option value="College">College</option>
                                    <option value="University">University</option>
                                    <option value="Coaching Institute">Coaching Institute</option>
                                    <option value="Training Center">Training Center</option>
                                    <option value="Custom">Custom</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Institution Name</label>
                                <input type="text" value={formData.institutionName} onChange={(e) => setFormData({ ...formData, institutionName: e.target.value })} className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 text-sm font-bold text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-500/20 placeholder-gray-400 dark:placeholder-gray-500" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Department</label>
                                <input type="text" value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 text-sm font-bold text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-500/20 placeholder-gray-400 dark:placeholder-gray-500" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Academic Session</label>
                                <input type="text" value={formData.academicSession} onChange={(e) => setFormData({ ...formData, academicSession: e.target.value })} className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 text-sm font-bold text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-500/20 placeholder-gray-400 dark:placeholder-gray-500" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Course Code</label>
                                <input type="text" value={formData.courseCode} onChange={(e) => setFormData({ ...formData, courseCode: e.target.value })} className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 text-sm font-bold text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-500/20 placeholder-gray-400 dark:placeholder-gray-500" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Logo URL</label>
                                <input type="url" value={formData.logo} onChange={(e) => setFormData({ ...formData, logo: e.target.value })} className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 text-sm font-bold text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-500/20 placeholder-gray-400 dark:placeholder-gray-500" />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Header Style</label>
                                <select value={formData.examHeaderStyle} onChange={(e) => setFormData({ ...formData, examHeaderStyle: e.target.value })} className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-500/20 placeholder-gray-400 dark:placeholder-gray-500">
                                    <option value="Style 1">Style 1: Simple School Format</option>
                                    <option value="Style 2">Style 2: University Format</option>
                                    <option value="Style 3">Style 3: Modern Professional</option>
                                    <option value="Style 4">Style 4: Government Exam</option>
                                </select>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">General Instructions</label>
                                <textarea rows="3" value={formData.instructions} onChange={(e) => setFormData({ ...formData, instructions: e.target.value })} className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 text-sm font-bold text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-500/20 placeholder-gray-400 dark:placeholder-gray-500"></textarea>
                            </div>
                        </div>
                    </div>

                    {/* Subject & Curriculum */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg"><BookOpen className="w-5 h-5" /></div>
                                <h3 className="font-bold text-gray-900 dark:text-white">Subject & Curriculum</h3>
                            </div>
                            {templates.length > 0 && (
                                <select onChange={(e) => {
                                    if(!e.target.value) return;
                                    const tmpl = templates.find(t => t._id === e.target.value);
                                    if(tmpl) {
                                        setFormData({
                                            ...formData,
                                            examMode: tmpl.examMode || 'Single Subject',
                                            subject: tmpl.subject,
                                            blueprint: tmpl.blueprint || [],
                                            duration: tmpl.duration || 180
                                        });
                                        toast.success("Template loaded!");
                                    }
                                    e.target.value = "";
                                }} className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-gray-50 text-gray-600 outline-none">
                                    <option value="">Load Template...</option>
                                    {templates.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                                </select>
                            )}
                        </div>

                        {/* Exam Mode Selector */}
                        <div className="mb-6 p-1 bg-gray-100 dark:bg-gray-700 rounded-xl flex flex-col sm:flex-row">
                            <button type="button" onClick={() => setFormData({...formData, examMode: 'Single Subject'})} className={`flex-1 py-2 px-2 text-sm font-bold rounded-lg transition-all ${formData.examMode === 'Single Subject' ? 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>
                                Single Subject Exam
                            </button>
                            <button type="button" onClick={() => setFormData({...formData, examMode: 'Multi Subject'})} className={`flex-1 py-2 px-2 text-sm font-bold rounded-lg transition-all ${formData.examMode === 'Multi Subject' ? 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>
                                Multi Subject Exam
                            </button>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-5">
                            {formData.examMode === 'Single Subject' && (
                                <>
                                    <div className="relative">
                                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Subject</label>
                                        <input 
                                            type="text" required list="subject-suggestions" placeholder="Enter Subject Name"
                                            value={formData.subject} onChange={(e) => setFormData({ ...formData, subject: e.target.value })} 
                                            className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 text-sm font-bold text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-500/20 placeholder-gray-400 dark:placeholder-gray-500" 
                                        />
                                        <datalist id="subject-suggestions">
                                            {subjects.map((subject, index) => <option key={index} value={subject} />)}
                                        </datalist>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Global Topic (Optional)</label>
                                        <input type="text" placeholder="e.g. Normalization" value={formData.topic} onChange={(e) => setFormData({ ...formData, topic: e.target.value })} className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 text-sm font-bold text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-500/20 placeholder-gray-400 dark:placeholder-gray-500" />
                                    </div>
                                </>
                            )}
                            <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Exam Title</label>
                                <input type="text" required value={formData.examTitle} onChange={(e) => setFormData({ ...formData, examTitle: e.target.value })} className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 text-sm font-bold text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-500/20 placeholder-gray-400 dark:placeholder-gray-500" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Exam Date</label>
                                <input type="date" value={formData.examDate} onChange={(e) => setFormData({ ...formData, examDate: e.target.value })} className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 text-sm font-bold text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-500/20 placeholder-gray-400 dark:placeholder-gray-500" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Total Duration (Mins)</label>
                                <input type="number" value={totalCalculatedDuration || formData.duration} onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) })} className="w-full bg-white disabled:bg-gray-50 dark:bg-gray-800 dark:disabled:bg-gray-700/50 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 text-sm font-bold text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-500/20 placeholder-gray-400 dark:placeholder-gray-500" disabled={totalCalculatedDuration > 0} />
                            </div>
                        </div>
                    </div>

                {/* Exam Template & Section Breakdown */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-lg"><Target className="w-5 h-5" /></div>
                            <h3 className="font-bold text-gray-900 dark:text-white">Exam Template & Section Breakdown</h3>
                        </div>
                        <div className="flex gap-2">
                            <div className="bg-gray-50 dark:bg-gray-700/50 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 text-xs">
                                <span className="font-bold text-gray-500 dark:text-gray-400 mr-1">Qs:</span><span className="font-black text-gray-800 dark:text-gray-200">{totalQuestions}</span>
                            </div>
                            <div className="bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1.5 rounded-lg border border-indigo-100 dark:border-indigo-800 text-xs">
                                <span className="font-bold text-indigo-500 dark:text-indigo-400 mr-1">Marks:</span><span className="font-black text-indigo-700 dark:text-indigo-300">{totalMarks}</span>
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto mb-6">
                        <table className="w-full min-w-[900px] text-left border-collapse">
                            <thead className="bg-gray-50 dark:bg-gray-700/50 text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400">
                                <tr>
                                    <th className="px-3 py-2 rounded-tl-lg">Section Name</th>
                                    <th className="px-3 py-2">Qs</th>
                                    <th className="px-3 py-2">Marks/Q</th>
                                    {formData.examMode === 'Multi Subject' && <th className="px-3 py-2">Subject</th>}
                                    <th className="px-3 py-2">Time(m)</th>
                                    <th className="px-3 py-2">Type</th>
                                    <th className="px-3 py-2">Difficulty</th>
                                    <th className="px-3 py-2">Topics</th>
                                    <th className="px-3 py-2 rounded-tr-lg">Action</th>
                                </tr>
                            </thead>
                            <tbody className="text-xs font-semibold text-gray-700">
                                {formData.blueprint.map((sec, idx) => (
                                    <tr key={idx} className="border-b border-gray-100 dark:border-gray-700">
                                        <td className="px-3 py-3">{sec.sectionName}</td>
                                        <td className="px-3 py-3">{sec.questionCount}</td>
                                        <td className="px-3 py-3">{sec.marksPerQuestion}</td>
                                        {formData.examMode === 'Multi Subject' && <td className="px-3 py-3 text-indigo-600 font-bold">{sec.subject}</td>}
                                        <td className="px-3 py-3">{sec.duration || '-'}</td>
                                        <td className="px-3 py-3">{sec.type}</td>
                                        <td className="px-3 py-3">{sec.difficulty}</td>
                                        <td className="px-3 py-3 max-w-[150px] truncate" title={sec.topics}>{sec.topics || 'All'}</td>
                                        <td className="px-3 py-3">
                                            <button type="button" onClick={() => handleDeleteSection(idx)} className="text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4" /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {formData.blueprint.length === 0 && <div className="text-center py-6 text-sm text-gray-400 italic">No sections added yet.</div>}
                    </div>

                    {/* Add Section Form */}
                    <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-xl border border-gray-200 dark:border-gray-700 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="col-span-2">
                            <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 mb-1">Section Name *</label>
                            <input type="text" placeholder="e.g. Reasoning" value={newSection.sectionName} onChange={(e)=>setNewSection({...newSection, sectionName: e.target.value})} className="w-full text-xs px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 outline-none focus:border-indigo-500 dark:bg-gray-800 dark:text-white" />
                        </div>
                        {formData.examMode === 'Multi Subject' && (
                            <div className="col-span-2 relative">
                                <label className="block text-[10px] font-bold text-indigo-500 mb-1">Question Bank Subject *</label>
                                <input 
                                    type="text" required list="section-subject-suggestions" placeholder="Map to Subject"
                                    value={newSection.subject} onChange={(e) => setNewSection({ ...newSection, subject: e.target.value })} 
                                    className="w-full text-xs px-3 py-2 rounded-lg border border-indigo-300 dark:border-indigo-500/30 outline-none focus:border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/20 dark:text-white" 
                                />
                                <datalist id="section-subject-suggestions">
                                    {subjects.map((subject, index) => <option key={index} value={subject} />)}
                                </datalist>
                            </div>
                        )}
                        <div>
                            <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 mb-1">Questions *</label>
                            <input type="number" min="1" value={newSection.questionCount} onChange={(e)=>setNewSection({...newSection, questionCount: e.target.value})} className="w-full text-xs px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 outline-none focus:border-indigo-500 dark:bg-gray-800 dark:text-white" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 mb-1">Marks/Q *</label>
                            <input type="number" min="1" value={newSection.marksPerQuestion} onChange={(e)=>setNewSection({...newSection, marksPerQuestion: e.target.value})} className="w-full text-xs px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 outline-none focus:border-indigo-500 dark:bg-gray-800 dark:text-white" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 mb-1">Q-Type</label>
                            <select value={newSection.type} onChange={(e)=>setNewSection({...newSection, type: e.target.value})} className="w-full text-xs px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 outline-none focus:border-indigo-500 dark:bg-gray-800 dark:text-white">
                                <option value="MCQ">MCQ</option>
                                <option value="Short Answer">Short Answer</option>
                                <option value="Long Answer">Long Answer</option>
                                <option value="True/False">True/False</option>
                                <option value="Coding">Coding</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 mb-1">Difficulty</label>
                            <select value={newSection.difficulty} onChange={(e)=>setNewSection({...newSection, difficulty: e.target.value})} className="w-full text-xs px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 outline-none focus:border-indigo-500 dark:bg-gray-800 dark:text-white">
                                <option value="Mixed">Mixed</option>
                                <option value="Easy">Easy</option>
                                <option value="Medium">Medium</option>
                                <option value="Hard">Hard</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 mb-1">Time (mins)</label>
                            <input type="number" value={newSection.duration} onChange={(e)=>setNewSection({...newSection, duration: e.target.value})} className="w-full text-xs px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 outline-none focus:border-indigo-500 dark:bg-gray-800 dark:text-white" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 mb-1">Topics (comma sep)</label>
                            <input type="text" placeholder="Arrays, Maps..." value={newSection.topics} onChange={(e)=>setNewSection({...newSection, topics: e.target.value})} className="w-full text-xs px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 outline-none focus:border-indigo-500 dark:bg-gray-800 dark:text-white" />
                        </div>
                        <div className="col-span-2 md:col-span-4 mt-2">
                            <button type="button" onClick={handleAddSection} className="w-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-bold text-xs py-2 rounded-lg transition-colors flex items-center justify-center gap-2"><Plus className="w-4 h-4"/> Add Section</button>
                        </div>
                    </div>
                </div>

                {hasDeficit && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-5 mb-6">
                        <h4 className="text-sm font-bold text-red-800 mb-2">Not Enough Questions in Bank for Sections</h4>
                        <ul className="text-xs text-red-600 space-y-1 mb-4">
                            {Object.entries(deficits).map(([secName, info]) => (
                                <li key={secName}>• {secName}: You have {info.avail} but need {info.req} (Missing {info.missing})</li>
                            ))}
                        </ul>
                        <div className="flex gap-3">
                            <button onClick={handleAIGeneration} disabled={aiGenerating} type="button" className="bg-red-600 text-white text-xs font-bold px-4 py-2.5 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2">
                                <Sparkles className="w-3 h-3" />
                                {aiGenerating ? 'Generating...' : 'Generate Missing Questions with AI'}
                            </button>
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                    <button onClick={handleReset} type="button" className="w-full sm:flex-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-bold py-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-2 shadow-sm">
                        <RotateCcw className="w-4 h-4" /> Reset Settings
                    </button>
                    <button onClick={handleSaveTemplate} type="button" className="w-full sm:flex-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-bold py-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-2 shadow-sm">
                        <Save className="w-4 h-4" /> Save Template
                    </button>
                    <button type="submit" disabled={loading || hasDeficit || formData.blueprint.length === 0} className="w-full sm:flex-[2] bg-indigo-600 text-white font-bold py-4 rounded-xl hover:bg-indigo-700 disabled:bg-indigo-300 dark:disabled:bg-indigo-900 dark:disabled:text-indigo-300 transition-colors shadow-md flex items-center justify-center gap-2">
                        {loading ? 'Generating...' : <><Sparkles className="w-5 h-5" /> Generate Exam Paper</>}
                    </button>
                </div>
            </div>

            {/* Right Column - Paper Preview */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden relative flex flex-col">
                <div className="bg-gray-50/80 px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center"><BookOpen className="w-3 h-3 text-indigo-600" /></div>
                        <span className="font-bold text-gray-900 text-sm">Paper Preview</span>
                    </div>
                    <div className="flex gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                        <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                        <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                    </div>
                </div>

                {/* Document Canvas */}
                <div className="flex-1 p-8 md:p-12 overflow-y-auto custom-scrollbar bg-white text-gray-900">
                    {formData.examHeaderStyle === 'Style 1' && (
                        <div className="text-center mb-10 border-b-2 border-gray-900 pb-6 relative">
                            {formData.logo && <img src={formData.logo} alt="Logo" className="absolute left-0 top-0 w-16 h-16 object-contain" />}
                            <h2 className="text-xl font-bold text-gray-900 uppercase tracking-wide">{formData.institutionName}</h2>
                            <h3 className="text-sm font-semibold text-gray-700 mt-1 uppercase">{formData.examTitle}</h3>
                            <div className="flex justify-between items-center mt-6 text-sm font-bold text-gray-800">
                                <span>Subject: {formData.examMode === 'Multi Subject' ? 'Multiple Subjects' : formData.subject}</span>
                                <span>Time: {totalCalculatedDuration || formData.duration} Mins</span>
                                <span>Max Marks: {totalMarks}</span>
                            </div>
                            {formData.topic && formData.examMode !== 'Multi Subject' && (
                                <div className="text-left mt-2 text-sm font-bold text-gray-800">
                                    <span>Topic: {formData.topic}</span>
                                </div>
                            )}
                        </div>
                    )}
                    {formData.examHeaderStyle === 'Style 2' && (
                        <div className="text-center mb-10 border-b border-gray-400 pb-6">
                            <h2 className="text-2xl font-serif font-bold text-gray-900 mb-1">{formData.institutionName}</h2>
                            {formData.department && <h3 className="text-sm font-serif italic text-gray-600 mb-2">Department of {formData.department}</h3>}
                            <h4 className="text-md font-bold uppercase tracking-widest text-gray-800 bg-gray-100 inline-block px-4 py-1 rounded-full mb-4">{formData.academicSession}</h4>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">{formData.examTitle}</h3>
                            <div className="flex justify-between items-center text-sm font-bold text-gray-800 mt-4 px-4 py-2 border-t border-gray-300">
                                <span>Course: {formData.examMode === 'Multi Subject' ? 'Multiple Subjects' : (formData.courseCode || formData.subject)}</span>
                                <span>Time Allowed: {totalCalculatedDuration || formData.duration} Mins</span>
                            </div>
                            <div className="flex justify-between items-center text-sm font-bold text-gray-800 px-4 py-2 border-b border-gray-300">
                                <span>{(formData.topic && formData.examMode !== 'Multi Subject') ? `Topic: ${formData.topic}` : ''}</span>
                                <span>Maximum Marks: {totalMarks}</span>
                            </div>
                        </div>
                    )}
                    {formData.examHeaderStyle === 'Style 3' && (
                        <div className="text-center mb-10">
                            {formData.logo && <img src={formData.logo} alt="Logo" className="w-20 h-20 object-contain mx-auto mb-4" />}
                            <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2">{formData.institutionName}</h4>
                            <h2 className="text-2xl font-black text-gray-900 leading-tight mb-2">{formData.examTitle}</h2>
                            {formData.courseCode && <span className="inline-block px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-full mb-2">{formData.courseCode}</span>}
                            {formData.examMode === 'Multi Subject' ? (
                                <div className="text-sm font-bold text-gray-800 mb-4">Multiple Subjects</div>
                            ) : formData.topic && (
                                <div className="text-sm font-bold text-gray-800 mb-4">Topic: {formData.topic}</div>
                            )}
                            <div className="flex justify-between items-center border-b-2 border-gray-900 pb-4 text-xs font-bold text-gray-900 uppercase tracking-wider">
                                <span>Time: {totalCalculatedDuration || formData.duration} Minutes</span>
                                <span>Total Marks: {totalMarks}</span>
                            </div>
                        </div>
                    )}
                    {formData.examHeaderStyle === 'Style 4' && (
                        <div className="mb-10 border-4 border-double border-gray-900 p-4">
                            <div className="flex gap-4 items-center border-b border-gray-400 pb-4 mb-4">
                                {formData.logo && <img src={formData.logo} alt="Logo" className="w-16 h-16 object-contain" />}
                                <div className="flex-1 text-center pr-16">
                                    <h2 className="text-xl font-bold text-gray-900 uppercase">{formData.institutionName}</h2>
                                    <h3 className="text-md font-bold text-gray-800 uppercase mt-1">{formData.examTitle}</h3>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-y-2 text-sm font-bold text-gray-800">
                                <div><span className="text-gray-500">SUBJECT:</span> {formData.examMode === 'Multi Subject' ? 'Multiple Subjects' : formData.subject}</div>
                                <div className="text-right"><span className="text-gray-500">SESSION:</span> {formData.academicSession}</div>
                                <div><span className="text-gray-500">TOPIC:</span> {formData.examMode === 'Multi Subject' ? 'N/A' : (formData.topic || 'N/A')}</div>
                                <div className="text-right"><span className="text-gray-500">MARKS:</span> {totalMarks}</div>
                                <div><span className="text-gray-500">TIME:</span> {totalCalculatedDuration || formData.duration} MINUTES</div>
                            </div>
                        </div>
                    )}

                    {formData.instructions && (
                        <div className="mb-8 p-4 bg-gray-50/50 border border-gray-200 rounded-lg">
                            <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-2 underline">General Instructions:</h4>
                            <pre className="text-xs text-gray-700 font-sans whitespace-pre-wrap">{formData.instructions}</pre>
                        </div>
                    )}
                    
                    {formData.blueprint.length > 0 && (
                        <div className="mb-8 p-4 border border-gray-900 text-xs font-bold text-gray-900">
                            <div className="text-center underline mb-2">EXAM TEMPLATE & SECTION BREAKDOWN</div>
                            <div className="flex justify-between border-b border-gray-300 pb-1 mb-1 text-[10px] text-gray-500 uppercase">
                                <span className="w-1/4">Section</span>
                                {formData.examMode === 'Multi Subject' && <span className="w-1/4">Subject</span>}
                                <span className="w-1/6">Type</span>
                                <span className="w-1/6">Qs</span>
                                <span className="w-1/6">Marks</span>
                                <span className="w-1/4">Topics</span>
                            </div>
                            {formData.blueprint.map((sec, i) => (
                                <div key={i} className="flex justify-between py-1">
                                    <span className="w-1/4 truncate">{sec.sectionName}</span>
                                    {formData.examMode === 'Multi Subject' && <span className="w-1/4 truncate text-indigo-600">{sec.subject}</span>}
                                    <span className="w-1/6">{sec.type}</span>
                                    <span className="w-1/6">{sec.questionCount}</span>
                                    <span className="w-1/6">{sec.marksPerQuestion * sec.questionCount}</span>
                                    <span className="w-1/4 truncate text-gray-500 text-[10px] font-medium">{sec.topics || 'All'}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Real Questions based on live preview */}
                    <div className="space-y-8">
                        {formData.blueprint.map((sec, secIdx) => {
                            const qs = previewQuestions[sec.sectionName] || [];
                            if (qs.length === 0) return null;
                            
                            return (
                                <div key={secIdx}>
                                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-4 underline">
                                        Section: {sec.sectionName} ({qs.length} Questions, {sec.marksPerQuestion} mark{sec.marksPerQuestion > 1 ? 's' : ''} each)
                                    </h3>
                                    
                                    {qs.map((q, idx) => (
                                        <div key={q._id} className="flex gap-3 mb-6">
                                            <span className="font-bold text-gray-900">Q{idx + 1}.</span>
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-gray-800 mb-4">{q.questionText}</p>
                                                
                                                {sec.type === 'MCQ' && (
                                                    <div className="grid grid-cols-2 gap-4">
                                                        {q.options?.map((opt, oIdx) => (
                                                            <div key={oIdx} className="border border-gray-200 rounded-lg px-4 py-2.5 text-xs text-gray-600 font-medium bg-gray-50/50">
                                                                ({String.fromCharCode(65 + oIdx)}) {opt}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                                
                                                {sec.type === 'True/False' && (
                                                    <div className="flex gap-4">
                                                        <div className="border border-gray-200 rounded-lg px-6 py-2.5 text-xs text-gray-600 font-medium bg-gray-50/50">True</div>
                                                        <div className="border border-gray-200 rounded-lg px-6 py-2.5 text-xs text-gray-600 font-medium bg-gray-50/50">False</div>
                                                    </div>
                                                )}
                                                
                                                {sec.type === 'Short Answer' && (
                                                    <div className="h-24 w-full mt-3 border-b-2 border-dashed border-gray-200"></div>
                                                )}
                                                
                                                {(sec.type === 'Long Answer' || sec.type === 'Coding') && (
                                                    <div className="h-48 w-full mt-3 border-b-2 border-dashed border-gray-200 flex flex-col justify-between">
                                                        <div className="h-12 w-full border-b border-dashed border-gray-100"></div>
                                                        <div className="h-12 w-full border-b border-dashed border-gray-100"></div>
                                                        <div className="h-12 w-full border-b border-dashed border-gray-100"></div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )
                        })}
                        
                        {Object.keys(previewQuestions).length === 0 && (
                            <div className="py-20 text-center">
                                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <BookOpen className="w-6 h-6 text-gray-300" />
                                </div>
                                <h3 className="text-sm font-bold text-gray-900 mb-1">No Questions Selected</h3>
                                <p className="text-xs text-gray-500">Configure your template sections on the left to see a live preview.</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-gray-50 border-t border-gray-100 px-6 py-3 flex justify-between items-center">
                    <span className="text-[10px] font-bold text-gray-400">Live Blueprint Engine Active</span>
                    <div className="flex gap-3">
                        <span className="text-[10px] font-bold text-gray-400 flex items-center gap-1"><BookOpen className="w-3 h-3"/> Layout View</span>
                    </div>
                </div>
            </div>

        </form>
    </div>
  );
};

export default GenerateExam;