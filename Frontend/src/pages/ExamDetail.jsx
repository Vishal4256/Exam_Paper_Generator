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

  const isSectioned = exam.blueprint && exam.blueprint.length > 0;
  
  const groupedQuestions = {};
  const counts = { MCQ: 0, 'Short Answer': 0, 'Long Answer': 0, 'True/False': 0, 'Coding': 0 };
  
  if (exam.questions) {
      exam.questions.forEach(q => {
          const type = q.type || 'MCQ';
          if (!groupedQuestions[type]) groupedQuestions[type] = [];
          groupedQuestions[type].push(q);
          if (counts[type] !== undefined) counts[type]++;
      });
  }

  let mcqMarks = 0;
  if (isSectioned) {
      exam.blueprint.forEach(sec => {
          if (sec.type === 'MCQ') {
              mcqMarks += sec.questionCount * sec.marksPerQuestion;
          }
      });
  } else {
      mcqMarks = counts['MCQ'] * (exam.marksDistribution?.['MCQ']?.marks || 1);
  }
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
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto mt-4 md:mt-0">
              <button onClick={handleEdit} className="w-full sm:w-auto justify-center px-5 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2 shadow-sm">
                  <Edit3 className="w-4 h-4" /> Edit Configuration
              </button>
              <button onClick={() => downloadPDF('exam')} className="w-full sm:w-auto justify-center px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-md shadow-indigo-600/20">
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
          {/* Header Block */}
          <div className="text-center font-serif text-black dark:text-gray-100 mb-6">
              <h1 className="text-xl font-bold uppercase tracking-wide">{exam.collegeName || exam.institutionName || 'INSTITUTION NAME'}</h1>
              <h2 className="text-lg font-bold uppercase mt-1">{exam.examMode === 'Multi Subject' ? 'MULTIPLE SUBJECTS' : (exam.subject || 'N/A')}</h2>
              {exam.courseCode && <div className="text-sm mt-1">Class: {exam.courseCode}</div>}
              <h3 className="text-base font-bold uppercase mt-2">{exam.examTitle} {previewMode === 'answer' ? '- ANSWER KEY' : ''}</h3>
              
              <div className="flex justify-between items-center text-sm font-bold uppercase border-t border-black dark:border-gray-200 mt-4 pt-4 border-b pb-4">
                  <span>TIME: {exam.duration ? exam.duration + ' HOURS' : 'N/A'}</span>
                  <span>M.M.: {exam.totalMarks || 0}</span>
              </div>
          </div>

          {/* Instructions */}
          <div className="mb-6 font-serif text-black dark:text-gray-100">
              <h4 className="text-sm font-bold mb-2">General Instructions:</h4>
              <pre className="text-sm font-serif whitespace-pre-wrap leading-relaxed">{exam.instructions || '• All questions are compulsory.\n• Read questions carefully before answering.'}</pre>
          </div>

          {/* Table Container */}
          <div className="border-t border-l border-black dark:border-gray-200 font-serif text-black dark:text-gray-100">
              
              {/* Table Header Row */}
              <div className="flex bg-gray-50 dark:bg-gray-800/50">
                  <div className="w-[10%] p-2 text-center text-xs font-bold border-r border-b border-black dark:border-gray-200">Q.NO.</div>
                  <div className="w-[75%] p-2 text-center text-xs font-bold border-r border-b border-black dark:border-gray-200">QUESTIONS</div>
                  <div className="w-[15%] p-2 text-center text-xs font-bold border-r border-b border-black dark:border-gray-200">MARKS</div>
              </div>

              {/* Sections & Questions */}
              {(() => {
                  let qNumber = 1;

                  const renderSection = (qList, sectionName, type, marksForType) => (
                      <React.Fragment key={sectionName}>
                          {/* Section Header */}
                          <div className="border-b border-r border-black dark:border-gray-200 bg-gray-50 dark:bg-gray-800/50 text-center py-2">
                              <div className="text-sm font-bold uppercase">{sectionName} ({type.toUpperCase()})</div>
                              <div className="text-xs italic">Questions carry {marksForType} mark{marksForType > 1 ? 's' : ''}</div>
                          </div>
                          
                          {/* Questions */}
                          {qList.map((q, qIndex) => {
                              const currentQNum = qNumber++;
                              return (
                                  <div key={q._id || qIndex} className="flex border-b border-r border-black dark:border-gray-200 min-h-[80px]">
                                      {/* Q.NO */}
                                      <div className="w-[10%] p-3 text-center text-sm font-bold border-r border-black dark:border-gray-200">
                                          {currentQNum}
                                      </div>
                                      
                                      {/* QUESTION BODY */}
                                      <div className="w-[75%] p-4 border-r border-black dark:border-gray-200 flex flex-col justify-between">
                                          <div>
                                              <p className="text-sm leading-relaxed mb-4 whitespace-pre-wrap">{q.questionText}</p>
                                              
                                              {/* Options */}
                                              {previewMode === 'paper' && (
                                                  <div className="flex flex-col gap-2 ml-2">
                                                      {type === 'MCQ' && q.options && q.options.map((opt, idx) => (
                                                          <div key={idx} className="text-sm">
                                                              {String.fromCharCode(65 + idx)}. {opt}
                                                          </div>
                                                      ))}
                                                      {type === 'True/False' && (
                                                          <>
                                                              <div className="text-sm">A. True</div>
                                                              <div className="text-sm">B. False</div>
                                                          </>
                                                      )}
                                                      {(type === 'Short Answer' || type === 'Long Answer' || type === 'Coding') && (
                                                          <div className="mt-8 italic text-xs text-gray-400">
                                                              [Space for answer...]
                                                          </div>
                                                      )}
                                                  </div>
                                              )}
                                              
                                              {/* Answer Key Output */}
                                              {previewMode === 'answer' && (
                                                  <div className="mt-4 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                                                      Correct Answer: {q.correctAnswer || 'N/A'}
                                                  </div>
                                              )}
                                          </div>
                                          
                                          {/* Metadata */}
                                          <div className="text-right mt-4 text-[10px] text-gray-500 italic">
                                              Difficulty: {q.difficultyLevel || 'Medium'}
                                          </div>
                                      </div>
                                      
                                      {/* MARKS */}
                                      <div className="w-[15%] p-3 text-center text-sm font-bold flex items-center justify-center">
                                          {marksForType}
                                      </div>
                                  </div>
                              );
                          })}
                      </React.Fragment>
                  );

                  if (isSectioned && exam.sectionedQuestions) {
                      return exam.sectionedQuestions.map((sectionGroup, sIdx) => {
                          if (!sectionGroup.questions || sectionGroup.questions.length === 0) return null;
                          const bp = exam.blueprint ? exam.blueprint.find(b => b.sectionName === sectionGroup.sectionName) : null;
                          const marksForType = bp ? bp.marksPerQuestion : 1;
                          const type = bp ? (bp.type || 'MCQ') : 'MCQ';
                          return renderSection(sectionGroup.questions, `SECTION ${String.fromCharCode(65 + sIdx)}`, type, marksForType);
                      });
                  } else {
                      const questionsByType = { 'MCQ': [], 'Short Answer': [], 'Long Answer': [], 'True/False': [] };
                      exam.questions.forEach(q => {
                          if (questionsByType[q.type]) questionsByType[q.type].push(q);
                          else questionsByType['MCQ'].push(q);
                      });

                      let sIdx = 0;
                      return Object.entries(questionsByType).map(([type, qList]) => {
                          if (qList.length === 0) return null;
                          const marksForType = exam.marksDistribution?.[type]?.marks || 1;
                          const sectionName = `SECTION ${String.fromCharCode(65 + sIdx)}`;
                          sIdx++;
                          return renderSection(qList, sectionName, type, marksForType);
                      });
                  }
              })()}

          </div>

          <div className="mt-12 text-center text-xs text-black dark:text-gray-400 font-serif">
              Page 1
              <br/>
              <span className="text-[10px]">Developed by ExamFlow</span>
          </div>
      </div>
    </div>
  );
};

export default ExamDetail;

const ChevronRight = ({className}) => <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>;