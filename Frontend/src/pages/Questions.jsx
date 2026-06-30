import React, { useState, useEffect, useCallback, useRef } from 'react';
import api from '../utils/axiosConfig';
import { Search, Plus, Filter, Trash2, Edit2, ChevronLeft, ChevronRight, Check, Download, Upload, X, MoreVertical, Layers, SortAsc, FileText, ListFilter } from 'lucide-react';
import { toast } from 'react-toastify';
import Papa from 'papaparse';

const Questions = () => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  
  const [filters, setFilters] = useState({ subject: '', difficulty: '', type: '', search: '' });
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sort, setSort] = useState('newest');
  
  const handleFilterChange = (field, value) => {
      setFilters(prev => ({ ...prev, [field]: value }));
      setPagination(p => ({ ...p, page: 1 }));
  };

  const [selectedIds, setSelectedIds] = useState(new Set());
  
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [newQuestion, setNewQuestion] = useState({
    questionText: '', subject: '', difficulty: 'Medium', type: 'MCQ', options: ['', '', '', ''], correctAnswer: '',
    required: true, shuffleOptions: false, bloomLevel: 'Remember'
  });
  
  const [subjects, setSubjects] = useState([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false); 
  
  const [csvPreview, setCsvPreview] = useState({ isOpen: false, rows: [], valid: [], invalid: [], duplicates: [] });

  const [isExportOpen, setIsExportOpen] = useState(false);
  const exportRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
        if (exportRef.current && !exportRef.current.contains(event.target)) {
            setIsExportOpen(false);
        }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
        document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(filters.search);
      setPagination(p => ({ ...p, page: 1 }));
    }, 300);
    return () => clearTimeout(handler);
  }, [filters.search]);

  useEffect(() => {
    fetchQuestions();
    setSelectedIds(new Set());
  }, [debouncedSearch, filters.subject, filters.difficulty, filters.type, sort, pagination.page]);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const params = { page: pagination.page, limit: 10, sort };
      if (filters.subject) params.subject = filters.subject;
      if (filters.difficulty) params.difficulty = filters.difficulty;
      if (filters.type) params.type = filters.type;
      if (debouncedSearch) params.search = debouncedSearch;

      const queryString = new URLSearchParams(params).toString();
      const requestUrl = `/api/questions?${queryString}`;
      console.log("Fetching questions:", requestUrl);

      const res = await api.get('/questions', { params });
      setQuestions(res.data.questions || []);
      
      setPagination(prev => ({ 
          ...prev, 
          page: res.data.currentPage || 1, 
          pages: res.data.totalPages || 1, 
          total: res.data.totalQuestions || 0,
          absoluteTotal: res.data.absoluteTotal || 0
      }));
      
      const allRes = await api.get('/questions', { params: { limit: 1000 } });
      const uniqueSubjects = [...new Set((allRes.data.questions || []).map(q => q.subject))];
      setSubjects(uniqueSubjects);
    } catch (err) {
      console.error('Error fetching questions:', err);
      toast.error('Failed to load questions. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(new Set(questions.map(q => q._id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelect = (id) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedIds(newSelected);
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete ${selectedIds.size} questions?`)) return;
    try {
      await api.post('/questions/bulk-delete', { ids: Array.from(selectedIds) });
      toast.success(`Deleted ${selectedIds.size} questions.`);
      setSelectedIds(new Set());
      fetchQuestions();
    } catch (err) {
      toast.error('Bulk delete failed.');
    }
  };
  
  const handleBulkUpdate = async (field, value) => {
      try {
          await api.post('/questions/bulk-update', { ids: Array.from(selectedIds), updateData: { [field]: value } });
          toast.success(`Updated ${selectedIds.size} questions.`);
          setSelectedIds(new Set());
          fetchQuestions();
      } catch (err) {
          toast.error(`Bulk update failed.`);
      }
  };

  const handleExport = async (format) => {
    const idsToExport = Array.from(selectedIds).length > 0 ? Array.from(selectedIds) : questions.map(q => q._id);
    const questionsToExport = questions.filter(q => idsToExport.includes(q._id));
    
    if (questionsToExport.length === 0) return toast.warning('No questions to export.');

    if (format === 'csv') {
      const csvData = questionsToExport.map(q => ({
        questionText: q.questionText,
        subject: q.subject,
        type: q.type,
        difficulty: q.difficulty,
        bloomLevel: q.bloomLevel || 'Remember',
        correctAnswer: typeof q.correctAnswer === 'string' ? q.correctAnswer : JSON.stringify(q.correctAnswer)
      }));
      const csvStr = Papa.unparse(csvData);
      const blob = new Blob([csvStr], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Export_${new Date().getTime()}.csv`;
      a.click();
    } else {
      try {
        toast.info(`Generating ${format.toUpperCase()}...`);
        const res = await api.post(`/import/export/${format}`, { questions: questionsToExport }, { responseType: 'blob' });
        const url = window.URL.createObjectURL(new Blob([res.data]));
        const a = document.createElement('a');
        a.href = url;
        a.download = `Export_${new Date().getTime()}.${format}`;
        a.click();
      } catch (err) {
        toast.error(`Failed to export ${format.toUpperCase()}`);
      }
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const rows = results.data.slice(0, 50);
        const valid = [];
        const invalid = [];
        const duplicates = [];
        
        let existingQs = [];
        try {
            const res = await api.get('/questions', { params: { limit: 10000 } });
            existingQs = res.data.questions || [];
        } catch(e) {}

        rows.forEach((row, index) => {
          const qText = row.questionText || row.question || row.Question || '';
          const subject = row.subject || row.Subject || '';
          const type = row.type || 'MCQ';
          const ans = row.correctAnswer || row.CorrectAnswer || '';

          if (!qText.trim() || !ans.trim() || !subject.trim()) {
            invalid.push({ ...row, _index: index, _reason: 'Missing required fields' });
            return;
          }
          
          const isDup = existingQs.some(eq => 
            eq.questionText.trim().toLowerCase().replace(/\s+/g, ' ') === qText.trim().toLowerCase().replace(/\s+/g, ' ') &&
            eq.subject.trim().toLowerCase() === subject.trim().toLowerCase() &&
            eq.type === type
          );

          if (isDup) {
            duplicates.push({ ...row, _index: index, _reason: 'Duplicate found in DB' });
          } else {
            valid.push({ ...row, _index: index });
          }
        });

        setCsvPreview({ isOpen: true, rows, valid, invalid, duplicates, fileRows: results.data });
      }
    });
    e.target.value = null;
  };
  
  const confirmCsvImport = async (importOnlyValid = true) => {
      const rowsToImport = importOnlyValid ? csvPreview.fileRows.filter((_, i) => !csvPreview.invalid.some(inv => inv._index === i) && !csvPreview.duplicates.some(dup => dup._index === i)) : csvPreview.fileRows;
      
      if (rowsToImport.length === 0) return toast.warning('No valid rows to import.');
      
      const payload = rowsToImport.map(row => ({
          questionText: row.questionText || row.question || row.Question,
          subject: row.subject || row.Subject,
          type: row.type || 'MCQ',
          correctAnswer: row.correctAnswer || row.CorrectAnswer,
          difficulty: row.difficulty || 'Medium',
          options: row.options ? row.options.split('|') : [row.optionA, row.optionB, row.optionC, row.optionD].filter(Boolean),
          bloomLevel: row.bloomLevel || 'Remember',
      }));

      try {
          toast.info('Importing questions...');
          await api.post('/questions/bulk', { questions: payload });
          toast.success('Successfully imported questions');
          setCsvPreview({ isOpen: false, rows: [], valid: [], invalid: [], duplicates: [] });
          fetchQuestions();
      } catch (err) {
          toast.error('Import failed');
      }
  };

  const handleAddSubmit = async (e, status = 'active') => {
    if (e) e.preventDefault();
    
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
      formData.append('bloomLevel', newQuestion.bloomLevel);
      
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
        questionText: '', subject: '', difficulty: 'Medium', type: 'MCQ', options: ['', '', '', ''], correctAnswer: '', required: true, shuffleOptions: false, bloomLevel: 'Remember'
      });
      setIsAddOpen(false);
      setEditingId(null);
      fetchQuestions();
    } catch (err) {
      console.error('Error adding question:', err);
      toast.error('Failed to add question');
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
        shuffleOptions: q.shuffleOptions ?? false,
        bloomLevel: q.bloomLevel || 'Remember'
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

  const renderBadge = (value, type) => {
      let classes = 'px-3 py-1 rounded-full text-xs font-bold border ';
      if (type === 'difficulty') {
          if (value === 'Easy') classes += 'bg-white text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700';
          if (value === 'Medium') classes += 'bg-yellow-50 text-yellow-600 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800/50';
          if (value === 'Hard') classes += 'bg-red-50 text-red-600 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800/50';
      }
      return <span className={classes}>{value}</span>;
  };

  if (isAddOpen) {
      return (
        <div className="max-w-[1400px] mx-auto pb-8 px-4">
            <div className="mb-6 flex items-center gap-2 text-sm text-gray-500 font-semibold">
                <button onClick={() => setIsAddOpen(false)} className="hover:text-indigo-600">Questions</button>
                <ChevronRight className="w-4 h-4" />
                <span className="text-gray-900 dark:text-white">{editingId ? 'Edit Question' : 'Add New Question'}</span>
            </div>
            
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create Academic Content</h1>
            </div>

            <form onSubmit={handleAddSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-2">Question Type</label>
                            <select value={newQuestion.type} onChange={(e) => setNewQuestion({...newQuestion, type: e.target.value})} className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm dark:text-white outline-none focus:ring-2 focus:ring-indigo-100">
                                <option value="MCQ">Multiple Choice (MCQ)</option>
                                <option value="Short Answer">Short Answer</option>
                                <option value="Long Answer">Long Answer</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-2">Subject</label>
                            <input type="text" list="subject-options" value={newQuestion.subject} onChange={(e) => setNewQuestion({...newQuestion, subject: e.target.value})} placeholder="e.g. Mathematics" className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm dark:text-white outline-none focus:ring-2 focus:ring-indigo-100" required />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-2">Difficulty</label>
                            <select value={newQuestion.difficulty} onChange={(e) => setNewQuestion({...newQuestion, difficulty: e.target.value})} className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm dark:text-white outline-none focus:ring-2 focus:ring-indigo-100">
                                <option value="Easy">Easy</option><option value="Medium">Medium</option><option value="Hard">Hard</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-2">Bloom's Level</label>
                            <select value={newQuestion.bloomLevel} onChange={(e) => setNewQuestion({...newQuestion, bloomLevel: e.target.value})} className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm dark:text-white outline-none focus:ring-2 focus:ring-indigo-100">
                                <option value="Remember">Remember</option><option value="Understand">Understand</option><option value="Apply">Apply</option>
                                <option value="Analyze">Analyze</option><option value="Evaluate">Evaluate</option><option value="Create">Create</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <textarea required value={newQuestion.questionText} onChange={(e) => setNewQuestion({...newQuestion, questionText: e.target.value})} placeholder="Type your question here..." className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-4 text-sm h-32 outline-none focus:ring-2 focus:ring-indigo-100 resize-none dark:text-white" />
                    </div>

                    {newQuestion.type === 'MCQ' ? (
                        <div className="space-y-3">
                            {newQuestion.options.map((opt, i) => (
                                <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border ${newQuestion.correctAnswer === opt && opt ? 'border-indigo-600 bg-indigo-50/30' : 'border-gray-200 dark:border-gray-700'}`}>
                                    <input type="radio" name="correctOpt" checked={newQuestion.correctAnswer === opt && opt} onChange={() => setNewQuestion({...newQuestion, correctAnswer: opt})} />
                                    <input type="text" placeholder={`Option ${String.fromCharCode(65+i)}`} value={opt} onChange={(e) => {
                                        const newOpts = [...newQuestion.options];
                                        newOpts[i] = e.target.value;
                                        setNewQuestion({...newQuestion, options: newOpts});
                                    }} required className="flex-1 bg-transparent outline-none text-sm dark:text-white" />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">Correct Answer / Key Points</label>
                            <textarea required value={newQuestion.correctAnswer} onChange={(e) => setNewQuestion({...newQuestion, correctAnswer: e.target.value})} placeholder="Expected answer..." className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-4 text-sm h-24 outline-none focus:ring-2 dark:text-white" />
                        </div>
                    )}
                </div>

                <div className="space-y-6">
                    <button type="submit" onClick={(e) => handleAddSubmit(e, 'active')} className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 transition-colors">
                        {editingId ? 'Update Question' : 'Add to Bank'}
                    </button>
                    <button type="button" onClick={() => setIsAddOpen(false)} className="w-full text-gray-500 font-bold py-3 hover:text-gray-700 transition-colors">
                        Cancel
                    </button>
                </div>
            </form>
        </div>
      );
  }

  if (csvPreview.isOpen) {
      return (
          <div className="max-w-[1400px] mx-auto pb-8 px-4">
              <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">CSV Import Preview</h1>
                    <div className="flex flex-wrap gap-2 text-sm text-gray-600 dark:text-gray-400 font-medium">
                        <span className="bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">Total Rows: {csvPreview.fileRows.length}</span>
                        <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full">Valid: {csvPreview.valid.length}</span>
                        <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full">Duplicates: {csvPreview.duplicates.length}</span>
                        <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full">Invalid: {csvPreview.invalid.length}</span>
                    </div>
                  </div>
                  <div className="flex gap-3 w-full md:w-auto">
                      <button onClick={() => setCsvPreview({isOpen: false, rows: [], valid: [], invalid: [], duplicates: []})} className="flex-1 md:flex-none px-6 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">Cancel</button>
                      <button onClick={() => confirmCsvImport(true)} className="flex-1 md:flex-none px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 shadow-md shadow-indigo-600/20">Import Valid Rows</button>
                  </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-x-auto shadow-sm p-2">
                  <table className="w-full text-left border-collapse text-sm">
                      <thead className="bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                          <tr>
                              <th className="p-4 font-bold text-gray-600 dark:text-gray-300">Status</th>
                              <th className="p-4 font-bold text-gray-600 dark:text-gray-300 w-1/2">Question</th>
                              <th className="p-4 font-bold text-gray-600 dark:text-gray-300">Subject</th>
                              <th className="p-4 font-bold text-gray-600 dark:text-gray-300">Type</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                          {csvPreview.rows.map((row, i) => {
                              let status = 'Valid';
                              let badgeClass = 'bg-green-50 text-green-700 border border-green-200';
                              if (csvPreview.invalid.some(inv => inv._index === i)) { status = 'Invalid'; badgeClass = 'bg-red-50 text-red-700 border border-red-200'; }
                              else if (csvPreview.duplicates.some(dup => dup._index === i)) { status = 'Duplicate'; badgeClass = 'bg-yellow-50 text-yellow-700 border border-yellow-200'; }
                              
                              return (
                                  <tr key={i} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors">
                                      <td className="p-4"><span className={`px-2 py-1 rounded text-xs font-bold ${badgeClass}`}>{status}</span></td>
                                      <td className="p-4 truncate max-w-xs dark:text-gray-300 font-medium">{row.questionText || row.question || row.Question}</td>
                                      <td className="p-4 dark:text-gray-400">{row.subject || row.Subject}</td>
                                      <td className="p-4 dark:text-gray-400">{row.type || 'MCQ'}</td>
                                  </tr>
                              );
                          })}
                      </tbody>
                  </table>
                  {csvPreview.fileRows.length > 50 && (
                      <div className="p-4 text-center text-sm font-semibold text-gray-500 bg-gray-50 dark:bg-gray-800/50 rounded-b-xl border-t border-gray-100 dark:border-gray-700">
                          Showing first 50 of {csvPreview.fileRows.length} rows...
                      </div>
                  )}
              </div>
          </div>
      );
  }

  return (
    <div className="max-w-[1400px] mx-auto space-y-6 pb-8 px-4 relative">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-1">Question Bank</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Manage and organize your academic questions.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <input type="file" accept=".csv" id="csvUpload" className="hidden" onChange={handleFileUpload} />
            <button onClick={() => document.getElementById('csvUpload').click()} className="w-full sm:w-auto justify-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 px-5 py-2.5 rounded-xl font-bold transition-all shadow-sm flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700">
                <Upload className="w-4 h-4" /> Bulk Import CSV
            </button>
            <button onClick={() => setIsAddOpen(true)} className="w-full sm:w-auto justify-center bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-md shadow-indigo-600/20 flex items-center gap-2">
                <Plus className="w-4 h-4" /> Add Question
            </button>
        </div>
      </div>

      {/* Sticky Bulk Action Bar */}
      {selectedIds.size > 0 && (
          <div className="sticky top-4 z-40 bg-indigo-600 text-white rounded-xl shadow-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-in slide-in-from-top-4">
              <div className="flex items-center gap-3">
                  <span className="font-bold bg-white/20 px-3 py-1 rounded-full text-sm">{selectedIds.size} Selected</span>
                  <button onClick={() => setSelectedIds(new Set())} className="text-sm font-medium hover:underline text-indigo-100">Clear</button>
              </div>
              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                  <button onClick={handleBulkDelete} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors"><Trash2 className="w-4 h-4" /> Delete</button>
                  <select onChange={(e) => { if(e.target.value) { handleBulkUpdate('difficulty', e.target.value); e.target.value=''; } }} className="bg-white/10 hover:bg-white/20 border border-white/20 text-white px-3 py-2 rounded-lg text-sm font-bold outline-none cursor-pointer transition-colors">
                      <option value="" className="text-black">Update Difficulty...</option>
                      <option value="Easy" className="text-black">Easy</option><option value="Medium" className="text-black">Medium</option><option value="Hard" className="text-black">Hard</option>
                  </select>
                  <div className="relative" ref={exportRef}>
                      <button onClick={() => setIsExportOpen(!isExportOpen)} className="bg-white/10 hover:bg-white/20 border border-white/20 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors"><Download className="w-4 h-4" /> Export</button>
                      {isExportOpen && (
                          <div className="absolute right-0 top-full mt-2 w-32 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-50 overflow-hidden">
                              <button onClick={() => { setIsExportOpen(false); handleExport('csv'); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 font-bold transition-colors">CSV</button>
                              <button onClick={() => { setIsExportOpen(false); handleExport('pdf'); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 font-bold transition-colors">PDF</button>
                              <button onClick={() => { setIsExportOpen(false); handleExport('docx'); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 font-bold transition-colors">DOCX</button>
                          </div>
                      )}
                  </div>
              </div>
          </div>
      )}

      {/* Main Content Area */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          
          {/* Filters Bar (Desktop) & Search */}
          <div className="p-4 md:p-6 border-b border-gray-100 dark:border-gray-700">
              <div className="flex flex-col md:flex-row gap-4">
                  <div className="relative flex-1">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Search className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                          type="text"
                          placeholder="Search questions..."
                          value={filters.search}
                          onChange={(e) => setFilters({...filters, search: e.target.value})}
                          className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm text-gray-900 dark:text-white transition-all font-medium"
                      />
                  </div>
                  
                  {/* Mobile Filter Toggle */}
                  <button onClick={() => setIsFilterOpen(!isFilterOpen)} className="md:hidden flex items-center justify-center gap-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 px-4 py-3 rounded-xl font-bold text-sm dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                      <ListFilter className="w-4 h-4" /> Filters
                  </button>

                  {/* Desktop Filters */}
                  <div className={`flex-col md:flex-row items-center gap-4 ${isFilterOpen ? 'flex' : 'hidden md:flex'}`}>
                      <select value={filters.subject} onChange={(e) => handleFilterChange('subject', e.target.value)} className="w-full md:w-auto bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm font-bold text-gray-900 dark:text-white rounded-xl px-4 py-3 outline-none cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                          <option value="">All Subjects</option>
                          {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <select value={filters.difficulty} onChange={(e) => handleFilterChange('difficulty', e.target.value)} className="w-full md:w-auto bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm font-bold text-gray-900 dark:text-white rounded-xl px-4 py-3 outline-none cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                          <option value="">All Difficulties</option>
                          <option value="Easy">Easy</option><option value="Medium">Medium</option><option value="Hard">Hard</option>
                      </select>
                      <select value={sort} onChange={(e) => setSort(e.target.value)} className="w-full md:w-auto bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm font-bold text-gray-900 dark:text-white rounded-xl px-4 py-3 outline-none cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                          <option value="newest">Newest First</option>
                          <option value="oldest">Oldest First</option>
                          <option value="az">Subject (A-Z)</option>
                          <option value="za">Subject (Z-A)</option>
                          <option value="difficulty_asc">Difficulty (Asc)</option>
                          <option value="difficulty_desc">Difficulty (Desc)</option>
                          <option value="type_asc">Type (Asc)</option>
                          <option value="type_desc">Type (Desc)</option>
                      </select>
                  </div>
              </div>
          </div>

          {/* Data Presentation */}
          <div className="p-4 md:p-6 overflow-x-auto">
              {loading ? (
                  <div className="space-y-4">
                      {[1,2,3,4,5].map(i => (
                          <div key={i} className="h-20 bg-gray-50 dark:bg-gray-700/50 rounded-xl animate-pulse"></div>
                      ))}
                  </div>
              ) : questions.length === 0 ? (
                  (() => {
                      console.log({
                          totalQuestions: pagination.total,
                          absoluteTotal: pagination.absoluteTotal,
                          filters,
                          sort,
                          search: debouncedSearch
                      });
                      
                      if (pagination.absoluteTotal === 0) {
                          return (
                              <div className="text-center py-16">
                                  <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100 dark:border-gray-700">
                                      <Layers className="w-8 h-8 text-gray-300 dark:text-gray-600" />
                                  </div>
                                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">No questions exist in your Question Bank yet.</h3>
                                  <p className="text-gray-500 dark:text-gray-400 text-sm max-w-sm mx-auto">Click Add Question or Import CSV to begin.</p>
                              </div>
                          );
                      }
                      
                      return (
                          <div className="text-center py-16">
                              <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100 dark:border-gray-700">
                                  <Layers className="w-8 h-8 text-gray-300 dark:text-gray-600" />
                              </div>
                              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">No questions found</h3>
                              <p className="text-gray-500 dark:text-gray-400 text-sm max-w-sm mx-auto">We couldn't find any questions matching your current filters or search terms.</p>
                              <button onClick={() => { setFilters({subject:'', difficulty:'', type:'', search:''}); setSort('newest'); setDebouncedSearch(''); }} className="mt-4 text-indigo-600 font-bold text-sm hover:underline">Clear all filters</button>
                          </div>
                      );
                  })()
              ) : (
                  <>
                      {/* Desktop Table */}
                      <table className="w-full hidden md:table text-left border-collapse">
                          <thead>
                              <tr>
                                  <th className="py-3 px-3 w-10">
                                      <input type="checkbox" onChange={handleSelectAll} checked={questions.length > 0 && selectedIds.size === questions.length} className="w-4 h-4 rounded border-gray-300 cursor-pointer" />
                                  </th>
                                  <th className="py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider w-1/2">Question</th>
                                  <th className="py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Subject</th>
                                  <th className="py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Difficulty</th>
                                  <th className="py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Type</th>
                                  <th className="py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right">Actions</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                              {questions.map((q) => (
                                  <tr key={q._id} className={`hover:bg-gray-50/80 dark:hover:bg-gray-700/30 transition-colors cursor-pointer group ${selectedIds.has(q._id) ? 'bg-indigo-50/50 dark:bg-indigo-900/20' : ''}`} onClick={() => handleSelect(q._id)}>
                                      <td className="py-4 px-3" onClick={e => e.stopPropagation()}>
                                          <input type="checkbox" checked={selectedIds.has(q._id)} onChange={() => handleSelect(q._id)} className="w-4 h-4 rounded border-gray-300 cursor-pointer" />
                                      </td>
                                      <td className="py-4 pr-4">
                                          <p className="text-sm font-bold text-gray-900 dark:text-white leading-snug line-clamp-2 max-w-lg">{q.questionText}</p>
                                      </td>
                                      <td className="py-4 text-sm font-bold text-gray-600 dark:text-gray-300">{q.subject}</td>
                                      <td className="py-4">{renderBadge(q.difficulty, 'difficulty')}</td>
                                      <td className="py-4 text-sm font-bold text-gray-500 dark:text-gray-400">{q.type}</td>
                                      <td className="py-4 text-right flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
                                          <button onClick={() => handleEdit(q)} className="p-2 text-gray-400 hover:bg-gray-100 hover:text-indigo-600 dark:hover:bg-gray-700 rounded-lg transition-colors"><Edit2 className="w-4 h-4" /></button>
                                          <button onClick={() => handleDelete(q._id)} className="p-2 text-gray-400 hover:bg-gray-100 hover:text-red-600 dark:hover:bg-gray-700 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                                      </td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>

                      {/* Mobile Cards */}
                      <div className="md:hidden space-y-3">
                          {/* Mobile Select All */}
                          <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700 active:bg-gray-100 dark:active:bg-gray-600 transition-colors" onClick={() => handleSelectAll({ target: { checked: selectedIds.size !== questions.length } })}>
                              <input type="checkbox" onChange={handleSelectAll} checked={questions.length > 0 && selectedIds.size === questions.length} className="w-5 h-5 pointer-events-none" id="selectAllMobile" />
                              <label htmlFor="selectAllMobile" className="text-sm font-bold text-gray-700 dark:text-gray-200 pointer-events-none">Select All on Page</label>
                          </div>
                          
                          {questions.map((q) => (
                              <div key={q._id} className={`p-4 rounded-xl border transition-colors shadow-sm ${selectedIds.has(q._id) ? 'border-indigo-500 bg-indigo-50/30 dark:bg-indigo-900/20' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'}`} onClick={() => handleSelect(q._id)}>
                                  <div className="flex justify-between items-start mb-3 gap-3">
                                      <input type="checkbox" checked={selectedIds.has(q._id)} readOnly className="w-5 h-5 mt-0.5 pointer-events-none" />
                                      <p className="text-sm font-bold text-gray-900 dark:text-white line-clamp-3 flex-1">{q.questionText}</p>
                                  </div>
                                  <div className="flex flex-wrap items-center gap-2 mb-4 ml-8">
                                      <span className="text-[10px] font-bold bg-gray-100 dark:bg-gray-700 px-2.5 py-1 rounded-md text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600">{q.subject}</span>
                                      {renderBadge(q.difficulty, 'difficulty')}
                                      <span className="text-[10px] font-bold bg-gray-100 dark:bg-gray-700 px-2.5 py-1 rounded-md text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600">{q.type}</span>
                                  </div>
                                  <div className="flex justify-end gap-2 pt-3 border-t border-gray-100 dark:border-gray-700 ml-8">
                                      <button onClick={(e) => { e.stopPropagation(); handleEdit(q); }} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 dark:text-indigo-400 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 transition-colors"><Edit2 className="w-3.5 h-3.5" /> Edit</button>
                                      <button onClick={(e) => { e.stopPropagation(); handleDelete(q._id); }} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 dark:text-red-400 dark:bg-red-900/30 dark:hover:bg-red-900/50 transition-colors"><Trash2 className="w-3.5 h-3.5" /> Delete</button>
                                  </div>
                              </div>
                          ))}
                      </div>
                  </>
              )}
          </div>

          {/* Footer / Pagination */}
          {!loading && questions.length > 0 && (
              <div className="p-4 md:p-6 flex flex-col sm:flex-row items-center justify-between border-t border-gray-100 dark:border-gray-700 gap-4 bg-gray-50/50 dark:bg-gray-800/50 rounded-b-2xl">
                  <span className="text-sm font-bold text-gray-500 dark:text-gray-400">Showing {((pagination.page - 1) * 10) + 1}-{Math.min(pagination.page * 10, pagination.total)} of {pagination.total}</span>
                  <div className="flex items-center gap-1">
                      <button onClick={() => setPagination({...pagination, page: Math.max(1, pagination.page - 1)})} disabled={pagination.page === 1} className="w-9 h-9 flex items-center justify-center border border-gray-200 dark:border-gray-600 rounded-xl text-gray-400 hover:bg-white dark:hover:bg-gray-700 disabled:opacity-50 transition-colors shadow-sm bg-gray-50 dark:bg-gray-800"><ChevronLeft className="w-4 h-4" /></button>
                      
                      {[...Array(Math.min(5, pagination.pages || 1))].map((_, i) => {
                          let pageNum = i + 1;
                          if (pagination.pages > 5 && pagination.page > 3) {
                              pageNum = pagination.page - 2 + i;
                              if (pageNum > pagination.pages) return null;
                          }
                          return (
                              <button key={pageNum} onClick={() => setPagination({...pagination, page: pageNum})} className={`w-9 h-9 flex items-center justify-center border rounded-xl font-bold text-sm transition-colors shadow-sm ${pagination.page === pageNum ? 'bg-indigo-600 border-indigo-600 text-white shadow-indigo-600/20' : 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700'}`}>{pageNum}</button>
                          )
                      })}

                      <button onClick={() => setPagination({...pagination, page: Math.min(pagination.pages || 1, pagination.page + 1)})} disabled={pagination.page === (pagination.pages || 1)} className="w-9 h-9 flex items-center justify-center border border-gray-200 dark:border-gray-600 rounded-xl text-gray-400 hover:bg-white dark:hover:bg-gray-700 disabled:opacity-50 transition-colors shadow-sm bg-gray-50 dark:bg-gray-800"><ChevronRight className="w-4 h-4" /></button>
                  </div>
              </div>
          )}
      </div>
    </div>
  );
};

export default Questions;