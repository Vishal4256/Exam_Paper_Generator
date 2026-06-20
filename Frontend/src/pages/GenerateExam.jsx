import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../utils/axiosConfig';
import { Sparkles, BookOpen, Zap, Target, Save, RotateCcw, Building2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

const GenerateExam = () => {
  const { user, updateUser } = useAuth();
  const [formData, setFormData] = useState({
    examTitle: 'Advanced Quantum Mechanics',
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
    marksDistribution: {
      'MCQ': { count: 2, marks: 2 },
      'Short Answer': { count: 5, marks: 5 },
      'Long Answer': { count: 3, marks: 10 },
      'True/False': { count: 0, marks: 1 }
    }
  });
  
  const [subjects, setSubjects] = useState([]);
  const [allQuestions, setAllQuestions] = useState([]);
  const [availableCounts, setAvailableCounts] = useState({'MCQ': 0, 'Short Answer': 0, 'Long Answer': 0, 'True/False': 0});
  const [previewQuestions, setPreviewQuestions] = useState([]);
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
                  marksDistribution: exam.marksDistribution
              });
              toast.info("Configuration loaded for editing");
          } catch (e) {
              console.error("Error loading exam for edit", e);
          }
      } else {
          // Load Defaults
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
     
     const counts = { 'MCQ': 0, 'Short Answer': 0, 'Long Answer': 0, 'True/False': 0 };
     subjectQs.forEach(q => {
         if (counts[q.type] !== undefined) counts[q.type]++;
     });
     setAvailableCounts(counts);

     // Generate a live preview
     let preview = [];
     for (const [type, info] of Object.entries(formData.marksDistribution)) {
         if (info.count > 0) {
             const typeQs = subjectQs.filter(q => q.type === type);
             const shuffled = [...typeQs].sort(() => 0.5 - Math.random());
             preview.push(...shuffled.slice(0, info.count));
         }
     }
     
     // Group preview by type for display
     const groupedPreview = {
        'MCQ': preview.filter(q => q.type === 'MCQ'),
        'Short Answer': preview.filter(q => q.type === 'Short Answer'),
        'Long Answer': preview.filter(q => q.type === 'Long Answer'),
        'True/False': preview.filter(q => q.type === 'True/False')
     };
     setPreviewQuestions(groupedPreview);
  }, [formData.subject, formData.marksDistribution, allQuestions]);

  const handleDistributionChange = (type, field, value) => {
    setFormData({
      ...formData,
      marksDistribution: {
        ...formData.marksDistribution,
        [type]: {
          ...formData.marksDistribution[type],
          [field]: parseInt(value) || 0
        }
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...formData,
        collegeName: formData.institutionName // mapping for backward compatibility
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
              marksDistribution: formData.marksDistribution,
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
          setFormData({
            examTitle: 'Advanced Quantum Mechanics',
            description: '',
            institutionName: 'ACADEMIC INTELLIGENCE INSTITUTE',
            institutionType: 'College',
            department: '',
            academicSession: '',
            courseCode: '',
            logo: '',
            instructions: '',
            examHeaderStyle: 'Style 3',
            subject: subjects[0] || '',
            topic: '',
            examDate: '',
            duration: 180,
            marksDistribution: {
              'MCQ': { count: 2, marks: 2 },
              'Short Answer': { count: 5, marks: 5 },
              'Long Answer': { count: 3, marks: 10 },
              'True/False': { count: 0, marks: 1 }
            }
          });
      }
  };

  const handleAIGeneration = async () => {
      if (!formData.subject) return toast.error("Select a subject first");
      setAiGenerating(true);
      const toastId = toast.loading("Generating missing questions with AI...");
      
      try {
          let newlyGenerated = [];
          for (const [type, count] of Object.entries(deficits)) {
              const reqData = {
                  subject: formData.subject,
                  topic: formData.subject + ' General Topics',
                  difficulty: 'Medium',
                  type: type,
                  count: count
              };
              const res = await api.post('/ai/generate', reqData);
              const generated = res.data.questions || res.data;
              newlyGenerated.push(...generated);
          }
          
          if (newlyGenerated.length > 0) {
              const questionsToSave = newlyGenerated.map(q => ({...q, source: 'ai'}));
              await api.post('/questions/bulk', { questions: questionsToSave });
              toast.update(toastId, { render: `Successfully generated and saved ${newlyGenerated.length} missing questions!`, type: 'success', isLoading: false, autoClose: 3000 });
              fetchData(); // Refresh all questions
          }
      } catch (err) {
          console.error(err);
          toast.update(toastId, { render: err.response?.data?.msg || 'Failed to generate questions. Check API Key.', type: 'error', isLoading: false, autoClose: 5000 });
      } finally {
          setAiGenerating(false);
      }
  };

  let hasDeficit = false;
  let deficits = {};
  for (const [type, info] of Object.entries(formData.marksDistribution)) {
      if (info.count > availableCounts[type]) {
          hasDeficit = true;
          deficits[type] = info.count - availableCounts[type];
      }
  }

  const totalMarks = Object.values(formData.marksDistribution).reduce((sum, item) => sum + (item.count * item.marks), 0);

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
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg"><Building2 className="w-5 h-5" /></div>
                                <h3 className="font-bold text-gray-900 dark:text-white">Institution Branding</h3>
                            </div>
                            <button type="button" onClick={handleSaveDefaults} className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1.5 rounded-lg transition-colors">
                                Save As Default
                            </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Institution Type</label>
                                <select value={formData.institutionType} onChange={(e) => setFormData({ ...formData, institutionType: e.target.value })} className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-500/20">
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
                                <input type="text" value={formData.institutionName} onChange={(e) => setFormData({ ...formData, institutionName: e.target.value })} className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 text-sm font-bold text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-500/20" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Department</label>
                                <input type="text" value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 text-sm font-bold text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-500/20" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Academic Session</label>
                                <input type="text" value={formData.academicSession} onChange={(e) => setFormData({ ...formData, academicSession: e.target.value })} className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 text-sm font-bold text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-500/20" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Course Code</label>
                                <input type="text" value={formData.courseCode} onChange={(e) => setFormData({ ...formData, courseCode: e.target.value })} className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 text-sm font-bold text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-500/20" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Logo URL</label>
                                <input type="url" value={formData.logo} onChange={(e) => setFormData({ ...formData, logo: e.target.value })} className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 text-sm font-bold text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-500/20" />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Header Style</label>
                                <select value={formData.examHeaderStyle} onChange={(e) => setFormData({ ...formData, examHeaderStyle: e.target.value })} className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-500/20">
                                    <option value="Style 1">Style 1: Simple School Format</option>
                                    <option value="Style 2">Style 2: University Format</option>
                                    <option value="Style 3">Style 3: Modern Professional</option>
                                    <option value="Style 4">Style 4: Government Exam</option>
                                </select>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">General Instructions</label>
                                <textarea rows="3" value={formData.instructions} onChange={(e) => setFormData({ ...formData, instructions: e.target.value })} className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 text-sm font-bold text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-500/20"></textarea>
                            </div>
                        </div>
                    </div>

                    {/* Subject & Curriculum */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                        <div className="flex justify-between items-center mb-6">
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
                                            subject: tmpl.subject,
                                            marksDistribution: tmpl.marksDistribution,
                                            duration: tmpl.duration || 180
                                        });
                                        toast.success("Template loaded!");
                                    }
                                    e.target.value = ""; // Reset select
                                }} className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-gray-50 text-gray-600 outline-none">
                                    <option value="">Load Template...</option>
                                    {templates.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                                </select>
                            )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
                            <div className="relative">
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Subject</label>
                                <input 
                                    type="text" 
                                    required 
                                    list="subject-suggestions"
                                    placeholder="Enter Subject Name"
                                    minLength="2"
                                    maxLength="100"
                                    value={formData.subject} 
                                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })} 
                                    className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 text-sm font-bold text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-500/20" 
                                />
                                <datalist id="subject-suggestions">
                                    {subjects.map((subject, index) => <option key={index} value={subject} />)}
                                </datalist>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Topic</label>
                                <input type="text" required placeholder="e.g. Normalization, Quantum Mechanics" value={formData.topic} onChange={(e) => setFormData({ ...formData, topic: e.target.value })} className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 text-sm font-bold text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-500/20" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Exam Title</label>
                                <input type="text" required value={formData.examTitle} onChange={(e) => setFormData({ ...formData, examTitle: e.target.value })} className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 text-sm font-bold text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-500/20" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Exam Date</label>
                                <input type="date" value={formData.examDate} onChange={(e) => setFormData({ ...formData, examDate: e.target.value })} className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 text-sm font-bold text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-500/20" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Duration (Mins)</label>
                                <input type="number" required value={formData.duration} onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) })} className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 text-sm font-bold text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-500/20" />
                            </div>
                        </div>
                    </div>
                {/* Question Type Distribution */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-lg"><Target className="w-5 h-5" /></div>
                            <h3 className="font-bold text-gray-900 dark:text-white">Question Type Distribution</h3>
                        </div>
                        <div className="bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100">
                            <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider mr-2">Total Marks:</span>
                            <span className="text-sm font-black text-indigo-700">{totalMarks}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {['MCQ', 'Short Answer', 'Long Answer', 'True/False'].map((type) => {
                            const mapType = type === 'Long Answer' ? 'Long/Theory' : type + (type === 'MCQ' ? 's' : '');
                            return (
                            <div key={type} className="border border-gray-100 dark:border-gray-700 rounded-xl p-4 bg-gray-50/50 dark:bg-gray-800/50 hover:border-indigo-200 transition-colors">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="w-3 h-3 rounded-full border-2 border-indigo-600 flex items-center justify-center"><div className="w-1.5 h-1.5 bg-indigo-600 rounded-full"></div></div>
                                    <span className="text-xs font-bold text-gray-900 dark:text-gray-100 line-clamp-1">{mapType}</span>
                                </div>
                                <div className="flex gap-3">
                                    <div className="flex-1">
                                        <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1 text-center">Count</label>
                                        <input type="number" min="0" value={formData.marksDistribution[type].count} onChange={(e) => handleDistributionChange(type, 'count', e.target.value)} className="w-full bg-white border border-gray-200 rounded-lg py-2 text-center text-sm font-bold text-gray-700 outline-none focus:border-indigo-500" />
                                    </div>
                                    <div className="flex-1">
                                        <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1 text-center">Each</label>
                                        <input type="number" min="1" value={formData.marksDistribution[type].marks} onChange={(e) => handleDistributionChange(type, 'marks', e.target.value)} className="w-full bg-white border border-gray-200 rounded-lg py-2 text-center text-sm font-bold text-gray-700 outline-none focus:border-indigo-500" />
                                    </div>
                                </div>
                                <div className="mt-3 text-center">
                                    <span className={`text-[10px] font-bold ${formData.marksDistribution[type].count > availableCounts[type] ? 'text-red-500' : 'text-emerald-500'}`}>
                                        Avail: {availableCounts[type]}
                                    </span>
                                </div>
                            </div>
                        )})}
                    </div>
                </div>

                {hasDeficit && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-5 mb-6">
                        <h4 className="text-sm font-bold text-red-800 mb-2">Not Enough Questions in Bank</h4>
                        <ul className="text-xs text-red-600 space-y-1 mb-4">
                            {Object.entries(deficits).map(([type, count]) => (
                                <li key={type}>• {type}: You have {availableCounts[type]} but need {formData.marksDistribution[type].count} (Missing {count})</li>
                            ))}
                        </ul>
                        <div className="flex gap-3">
                            <button onClick={handleAIGeneration} disabled={aiGenerating} type="button" className="bg-red-600 text-white text-xs font-bold px-4 py-2.5 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2">
                                <Sparkles className="w-3 h-3" />
                                {aiGenerating ? 'Generating...' : 'Generate Missing Questions with AI'}
                            </button>
                            <button onClick={() => {
                                const fixed = {...formData.marksDistribution};
                                Object.keys(deficits).forEach(t => fixed[t].count = availableCounts[t]);
                                setFormData({...formData, marksDistribution: fixed});
                            }} type="button" className="bg-white border border-red-200 text-red-600 text-xs font-bold px-4 py-2.5 rounded-lg hover:bg-red-50 transition-colors">
                                Adjust Counts to Available
                            </button>
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-4">
                    <button onClick={handleReset} type="button" className="flex-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-bold py-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-2 shadow-sm">
                        <RotateCcw className="w-4 h-4" /> Reset Settings
                    </button>
                    <button onClick={handleSaveTemplate} type="button" className="flex-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-bold py-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-2 shadow-sm">
                        <Save className="w-4 h-4" /> Save Template
                    </button>
                    <button type="submit" disabled={loading || hasDeficit} className="flex-[2] bg-indigo-600 text-white font-bold py-4 rounded-xl hover:bg-indigo-700 disabled:bg-indigo-300 dark:disabled:bg-indigo-800 transition-colors shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2">
                        {loading ? 'Generating...' : <><Sparkles className="w-5 h-5" /> Generate Exam Paper</>}
                    </button>
                </div>
            </div>

            {/* Right Column - Paper Preview */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-xl overflow-hidden relative flex flex-col">
                <div className="bg-gray-50/80 dark:bg-gray-700/50 px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center"><BookOpen className="w-3 h-3 text-indigo-600 dark:text-indigo-400" /></div>
                        <span className="font-bold text-gray-900 dark:text-white text-sm">Paper Preview</span>
                    </div>
                    <div className="flex gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                        <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                        <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                    </div>
                </div>

                {/* Document Canvas */}
                <div className="flex-1 p-8 md:p-12 overflow-y-auto custom-scrollbar bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
                    {formData.examHeaderStyle === 'Style 1' && (
                        <div className="text-center mb-10 border-b-2 border-gray-900 dark:border-gray-100 pb-6 relative">
                            {formData.logo && <img src={formData.logo} alt="Logo" className="absolute left-0 top-0 w-16 h-16 object-contain" />}
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white uppercase tracking-wide">{formData.institutionName}</h2>
                            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mt-1 uppercase">{formData.examTitle}</h3>
                            <div className="flex justify-between items-center mt-6 text-sm font-bold text-gray-800 dark:text-gray-200">
                                <span>Subject: {formData.subject}</span>
                                <span>Time: {formData.duration} Mins</span>
                                <span>Max Marks: {totalMarks}</span>
                            </div>
                            {formData.topic && (
                                <div className="text-left mt-2 text-sm font-bold text-gray-800 dark:text-gray-200">
                                    <span>Topic: {formData.topic}</span>
                                </div>
                            )}
                        </div>
                    )}
                    {formData.examHeaderStyle === 'Style 2' && (
                        <div className="text-center mb-10 border-b border-gray-400 dark:border-gray-500 pb-6">
                            <h2 className="text-2xl font-serif font-bold text-gray-900 dark:text-white mb-1">{formData.institutionName}</h2>
                            {formData.department && <h3 className="text-sm font-serif italic text-gray-600 dark:text-gray-400 mb-2">Department of {formData.department}</h3>}
                            <h4 className="text-md font-bold uppercase tracking-widest text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 inline-block px-4 py-1 rounded-full mb-4">{formData.academicSession}</h4>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{formData.examTitle}</h3>
                            <div className="flex justify-between items-center text-sm font-bold text-gray-800 dark:text-gray-200 mt-4 px-4 py-2 border-t border-gray-300 dark:border-gray-600">
                                <span>Course: {formData.courseCode || formData.subject}</span>
                                <span>Time Allowed: {formData.duration} Mins</span>
                            </div>
                            <div className="flex justify-between items-center text-sm font-bold text-gray-800 dark:text-gray-200 px-4 py-2 border-b border-gray-300 dark:border-gray-600">
                                <span>{formData.topic ? `Topic: ${formData.topic}` : ''}</span>
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
                            {formData.topic && <div className="text-sm font-bold text-gray-800 mb-4">Topic: {formData.topic}</div>}
                            <div className="flex justify-between items-center border-b-2 border-gray-900 pb-4 text-xs font-bold text-gray-900 uppercase tracking-wider">
                                <span>Time: {formData.duration} Minutes</span>
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
                                <div><span className="text-gray-500">SUBJECT:</span> {formData.subject}</div>
                                <div className="text-right"><span className="text-gray-500">SESSION:</span> {formData.academicSession}</div>
                                <div><span className="text-gray-500">TOPIC:</span> {formData.topic || 'N/A'}</div>
                                <div className="text-right"><span className="text-gray-500">MARKS:</span> {totalMarks}</div>
                                <div><span className="text-gray-500">TIME:</span> {formData.duration} MINUTES</div>
                            </div>
                        </div>
                    )}

                    {formData.instructions && (
                        <div className="mb-8 p-4 bg-gray-50/50 border border-gray-200 rounded-lg">
                            <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-2 underline">General Instructions:</h4>
                            <pre className="text-xs text-gray-700 font-sans whitespace-pre-wrap">{formData.instructions}</pre>
                        </div>
                    )}

                    {/* Real Questions based on live preview */}
                    <div className="space-y-8">
                        {previewQuestions['MCQ']?.length > 0 && (
                            <div>
                                <h3 className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-4">Section A: Objective Type (MCQs)</h3>
                                {previewQuestions['MCQ'].map((q, idx) => (
                                    <div key={q._id} className="flex gap-3 mb-6">
                                        <span className="font-bold text-gray-900">Q{idx + 1}.</span>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-gray-800 mb-4">{q.questionText}</p>
                                            <div className="grid grid-cols-2 gap-4">
                                                {q.options?.map((opt, oIdx) => (
                                                    <div key={oIdx} className="border border-gray-200 rounded-lg px-4 py-2.5 text-xs text-gray-600 font-medium bg-gray-50/50">
                                                        ({String.fromCharCode(65 + oIdx)}) {opt}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {previewQuestions['Short Answer']?.length > 0 && (
                            <div>
                                <h3 className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-4 mt-8">Section B: Short Analysis</h3>
                                {previewQuestions['Short Answer'].map((q, idx) => (
                                    <div key={q._id} className="flex gap-3 mb-6">
                                        <span className="font-bold text-gray-900">Q{(previewQuestions['MCQ']?.length || 0) + idx + 1}.</span>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-gray-800">{q.questionText}</p>
                                            <div className="h-24 w-full mt-3 border-b-2 border-dashed border-gray-200"></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {previewQuestions['Long Answer']?.length > 0 && (
                            <div>
                                <h3 className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-4 mt-8">Section C: Critical Theory</h3>
                                {previewQuestions['Long Answer'].map((q, idx) => (
                                    <div key={q._id} className="flex gap-3 mb-8">
                                        <span className="font-bold text-gray-900">Q{(previewQuestions['MCQ']?.length || 0) + (previewQuestions['Short Answer']?.length || 0) + idx + 1}.</span>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-gray-800">{q.questionText}</p>
                                            <div className="h-48 w-full mt-3 border-b-2 border-dashed border-gray-200 flex flex-col justify-between">
                                                <div className="h-12 w-full border-b border-dashed border-gray-100"></div>
                                                <div className="h-12 w-full border-b border-dashed border-gray-100"></div>
                                                <div className="h-12 w-full border-b border-dashed border-gray-100"></div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        
                        {previewQuestions['True/False']?.length > 0 && (
                            <div>
                                <h3 className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-4 mt-8">Section D: True or False</h3>
                                {previewQuestions['True/False'].map((q, idx) => (
                                    <div key={q._id} className="flex gap-3 mb-6">
                                        <span className="font-bold text-gray-900">Q{(previewQuestions['MCQ']?.length || 0) + (previewQuestions['Short Answer']?.length || 0) + (previewQuestions['Long Answer']?.length || 0) + idx + 1}.</span>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-gray-800 mb-4">{q.questionText}</p>
                                            <div className="flex gap-4">
                                                <div className="border border-gray-200 rounded-lg px-6 py-2.5 text-xs text-gray-600 font-medium bg-gray-50/50">True</div>
                                                <div className="border border-gray-200 rounded-lg px-6 py-2.5 text-xs text-gray-600 font-medium bg-gray-50/50">False</div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        
                        {Object.values(previewQuestions).every(arr => arr?.length === 0) && (
                            <div className="py-20 text-center">
                                <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <BookOpen className="w-6 h-6 text-gray-300 dark:text-gray-600" />
                                </div>
                                <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1">No Questions Selected</h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Configure your distribution on the left to see a live preview.</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 px-6 py-3 flex justify-between items-center">
                    <span className="text-[10px] font-bold text-gray-400">Draft Auto-saved 2m ago</span>
                    <div className="flex gap-3">
                        <span className="text-[10px] font-bold text-gray-400 flex items-center gap-1"><BookOpen className="w-3 h-3"/> PDF</span>
                        <span className="text-[10px] font-bold text-gray-400 flex items-center gap-1"><BookOpen className="w-3 h-3"/> Print</span>
                    </div>
                </div>
            </div>

        </form>
    </div>
  );
};

export default GenerateExam;