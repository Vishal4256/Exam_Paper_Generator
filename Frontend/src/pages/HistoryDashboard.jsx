import React, { useState, useEffect } from 'react';
import { Clock, Search, Filter, Trash2, Download, RefreshCw, FileText, Calendar, BookOpen, AlertCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import api from '../utils/axiosConfig';

const HistoryDashboard = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  
  const navigate = useNavigate();

  useEffect(() => {
    fetchHistory();
  }, [filterSubject]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const url = filterSubject ? `/history?subject=${filterSubject}` : '/history';
      const res = await api.get(url);
      setHistory(res.data.history);
    } catch (error) {
      toast.error("Failed to load history");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this history record?")) return;
    try {
      await api.delete(`/history/${id}`);
      setHistory(prev => prev.filter(h => h._id !== id));
      toast.success("Record deleted");
    } catch (error) {
      toast.error("Failed to delete record");
    }
  };

  const handleRestore = (record) => {
    const sessionToRestore = {
      activeTab: 'questions',
      extractedText: record.extractedText || '',
      generatedQuestions: record.generatedQuestions || [],
      selectedQuestions: (record.generatedQuestions || []).map((_, i) => i)
    };
    localStorage.setItem('ai_session_state', JSON.stringify(sessionToRestore));
    toast.success("Session restored! Redirecting to AI Import Center...");
    navigate('/ai-import');
  };

  const handleExport = async (record) => {
    if (!record.generatedQuestions || record.generatedQuestions.length === 0) {
      return toast.error("No questions to export in this record.");
    }
    try {
      const res = await api.post(`/import/export/pdf`, { questions: record.generatedQuestions }, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Export_${record.fileName}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      toast.success("Export downloaded");
    } catch (err) {
      toast.error("Failed to export");
    }
  };

  const filteredHistory = history.filter(h => 
    h.fileName.toLowerCase().includes(search.toLowerCase()) || 
    (h.subject || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Clock className="w-8 h-8 text-indigo-600" /> AI Import History
          </h1>
          <p className="text-gray-500 mt-2 text-sm">Review, restore, and re-download your past AI processing jobs.</p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-4 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex-1 relative">
          <Search className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search by filename or subject..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
          />
        </div>
        <div className="relative">
          <Filter className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
          <select 
            value={filterSubject}
            onChange={(e) => setFilterSubject(e.target.value)}
            className="w-full sm:w-48 pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white appearance-none cursor-pointer"
          >
            <option value="">All Subjects</option>
            {[...new Set(history.map(h => h.subject).filter(Boolean))].map(sub => (
              <option key={sub} value={sub}>{sub}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <RefreshCw className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      ) : filteredHistory.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 dark:bg-gray-800/50 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No history found</h3>
          <p className="text-gray-500 text-sm">Your processed AI documents will appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredHistory.map((record) => (
            <div key={record._id} className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow flex flex-col h-full">
              
              <div className="flex justify-between items-start mb-4">
                <div className="bg-indigo-50 dark:bg-indigo-900/20 p-2.5 rounded-lg">
                  <FileText className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${record.processingStatus === 'Completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                  {record.processingStatus}
                </span>
              </div>
              
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1 truncate" title={record.fileName}>{record.fileName}</h3>
              <p className="text-sm text-gray-500 mb-4">{record.fileType}</p>
              
              <div className="space-y-2 mt-auto pb-4 mb-4 border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <BookOpen className="w-4 h-4" /> 
                  <span className="truncate">{record.subject || 'Uncategorized'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Calendar className="w-4 h-4" /> 
                  {new Date(record.createdAt).toLocaleDateString()}
                </div>
                {record.generatedQuestions?.length > 0 && (
                  <div className="text-sm font-medium text-indigo-600 dark:text-indigo-400 mt-2">
                    {record.generatedQuestions.length} Questions Generated
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={() => handleRestore(record)}
                  className="flex-1 flex justify-center items-center gap-1.5 px-3 py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 font-medium text-xs rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" /> Restore
                </button>
                <button 
                  onClick={() => handleExport(record)}
                  className="flex-1 flex justify-center items-center gap-1.5 px-3 py-2 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium text-xs rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                >
                  <Download className="w-4 h-4" /> PDF
                </button>
                <button 
                  onClick={() => handleDelete(record._id)}
                  className="px-3 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-medium rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HistoryDashboard;
