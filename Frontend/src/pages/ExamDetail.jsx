import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../utils/axiosConfig';
import { Download, Edit3, Key, Printer, Share2, Building2, Calendar, Clock, Award, XCircle, FileText } from 'lucide-react';
import { toast } from 'react-toastify';

const ExamDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [previewMode, setPreviewMode] = useState('paper');

  useEffect(() => {
    fetchExam();
  }, [id]);

  const fetchExam = async () => {
    try {
      const res = await api.get(`/exams/${id}`);
      setExam(res.data);
    } catch (err) {
      console.error('Error fetching exam:', err);
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = async (type) => {
    try {
        const url = type === 'exam' ? `/exams/${id}/pdf` : `/exams/${id}/answer-key`;
        const res = await api.get(url, { responseType: 'blob' });
        
        const blob = new Blob([res.data], { type: 'application/pdf' });
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `${type === 'exam' ? 'Exam' : 'Answer-Key'}-${id}.pdf`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(downloadUrl);
        toast.success(type === 'exam' ? 'Exam PDF Downloaded!' : 'Answer Key Exported!');
    } catch (err) {
        console.error('Error downloading PDF:', err);
        toast.error('Failed to download PDF');
    }
  };

  const handleShare = () => {
      const url = `${window.location.origin}/exams/${id}`;
      navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard!");
  };

  const handlePrint = () => {
      window.print();
  };

  const handleEdit = () => {
      navigate(`/generate?edit=${id}`);
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!exam) return <div className="text-center py-20">Exam not found</div>;

  const groupedQuestions = {};
  const counts = { MCQ: 0, 'Short Answer': 0, 'Long Answer': 0, 'True/False': 0 };
  
  if (exam.questions) {
      exam.questions.forEach(q => {
          const type = q.type || 'MCQ';
          if (!groupedQuestions[type]) groupedQuestions[type] = [];
          groupedQuestions[type].push(q);
          counts[type]++;
      });
  }

  const mcqMarks = counts['MCQ'] * (exam.marksDistribution?.['MCQ']?.marks || 1);
  const subjectiveMarks = (exam.totalMarks || 0) - mcqMarks;
  const mcqPercentage = exam.totalMarks ? Math.round((mcqMarks / exam.totalMarks) * 100) : 0;
  const subPercentage = exam.totalMarks ? 100 - mcqPercentage : 0;

  return (
    <div className="max-w-[1200px] mx-auto pb-12 space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-start gap-6 print:hidden">
          <div>
              <div className="flex flex-wrap gap-2 mb-2">
                  <span className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest">{exam.subject}</span>
                  {exam.topic && <span className="bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest">{exam.topic}</span>}
                  <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest flex items-center">• Generated {new Date(exam.generatedAt).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}</span>
              </div>
              <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-3">{exam.examTitle}</h1>
              <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> {exam.examDate ? new Date(exam.examDate).toLocaleDateString() : 'Winter Semester'}</div>
                  <div className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {exam.duration} Minutes</div>
                  <div className="flex items-center gap-1.5"><Building2 className="w-4 h-4" /> {exam.collegeName || 'Physics Department'}</div>
              </div>
          </div>
          <div className="flex gap-3">
              <button onClick={handleEdit} className="px-5 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2 shadow-sm">
                  <Edit3 className="w-4 h-4" /> Edit Configuration
              </button>
              <button onClick={() => downloadPDF('exam')} className="px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-md shadow-indigo-600/20">
                  <Download className="w-4 h-4" /> Download PDF
              </button>
          </div>
      </div>

      {/* Analytics Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 print:hidden">
          
          {/* Question Breakdown */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
              <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4">Question Breakdown</p>
              <div className="flex items-baseline gap-2 mb-6">
                  <span className="text-4xl font-black text-gray-900 dark:text-white">{exam.questions?.length || 0}</span>
                  <span className="text-xs font-bold text-gray-500 dark:text-gray-400">Total Questions</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                  <div className="bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-700 rounded-lg p-3 text-center">
                      <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 mb-1">MCQs</p>
                      <p className="text-xl font-black text-gray-900 dark:text-white">{counts['MCQ']}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-700 rounded-lg p-3 text-center">
                      <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 mb-1">Short</p>
                      <p className="text-xl font-black text-gray-900 dark:text-white">{counts['Short Answer']}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-700 rounded-lg p-3 text-center">
                      <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 mb-1">Long</p>
                      <p className="text-xl font-black text-gray-900 dark:text-white">{counts['Long Answer']}</p>
                  </div>
              </div>
          </div>

          {/* Weightage */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
              <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4">Weightage</p>
              <div className="flex items-baseline gap-2 mb-6">
                  <span className="text-4xl font-black text-indigo-600 dark:text-indigo-400">{exam.totalMarks || 0}</span>
                  <span className="text-xs font-bold text-gray-500 dark:text-gray-400">Total Marks</span>
              </div>
              <div className="space-y-4">
                  <div>
                      <div className="flex justify-between text-[10px] font-bold mb-1">
                          <span className="text-gray-500 dark:text-gray-400">MCQs ({exam.marksDistribution?.['MCQ']?.marks || 1} pts each)</span>
                          <span className="text-gray-900 dark:text-white">{mcqPercentage}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden"><div className="h-full bg-indigo-600 dark:bg-indigo-500 rounded-full" style={{width: `${mcqPercentage}%`}}></div></div>
                  </div>
                  <div>
                      <div className="flex justify-between text-[10px] font-bold mb-1">
                          <span className="text-gray-500 dark:text-gray-400">Short/Long Response</span>
                          <span className="text-gray-900 dark:text-white">{subPercentage}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden"><div className="h-full bg-indigo-600 dark:bg-indigo-500 rounded-full" style={{width: `${subPercentage}%`}}></div></div>
                  </div>
              </div>
          </div>

          {/* Quick Exports */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
              <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4">Quick Exports</p>
              <div className="space-y-2">
                  <button onClick={() => downloadPDF('answer')} className="w-full bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-100 dark:border-gray-600 rounded-xl p-3 flex justify-between items-center transition-colors">
                      <div className="flex items-center gap-3"><Key className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /><span className="text-xs font-bold text-gray-700 dark:text-gray-300">Answer Key</span></div>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                  </button>
                  <button onClick={handlePrint} className="w-full bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-100 dark:border-gray-600 rounded-xl p-3 flex justify-between items-center transition-colors">
                      <div className="flex items-center gap-3"><Printer className="w-4 h-4 text-gray-400" /><span className="text-xs font-bold text-gray-700 dark:text-gray-300">Print Layout</span></div>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                  </button>
                  <button onClick={handleShare} className="w-full bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-100 dark:border-gray-600 rounded-xl p-3 flex justify-between items-center transition-colors">
                      <div className="flex items-center gap-3"><Share2 className="w-4 h-4 text-gray-400" /><span className="text-xs font-bold text-gray-700 dark:text-gray-300">Share Link</span></div>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                  </button>
              </div>
          </div>

      </div>

      {/* Document Preview Header Area */}
      <div className="flex justify-between items-end pt-4 pb-2 print:hidden">
          <span className="text-xs font-bold text-gray-500 dark:text-gray-400">Document Preview</span>
          <div className="flex items-center gap-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-1 shadow-sm">
              <button onClick={() => setPreviewMode('paper')} className={`px-4 py-1.5 rounded text-[10px] font-bold transition-colors ${previewMode === 'paper' ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'}`}>Paper</button>
              <button onClick={() => setPreviewMode('answer')} className={`px-4 py-1.5 rounded text-[10px] font-bold transition-colors ${previewMode === 'answer' ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'}`}>Answer Key</button>
          </div>
      </div>

      {/* Document Canvas (A4 simulation) */}
      <div className="bg-white dark:bg-gray-900 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none border border-gray-200 dark:border-gray-800 rounded-sm mx-auto w-full max-w-[800px] min-h-[1131px] p-12 md:p-16 relative print:shadow-none print:border-none print:m-0 print:p-0 print:max-w-none print:w-full">
          
          {(!exam.examHeaderStyle || exam.examHeaderStyle === 'Style 3') && (
              <div className="text-center mb-10 border-b-2 border-gray-900 dark:border-gray-100 pb-4">
                  <div className="flex justify-center mb-4">
                      {exam.logo ? (
                          <img src={exam.logo} alt="Logo" className="w-16 h-16 object-contain" />
                      ) : (
                          <div className="w-16 h-16 border-2 border-gray-800 dark:border-gray-200 flex items-center justify-center">
                              <FileText className="w-8 h-8 text-gray-800 dark:text-gray-200" />
                          </div>
                      )}
                  </div>
                  <h4 className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em] mb-2">{exam.collegeName || exam.institutionName || 'INSTITUTION NAME'}</h4>
                  <h2 className="text-2xl font-black text-gray-900 dark:text-white leading-tight mb-2 uppercase">{exam.examTitle}</h2>
                  {exam.courseCode && <span className="inline-block px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-700 text-xs font-bold rounded-full mb-6">{exam.courseCode}</span>}
                  <div className="flex justify-between items-center text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                      <span>Time: {exam.duration} Minutes</span>
                      <span>Total Marks: {exam.totalMarks}</span>
                  </div>
              </div>
          )}

          {exam.examHeaderStyle === 'Style 1' && (
              <div className="text-center mb-10 border-b-2 border-gray-900 dark:border-gray-100 pb-6 relative">
                  {exam.logo && <img src={exam.logo} alt="Logo" className="absolute left-0 top-0 w-16 h-16 object-contain" />}
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white uppercase tracking-wide">{exam.institutionName || exam.collegeName}</h2>
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mt-1 uppercase">{exam.examTitle}</h3>
                  <div className="flex justify-between items-center mt-6 text-sm font-bold text-gray-800 dark:text-gray-200">
                      <span>Subject: {exam.subject}</span>
                      <span>Time: {exam.duration} Mins</span>
                      <span>Max Marks: {exam.totalMarks}</span>
                  </div>
              </div>
          )}

          {exam.examHeaderStyle === 'Style 2' && (
              <div className="text-center mb-10 border-b border-gray-400 dark:border-gray-600 pb-6">
                  <h2 className="text-2xl font-serif font-bold text-gray-900 dark:text-white mb-1">{exam.institutionName || exam.collegeName}</h2>
                  {exam.department && <h3 className="text-sm font-serif italic text-gray-600 dark:text-gray-400 mb-2">Department of {exam.department}</h3>}
                  <h4 className="text-md font-bold uppercase tracking-widest text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 inline-block px-4 py-1 rounded-full mb-4">{exam.academicSession}</h4>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{exam.examTitle}</h3>
                  <div className="flex justify-between items-center text-sm font-bold text-gray-800 dark:text-gray-200 mt-4 px-4 py-2 border-y border-gray-300 dark:border-gray-700">
                      <span>Course: {exam.courseCode || exam.subject}</span>
                      <span>Time Allowed: {exam.duration} Mins</span>
                      <span>Maximum Marks: {exam.totalMarks}</span>
                  </div>
              </div>
          )}

          {exam.examHeaderStyle === 'Style 4' && (
              <div className="mb-10 border-4 border-double border-gray-900 dark:border-gray-100 p-4">
                  <div className="flex gap-4 items-center border-b border-gray-400 dark:border-gray-600 pb-4 mb-4">
                      {exam.logo && <img src={exam.logo} alt="Logo" className="w-16 h-16 object-contain" />}
                      <div className="flex-1 text-center pr-16">
                          <h2 className="text-xl font-bold text-gray-900 dark:text-white uppercase">{exam.institutionName || exam.collegeName}</h2>
                          <h3 className="text-md font-bold text-gray-800 dark:text-gray-200 uppercase mt-1">{exam.examTitle}</h3>
                      </div>
                  </div>
                  <div className="grid grid-cols-2 gap-y-2 text-sm font-bold text-gray-800 dark:text-gray-200">
                      <div><span className="text-gray-500 dark:text-gray-400">SUBJECT:</span> {exam.subject}</div>
                      <div className="text-right"><span className="text-gray-500 dark:text-gray-400">SESSION:</span> {exam.academicSession}</div>
                      <div><span className="text-gray-500 dark:text-gray-400">TIME:</span> {exam.duration} MINUTES</div>
                      <div className="text-right"><span className="text-gray-500 dark:text-gray-400">MARKS:</span> {exam.totalMarks}</div>
                  </div>
              </div>
          )}

          {previewMode === 'answer' && (
              <div className="text-center bg-gray-100 dark:bg-gray-800 py-2 mb-6 font-bold uppercase tracking-widest text-sm border-y border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white">
                  OFFICIAL ANSWER KEY
              </div>
          )}

          {exam.instructions && previewMode === 'paper' && (
              <div className="mb-10 text-xs text-gray-800 dark:text-gray-200">
                  <h3 className="font-bold underline mb-3">General Instructions:</h3>
                  <pre className="text-xs text-gray-700 dark:text-gray-300 font-sans whitespace-pre-wrap">{exam.instructions}</pre>
              </div>
          )}

          <div className="space-y-10">
            {Object.entries(groupedQuestions).map(([type, qList]) => {
                const marksForType = exam.marksDistribution?.[type]?.marks || 1;
                const sectionMap = {'MCQ': 'A: MULTIPLE CHOICE', 'Short Answer': 'B: SHORT ANALYSIS', 'Long Answer': 'C: LONG RESPONSE', 'True/False': 'D: TRUE/FALSE'};

                return (
                    <div key={type}>
                        <div className="flex justify-between items-end border-b-2 border-gray-800 dark:border-gray-200 pb-2 mb-6">
                            <h3 className="font-black text-gray-900 dark:text-white uppercase text-sm">
                                SECTION {sectionMap[type]} <span className="font-bold">({qList.length * marksForType} MARKS)</span>
                            </h3>
                            <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 italic">Attempt all questions.</span>
                        </div>

                        <div className="space-y-6">
                            {qList.map((question, index) => (
                                <div key={question._id || index} className="flex gap-4">
                                    <span className="font-black text-gray-900 dark:text-white text-xs mt-0.5">Q{index + 1}.</span>
                                    <div className="flex-1">
                                        <p className="text-xs font-bold text-gray-900 dark:text-white mb-3 leading-relaxed">
                                            {question.questionText}
                                        </p>
                                        
                                        {(type === 'MCQ' || type === 'True/False') && previewMode === 'paper' && (
                                            <div className="grid grid-cols-2 gap-y-2 gap-x-8 ml-2">
                                                {(type === 'True/False' ? ['True', 'False'] : (question.options || [])).map((option, optIndex) => (
                                                    <div key={optIndex} className="text-xs text-gray-700 dark:text-gray-300 font-medium flex gap-2">
                                                        <span>{String.fromCharCode(65 + optIndex)})</span> {option}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        {type === 'Long Answer' && previewMode === 'paper' && (
                                            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 italic text-[10px] text-gray-400 font-medium">
                                                [Space for answer...]
                                            </div>
                                        )}
                                        {previewMode === 'answer' && (
                                            <div className="mt-3 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 rounded-lg">
                                                <div className="flex gap-2">
                                                    <span className="text-xs font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-widest">Answer:</span>
                                                    <span className="text-xs font-medium text-emerald-900 dark:text-emerald-300">{question.correctAnswer}</span>
                                                </div>
                                                {question.explanation && (
                                                    <div className="mt-2 text-xs text-emerald-700 dark:text-emerald-500 leading-relaxed italic border-t border-emerald-200/50 dark:border-emerald-800/50 pt-2">
                                                        {question.explanation}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <span className="font-bold text-gray-900 dark:text-white text-[10px]">[{marksForType}]</span>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}
          </div>


      </div>
    </div>
  );
};

export default ExamDetail;

const ChevronRight = ({className}) => <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>;