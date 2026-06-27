import React, { useState, useEffect } from 'react';
import api from '../utils/axiosConfig';
import { Search, Plus, Filter, Trash2, Edit2, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { toast } from 'react-toastify';

const Questions = () => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  
  const [filters, setFilters] = useState({ subject: '', difficulty: '', type: '', search: '' });
  
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [newQuestion, setNewQuestion] = useState({
    questionText: '', subject: '', difficulty: 'Medium', type: 'MCQ', options: ['', '', '', ''], correctAnswer: '',
    required: true, shuffleOptions: false
  });
  const [subjects, setSubjects] = useState([]);

  useEffect(() => {
    fetchQuestions();
  }, [filters, pagination.page]);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const params = { page: pagination.page, limit: 10 };
      if (filters.subject) params.subject = filters.subject;
      if (filters.difficulty) params.difficulty = filters.difficulty;
      if (filters.type) params.type = filters.type;
      if (filters.search) params.search = filters.search;

      const res = await api.get('/questions', { params });
      setQuestions(res.data.questions || res.data);
      if (res.data.pages !== undefined) {
          setPagination(prev => ({ ...prev, page: res.data.page, pages: res.data.pages, total: res.data.total }));
      }
      
      const allRes = await api.get('/questions');
      const allQuestionsData = allRes.data.questions || allRes.data;
      const uniqueSubjects = [...new Set(allQuestionsData.map(q => q.subject))];
      setSubjects(uniqueSubjects);
    } catch (err) {
      console.error('Error fetching questions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubmit = async (e, status = 'active') => {
    if (e) e.preventDefault();
    
    // Add custom validation
    if (!newQuestion.questionText.trim()) return toast.error('Question text is required');
    if (!newQuestion.subject.trim()) return toast.error('Subject is required');
    
    if (newQuestion.type === 'MCQ') {
        const filledOptions = newQuestion.options.filter(o => o.trim() !== '');
        if (filledOptions.length < 2) return toast.error('At least 2 options are required for MCQ');
        if (!newQuestion.correctAnswer && status === 'active') return toast.error('Please select the correct answer');
    } else {
        if (!newQuestion.correctAnswer.trim() && status === 'active') return toast.error('Answer / Rubric is required');
    }

    try {
      const formData = new FormData();
      formData.append('questionText', newQuestion.questionText);
      formData.append('subject', newQuestion.subject);
      formData.append('difficulty', newQuestion.difficulty);
      formData.append('type', newQuestion.type);
      formData.append('required', newQuestion.required);
      formData.append('shuffleOptions', newQuestion.shuffleOptions);
      formData.append('status', status);
      
      if (newQuestion.type === 'MCQ') {
          formData.append('options', JSON.stringify(newQuestion.options));
          formData.append('correctAnswer', newQuestion.correctAnswer);
      } else {
          formData.append('correctAnswer', newQuestion.correctAnswer);
      }

      if (editingId) {
          await api.put(`/questions/${editingId}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
          toast.success('Question updated successfully!');
      } else {
          await api.post('/questions', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
          toast.success(status === 'draft' ? 'Draft saved successfully!' : 'Question added successfully!');
      }
      
      setNewQuestion({
        questionText: '', subject: '', difficulty: 'Medium', type: 'MCQ', options: ['', '', '', ''], correctAnswer: '', required: true, shuffleOptions: false
      });
      setIsAddOpen(false);
      setEditingId(null);
      fetchQuestions();
    } catch (err) {
      console.error('Error adding question:', err);
      toast.error('Failed to add question');
    }
  };

  const handleCancel = () => {
    if (window.confirm("Are you sure you want to discard changes?")) {
        setNewQuestion({
            questionText: '', subject: '', difficulty: 'Medium', type: 'MCQ', options: ['', '', '', ''], correctAnswer: '', required: true, shuffleOptions: false
        });
        setIsAddOpen(false);
        setEditingId(null);
    }
  };

  const handleEdit = (q) => {
    setNewQuestion({
        questionText: q.questionText || '',
        subject: q.subject || '',
        difficulty: q.difficulty || 'Medium',
        type: q.type || 'MCQ',
        options: q.options && q.options.length > 0 ? [...q.options, ...Array(Math.max(0, 4 - q.options.length)).fill('')] : ['', '', '', ''],
        correctAnswer: q.correctAnswer || '',
        required: q.required ?? true,
        shuffleOptions: q.shuffleOptions ?? false
    });
    setEditingId(q._id);
    setIsAddOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this question?')) {
      await api.delete(`/questions/${id}`);
      fetchQuestions();
    }
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...newQuestion.options];
    newOptions[index] = value;
    setNewQuestion({ ...newQuestion, options: newOptions });
  };

  const renderBadge = (value, type) => {
      let classes = 'px-3 py-1 rounded-full text-xs font-bold border ';
      if (type === 'difficulty') {
          if (value === 'Easy') classes += 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700';
          if (value === 'Medium') classes += 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800/50';
          if (value === 'Hard') classes += 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800/50';
      }
      return <span className={classes}>{value}</span>;
  };

  if (isAddOpen) {
    return (
        <div className="max-w-[1400px] mx-auto pb-8">
            <div className="mb-6 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 font-semibold">
                <button onClick={() => setIsAddOpen(false)} className="hover:text-indigo-600 dark:hover:text-indigo-400">Questions</button>
                <ChevronRight className="w-4 h-4" />
                <span className="text-gray-900 dark:text-white">{editingId ? 'Edit Question' : 'Add New Question'}</span>
            </div>
            
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create Academic Content</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">Build precise questions for your educational database with metadata tagging.</p>
            </div>

            <form onSubmit={handleAddSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    
                    {/* Meta Config */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2">Question Type</label>
                            <select value={newQuestion.type} onChange={(e) => setNewQuestion({...newQuestion, type: e.target.value})} className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-500/20">
                                <option value="MCQ">Multiple Choice (MCQ)</option>
                                <option value="Short Answer">Short Answer</option>
                                <option value="Long Answer">Long Answer</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2">Subject</label>
                            <input type="text" list="subject-options" value={newQuestion.subject} onChange={(e) => setNewQuestion({...newQuestion, subject: e.target.value})} placeholder="e.g. Mathematics" className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-500/20" required />
                            <datalist id="subject-options">
                                {subjects.map(s => <option key={s} value={s} />)}
                            </datalist>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2">Difficulty</label>
                            <select value={newQuestion.difficulty} onChange={(e) => setNewQuestion({...newQuestion, difficulty: e.target.value})} className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-500/20">
                                <option value="Easy">Easy</option><option value="Medium">Medium</option><option value="Hard">Hard</option>
                            </select>
                        </div>
                    </div>

                    {/* Question Content */}
                    <div>
                        <div className="flex justify-between mb-2">
                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400">Question Content</label>
                            <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">{newQuestion.questionText.length} chars</span>
                        </div>
                        <textarea required value={newQuestion.questionText} onChange={(e) => setNewQuestion({...newQuestion, questionText: e.target.value})} placeholder="Type your question here. Use LaTeX for math like $\sqrt{x^2}$..." className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-4 text-sm h-32 outline-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-500/20 resize-none shadow-sm text-gray-900 dark:text-gray-100" />
                    </div>

                    {/* Options */}
                    {newQuestion.type === 'MCQ' ? (
                        <div>
                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-4 uppercase">Answer Options</label>
                            <div className="space-y-3">
                                {newQuestion.options.map((opt, i) => (
                                    <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${newQuestion.correctAnswer === opt && opt ? 'border-indigo-600 bg-indigo-50/30 dark:bg-indigo-900/30 dark:border-indigo-500' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'}`}>
                                        <button type="button" onClick={() => setNewQuestion({...newQuestion, correctAnswer: opt})} className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${newQuestion.correctAnswer === opt && opt ? 'border-indigo-600 dark:border-indigo-400' : 'border-gray-300 dark:border-gray-600'}`}>
                                            {newQuestion.correctAnswer === opt && opt && <div className="w-2.5 h-2.5 bg-indigo-600 rounded-full" />}
                                        </button>
                                        <input type="text" placeholder={`Option ${String.fromCharCode(65+i)}`} value={opt} onChange={(e) => handleOptionChange(i, e.target.value)} required className="flex-1 bg-transparent outline-none text-sm font-medium" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : newQuestion.type === 'True/False' ? (
                        <div>
                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-4 uppercase">Correct Answer</label>
                            <div className="flex gap-4">
                                <label className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-xl border cursor-pointer transition-colors ${newQuestion.correctAnswer === 'True' ? 'border-indigo-600 bg-indigo-50/30 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-500' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                                    <input type="radio" name="tf" value="True" checked={newQuestion.correctAnswer === 'True'} onChange={(e) => setNewQuestion({...newQuestion, correctAnswer: 'True'})} className="hidden" />
                                    <span className="font-bold text-gray-900 dark:text-gray-100">True</span>
                                </label>
                                <label className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-xl border cursor-pointer transition-colors ${newQuestion.correctAnswer === 'False' ? 'border-indigo-600 bg-indigo-50/30 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-500' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                                    <input type="radio" name="tf" value="False" checked={newQuestion.correctAnswer === 'False'} onChange={(e) => setNewQuestion({...newQuestion, correctAnswer: 'False'})} className="hidden" />
                                    <span className="font-bold">False</span>
                                </label>
                            </div>
                        </div>
                    ) : newQuestion.type === 'Short Answer' ? (
                        <div>
                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase">Correct Answer / Keyword</label>
                            <input type="text" required value={newQuestion.correctAnswer} onChange={(e) => setNewQuestion({...newQuestion, correctAnswer: e.target.value})} placeholder="Expected short answer..." className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3.5 text-sm outline-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-500/20 shadow-sm text-gray-900 dark:text-gray-100" />
                        </div>
                    ) : (
                        <div>
                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase">Grading Rubric / Key Points</label>
                            <textarea required value={newQuestion.correctAnswer} onChange={(e) => setNewQuestion({...newQuestion, correctAnswer: e.target.value})} placeholder="Keywords or concepts required for full marks..." className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-4 text-sm h-24 outline-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-500/20 resize-none shadow-sm text-gray-900 dark:text-gray-100" />
                        </div>
                    )}
                </div>

                {/* Right Panel */}
                <div className="space-y-6">
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-4 uppercase">Live Preview</label>
                        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-5 shadow-sm min-h-[160px]">
                            <div className="flex justify-between items-start mb-3">
                                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded">{newQuestion.type}</span>
                                <div className="flex gap-2">
                                    <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">{newQuestion.subject || 'Subject'}</span>
                                    <span className={`text-[10px] font-bold px-2 py-1 rounded ${newQuestion.difficulty === 'Easy' ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400' : newQuestion.difficulty === 'Medium' ? 'bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400' : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400'}`}>{newQuestion.difficulty}</span>
                                </div>
                            </div>
                            <p className="text-sm text-gray-900 dark:text-white font-medium mb-4 whitespace-pre-wrap">{newQuestion.questionText || <span className="text-gray-400 dark:text-gray-500 italic">Question text will appear here...</span>}</p>
                            
                            {newQuestion.type === 'MCQ' && (
                                <div className="space-y-2">
                                    {newQuestion.options.map((opt, i) => (
                                        opt && <div key={i} className={`text-xs p-2 rounded-lg border ${newQuestion.correctAnswer === opt ? 'border-green-400 bg-green-50/50 text-green-800 font-medium' : 'border-gray-100 text-gray-600 bg-gray-50'}`}>{String.fromCharCode(65+i)}. {opt}</div>
                                    ))}
                                </div>
                            )}
                            {newQuestion.type === 'True/False' && (
                                <div className="flex gap-2">
                                    <div className={`flex-1 text-center text-xs p-2 rounded-lg border ${newQuestion.correctAnswer === 'True' ? 'border-green-400 bg-green-50/50 text-green-800' : 'border-gray-100 text-gray-600'}`}>True</div>
                                    <div className={`flex-1 text-center text-xs p-2 rounded-lg border ${newQuestion.correctAnswer === 'False' ? 'border-green-400 bg-green-50/50 text-green-800' : 'border-gray-100 text-gray-600'}`}>False</div>
                                </div>
                            )}
                            {(newQuestion.type === 'Short Answer' || newQuestion.type === 'Long Answer') && newQuestion.correctAnswer && (
                                <div className="mt-3 p-3 bg-green-50/50 border border-green-200 rounded-lg">
                                    <p className="text-[10px] font-bold text-green-800 uppercase mb-1">Expected Answer</p>
                                    <p className="text-xs text-green-700">{newQuestion.correctAnswer}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                        <label className="block text-xs font-bold text-gray-500 mb-4 uppercase">Settings</label>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Shuffle Options</span>
                                <button type="button" onClick={() => setNewQuestion({...newQuestion, shuffleOptions: !newQuestion.shuffleOptions})} className={`w-10 h-6 rounded-full relative transition-colors ${newQuestion.shuffleOptions ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-600'}`}>
                                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${newQuestion.shuffleOptions ? 'right-1' : 'left-1'}`}></div>
                                </button>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Required</span>
                                <button type="button" onClick={() => setNewQuestion({...newQuestion, required: !newQuestion.required})} className={`w-10 h-6 rounded-full relative transition-colors ${newQuestion.required ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-600'}`}>
                                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${newQuestion.required ? 'right-1' : 'left-1'}`}></div>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 pt-4">
                        <button type="submit" onClick={(e) => handleAddSubmit(e, 'active')} className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-600/20">
                            {editingId ? 'Update Question' : 'Add to Bank'}
                        </button>
                        {!editingId && <button type="button" onClick={(e) => handleAddSubmit(e, 'draft')} className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-bold py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                            Save as Draft
                        </button>}
                        <button type="button" onClick={handleCancel} className="w-full text-gray-500 dark:text-gray-400 font-bold py-3 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
                            Cancel
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto space-y-8 pb-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-1">Question Bank</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Manage and organize your academic questions across curricula.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <input 
                type="file" 
                accept=".csv" 
                id="csvUpload" 
                className="hidden" 
                onChange={async (e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    const formData = new FormData();
                    formData.append('file', file);
                    try {
                        toast.info('Importing questions...');
                        const res = await api.post('/questions/bulk-import', formData);
                        toast.success(res.data.msg);
                        fetchQuestions();
                    } catch (err) {
                        toast.error(err.response?.data?.msg || 'Failed to import CSV');
                    }
                    e.target.value = null;
                }} 
            />
            <button onClick={() => document.getElementById('csvUpload').click()} className="w-full sm:w-auto justify-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 px-5 py-2.5 rounded-xl font-bold transition-all shadow-sm flex items-center gap-2">
                <Plus className="w-4 h-4" /> Bulk Import CSV
            </button>
            <button onClick={() => setIsAddOpen(true)} className="w-full sm:w-auto justify-center bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-md shadow-indigo-600/20 flex items-center gap-2">
                <Plus className="w-4 h-4" /> Add Question
            </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
          
          {/* Filters Bar */}
          <div className="flex flex-col mb-8 pb-6 border-b border-gray-100 dark:border-gray-700 gap-4">
              <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                      type="text"
                      placeholder="Search questions..."
                      value={filters.search}
                      onChange={(e) => setFilters({...filters, search: e.target.value})}
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm text-gray-900 dark:text-white"
                  />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-4">
                      <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600">
                      <Filter className="w-4 h-4 text-gray-400 dark:text-gray-300" />
                      <span className="text-xs font-bold text-gray-600 dark:text-gray-200">Filters</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Subject:</span>
                      <select value={filters.subject} onChange={(e) => setFilters({...filters, subject: e.target.value})} className="bg-transparent text-sm font-bold text-gray-900 dark:text-white outline-none cursor-pointer">
                          <option value="">All</option>
                          {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                  </div>
                  
                  <div className="w-px h-4 bg-gray-200 dark:bg-gray-600"></div>

                  <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Difficulty:</span>
                      <select value={filters.difficulty} onChange={(e) => setFilters({...filters, difficulty: e.target.value})} className="bg-transparent text-sm font-bold text-gray-900 dark:text-white outline-none cursor-pointer">
                          <option value="">All</option>
                          <option value="Easy">Easy</option><option value="Medium">Medium</option><option value="Hard">Hard</option>
                      </select>
                  </div>
                  
                  <div className="w-px h-4 bg-gray-200 dark:bg-gray-600"></div>

                  <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Type:</span>
                      <select value={filters.type} onChange={(e) => setFilters({...filters, type: e.target.value})} className="bg-transparent text-sm font-bold text-gray-900 dark:text-white outline-none cursor-pointer">
                          <option value="">All</option>
                          <option value="MCQ">MCQ</option><option value="Short Answer">Short Answer</option>
                      </select>
                  </div>
              </div>

              <button onClick={() => setFilters({subject:'', difficulty:'', type:''})} className="text-indigo-600 dark:text-indigo-400 text-sm font-bold hover:text-indigo-700 dark:hover:text-indigo-300">
                  Clear all
              </button>
              </div>
          </div>

          {/* Data Table */}
          <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                  <thead>
                      <tr>
                          <th className="py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider w-1/2">Question Content</th>
                          <th className="py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Subject</th>
                          <th className="py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Difficulty</th>
                          <th className="py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Type</th>
                          <th className="py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right">Actions</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                      {questions.map((q) => (
                          <tr key={q._id} className="hover:bg-gray-50/30 dark:hover:bg-gray-700/30 transition-colors group">
                              <td className="py-5 pr-4">
                                  <p className="text-sm font-bold text-gray-900 dark:text-white leading-snug mb-1">{q.questionText}</p>
                                  <p className="text-xs text-gray-400 font-medium flex items-center gap-2">Added recently {q.status === 'draft' && <span className="text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-800 px-1.5 py-0.5 rounded text-[10px] uppercase font-bold">Draft</span>}</p>
                              </td>
                              <td className="py-5 text-sm font-semibold text-gray-600 dark:text-gray-300">{q.subject}</td>
                              <td className="py-5">{renderBadge(q.difficulty, 'difficulty')}</td>
                              <td className="py-5 text-sm font-medium text-gray-500 dark:text-gray-400">{q.type || 'MCQ'}</td>
                              <td className="py-5 text-right flex items-center justify-end gap-1">
                                  <button onClick={() => handleEdit(q)} className="p-2 text-gray-400 hover:text-indigo-500 dark:hover:text-indigo-400 rounded-lg transition-colors">
                                      <Edit2 className="w-4 h-4" />
                                  </button>
                                  <button onClick={() => handleDelete(q._id)} className="p-2 text-gray-400 hover:text-red-500 dark:hover:text-red-400 rounded-lg transition-colors">
                                      <Trash2 className="w-4 h-4" />
                                  </button>
                              </td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>

          {/* Footer */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-between pt-6 border-t border-gray-100 gap-4">
              <span className="text-xs font-semibold text-gray-500">Showing {questions.length > 0 ? ((pagination.page - 1) * 10) + 1 : 0}-{Math.min(pagination.page * 10, pagination.total || questions.length)} of {pagination.total || questions.length} questions</span>
              <div className="flex items-center gap-1">
                  <button onClick={() => setPagination({...pagination, page: Math.max(1, pagination.page - 1)})} disabled={pagination.page === 1} className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-lg text-gray-400 hover:bg-gray-50 disabled:opacity-50"><ChevronLeft className="w-4 h-4" /></button>
                  
                  {[...Array(pagination.pages || 1)].map((_, i) => (
                      <button key={i+1} onClick={() => setPagination({...pagination, page: i+1})} className={`w-8 h-8 flex items-center justify-center border rounded-lg font-bold text-xs ${pagination.page === i+1 ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>{i+1}</button>
                  ))}

                  <button onClick={() => setPagination({...pagination, page: Math.min(pagination.pages || 1, pagination.page + 1)})} disabled={pagination.page === (pagination.pages || 1) || (pagination.pages || 1) === 0} className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-lg text-gray-400 hover:bg-gray-50 disabled:opacity-50"><ChevronRight className="w-4 h-4" /></button>
              </div>
          </div>
      </div>
    </div>
  );
};

export default Questions;