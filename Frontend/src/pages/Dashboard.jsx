import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/axiosConfig';
import { useAuth } from '../context/AuthContext';
import { Plus, Sparkles, FileText, CheckCircle2 } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalQuestions: 0,
    totalExams: 0,
    subjects: 0,
    recentExams: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [questionsRes, examsRes] = await Promise.all([
        api.get('/questions'),
        api.get('/exams')
      ]);

      const questions = questionsRes.data.questions || questionsRes.data;
      const exams = examsRes.data;
      const subjects = new Set(questions.map(q => q.subject)).size;

      // Calculate Distributions
      const diffDist = {};
      const typeDist = {};
      const subjDist = {};

      questions.forEach(q => {
        diffDist[q.difficulty] = (diffDist[q.difficulty] || 0) + 1;
        typeDist[q.type] = (typeDist[q.type] || 0) + 1;
        subjDist[q.subject] = (subjDist[q.subject] || 0) + 1;
      });

      const difficultyData = Object.keys(diffDist).map(k => ({ name: k, value: diffDist[k] }));
      const typeData = Object.keys(typeDist).map(k => ({ name: k, count: typeDist[k] }));
      const subjectData = Object.keys(subjDist).map(k => ({ name: k, value: subjDist[k] }));

      setStats({
        totalQuestions: questions.length,
        totalExams: exams.length,
        subjects: subjects,
        recentExams: exams.slice(0, 5),
        difficultyData,
        typeData,
        subjectData
      });
    } catch (err) {
      console.error('Error fetching stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto space-y-8 pb-8">
      
      {/* Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
        <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-1">Dashboard</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Welcome back, {user?.name}</p>
        </div>
        <div className="flex items-center gap-3">
            <Link to="/questions" className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 px-4 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-all flex items-center gap-2">
                <Plus className="w-4 h-4" /> Add Question
            </Link>
            <Link to="/generate" className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-indigo-600/20 transition-all flex items-center gap-2">
                <Sparkles className="w-4 h-4" /> Generate New Exam
            </Link>
        </div>
      </div>

      {/* Stat Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col justify-between h-32 relative overflow-hidden group">
          <div className="flex justify-between items-start w-full">
            <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg flex items-center justify-center">
              <span className="font-bold text-lg">?</span>
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-0.5">Total Questions</p>
            <p className="text-2xl font-black text-gray-900 dark:text-white">{stats.totalQuestions}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col justify-between h-32 relative overflow-hidden group">
          <div className="flex justify-between items-start w-full">
            <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-0.5">Generated Exams</p>
            <p className="text-2xl font-black text-gray-900 dark:text-white">{stats.totalExams}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col justify-between h-32 relative overflow-hidden group">
          <div className="flex justify-between items-start w-full">
            <div className="w-10 h-10 bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-0.5">Subjects</p>
            <p className="text-2xl font-black text-gray-900 dark:text-white">{stats.subjects}</p>
          </div>
        </div>
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
              <h3 className="font-bold text-gray-900 dark:text-white mb-6">Subject Distribution</h3>
              <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                          <Pie data={stats.subjectData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} fill="#8884d8" label>
                              {stats.subjectData?.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={['#6366f1', '#10b981', '#f59e0b', '#3b82f6', '#ec4899'][index % 5]} />
                              ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                      </PieChart>
                  </ResponsiveContainer>
              </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
              <h3 className="font-bold text-gray-900 dark:text-white mb-6">Question Type Distribution</h3>
              <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats.typeData}>
                          <XAxis dataKey="name" tick={{fontSize: 12}} />
                          <YAxis />
                          <Tooltip cursor={{fill: 'transparent'}} />
                          <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={40} />
                      </BarChart>
                  </ResponsiveContainer>
              </div>
          </div>
      </div>

      {/* Main Grid */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="px-6 py-5 flex justify-between items-center">
              <h3 className="font-bold text-gray-900 dark:text-white">Recent Exams</h3>
              <Link to="/exams" className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:text-indigo-700 dark:hover:text-indigo-300">
                  View All
              </Link>
          </div>
          <div className="overflow-x-auto">
              <table className="w-full text-left">
                  <thead className="bg-gray-50/30 dark:bg-gray-700/50 border-y border-gray-100 dark:border-gray-700">
                      <tr>
                          <th className="px-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Exam Name</th>
                          <th className="px-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Subject</th>
                          <th className="px-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Date</th>
                          <th className="px-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Status</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                      {stats.recentExams.length === 0 ? (
                        <tr>
                          <td colSpan="4" className="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400">No exams generated yet</td>
                        </tr>
                      ) : stats.recentExams.map((exam) => (
                          <tr key={exam._id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors">
                              <td className="px-6 py-4">
                                  <Link to={`/exams/${exam._id}`} className="text-sm font-bold text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400">
                                      {exam.examTitle}
                                  </Link>
                              </td>
                              <td className="px-6 py-4 text-xs font-medium text-gray-500 dark:text-gray-400">{exam.subject || '-'}</td>
                              <td className="px-6 py-4 text-xs font-medium text-gray-500 dark:text-gray-400">
                                  {new Date(exam.generatedAt).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4">
                                  <span className="px-2 py-1 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold uppercase rounded-md">Generated</span>
                              </td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
      </div>
    </div>
  );
};

export default Dashboard;