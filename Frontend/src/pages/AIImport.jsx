import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, FileText, Image as ImageIcon, Loader2, Save, Download, RefreshCw, Trash2, CheckCircle, FileOutput, FilePlus2, BarChart2, FileUp, Sparkles, Copy, X, AlertTriangle, CheckCircle2 } from 'lucide-react';
import api from '../utils/axiosConfig';
import { toast } from 'react-toastify';

const AIImport = () => {
  const [activeTab, setActiveTab] = useState('pdf');
  const [files, setFiles] = useState([]);
  const [ocrLang, setOcrLang] = useState('eng');
  
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionProgress, setExtractionProgress] = useState(0);
  
  const [extractedText, setExtractedText] = useState('');
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [savedSession, setSavedSession] = useState(null);
  
  const [saveStatus, setSaveStatus] = useState('saved'); // 'unsaved', 'saving', 'saved'
  const [lastSaved, setLastSaved] = useState(null);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);

  const [currentJobId, setCurrentJobId] = useState(null);
  const [jobStatus, setJobStatus] = useState(null);

  const [options, setOptions] = useState({
    generationMode: 'New',
    subject: '',
    type: 'Mixed',
    difficulty: 'Mixed',
    count: 10,
    marks: 1
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  
  const [generatedQuestions, setGeneratedQuestions] = useState([]);
  const [selectedQuestions, setSelectedQuestions] = useState(new Set());
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const sessionStr = localStorage.getItem('ai_session_state');
    if (sessionStr) {
      try {
        const session = JSON.parse(sessionStr);
        if (session.extractedText || session.generatedQuestions?.length > 0) {
          setSavedSession(session);
          setShowSessionModal(true);
        }
      } catch (e) {
        localStorage.removeItem('ai_session_state');
      }
    }
  }, []);

  useEffect(() => {
    if (!showSessionModal) {
      setSaveStatus('unsaved');
      
      const timer = setTimeout(() => {
        setSaveStatus('saving');
        const stateToSave = {
          activeTab,
          ocrLang,
          extractedText,
          options,
          generatedQuestions,
          selectedQuestions: Array.from(selectedQuestions)
        };
        
        if (extractedText || generatedQuestions.length > 0) {
          localStorage.setItem('ai_session_state', JSON.stringify(stateToSave));
          setLastSaved(new Date());
        } else {
          localStorage.removeItem('ai_session_state');
        }
        setSaveStatus('saved');
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [activeTab, ocrLang, extractedText, options, generatedQuestions, selectedQuestions, showSessionModal]);

  useEffect(() => {
    if (!currentJobId) return;

    const interval = setInterval(async () => {
      try {
        const res = await api.get(`/jobs/${currentJobId}`);
        const job = res.data.job;
        setJobStatus(job);

        if (job.status === 'Completed') {
          if (job.result.extractedText) {
            setExtractedText(job.result.extractedText);
            if (job.result.analysis) {
              setAnalysis(job.result.analysis);
              if (job.result.analysis.subject && !options.subject) {
                setOptions(prev => ({ ...prev, subject: job.result.analysis.subject }));
              }
            }
            setActiveTab('preview');
            toast.success("Text extracted successfully!");
            setIsExtracting(false);
          } else if (job.result.generatedQuestions) {
            const newQuestions = job.result.generatedQuestions;
            
            try {
              const simRes = await api.post('/import/check-similarity', { questions: newQuestions });
              if (simRes.data.success) {
                  newQuestions.forEach((q, i) => {
                      q.similarity = simRes.data.results[i];
                  });
              }
            } catch (e) { console.error("Similarity check failed:", e); }

            setGeneratedQuestions(newQuestions);
            setSelectedQuestions(new Set(newQuestions.map((_, i) => i)));
            toast.success("Questions generated successfully!");
            setActiveTab('questions');
            setIsGenerating(false);
          }
          setCurrentJobId(null);
          await api.delete(`/jobs/${currentJobId}`);
        } else if (job.status === 'Failed') {
          toast.error(`Task failed: ${job.errorMessage}`);
          setCurrentJobId(null);
          setIsExtracting(false);
          setIsGenerating(false);
          await api.delete(`/jobs/${currentJobId}`);
        }
      } catch (err) {
        console.error("Failed to poll job:", err);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [currentJobId, options.subject]);

  const restoreSession = () => {
    if (savedSession) {
      if (savedSession.activeTab) setActiveTab(savedSession.activeTab);
      if (savedSession.ocrLang) setOcrLang(savedSession.ocrLang);
      if (savedSession.extractedText) setExtractedText(savedSession.extractedText);
      if (savedSession.options) setOptions(savedSession.options);
      if (savedSession.generatedQuestions) setGeneratedQuestions(savedSession.generatedQuestions);
      if (savedSession.selectedQuestions) setSelectedQuestions(new Set(savedSession.selectedQuestions));
    }
    setShowSessionModal(false);
  };

  const startFresh = () => {
    localStorage.removeItem('ai_session_state');
    setShowSessionModal(false);
  };

  const onDrop = useCallback(acceptedFiles => {
    setFiles(prev => [...prev, ...acceptedFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: activeTab === 'pdf' 
      ? { 'application/pdf': ['.pdf'] }
      : { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] },
    maxSize: 10 * 1024 * 1024
  });

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const formatSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024, sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const simulateProgress = (setter, duration) => {
    setter(0);
    const interval = setInterval(() => {
      setter(prev => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + (Math.random() * 15);
      });
    }, duration / 10);
    return interval;
  };

  const handleExtractText = async () => {
    if (files.length === 0) return toast.error("Please upload files first.");
    
    const formData = new FormData();
    formData.append('action', 'extract');
    formData.append('ocrLang', ocrLang);
    files.forEach(file => formData.append('files', file));

    setIsExtracting(true);
    setJobStatus({ progress: 5, currentStage: 'Starting extraction...' });
    
    try {
      const res = await api.post('/jobs/create', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setCurrentJobId(res.data.jobId);
    } catch (error) {
      toast.error(error.response?.data?.msg || "Failed to start extraction job.");
      setIsExtracting(false);
      setJobStatus(null);
    }
  };

  const handleAnalyzeText = async (textToAnalyze) => {
    if (textToAnalyze.length > 50000) {
      toast.info("Document is large. Generating questions might be capped to the first 50,000 characters.");
    }
    setIsAnalyzing(true);
    try {
      const res = await api.post('/import/analyze-text', { text: textToAnalyze });
      setAnalysis(res.data.analysis);
      if (res.data.analysis?.subject && !options.subject) {
        setOptions(prev => ({ ...prev, subject: res.data.analysis.subject }));
      }
    } catch (error) {
      toast.error("Analysis failed, but you can still generate questions.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGenerate = async () => {
    if (!extractedText) return toast.error("No text available to generate questions.");

    setIsGenerating(true);
    setJobStatus({ progress: 5, currentStage: 'Starting generation...' });

    try {
      const res = await api.post('/jobs/create', {
        action: 'generate',
        text: extractedText,
        options: JSON.stringify(options)
      });
      setCurrentJobId(res.data.jobId);
    } catch (error) {
      toast.error(error.response?.data?.msg || "Failed to start generation job.");
      setIsGenerating(false);
      setJobStatus(null);
    }
  };

  const handleSaveAll = async () => {
    const questionsToSave = generatedQuestions.filter((_, i) => selectedQuestions.has(i));
    if (questionsToSave.length === 0) return toast.error("No questions selected to save.");
    
    setIsSaving(true);
    try {
      const res = await api.post('/import/save', { questions: questionsToSave });
      toast.success(res.data.msg);
      
      const remaining = generatedQuestions.filter((_, i) => !selectedQuestions.has(i));
      setGeneratedQuestions(remaining);
      setSelectedQuestions(new Set());
      
      if (remaining.length === 0) {
        setExtractedText('');
        setFiles([]);
        setAnalysis(null);
        setActiveTab('pdf');
        localStorage.removeItem('ai_session_state');
      }
    } catch (error) {
      toast.error(error.response?.data?.msg || "Failed to save questions.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!extractedText && generatedQuestions.length === 0) return toast.error("Nothing to save.");
    const draftName = prompt("Enter a name for this draft:", "My Draft " + new Date().toLocaleDateString());
    if (!draftName) return;

    setSaveStatus('saving');
    try {
        await api.post('/drafts', {
            name: draftName,
            extractedText,
            generatedQuestions,
            options
        });
        toast.success("Draft saved to cloud successfully!");
        setSaveStatus('saved');
        setLastSaved(new Date());
    } catch (error) {
        toast.error("Failed to save draft to cloud.");
        setSaveStatus('unsaved');
    }
  };

  const toggleQuestionSelection = (index) => {
    const newSelected = new Set(selectedQuestions);
    if (newSelected.has(index)) newSelected.delete(index);
    else newSelected.add(index);
    setSelectedQuestions(newSelected);
  };

  const updateQuestion = (index, field, value) => {
    const updated = [...generatedQuestions];
    updated[index][field] = value;
    setGeneratedQuestions(updated);
  };

  const removeQuestion = (index) => {
    setGeneratedQuestions(prev => prev.filter((_, i) => i !== index));
    const newSelected = new Set(selectedQuestions);
    newSelected.delete(index);
    setSelectedQuestions(newSelected);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(extractedText);
    toast.success("Copied to clipboard!");
  };

  // Exports
  const downloadTXT = () => {
    const blob = new Blob([extractedText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Extracted_Text.txt';
    a.click();
  };

  const downloadCSV = () => {
    const questionsToExport = generatedQuestions.filter((_, i) => selectedQuestions.has(i));
    if (questionsToExport.length === 0) return toast.error("Select questions to export.");
    let csv = 'Question,Type,Difficulty,Subject,Marks,Bloom Level,Answer\n';
    questionsToExport.forEach(q => {
      csv += `"${q.questionText}","${q.type}","${q.difficulty}","${q.subject}","${q.marks || 1}","${q.bloomLevel || ''}","${q.correctAnswer}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Generated_Questions.csv';
    a.click();
  };

  const exportDocFromBackend = async (endpoint, filename) => {
    const questionsToExport = generatedQuestions.filter((_, i) => selectedQuestions.has(i));
    if (questionsToExport.length === 0) return toast.error("Select questions to export.");
    try {
      const res = await api.post(`/import/export/${endpoint}`, { questions: questionsToExport }, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      toast.error(`Failed to export ${filename}`);
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 pb-20">
      
      {/* Session Recovery Modal */}
      {showSessionModal && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full p-6 text-center border border-gray-100 dark:border-gray-700">
            <RefreshCw className="w-12 h-12 text-indigo-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Previous Session Detected</h2>
            <p className="text-gray-500 mb-6 text-sm">We found your unsaved AI extraction and generated questions from a previous visit. Would you like to restore them?</p>
            <div className="flex gap-3">
              <button onClick={startFresh} className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">Start Fresh</button>
              <button onClick={restoreSession} className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors">Restore Session</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <FileUp className="w-6 h-6 md:w-8 md:h-8 text-indigo-600" /> AI Import Center
          </h1>
          <p className="text-gray-500 mt-2 text-sm md:text-base">Upload your documents or images and let AI generate questions automatically.</p>
        </div>
        
        {/* Autosave Indicator & Save Draft */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm font-medium px-4 py-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 w-fit transition-all duration-300">
            {saveStatus === 'unsaved' && <><AlertTriangle className="w-4 h-4 text-amber-500" /> <span className="text-amber-600 dark:text-amber-500">Unsaved changes</span></>}
            {saveStatus === 'saving' && <><Loader2 className="w-4 h-4 text-indigo-500 animate-spin" /> <span className="text-indigo-600 dark:text-indigo-400">Saving...</span></>}
            {saveStatus === 'saved' && (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> 
                <span className="text-gray-600 dark:text-gray-300">
                  {lastSaved ? `Saved just now (${lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })})` : '✓ All changes saved'}
                </span>
              </>
            )}
          </div>
          <button onClick={handleSaveDraft} className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-indigo-600 dark:text-indigo-400 font-medium text-sm rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 transition-colors">
            <Save className="w-4 h-4" /> Save Draft
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 border-b border-gray-200 dark:border-gray-700 overflow-x-auto hide-scrollbar">
        {['pdf', 'image', 'preview', 'questions'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`py-3 px-4 md:px-6 font-medium text-sm capitalize whitespace-nowrap transition-colors border-b-2 ${
              activeTab === tab 
                ? 'border-indigo-600 text-indigo-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {tab === 'pdf' && 'Upload PDF'}
            {tab === 'image' && 'Upload Images'}
            {tab === 'preview' && 'Extracted Text'}
            {tab === 'questions' && 'Generated Questions'}
          </button>
        ))}
      </div>

      {/* Upload PDF & Images */}
      {(activeTab === 'pdf' || activeTab === 'image') && (
        <div className="space-y-6">
          
          {activeTab === 'image' && (
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">OCR Language:</label>
              <select value={ocrLang} onChange={e => setOcrLang(e.target.value)} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white">
                <option value="eng">English</option>
                <option value="hin">Hindi</option>
              </select>
            </div>
          )}

          <div 
            {...getRootProps()} 
            className={`border-2 border-dashed rounded-xl p-8 md:p-12 text-center cursor-pointer transition-colors ${
              isDragActive ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-gray-300 hover:border-indigo-400 dark:border-gray-600 dark:hover:border-indigo-500'
            }`}
          >
            <input {...getInputProps()} />
            {activeTab === 'pdf' ? <FileText className="w-10 h-10 md:w-12 md:h-12 mx-auto text-gray-400 mb-4" /> : <ImageIcon className="w-10 h-10 md:w-12 md:h-12 mx-auto text-gray-400 mb-4" />}
            <p className="text-gray-600 dark:text-gray-400 font-medium text-sm md:text-base">
              Drag & Drop your {activeTab === 'pdf' ? 'PDFs' : 'Images'} here, or click to select
            </p>
            <p className="text-xs md:text-sm text-gray-500 mt-2">Max file size: 10MB per file</p>
          </div>

          {files.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 md:p-6 shadow-sm border border-gray-100 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Selected Files ({files.length})</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {files.map((file, i) => (
                  <div key={i} className="flex flex-col p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600 relative group">
                    <button onClick={() => removeFile(i)} className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded">
                      <X className="w-4 h-4" />
                    </button>
                    <div className="flex items-center gap-3 mb-2 pr-6">
                      {file.type.includes('pdf') ? <FileText className="w-8 h-8 text-red-500 flex-shrink-0" /> : <ImageIcon className="w-8 h-8 text-blue-500 flex-shrink-0" />}
                      <div className="overflow-hidden">
                        <p className="text-sm font-medium truncate dark:text-gray-200">{file.name}</p>
                        <p className="text-xs text-gray-500">{formatSize(file.size)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {isExtracting && jobStatus && (
                <div className="mt-6 space-y-2 bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800">
                  <div className="flex justify-between text-sm font-semibold text-indigo-700 dark:text-indigo-300">
                    <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> {jobStatus.currentStage}</span>
                    <span>{Math.round(jobStatus.progress)}%</span>
                  </div>
                  <div className="w-full bg-indigo-200/50 rounded-full h-3 dark:bg-indigo-950 overflow-hidden">
                    <div className="bg-indigo-600 h-3 rounded-full transition-all duration-500 ease-out" style={{ width: `${jobStatus.progress}%` }}></div>
                  </div>
                </div>
              )}

              <div className="mt-6 flex justify-end">
                <button
                  onClick={handleExtractText}
                  disabled={isExtracting}
                  className="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors flex justify-center items-center gap-2 disabled:opacity-70"
                >
                  {isExtracting ? <><Loader2 className="w-4 h-4 animate-spin" /> Extracting...</> : <><RefreshCw className="w-4 h-4" /> Extract Text</>}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Extracted Text Preview & Generation Options */}
      {activeTab === 'preview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="font-semibold text-lg dark:text-white">Extracted Content</h3>
              <div className="flex gap-2">
                <button onClick={copyToClipboard} className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white flex items-center gap-1 font-medium bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-md">
                  <Copy className="w-4 h-4" /> Copy
                </button>
                <button onClick={downloadTXT} className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-medium bg-indigo-50 dark:bg-indigo-900/20 px-3 py-1.5 rounded-md">
                  <Download className="w-4 h-4" /> TXT
                </button>
                <button onClick={() => setExtractedText('')} className="text-sm text-red-600 hover:text-red-800 flex items-center gap-1 font-medium bg-red-50 dark:bg-red-900/20 px-3 py-1.5 rounded-md">
                  <Trash2 className="w-4 h-4" /> Clear
                </button>
              </div>
            </div>
            
            {extractedText.trim() === '' ? (
              <div className="w-full h-96 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-800/50 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                <FileText className="w-12 h-12 text-gray-400 mb-3" />
                <p className="text-gray-500 font-medium">No content extracted yet.</p>
                <p className="text-sm text-gray-400 mt-1">Upload a file or paste text directly.</p>
              </div>
            ) : (
              <>
                <textarea 
                  value={extractedText}
                  onChange={e => setExtractedText(e.target.value)}
                  className="w-full h-[500px] p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 dark:text-gray-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none font-mono text-sm shadow-inner"
                  placeholder="Extracted text will appear here. You can edit it before generation."
                />
                <div className="flex gap-4 text-xs font-medium text-gray-500">
                  <span>Words: {extractedText.trim().split(/\s+/).filter(w => w.length > 0).length}</span>
                  <span>Characters: {extractedText.length}</span>
                </div>
              </>
            )}
          </div>

          <div className="space-y-6">
            {/* AI Analysis Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-indigo-600" /> AI Document Analysis
              </h3>
              {isAnalyzing ? (
                <div className="flex flex-col items-center justify-center py-6 gap-3">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-600" /> 
                  <span className="text-sm font-medium text-gray-500">Analyzing content structure...</span>
                </div>
              ) : analysis ? (
                <div className="space-y-4 text-sm">
                  <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg border border-gray-100 dark:border-gray-600">
                    <span className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Detected Subject</span> 
                    <span className="font-semibold text-gray-900 dark:text-gray-100">{analysis.subject}</span>
                  </div>
                  <div><span className="text-gray-500 dark:text-gray-400 font-medium">Topics:</span> <span className="text-gray-800 dark:text-gray-200">{analysis.topics.join(', ')}</span></div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400 font-medium block mb-2">Difficulty Spread:</span> 
                    <div className="flex gap-2">
                      <span className="flex-1 text-center px-2 py-1.5 bg-green-50 border border-green-200 text-green-700 rounded-md text-xs font-semibold">Easy<br/>{analysis.difficultyDistribution?.Easy || '0%'}</span>
                      <span className="flex-1 text-center px-2 py-1.5 bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-md text-xs font-semibold">Med<br/>{analysis.difficultyDistribution?.Medium || '0%'}</span>
                      <span className="flex-1 text-center px-2 py-1.5 bg-red-50 border border-red-200 text-red-700 rounded-md text-xs font-semibold">Hard<br/>{analysis.difficultyDistribution?.Hard || '0%'}</span>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-gray-100 dark:border-gray-700"><span className="text-gray-500 dark:text-gray-400 font-medium">Est. Yield:</span> <span className="font-bold text-indigo-600 dark:text-indigo-400">~{analysis.estimatedQuestionCount} Questions</span></div>
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">No analysis available.</p>
              )}
            </div>

            {/* Generation Options */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 space-y-4">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-indigo-600" /> Question Generator
              </h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mode</label>
                <select value={options.generationMode} onChange={e => setOptions({...options, generationMode: e.target.value})} className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm p-2 border">
                  <option value="New">Create New Questions</option>
                  <option value="Extract">Extract Only (Keep Original)</option>
                  <option value="Mixed">Mixed (Extract & Create)</option>
                  <option value="PYQ">Previous Year Paper Mode</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subject Override</label>
                <input type="text" value={options.subject} onChange={e => setOptions({...options, subject: e.target.value})} placeholder="e.g. Database Management" className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm p-2 border" />
              </div>

              {(options.generationMode === 'New' || options.generationMode === 'Mixed') && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
                      <select value={options.type} onChange={e => setOptions({...options, type: e.target.value})} className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm p-2 border">
                        <option>Mixed</option>
                        <option>MCQ</option>
                        <option>Short Answer</option>
                        <option>Long Answer</option>
                        <option>Coding</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Difficulty</label>
                      <select value={options.difficulty} onChange={e => setOptions({...options, difficulty: e.target.value})} className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm p-2 border">
                        <option>Mixed</option>
                        <option>Easy</option>
                        <option>Medium</option>
                        <option>Hard</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Count</label>
                      <select value={options.count} onChange={e => setOptions({...options, count: parseInt(e.target.value)})} className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm p-2 border">
                        <option value="5">5</option>
                        <option value="10">10</option>
                        <option value="20">20</option>
                        <option value="50">50</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Marks</label>
                      <input type="number" min="1" value={options.marks} onChange={e => setOptions({...options, marks: parseInt(e.target.value)})} className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm p-2 border" />
                    </div>
                  </div>
                </>
              )}

              {isGenerating && jobStatus && (
                <div className="mt-4 space-y-2 bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800">
                  <div className="flex justify-between text-sm font-semibold text-indigo-700 dark:text-indigo-300">
                    <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> {jobStatus.currentStage}</span>
                    <span>{Math.round(jobStatus.progress)}%</span>
                  </div>
                  <div className="w-full bg-indigo-200/50 rounded-full h-3 dark:bg-indigo-950 overflow-hidden">
                    <div className="bg-indigo-600 h-3 rounded-full transition-all duration-500 ease-out" style={{ width: `${jobStatus.progress}%` }}></div>
                  </div>
                </div>
              )}

              <button
                onClick={handleGenerate}
                disabled={isGenerating || !extractedText}
                className="w-full mt-6 px-4 py-3 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-colors flex justify-center items-center gap-2 disabled:opacity-70 shadow-md shadow-indigo-600/20"
              >
                {isGenerating ? <><Loader2 className="w-5 h-5 animate-spin" /> Generating...</> : <><Sparkles className="w-5 h-5" /> Generate Questions</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Generated Questions Review */}
      {activeTab === 'questions' && (
        <div className="space-y-6">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold text-xl dark:text-white flex items-center gap-2">
                Review Questions
                <span className="bg-indigo-100 text-indigo-700 text-sm py-0.5 px-2 rounded-full font-bold">{generatedQuestions.length}</span>
              </h3>
              <p className="text-sm text-gray-500 mt-1">Select the questions you want to save to your bank.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setSelectedQuestions(new Set(generatedQuestions.map((_, i) => i)))} className="px-3 py-1.5 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600">Select All</button>
              <button onClick={() => setSelectedQuestions(new Set())} className="px-3 py-1.5 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600">Deselect All</button>
              
              <div className="h-6 w-px bg-gray-300 dark:bg-gray-600 mx-2 hidden sm:block"></div>
              
              <button onClick={downloadCSV} className="px-3 py-1.5 text-sm font-medium bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-white flex items-center gap-2">
                <FileOutput className="w-4 h-4" /> CSV
              </button>
              <button onClick={() => exportDocFromBackend('pdf', 'Questions.pdf')} className="px-3 py-1.5 text-sm font-medium bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-white flex items-center gap-2">
                <FileOutput className="w-4 h-4" /> PDF
              </button>
              <button onClick={() => exportDocFromBackend('docx', 'Questions.docx')} className="px-3 py-1.5 text-sm font-medium bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-white flex items-center gap-2">
                <FileOutput className="w-4 h-4" /> DOCX
              </button>
              <button 
                onClick={handleSaveAll}
                disabled={isSaving || generatedQuestions.length === 0}
                className="px-4 py-1.5 text-sm font-medium bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center gap-2 disabled:opacity-70 ml-auto sm:ml-0 shadow-sm"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Selected ({selectedQuestions.size})
              </button>
            </div>
          </div>

          {generatedQuestions.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700">
              <p className="text-gray-500">No questions generated yet.</p>
              <button onClick={() => setActiveTab('preview')} className="mt-4 text-indigo-600 font-medium hover:underline">Go to Extracted Text</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {generatedQuestions.map((q, idx) => {
                const isSelected = selectedQuestions.has(idx);
                return (
                  <div key={idx} className={`bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border-2 transition-all flex flex-col group relative ${isSelected ? 'border-indigo-500 ring-2 ring-indigo-500/20' : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300'}`}>
                    
                    <div className="absolute top-4 right-4 flex items-center gap-2">
                      <button onClick={() => removeQuestion(idx)} className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity bg-white dark:bg-gray-800 rounded-full p-1 shadow-sm">
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <input 
                        type="checkbox" 
                        checked={isSelected}
                        onChange={() => toggleQuestionSelection(idx)}
                        className="w-5 h-5 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 cursor-pointer"
                      />
                    </div>

                    {q.similarity?.isSimilar && (
                      <div className="mb-3 mt-8 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs px-2 py-1.5 rounded flex items-start gap-1.5">
                        <AlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-600 dark:text-amber-400" />
                        <div>
                          <strong>{q.similarity.score}% Similar:</strong> This looks like a duplicate in your Question Bank. You can uncheck it to skip saving.
                        </div>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2 mb-3 pr-16 mt-2">
                      <select value={q.type} onChange={e => updateQuestion(idx, 'type', e.target.value)} className="text-xs font-semibold bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-2 py-1 rounded border-none focus:ring-1 focus:ring-indigo-500 cursor-pointer">
                        <option>MCQ</option><option>Short Answer</option><option>Long Answer</option><option>Coding</option>
                      </select>
                      <select value={q.difficulty} onChange={e => updateQuestion(idx, 'difficulty', e.target.value)} className={`text-xs font-semibold px-2 py-1 rounded border-none focus:ring-1 focus:ring-indigo-500 cursor-pointer ${
                        q.difficulty === 'Easy' ? 'bg-green-100 text-green-700' : q.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                      }`}>
                        <option>Easy</option><option>Medium</option><option>Hard</option>
                      </select>
                      <div className="flex items-center gap-1 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded">
                        <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">Marks:</span>
                        <input type="number" min="1" value={q.marks || 1} onChange={e => updateQuestion(idx, 'marks', parseInt(e.target.value))} className="w-10 text-xs font-bold text-blue-800 dark:text-blue-200 bg-transparent border-none p-0 focus:ring-0 text-center" />
                      </div>
                    </div>

                    <textarea 
                      value={q.questionText} 
                      onChange={e => updateQuestion(idx, 'questionText', e.target.value)}
                      className="w-full text-sm font-medium text-gray-900 dark:text-white bg-transparent border border-transparent hover:border-gray-200 dark:hover:border-gray-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded p-1 mb-2 resize-none transition-colors"
                      rows="3"
                    />

                    {q.options && q.options.length > 0 && (
                      <div className="space-y-1.5 mb-3">
                        {q.options.map((opt, i) => (
                          <div key={i} className="flex items-start gap-2 bg-gray-50 dark:bg-gray-700/30 rounded px-2 py-1">
                            <span className="text-xs font-bold text-gray-400 mt-1">{String.fromCharCode(65 + i)}.</span>
                            <input 
                              value={opt}
                              onChange={e => {
                                const newOpts = [...q.options];
                                newOpts[i] = e.target.value;
                                updateQuestion(idx, 'options', newOpts);
                              }}
                              className="flex-1 text-xs font-medium text-gray-700 dark:text-gray-200 bg-transparent border-none focus:ring-1 focus:ring-indigo-500 rounded p-1"
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="mt-auto pt-3 border-t border-gray-100 dark:border-gray-700 space-y-2">
                      <div>
                        <label className="text-xs font-bold tracking-wide text-gray-500 uppercase mb-1 flex justify-between">
                          <span>Answer / Rubric</span>
                          <span className="text-[10px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded">Bloom: {q.bloomLevel || 'N/A'}</span>
                        </label>
                        <textarea 
                          value={q.correctAnswer}
                          onChange={e => updateQuestion(idx, 'correctAnswer', e.target.value)}
                          className="w-full text-xs font-medium text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/20 p-2 rounded border border-transparent focus:border-indigo-300 focus:ring-1 focus:ring-indigo-500 resize-none transition-colors"
                          rows="2"
                        />
                      </div>
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          value={q.subject}
                          onChange={e => updateQuestion(idx, 'subject', e.target.value)}
                          placeholder="Subject"
                          className="flex-1 text-xs text-gray-500 bg-gray-50 dark:bg-gray-700/50 rounded border-none focus:ring-1 focus:ring-indigo-500 p-1.5"
                        />
                        {q.qualityScore && (
                          <div className="flex items-center text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 rounded border border-emerald-100">
                            Quality: {q.qualityScore}/10
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AIImport;
