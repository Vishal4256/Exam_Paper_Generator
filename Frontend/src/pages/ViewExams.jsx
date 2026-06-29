import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/axiosConfig';
import { Files, Search, Filter, Calendar, ChevronRight, Eye, Download, Trash2, AlertCircle } from 'lucide-react';
import { toast } from 'react-toastify';

const ViewExams = () => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedExams, setSelectedExams] = useState([]);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [examToDelete, setExamToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      const res = await api.get('/exams');
      setExams(res.data);
    } catch (err) {
      console.error('Error fetching exams:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!examToDelete) return;
    setDeleting(true);
    try {
      await api.delete(`/exams/${examToDelete}`);
      setExams(exams.filter(e => e._id !== examToDelete));
      toast.success("Exam deleted successfully");
      setDeleteModalOpen(false);
      setExamToDelete(null);
      setSelectedExams(selectedExams.filter(id => id !== examToDelete));
    } catch (err) {
      toast.error(err.response?.data?.msg || "Failed to delete exam");
    } finally {
      setDeleting(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedExams.length === 0) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedExams.length} exams?`)) return;
    try {
      await api.delete('/exams/bulk', { data: { examIds: selectedExams } });
      setExams(exams.filter(e => !selectedExams.includes(e._id)));
      toast.success("Exams deleted successfully");
      setSelectedExams([]);
    } catch (err) {
      toast.error("Failed to delete exams");
    }
  };

  const handleDownloadPDF = async (id) => {
    try {
      const res = await api.get(`/exams/${id}/pdf`, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `Exam-${id}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
      toast.success('Exam PDF Downloaded!');
    } catch (err) {
      toast.error('Failed to download PDF');
    }
  };

  const filteredExams = exams.filter(exam => 
    exam.examTitle?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    exam.subject?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto">
        {/* Header & Actions */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div className="relative w-full md:w-96">
                <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                    type="text"
                    placeholder="Search exams by title or subject..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all shadow-sm text-gray-900 dark:text-gray-100"
                />
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                {selectedExams.length > 0 && (
                    <button onClick={handleBulkDelete} className="w-full sm:w-auto justify-center bg-red-50 border border-red-200 hover:bg-red-100 text-red-600 px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 transition-all shadow-sm">
                        <Trash2 className="w-4 h-4" />
                        Delete Selected ({selectedExams.length})
                    </button>
                )}
                <button className="w-full sm:w-auto justify-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 transition-all shadow-sm">
                    <Filter className="w-4 h-4" />
                    Filter
                </button>
            </div>
        </div>

        {/* Data Grid */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm overflow-hidden">
            {loading ? (
                <div className="p-12 text-center text-gray-500">Loading exams...</div>
            ) : filteredExams.length === 0 ? (
                <div className="p-12 text-center">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Files className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">No Exams Found</h3>
                    <p className="text-gray-500">Generate your first exam to get started.</p>
                    <Link to="/generate" className="mt-4 inline-block bg-indigo-600 text-white font-semibold px-6 py-2.5 rounded-xl hover:bg-indigo-700 transition-colors">
                        Generate Exam
                    </Link>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[900px] text-left border-collapse">
                        <thead className="bg-gray-50/80 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                            <tr>
                                <th className="px-6 py-4 text-left w-12">
                                    <input 
                                        type="checkbox" 
                                        className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                                        checked={filteredExams.length > 0 && selectedExams.length === filteredExams.length}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setSelectedExams(filteredExams.map(ex => ex._id));
                                            } else {
                                                setSelectedExams([]);
                                            }
                                        }}
                                    />
                                </th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Exam Title</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Subject</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Questions</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Marks</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Date Created</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {filteredExams.map((exam) => (
                                <tr key={exam._id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors group">
                                    <td className="px-6 py-4">
                                        <input 
                                            type="checkbox" 
                                            className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                                            checked={selectedExams.includes(exam._id)}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setSelectedExams([...selectedExams, exam._id]);
                                                } else {
                                                    setSelectedExams(selectedExams.filter(id => id !== exam._id));
                                                }
                                            }}
                                        />
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-gray-900 dark:text-white mb-0.5">{exam.examTitle}</div>
                                        {exam.collegeName && <div className="text-xs text-gray-500 dark:text-gray-400">{exam.collegeName}</div>}
                                        {exam.topic && <div className="text-xs font-semibold text-indigo-500 mt-1">Topic: {exam.topic}</div>}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-sm font-medium bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400">
                                            {exam.subject || 'Mixed'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 font-semibold text-gray-700 dark:text-gray-300">
                                        {exam.questions?.length || 0}
                                    </td>
                                    <td className="px-6 py-4 font-semibold text-gray-700 dark:text-gray-300">
                                        {exam.totalMarks || 0}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2 mt-1.5">
                                        <Calendar className="w-4 h-4 text-gray-400" />
                                        {new Date(exam.generatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                                    </td>
                                    <td className="px-6 py-4 text-right flex justify-end gap-1">
                                        <Link 
                                            to={`/exams/${exam._id}`} 
                                            title="View Exam"
                                            className="inline-flex items-center justify-center p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                        >
                                            <Eye className="w-4 h-4" />
                                        </Link>
                                        <button 
                                            onClick={() => handleDownloadPDF(exam._id)}
                                            title="Download PDF"
                                            className="inline-flex items-center justify-center p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                        >
                                            <Download className="w-4 h-4" />
                                        </button>
                                        <button 
                                            onClick={() => { setExamToDelete(exam._id); setDeleteModalOpen(true); }}
                                            title="Delete Exam"
                                            className="inline-flex items-center justify-center p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">Showing {filteredExams.length} records</span>
            </div>
        </div>

        {/* Delete Confirmation Modal */}
        {deleteModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
                <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md overflow-hidden shadow-xl transform transition-all">
                    <div className="p-6">
                        <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center mb-4 mx-auto">
                            <AlertCircle className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-bold text-center text-gray-900 dark:text-white mb-2">Delete Exam</h3>
                        <p className="text-center text-gray-500 dark:text-gray-400 mb-6 text-sm">
                            Are you sure you want to delete this exam? <br/>This action cannot be undone.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => { setDeleteModalOpen(false); setExamToDelete(null); }}
                                disabled={deleting}
                                className="flex-1 px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={deleting}
                                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors flex justify-center items-center gap-2"
                            >
                                {deleting ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default ViewExams;