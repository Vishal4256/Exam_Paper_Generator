import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../utils/axiosConfig';
import { getText } from '../utils/richText';
import { Search, Plus, Filter, Trash2, Edit2, ChevronLeft, ChevronRight, Check, Download, Upload, X, MoreVertical, Layers, SortAsc, FileText, ListFilter } from 'lucide-react';
import { toast } from 'react-toastify';
import Papa from 'papaparse';
import AddQuestionWorkspace from '../components/AddQuestionWorkspace';
import AdvancedFilters from '../components/AdvancedFilters';
import BulkActionModal from '../components/BulkActionModal';
import ImportWizard from '../components/ImportWizard';
import { Archive, Copy, Tag, BookOpen, BarChart } from 'lucide-react';

const highlightText = (textObj, query) => {
    let text = textObj;
    if (textObj && typeof textObj === 'object') {
        text = textObj.plainText || textObj.questionText || '';
    }
    if (typeof text !== 'string') text = String(text || '');
    if (!query) return text;
    // Escape regex characters in query
    const escapedQuery = query.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
    const parts = text.split(new RegExp(`(${escapedQuery})`, 'gi'));
    return parts.map((part, i) => 
        part.toLowerCase() === query.toLowerCase() ? <span key={i} className="bg-yellow-200 text-yellow-900 rounded-sm px-0.5">{part}</span> : part
    );
};
const Questions = () => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  
  const [searchParams, setSearchParams] = useSearchParams();

  // Derive state directly from URL params for perfect browser back/forward support
  const filters = {
      subject: searchParams.get('subject') ? searchParams.get('subject').split(',') : [],
      difficulty: searchParams.get('difficulty') ? searchParams.get('difficulty').split(',') : [],
      type: searchParams.get('type') ? searchParams.get('type').split(',') : [],
      bloomLevel: searchParams.get('bloomLevel') ? searchParams.get('bloomLevel').split(',') : [],
      status: searchParams.get('status') ? searchParams.get('status').split(',') : []
  };
  
  const searchQuery = searchParams.get('q') || '';
  const sort = searchParams.get('sort') || 'newest';
  
  // Local state for debouncing
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);

  const setFilters = (updater) => {
      setSearchParams(prev => {
          const newParams = new URLSearchParams(prev);
          const nextFilters = typeof updater === 'function' ? updater(filters) : updater;
          
          Object.keys(nextFilters).forEach(key => {
              if (nextFilters[key] && nextFilters[key].length > 0) {
                  newParams.set(key, nextFilters[key].join(','));
              } else {
                  newParams.delete(key);
              }
          });
          return newParams;
      }, { replace: true });
  };

  const updateSearchQuery = (val) => {
      setSearchParams(prev => {
          const newParams = new URLSearchParams(prev);
          if (val) newParams.set('q', val);
          else newParams.delete('q');
          return newParams;
      }, { replace: true });
  };

  const updateSort = (val) => {
      setSearchParams(prev => {
          const newParams = new URLSearchParams(prev);
          if (val && val !== 'newest') newParams.set('sort', val);
          else newParams.delete('sort');
          return newParams;
      }, { replace: true });
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
  
  const [isImportWizardOpen, setIsImportWizardOpen] = useState(false);

  const [isExportOpen, setIsExportOpen] = useState(false);
  const [bulkModalAction, setBulkModalAction] = useState(null);
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
      if (searchQuery !== debouncedSearch) {
          setDebouncedSearch(searchQuery);
          setPagination(p => ({ ...p, page: 1 }));
      }
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  useEffect(() => {
    fetchQuestions();
    setSelectedIds(new Set());
  }, [debouncedSearch, JSON.stringify(filters), sort, pagination.page]);

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('manual') === 'true') {
      setIsAddOpen(true);
      // Clean up URL
      params.delete('manual');
      const newSearch = params.toString() ? `?${params.toString()}` : '';
      navigate(`/questions${newSearch}`, { replace: true });
    }
  }, [location.search, navigate]);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const params = { page: pagination.page, limit: 10, sort };
      
      Object.keys(filters).forEach(key => {
          if (filters[key] && filters[key].length > 0) {
              params[key] = filters[key].join(',');
          }
      });
      
      const qualityMin = searchParams.get('qualityMin');
      const qualityMax = searchParams.get('qualityMax');
      const missingExplanation = searchParams.get('missingExplanation');

      if (qualityMin) params.qualityMin = qualityMin;
      if (qualityMax) params.qualityMax = qualityMax;
      if (missingExplanation) params.missingExplanation = missingExplanation;

      if (debouncedSearch) params.search = debouncedSearch;

      const res = await api.get('/questions', { params });
      
      const incoming = res.data.questions || [];
      setQuestions(incoming);
      
      setPagination(prev => ({ 
          ...prev, 
          page: res.data.currentPage || 1, 
          pages: res.data.totalPages || 1, 
          total: res.data.totalQuestions || 0,
          absoluteTotal: res.data.absoluteTotal || 0
      }));
      
      // Accumulate subjects from currently fetched page — no extra API call needed
      if (incoming.length > 0) {
          setSubjects(prev => {
              const combined = new Set([...prev, ...incoming.map(q => q.subject).filter(Boolean)]);
              return [...combined].sort();
          });
      }
    } catch (err) {
      console.error('Error fetching questions:', err);
      toast.error('Failed to load questions. Please retry.', { toastId: 'fetch-questions-error' });
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

  const handleSelectAllFiltered = async () => {
      try {
          const params = { search: debouncedSearch };
          Object.keys(filters).forEach(key => {
              if (filters[key] && filters[key].length > 0) {
                  params[key] = filters[key].join(',');
              }
          });
          
          const qualityMin = searchParams.get('qualityMin');
          const qualityMax = searchParams.get('qualityMax');
          const missingExplanation = searchParams.get('missingExplanation');
          if (qualityMin) params.qualityMin = qualityMin;
          if (qualityMax) params.qualityMax = qualityMax;
          if (missingExplanation) params.missingExplanation = missingExplanation;

          const res = await api.get('/questions/filtered-ids', { params });
          setSelectedIds(new Set(res.data.ids));
      } catch (err) {
          toast.error("Failed to select all filtered questions.");
      }
  };

  const handleSelect = (id) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedIds(newSelected);
  };

  const handleBulkConfirm = async (actionType, payload) => {
      const ids = Array.from(selectedIds);
      try {
          if (actionType === 'delete') {
              await api.post('/questions/bulk-delete', { ids });
              toast.success(`Deleted ${ids.length} questions.`);
          } else if (actionType === 'archive' || actionType === 'restore') {
              await api.post('/questions/bulk-update', { ids, updateData: { status: actionType === 'archive' ? 'archived' : 'active' } });
              toast.success(`${actionType === 'archive' ? 'Archived' : 'Restored'} ${ids.length} questions.`);
          } else if (actionType === 'subject' || actionType === 'difficulty') {
              await api.post('/questions/bulk-update', { ids, updateData: payload });
              toast.success(`Updated ${actionType} for ${ids.length} questions.`);
          } else if (actionType === 'tags') {
              await api.post('/questions/bulk-update-tags', { ids, ...payload });
              toast.success(`Updated tags for ${ids.length} questions.`);
          } else if (actionType === 'duplicate') {
              await api.post('/questions/bulk-duplicate', { ids });
              toast.success(`Duplicated ${ids.length} questions.`);
          }
          setSelectedIds(new Set());
          setBulkModalAction(null);
          fetchQuestions();
      } catch (err) {
          toast.error(`Bulk operation failed.`);
      }
  };

  const handleExport = async (format) => {
    const idsToExport = Array.from(selectedIds).length > 0 ? Array.from(selectedIds) : questions.map(q => q._id);
    const questionsToExport = questions.filter(q => idsToExport.includes(q._id));
    
    if (questionsToExport.length === 0) return toast.warning('No questions to export.');

    if (format === 'csv') {
      const csvData = questionsToExport.map(q => ({
        questionText: getText(q.questionText),
        subject: q.subject,
        type: q.type,
        difficulty: q.difficulty,
        bloomLevel: q.bloomLevel || 'Remember',
        correctAnswer: getText(q.correctAnswer)
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





  const handleEdit = (q) => {
    // Pass the raw question data — AddQuestionWorkspace.normalizeRichText handles both string and object formats
    setNewQuestion({
        questionText: q.questionText || '',
        subject: q.subject || '',
        difficulty: q.difficulty || 'Medium',
        type: q.type || 'MCQ',
        options: q.options && q.options.length > 0
            ? q.options
            : ['', '', '', ''],
        correctAnswer: getText(q.correctAnswer) || '',
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
          <AddQuestionWorkspace 
              editingId={editingId}
              initialData={newQuestion}
              onClose={() => {
                  setIsAddOpen(false);
                  setEditingId(null);
                  fetchQuestions();
              }}
          />
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
            <button onClick={() => setIsImportWizardOpen(true)} className="w-full sm:w-auto justify-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 px-5 py-2.5 rounded-xl font-bold transition-all shadow-sm flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700">
                <Upload className="w-4 h-4" /> Import Wizard
            </button>
            <Link to="/ai-generator" className="w-full sm:w-auto justify-center bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-md shadow-indigo-600/20 flex items-center gap-2">
                <Plus className="w-4 h-4" /> Add Question
            </Link>
        </div>
      </div>

      {/* Sticky Bulk Action Bar */}
      {selectedIds.size > 0 && (
          <div className="sticky top-4 z-40 bg-gray-900 text-white rounded-xl shadow-2xl shadow-gray-900/20 p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-in slide-in-from-top-4 border border-gray-700">
              <div className="flex items-center gap-4">
                  <span className="font-bold bg-indigo-600 px-3 py-1.5 rounded-lg text-sm">{selectedIds.size} Selected</span>
                  
                  {selectedIds.size === questions.length && pagination.total > questions.length && selectedIds.size !== pagination.total && (
                      <button onClick={handleSelectAllFiltered} className="text-sm font-bold text-indigo-400 hover:text-indigo-300 underline underline-offset-4 decoration-indigo-400/50">
                          Select all {pagination.total} matching questions
                      </button>
                  )}
                  {selectedIds.size === pagination.total && pagination.total > questions.length && (
                      <span className="text-sm font-bold text-gray-400">All matching questions selected</span>
                  )}
                  <div className="w-px h-6 bg-gray-700 hidden md:block"></div>
                  <button onClick={() => setSelectedIds(new Set())} className="text-sm font-bold text-gray-400 hover:text-white transition-colors">Clear</button>
              </div>
              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                  <button onClick={() => setBulkModalAction('subject')} className="bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors" title="Change Subject"><BookOpen className="w-4 h-4" /> <span className="hidden md:inline">Subject</span></button>
                  <button onClick={() => setBulkModalAction('difficulty')} className="bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors" title="Change Difficulty"><BarChart className="w-4 h-4" /> <span className="hidden md:inline">Difficulty</span></button>
                  <button onClick={() => setBulkModalAction('tags')} className="bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors" title="Manage Tags"><Tag className="w-4 h-4" /> <span className="hidden md:inline">Tags</span></button>
                  
                  <div className="w-px h-6 bg-gray-700 mx-1 hidden md:block"></div>
                  
                  <button onClick={() => setBulkModalAction('duplicate')} className="bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors" title="Duplicate"><Copy className="w-4 h-4" /></button>
                  {filters.status?.includes('archived') ? (
                      <button onClick={() => setBulkModalAction('restore')} className="bg-white/10 hover:bg-white/20 text-emerald-400 px-3 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors" title="Restore"><Archive className="w-4 h-4 rotate-180" /></button>
                  ) : (
                      <button onClick={() => setBulkModalAction('archive')} className="bg-white/10 hover:bg-white/20 text-amber-400 px-3 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors" title="Archive"><Archive className="w-4 h-4" /></button>
                  )}
                  <button onClick={() => setBulkModalAction('delete')} className="bg-red-500/20 hover:bg-red-500/40 text-red-400 border border-red-500/30 px-3 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors" title="Delete"><Trash2 className="w-4 h-4" /></button>
                  
                  <div className="w-px h-6 bg-gray-700 mx-1 hidden md:block"></div>
                  
                  <div className="relative" ref={exportRef}>
                      <button onClick={() => setIsExportOpen(!isExportOpen)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors"><Download className="w-4 h-4" /> <span className="hidden md:inline">Export</span></button>
                      {isExportOpen && (
                          <div className="absolute right-0 top-full mt-2 w-32 bg-gray-800 rounded-xl shadow-xl border border-gray-700 py-1 z-50 overflow-hidden">
                              <button onClick={() => { setIsExportOpen(false); handleExport('csv'); }} className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white font-bold transition-colors">CSV</button>
                              <button onClick={() => { setIsExportOpen(false); handleExport('pdf'); }} className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white font-bold transition-colors">PDF</button>
                              <button onClick={() => { setIsExportOpen(false); handleExport('docx'); }} className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white font-bold transition-colors">DOCX</button>
                          </div>
                      )}
                  </div>
              </div>
          </div>
      )}

      {/* Main Content Area */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          
          {/* Filters Bar (Desktop) & Search */}
          <div className="border-b border-gray-100 dark:border-gray-700">
              <div className="p-4 md:p-6 flex flex-col md:flex-row gap-4 items-center justify-between">
                  <div className="relative flex-1 w-full max-w-2xl">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Search className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                          type="text"
                          placeholder="Search questions, subjects, tags..."
                          value={searchQuery}
                          onChange={(e) => updateSearchQuery(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm text-gray-900 dark:text-white transition-all font-medium"
                      />
                  </div>
                  
                  <div className="flex items-center gap-3 w-full md:w-auto">
                      <select value={sort} onChange={(e) => updateSort(e.target.value)} className="w-full md:w-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-sm font-bold text-gray-900 dark:text-white rounded-xl px-4 py-3 outline-none cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm">
                          <option value="newest">Newest First</option>
                          <option value="oldest">Oldest First</option>
                          <option value="az">Subject (A-Z)</option>
                          <option value="za">Subject (Z-A)</option>
                          <option value="difficulty_asc">Difficulty (Asc)</option>
                          <option value="difficulty_desc">Difficulty (Desc)</option>
                      </select>
                      
                      <button 
                          onClick={() => setIsFilterOpen(!isFilterOpen)} 
                          className={`flex items-center justify-center gap-2 border px-5 py-3 rounded-xl font-bold text-sm transition-all shadow-sm flex-shrink-0
                              ${isFilterOpen || Object.values(filters).some(arr => arr.length > 0) 
                                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-900/30 dark:border-indigo-500/30 dark:text-indigo-300' 
                                  : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
                              }`}
                      >
                          <ListFilter className="w-4 h-4" /> Filters
                          {Object.values(filters).reduce((acc, curr) => acc + (curr.length > 0 ? 1 : 0), 0) > 0 && (
                              <span className="ml-1 bg-indigo-600 text-white text-[10px] px-1.5 py-0.5 rounded-md">
                                  {Object.values(filters).reduce((acc, curr) => acc + (curr.length > 0 ? 1 : 0), 0)}
                              </span>
                          )}
                      </button>
                  </div>
              </div>
              
              <AdvancedFilters 
                  isOpen={isFilterOpen}
                  onClose={() => setIsFilterOpen(false)}
                  filters={filters}
                  setFilters={setFilters}
                  availableSubjects={subjects}
              />
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
                      if (pagination.absoluteTotal === 0 && !debouncedSearch && Object.values(filters).every(arr => arr.length === 0)) {
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
                              <button onClick={() => { setSearchParams(new URLSearchParams({ sort: 'newest' }), { replace: true }); }} className="mt-4 text-indigo-600 font-bold text-sm hover:underline">Clear all filters</button>
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
                                          <p className="text-sm font-bold text-gray-900 dark:text-white leading-snug line-clamp-2 max-w-lg">
                                              {highlightText(q.questionText, debouncedSearch)}
                                          </p>
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
                                      <p className="text-sm font-bold text-gray-900 dark:text-white line-clamp-3 flex-1">
                                          {highlightText(q.questionText, debouncedSearch)}
                                      </p>
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
      
      <BulkActionModal 
          isOpen={bulkModalAction !== null}
          onClose={() => setBulkModalAction(null)}
          actionType={bulkModalAction}
          selectedCount={selectedIds.size}
          onConfirm={handleBulkConfirm}
          subjects={subjects}
      />
      
      <ImportWizard 
          isOpen={isImportWizardOpen}
          onClose={() => setIsImportWizardOpen(false)}
          onImportSuccess={fetchQuestions}
      />
      
    </div>
  );
};

export default Questions;