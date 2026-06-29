import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../utils/axiosConfig';
import { 
    Sparkles, BookOpen, Target, Save, Clock, ChevronDown, ChevronUp, 
    Plus, Trash2, Layout, Settings, FileText, Check, X, Search, Activity, Building2, RotateCcw
} from 'lucide-react';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

const GenerateExam = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('editId');

  // --- STATE ---
  const [currentStep, setCurrentStep] = useState(1);
  const [previewTab, setPreviewTab] = useState('Preview');
  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
  const [isMobilePreviewOpen, setIsMobilePreviewOpen] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [subjectsList, setSubjectsList] = useState([]);
  const [subjectSearch, setSubjectSearch] = useState('');
  const [isSubjectDropdownOpen, setIsSubjectDropdownOpen] = useState(false);

  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');

  const [formData, setFormData] = useState({
      examMode: 'Single Subject',
      subject: [], 
      examTitle: 'Midterm Assessment',
      examDate: '',
      duration: 180,
      totalMarks: 100,
      
      institutionType: 'College',
      institutionName: '',
      department: '',
      academicSession: '',
      courseCode: '',
      topic: '',
      
      blueprint: [],
      
      logo: '',
      examHeaderStyle: 'Style 1',
      instructions: '',
  });

  const [diffMix, setDiffMix] = useState({ easy: 30, medium: 50, hard: 20 });
  const [unsavedChanges, setUnsavedChanges] = useState(false);

  const [newSection, setNewSection] = useState({
      sectionName: '',
      type: 'MCQ',
      difficulty: 'Medium',
      questionCount: 10,
      marksPerQuestion: 1,
      timeAllocation: 0,
      topics: ''
  });

  // --- LIFECYCLE ---
  useEffect(() => {
      fetchInitialData();
      
      const savedDraft = localStorage.getItem('examDraft');
      if (savedDraft && !editId) {
          try { setFormData(JSON.parse(savedDraft)); } catch(e){}
      }

      const handleBeforeUnload = (e) => {
          if (unsavedChanges) e.returnValue = 'You have unsaved changes.';
      };
      window.addEventListener('beforeunload', handleBeforeUnload);
      return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  useEffect(() => {
      if (unsavedChanges) {
          const timer = setTimeout(() => {
              localStorage.setItem('examDraft', JSON.stringify(formData));
              setSaveStatus('Saved just now');
              setUnsavedChanges(false);
              setTimeout(() => setSaveStatus(''), 3000);
          }, 2000); // Save after 2s of inactivity
          return () => clearTimeout(timer);
      }
  }, [formData, unsavedChanges]);

  const handleChange = (field, value) => {
      setFormData(p => ({ ...p, [field]: value }));
      setUnsavedChanges(true);
      setSaveStatus('Saving...');
  };

  const fetchInitialData = async () => {
      try {
          const [qRes, instRes] = await Promise.all([
              api.get('/questions', { params: { limit: 10000 } }),
              api.get('/settings/institution').catch(() => ({ data: null }))
          ]);
          
          const uniqueSubjects = [...new Set((qRes.data.questions || []).map(q => q.subject))];
          setSubjectsList(uniqueSubjects);

          if (editId) {
              const examRes = await api.get(`/exams/${editId}`);
              const exam = examRes.data;
              setFormData({
                  examMode: exam.examMode || 'Single Subject',
                  subject: Array.isArray(exam.subject) ? exam.subject : exam.subject ? exam.subject.split(',').map(s=>s.trim()) : [],
                  examTitle: exam.examTitle,
                  institutionName: exam.collegeName || exam.institutionName || '',
                  institutionType: exam.institutionType || 'College',
                  department: exam.department || '',
                  academicSession: exam.academicSession || '',
                  courseCode: exam.courseCode || '',
                  logo: exam.logo || '',
                  instructions: exam.instructions || '',
                  examHeaderStyle: exam.examHeaderStyle || 'Style 1',
                  topic: exam.topic || '',
                  examDate: exam.examDate ? exam.examDate.split('T')[0] : '',
                  duration: exam.duration || 180,
                  totalMarks: exam.totalMarks || 100,
                  blueprint: exam.blueprint || []
              });
          } else if (instRes.data) {
              const defaults = instRes.data;
              setFormData(p => ({
                  ...p,
                  institutionName: defaults.institutionName || p.institutionName,
                  institutionType: defaults.institutionType || p.institutionType,
                  department: defaults.department || p.department,
                  academicSession: defaults.academicSession || p.academicSession,
                  logo: defaults.logoUrl || p.logo,
                  instructions: defaults.instructions || p.instructions,
                  examTitle: defaults.defaultExamTitle || p.examTitle
              }));
          }
      } catch (err) {
          console.error('Fetch error:', err);
      }
  };

  // --- LOGIC ---
  const handleDiffChange = (type, val) => {
      let v = Number(val);
      if (v < 0) v = 0;
      if (v > 100) v = 100;

      const newMix = { ...diffMix, [type]: v };
      const diff = 100 - v;
      
      if (type === 'easy') {
          const mRatio = diffMix.medium / ((diffMix.medium + diffMix.hard) || 1);
          newMix.medium = Math.round(diff * mRatio);
          newMix.hard = diff - newMix.medium;
      } else if (type === 'medium') {
          const eRatio = diffMix.easy / ((diffMix.easy + diffMix.hard) || 1);
          newMix.easy = Math.round(diff * eRatio);
          newMix.hard = diff - newMix.easy;
      } else {
          const eRatio = diffMix.easy / ((diffMix.easy + diffMix.medium) || 1);
          newMix.easy = Math.round(diff * eRatio);
          newMix.medium = diff - newMix.easy;
      }
      setDiffMix(newMix);
      setUnsavedChanges(true);
  };

  const handleSubjectToggle = (sub) => {
      if (formData.examMode === 'Single Subject') {
          handleChange('subject', [sub]);
          setIsSubjectDropdownOpen(false);
      } else {
          const cur = [...formData.subject];
          if (cur.includes(sub)) handleChange('subject', cur.filter(s => s !== sub));
          else handleChange('subject', [...cur, sub]);
      }
  };

  const handleAddSection = () => {
      if (!newSection.sectionName || newSection.questionCount <= 0 || newSection.marksPerQuestion <= 0) {
          return toast.error("Please provide valid section name, count, and marks.");
      }
      handleChange('blueprint', [...formData.blueprint, { ...newSection }]);
      setIsSectionModalOpen(false);
      setNewSection({ sectionName: '', type: 'MCQ', difficulty: 'Medium', questionCount: 10, marksPerQuestion: 1, timeAllocation: 0, topics: '' });
  };

  const handleDeleteSection = (index) => {
      handleChange('blueprint', formData.blueprint.filter((_, i) => i !== index));
  };

  const handleGenerate = async () => {
      if (formData.blueprint.length === 0) return toast.error('Blueprint requires at least one section.');
      if (formData.subject.length === 0) return toast.error('Please select at least one subject.');

      setLoading(true);
      try {
          const payload = {
              ...formData,
              collegeName: formData.institutionName,
              subject: formData.subject.join(', '),
              difficultyMix: diffMix // send to backend if supported
          };
          const res = await api.post('/exams/generate', payload);
          toast.success('Exam generated successfully!');
          localStorage.removeItem('examDraft');
          setUnsavedChanges(false);
          navigate(`/exams/${res.data._id}`);
      } catch (err) {
          toast.error(err.response?.data?.msg || 'Failed to generate exam');
      } finally {
          setLoading(false);
      }
  };

  const handleSaveDraft = () => {
      localStorage.setItem('examDraft', JSON.stringify(formData));
      setUnsavedChanges(false);
      toast.success("Draft saved successfully!");
  };

  const handleReset = () => {
      if (window.confirm("Are you sure you want to reset all data?")) {
          localStorage.removeItem('examDraft');
          window.location.reload();
      }
  };

  // --- COMPUTED ---
  const filteredSubjects = subjectsList.filter(s => s.toLowerCase().includes(subjectSearch.toLowerCase()));
  
  const stats = useMemo(() => {
      let qCount = 0;
      let totalM = 0;
      formData.blueprint.forEach(s => {
          qCount += Number(s.questionCount);
          totalM += (Number(s.questionCount) * Number(s.marksPerQuestion));
      });
      return { qCount, totalM, sections: formData.blueprint.length, pages: Math.ceil(qCount / 8) || 1 };
  }, [formData.blueprint]);


  // --- RENDERERS ---
  const renderStepNav = () => (
      <div className="flex items-center gap-2 md:gap-4 mb-8 overflow-x-auto pb-2 scrollbar-hide">
          {[
              { id: 1, title: 'Exam Details', icon: <FileText className="w-4 h-4" /> },
              { id: 2, title: 'Question Blueprint', icon: <Target className="w-4 h-4" /> },
              { id: 3, title: 'Institution', icon: <Building2 className="w-4 h-4" /> }
          ].map((s, i) => (
              <React.Fragment key={s.id}>
                  <button 
                      onClick={() => setCurrentStep(s.id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm whitespace-nowrap transition-all ${currentStep === s.id ? 'bg-indigo-600 text-white shadow-md' : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                  >
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${currentStep === s.id ? 'bg-white/20' : 'bg-gray-100'}`}>{s.id}</span>
                      {s.title}
                  </button>
                  {i < 2 && <div className="hidden md:block flex-1 h-px bg-gray-200"></div>}
              </React.Fragment>
          ))}
      </div>
  );

  return (
    <div className="max-w-[1400px] mx-auto pb-24 px-4 min-h-screen">
        
        {/* Header */}
        <div className="flex justify-between items-end mb-6 pt-4">
            <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">Generate Exam</h1>
                <p className="text-gray-500 text-sm">Design and automatically generate premium exam papers.</p>
            </div>
            {saveStatus && <span className="text-xs font-semibold text-gray-400 animate-pulse">{saveStatus}</span>}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* LEFT COLUMN - FORM */}
            <div className="lg:col-span-8 space-y-6 max-w-[900px]">
                {renderStepNav()}

                {/* STEP 1 */}
                {currentStep === 1 && (
                    <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 space-y-8 animate-in fade-in slide-in-from-bottom-4">
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2"><FileText className="w-5 h-5 text-indigo-500"/> Exam Details</h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Exam Type</label>
                                <div className="flex bg-gray-100 p-1 rounded-xl">
                                    <button type="button" onClick={() => handleChange('examMode', 'Single Subject')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${formData.examMode === 'Single Subject' ? 'bg-white text-gray-900 shadow' : 'text-gray-500'}`}>Single</button>
                                    <button type="button" onClick={() => handleChange('examMode', 'Multi Subject')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${formData.examMode === 'Multi Subject' ? 'bg-white text-gray-900 shadow' : 'text-gray-500'}`}>Multi Subject</button>
                                </div>
                            </div>
                            
                            <div className="relative">
                                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Subject(s)</label>
                                <div className="min-h-[44px] w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 flex flex-wrap gap-2 items-center cursor-text" onClick={() => setIsSubjectDropdownOpen(true)}>
                                    {formData.subject.map(sub => (
                                        <span key={sub} className="bg-white border border-gray-200 text-xs font-bold px-2 py-1 rounded flex items-center gap-1 shadow-sm">
                                            {sub} <X className="w-3 h-3 cursor-pointer hover:text-red-500" onClick={(e) => { e.stopPropagation(); handleSubjectToggle(sub); }}/>
                                        </span>
                                    ))}
                                    <input type="text" placeholder={formData.subject.length === 0 ? 'Search subjects...' : ''} value={subjectSearch} onChange={e => {setSubjectSearch(e.target.value); setIsSubjectDropdownOpen(true)}} className="flex-1 bg-transparent text-sm outline-none min-w-[100px]" onFocus={() => setIsSubjectDropdownOpen(true)} />
                                </div>
                                {isSubjectDropdownOpen && (
                                    <>
                                        <div className="fixed inset-0 z-10" onClick={() => setIsSubjectDropdownOpen(false)}></div>
                                        <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-xl max-h-60 overflow-y-auto py-1">
                                            {filteredSubjects.length === 0 && <div className="px-4 py-2 text-sm text-gray-500">No subjects found</div>}
                                            {filteredSubjects.map(s => (
                                                <div key={s} onClick={() => handleSubjectToggle(s)} className={`px-4 py-2 text-sm font-medium cursor-pointer hover:bg-indigo-50 flex justify-between ${formData.subject.includes(s) ? 'text-indigo-600 bg-indigo-50/50' : 'text-gray-700'}`}>
                                                    {s} {formData.subject.includes(s) && <Check className="w-4 h-4"/>}
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Exam Title</label>
                                <input type="text" value={formData.examTitle} onChange={e => handleChange('examTitle', e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
                            </div>
                            
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Exam Date</label>
                                <input type="date" value={formData.examDate} onChange={e => handleChange('examDate', e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Duration (Mins)</label>
                                    <input type="number" value={formData.duration} onChange={e => handleChange('duration', e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold outline-none" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Total Marks</label>
                                    <input type="number" value={formData.totalMarks} onChange={e => handleChange('totalMarks', e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold outline-none" />
                                </div>
                            </div>
                            
                            {/* Difficulty Sliders */}
                            <div className="md:col-span-2 bg-gray-50 rounded-xl p-5 border border-gray-200">
                                <label className="block text-xs font-bold text-gray-700 mb-4 uppercase tracking-wide flex items-center justify-between">
                                    Global Difficulty Target
                                    <span className={`px-2 py-1 rounded text-[10px] ${(diffMix.easy+diffMix.medium+diffMix.hard) === 100 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>Sum: {diffMix.easy+diffMix.medium+diffMix.hard}%</span>
                                </label>
                                <div className="grid grid-cols-3 gap-6">
                                    <div>
                                        <div className="flex justify-between text-xs font-bold mb-1"><span className="text-green-600">Easy</span> <span>{diffMix.easy}%</span></div>
                                        <input type="range" min="0" max="100" value={diffMix.easy} onChange={(e) => handleDiffChange('easy', e.target.value)} className="w-full accent-green-500" />
                                    </div>
                                    <div>
                                        <div className="flex justify-between text-xs font-bold mb-1"><span className="text-yellow-600">Medium</span> <span>{diffMix.medium}%</span></div>
                                        <input type="range" min="0" max="100" value={diffMix.medium} onChange={(e) => handleDiffChange('medium', e.target.value)} className="w-full accent-yellow-500" />
                                    </div>
                                    <div>
                                        <div className="flex justify-between text-xs font-bold mb-1"><span className="text-red-600">Hard</span> <span>{diffMix.hard}%</span></div>
                                        <input type="range" min="0" max="100" value={diffMix.hard} onChange={(e) => handleDiffChange('hard', e.target.value)} className="w-full accent-red-500" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Advanced Settings */}
                        <div className="border border-gray-200 rounded-xl overflow-hidden bg-gray-50">
                            <button type="button" onClick={() => setShowAdvanced(!showAdvanced)} className="w-full flex items-center justify-between px-5 py-4 font-bold text-sm text-gray-700 hover:bg-gray-100">
                                <span className="flex items-center gap-2"><Settings className="w-4 h-4"/> Advanced Settings</span>
                                {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                            {showAdvanced && (
                                <div className="p-5 border-t border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-4 bg-white">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Institution Type</label>
                                        <input type="text" value={formData.institutionType} onChange={e => handleChange('institutionType', e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Department</label>
                                        <input type="text" value={formData.department} onChange={e => handleChange('department', e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Course Code</label>
                                        <input type="text" value={formData.courseCode} onChange={e => handleChange('courseCode', e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Academic Session</label>
                                        <input type="text" value={formData.academicSession} onChange={e => handleChange('academicSession', e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Global Topic Scope</label>
                                        <input type="text" value={formData.topic} onChange={e => handleChange('topic', e.target.value)} placeholder="Limit entire exam to specific topics..." className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* STEP 2 */}
                {currentStep === 2 && (
                    <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6 animate-in fade-in slide-in-from-bottom-4">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2"><Target className="w-5 h-5 text-indigo-500"/> Question Blueprint</h2>
                            <button onClick={() => setIsSectionModalOpen(true)} className="bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-colors">
                                <Plus className="w-4 h-4"/> Add Section
                            </button>
                        </div>

                        <div className="grid grid-cols-3 gap-4 mb-4">
                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-center">
                                <p className="text-xs font-bold text-gray-500 uppercase">Sections</p>
                                <p className="text-2xl font-black text-gray-900">{stats.sections}</p>
                            </div>
                            <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 text-center">
                                <p className="text-xs font-bold text-indigo-500 uppercase">Questions</p>
                                <p className="text-2xl font-black text-indigo-700">{stats.qCount}</p>
                            </div>
                            <div className={`p-4 rounded-xl border text-center ${stats.totalM === Number(formData.totalMarks) ? 'bg-green-50 border-green-100' : 'bg-yellow-50 border-yellow-100'}`}>
                                <p className={`text-xs font-bold uppercase ${stats.totalM === Number(formData.totalMarks) ? 'text-green-600' : 'text-yellow-600'}`}>Marks</p>
                                <p className={`text-2xl font-black ${stats.totalM === Number(formData.totalMarks) ? 'text-green-700' : 'text-yellow-700'}`}>{stats.totalM} <span className="text-sm font-bold text-gray-400">/ {formData.totalMarks}</span></p>
                            </div>
                        </div>

                        {formData.blueprint.length === 0 ? (
                            <div className="border-2 border-dashed border-gray-200 rounded-xl p-12 text-center">
                                <Target className="w-12 h-12 text-gray-300 mx-auto mb-3"/>
                                <h3 className="text-gray-900 font-bold mb-1">No sections added</h3>
                                <p className="text-gray-500 text-sm mb-4">Break your exam into logical sections (e.g., MCQs, Long Answers).</p>
                                <button onClick={() => setIsSectionModalOpen(true)} className="text-indigo-600 font-bold text-sm hover:underline">Create first section</button>
                            </div>
                        ) : (
                            <div className="overflow-x-auto border border-gray-200 rounded-xl">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-gray-50 text-gray-500 font-bold text-xs uppercase tracking-wider">
                                        <tr>
                                            <th className="p-4">Section</th>
                                            <th className="p-4">Type</th>
                                            <th className="p-4">Difficulty</th>
                                            <th className="p-4 text-center">Qs</th>
                                            <th className="p-4 text-center">Marks/Q</th>
                                            <th className="p-4 text-right">Total</th>
                                            <th className="p-4"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {formData.blueprint.map((sec, i) => (
                                            <tr key={i} className="hover:bg-gray-50">
                                                <td className="p-4 font-bold text-gray-900">{sec.sectionName}</td>
                                                <td className="p-4 font-medium text-gray-600">{sec.type}</td>
                                                <td className="p-4"><span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-bold border border-gray-200">{sec.difficulty}</span></td>
                                                <td className="p-4 text-center font-bold">{sec.questionCount}</td>
                                                <td className="p-4 text-center font-medium text-gray-500">{sec.marksPerQuestion}</td>
                                                <td className="p-4 text-right font-black text-gray-800">{Number(sec.questionCount) * Number(sec.marksPerQuestion)}</td>
                                                <td className="p-4 text-right">
                                                    <button onClick={() => handleDeleteSection(i)} className="text-gray-400 hover:text-red-500 transition-colors p-1"><Trash2 className="w-4 h-4"/></button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* STEP 3 */}
                {currentStep === 3 && (
                    <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6 animate-in fade-in slide-in-from-bottom-4">
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2"><Building2 className="w-5 h-5 text-indigo-500"/> Institution Settings</h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Institution Name</label>
                                <input type="text" value={formData.institutionName} onChange={e => handleChange('institutionName', e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-indigo-500" />
                            </div>
                            
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Header Style</label>
                                <select value={formData.examHeaderStyle} onChange={e => handleChange('examHeaderStyle', e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-indigo-500">
                                    <option value="Style 1">Style 1 - Minimalist</option>
                                    <option value="Style 2">Style 2 - Detailed Box</option>
                                    <option value="Style 3">Style 3 - Classic Academic</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Logo URL</label>
                                <input type="text" value={formData.logo} onChange={e => handleChange('logo', e.target.value)} placeholder="https://..." className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-indigo-500" />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">General Instructions</label>
                                <textarea value={formData.instructions} onChange={e => handleChange('instructions', e.target.value)} placeholder="1. All questions are compulsory..." className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-4 text-sm font-medium outline-none focus:border-indigo-500 h-32 resize-none"></textarea>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* RIGHT COLUMN - PREVIEW (Desktop: Sticky, Mobile: Modal) */}
            <div className={`lg:col-span-4 ${isMobilePreviewOpen ? 'fixed inset-0 z-50 bg-gray-900/50 flex items-end sm:items-center justify-center p-4' : 'hidden lg:block'}`}>
                <div className={`bg-white rounded-2xl shadow-xl border border-gray-200 w-full overflow-hidden flex flex-col ${isMobilePreviewOpen ? 'max-h-[90vh]' : 'sticky top-4 h-[calc(100vh-8rem)]'}`}>
                    
                    {isMobilePreviewOpen && (
                        <div className="flex justify-between items-center p-4 border-b border-gray-100 lg:hidden bg-gray-50">
                            <h3 className="font-bold text-gray-900">Live Preview</h3>
                            <button onClick={() => setIsMobilePreviewOpen(false)} className="p-2 bg-gray-200 rounded-full"><X className="w-4 h-4"/></button>
                        </div>
                    )}

                    <div className="flex border-b border-gray-100 bg-gray-50/50 shrink-0">
                        <button onClick={() => setPreviewTab('Preview')} className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${previewTab === 'Preview' ? 'border-indigo-600 text-indigo-600 bg-white' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Preview</button>
                        <button onClick={() => setPreviewTab('Statistics')} className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${previewTab === 'Statistics' ? 'border-indigo-600 text-indigo-600 bg-white' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Statistics</button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 bg-gray-50/30">
                        {previewTab === 'Preview' ? (
                            <div className="bg-white border border-gray-200 shadow-sm rounded-lg p-6 min-h-[400px]">
                                <div className="text-center border-b-2 border-gray-900 pb-4 mb-4">
                                    <h1 className="text-xl font-black uppercase font-serif tracking-wide">{formData.institutionName || 'INSTITUTION NAME'}</h1>
                                    <h2 className="text-md font-bold mt-1 text-gray-800">{formData.examTitle}</h2>
                                    <p className="text-xs font-semibold text-gray-600 mt-2 uppercase tracking-widest">{formData.subject.length > 0 ? formData.subject.join(', ') : 'SUBJECT'}</p>
                                </div>
                                <div className="flex justify-between text-xs font-bold text-gray-800 border-b border-gray-300 pb-2 mb-4">
                                    <span>Date: {formData.examDate || '___/___/_____'}</span>
                                    <span>Time: {formData.duration} Mins</span>
                                    <span>Marks: {formData.totalMarks}</span>
                                </div>
                                {formData.instructions && (
                                    <div className="mb-6 border border-gray-200 p-3 bg-gray-50 rounded">
                                        <p className="text-xs font-bold uppercase mb-1">Instructions:</p>
                                        <p className="text-xs whitespace-pre-line text-gray-600">{formData.instructions}</p>
                                    </div>
                                )}
                                <div className="space-y-6">
                                    {formData.blueprint.map((sec, i) => (
                                        <div key={i} className="mb-4">
                                            <h3 className="text-sm font-bold border-b border-gray-200 pb-1 mb-2">{sec.sectionName}</h3>
                                            <p className="text-xs text-gray-500 italic mb-2">Contains {sec.questionCount} {sec.type} questions. ({sec.marksPerQuestion} Marks each)</p>
                                            <div className="space-y-2">
                                                {[...Array(Math.min(2, Number(sec.questionCount)))].map((_, idx) => (
                                                    <div key={idx} className="text-xs text-gray-700 flex gap-2">
                                                        <span>{idx+1}.</span>
                                                        <div className="h-3 bg-gray-200 rounded w-full mt-1 opacity-50"></div>
                                                    </div>
                                                ))}
                                                {Number(sec.questionCount) > 2 && <p className="text-[10px] text-gray-400 text-center mt-2">... {Number(sec.questionCount) - 2} more questions</p>}
                                            </div>
                                        </div>
                                    ))}
                                    {formData.blueprint.length === 0 && (
                                        <div className="text-center py-10 text-gray-300">
                                            <Layout className="w-8 h-8 mx-auto mb-2 opacity-50"/>
                                            <p className="text-xs font-bold">Add sections to see preview</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div>
                                    <h4 className="text-xs font-bold text-gray-500 uppercase mb-3 tracking-wider">Exam Overview</h4>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                                            <p className="text-xl font-black text-gray-900">{stats.qCount}</p>
                                            <p className="text-xs font-bold text-gray-500 uppercase">Questions</p>
                                        </div>
                                        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                                            <p className="text-xl font-black text-gray-900">{stats.totalM}</p>
                                            <p className="text-xs font-bold text-gray-500 uppercase">Allocated Marks</p>
                                        </div>
                                        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                                            <p className="text-xl font-black text-gray-900">{stats.sections}</p>
                                            <p className="text-xs font-bold text-gray-500 uppercase">Sections</p>
                                        </div>
                                        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                                            <p className="text-xl font-black text-gray-900">~{stats.pages}</p>
                                            <p className="text-xs font-bold text-gray-500 uppercase">Est. Pages</p>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-xs font-bold text-gray-500 uppercase mb-3 tracking-wider">Difficulty Profile (Target)</h4>
                                    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 space-y-4">
                                        <div>
                                            <div className="flex justify-between text-xs font-bold mb-1"><span className="text-green-600">Easy</span> <span>{diffMix.easy}%</span></div>
                                            <div className="w-full bg-gray-100 rounded-full h-1.5"><div className="bg-green-500 h-1.5 rounded-full" style={{width: `${diffMix.easy}%`}}></div></div>
                                        </div>
                                        <div>
                                            <div className="flex justify-between text-xs font-bold mb-1"><span className="text-yellow-600">Medium</span> <span>{diffMix.medium}%</span></div>
                                            <div className="w-full bg-gray-100 rounded-full h-1.5"><div className="bg-yellow-500 h-1.5 rounded-full" style={{width: `${diffMix.medium}%`}}></div></div>
                                        </div>
                                        <div>
                                            <div className="flex justify-between text-xs font-bold mb-1"><span className="text-red-600">Hard</span> <span>{diffMix.hard}%</span></div>
                                            <div className="w-full bg-gray-100 rounded-full h-1.5"><div className="bg-red-500 h-1.5 rounded-full" style={{width: `${diffMix.hard}%`}}></div></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>

        {/* BOTTOM ACTION BAR */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-40 p-4">
            <div className="max-w-[1400px] mx-auto flex flex-wrap lg:flex-nowrap items-center justify-between gap-4">
                <button onClick={() => setIsMobilePreviewOpen(true)} className="lg:hidden flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-3 rounded-xl font-bold text-sm flex justify-center items-center gap-2"><Layout className="w-4 h-4"/> Preview</button>
                
                <div className="hidden lg:flex items-center gap-4 text-sm font-bold text-gray-500">
                    <button onClick={handleReset} className="hover:text-red-500 transition-colors flex items-center gap-1"><RotateCcw className="w-4 h-4"/> Reset</button>
                    <span className="w-px h-4 bg-gray-300"></span>
                    <button onClick={handleSaveDraft} className="hover:text-indigo-600 transition-colors flex items-center gap-1"><Save className="w-4 h-4"/> Save Draft</button>
                </div>

                <div className="w-full lg:w-auto flex flex-1 lg:flex-none gap-3">
                    <button onClick={handleSaveDraft} className="lg:hidden flex-1 bg-white border border-gray-200 text-gray-700 px-4 py-3 rounded-xl font-bold text-sm text-center">Save Draft</button>
                    <button disabled={loading} onClick={handleGenerate} className="flex-[2] lg:flex-none bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3.5 rounded-xl font-black text-sm lg:text-base flex justify-center items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-70">
                        {loading ? <Activity className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5"/>} 
                        Generate Exam Paper
                    </button>
                </div>
            </div>
        </div>

        {/* ADD SECTION MODAL */}
        {isSectionModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95">
                    <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                        <h3 className="font-bold text-gray-900 text-lg">Add Section</h3>
                        <button onClick={() => setIsSectionModalOpen(false)} className="text-gray-400 hover:text-gray-600 bg-white rounded-full p-1 border border-gray-200 shadow-sm"><X className="w-5 h-5"/></button>
                    </div>
                    
                    <div className="p-6 space-y-5">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase">Section Name</label>
                            <input type="text" value={newSection.sectionName} onChange={e => setNewSection({...newSection, sectionName: e.target.value})} placeholder="e.g. Section A: Multiple Choice" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-indigo-500" />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase">Question Type</label>
                                <select value={newSection.type} onChange={e => setNewSection({...newSection, type: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-indigo-500">
                                    <option>MCQ</option><option>Short Answer</option><option>Long Answer</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase">Difficulty</label>
                                <select value={newSection.difficulty} onChange={e => setNewSection({...newSection, difficulty: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-indigo-500">
                                    <option>Mixed</option><option>Easy</option><option>Medium</option><option>Hard</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase">No. of Questions</label>
                                <input type="number" min="1" value={newSection.questionCount} onChange={e => setNewSection({...newSection, questionCount: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-indigo-500 text-center" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase">Marks Per Q</label>
                                <input type="number" min="0.5" step="0.5" value={newSection.marksPerQuestion} onChange={e => setNewSection({...newSection, marksPerQuestion: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-indigo-500 text-center" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase">Specific Topics (Optional)</label>
                            <input type="text" value={newSection.topics} onChange={e => setNewSection({...newSection, topics: e.target.value})} placeholder="e.g. Arrays, Trees, Graphs" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-indigo-500" />
                        </div>

                        <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100 flex justify-between items-center mt-2">
                            <span className="text-sm font-bold text-indigo-800">Section Total:</span>
                            <span className="text-xl font-black text-indigo-600">{Number(newSection.questionCount || 0) * Number(newSection.marksPerQuestion || 0)} Marks</span>
                        </div>
                    </div>
                    
                    <div className="p-5 border-t border-gray-100 bg-gray-50 flex gap-3">
                        <button onClick={() => setIsSectionModalOpen(false)} className="flex-1 bg-white border border-gray-200 text-gray-600 px-4 py-3 rounded-xl font-bold text-sm hover:bg-gray-100 transition-colors">Cancel</button>
                        <button onClick={handleAddSection} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-xl font-bold text-sm transition-colors shadow-md shadow-indigo-600/20">Save Section</button>
                    </div>
                </div>
            </div>
        )}

    </div>
  );
};

export default GenerateExam;