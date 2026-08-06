import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, CheckCircle, AlertTriangle, FileSpreadsheet, X, ChevronRight, ChevronLeft, Save } from 'lucide-react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import api from '../utils/axiosConfig';
import { toast } from 'react-toastify';

const REQUIRED_FIELDS = ['questionText', 'correctAnswer', 'subject'];

const ImportWizard = ({ isOpen, onClose, onImportSuccess }) => {
    const [step, setStep] = useState(1);
    
    // Data states
    const [file, setFile] = useState(null);
    const [rawHeaders, setRawHeaders] = useState([]);
    const [rawRows, setRawRows] = useState([]); // Array of arrays/objects
    const [columnMapping, setColumnMapping] = useState({});
    
    // Analysis results from backend
    const [analysisData, setAnalysisData] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    
    // User Decisions { rowIndex: 'skip' | 'replace' | 'new' }
    const [userDecisions, setUserDecisions] = useState({});
    const [isExecuting, setIsExecuting] = useState(false);
    
    // Summary
    const [importSummary, setImportSummary] = useState(null);

    const reset = () => {
        setStep(1);
        setFile(null);
        setRawHeaders([]);
        setRawRows([]);
        setColumnMapping({});
        setAnalysisData(null);
        setUserDecisions({});
        setImportSummary(null);
    };

    const handleClose = () => {
        reset();
        onClose();
    };

    if (!isOpen) return null;

    // --- STEP 1: UPLOAD ---
    const handleFileUpload = (e) => {
        const uploadedFile = e.target.files?.[0];
        if (!uploadedFile) return;

        setFile(uploadedFile);
        const name = uploadedFile.name.toLowerCase();

        if (name.endsWith('.csv')) {
            Papa.parse(uploadedFile, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => {
                    const headers = results.meta.fields || [];
                    setRawHeaders(headers);
                    setRawRows(results.data);
                    autoMapColumns(headers);
                    setStep(2);
                }
            });
        } else if (name.endsWith('.json')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    if (Array.isArray(data) && data.length > 0) {
                        const headers = Object.keys(data[0]);
                        setRawHeaders(headers);
                        setRawRows(data);
                        autoMapColumns(headers);
                        setStep(2);
                    } else {
                        toast.error("JSON file must contain an array of objects.");
                    }
                } catch (err) {
                    toast.error("Invalid JSON file.");
                }
            };
            reader.readAsText(uploadedFile);
        } else if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                    const json = XLSX.utils.sheet_to_json(firstSheet, { defval: "" });
                    
                    if (json.length > 0) {
                        const headers = Object.keys(json[0]);
                        setRawHeaders(headers);
                        setRawRows(json);
                        autoMapColumns(headers);
                        setStep(2);
                    } else {
                        toast.error("Excel file is empty.");
                    }
                } catch (err) {
                    console.error(err);
                    toast.error("Failed to parse Excel file.");
                }
            };
            reader.readAsArrayBuffer(uploadedFile);
        } else {
            toast.error("Unsupported file type. Please use CSV, Excel, or JSON.");
        }
    };

    const autoMapColumns = (headers) => {
        const mapping = {};
        const lowerHeaders = headers.map(h => h.toLowerCase().trim());
        
        const tryMap = (target, possibleNames) => {
            for (let name of possibleNames) {
                const idx = lowerHeaders.findIndex(h => h === name);
                if (idx !== -1) {
                    mapping[target] = headers[idx];
                    return;
                }
            }
        };

        tryMap('questionText', ['questiontext', 'question', 'text', 'q']);
        tryMap('subject', ['subject', 'course', 'sub']);
        tryMap('difficulty', ['difficulty', 'diff', 'level']);
        tryMap('type', ['type', 'questiontype', 'qtype']);
        tryMap('marks', ['marks', 'points', 'score']);
        tryMap('correctAnswer', ['correctanswer', 'answer', 'ans']);
        tryMap('explanation', ['explanation', 'exp', 'reason']);
        tryMap('topic', ['topic', 'chapter']);

        // Option Mapping
        const opts = headers.filter(h => /^option[a-z0-9\s]*$/i.test(h.trim()));
        if (opts.length > 0) {
            mapping['options'] = opts;
        }

        setColumnMapping(mapping);
    };

    // --- STEP 2: PREVIEW & MAPPING ---
    const handleAnalyze = async () => {
        // Build standardized JSON array based on mapping
        const mappedData = rawRows.map(row => {
            const obj = {};
            // Extract standard fields
            Object.keys(columnMapping).forEach(targetField => {
                if (targetField === 'options') {
                    // special handling for multiple options columns
                    const optionCols = columnMapping['options'];
                    if (Array.isArray(optionCols)) {
                        obj.options = optionCols.map(col => row[col]).filter(Boolean);
                    }
                } else {
                    const sourceCol = columnMapping[targetField];
                    if (sourceCol) {
                        obj[targetField] = row[sourceCol];
                    }
                }
            });
            return obj;
        });

        setIsAnalyzing(true);
        try {
            const res = await api.post('/import/analyze', { rows: mappedData });
            setAnalysisData(res.data);
            setStep(3);
        } catch (error) {
            toast.error(error.response?.data?.msg || "Analysis failed.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    // --- STEP 3: VALIDATION & STEP 4: DUPLICATE REVIEW ---
    const handleExecute = async () => {
        setIsExecuting(true);
        try {
            const res = await api.post('/import/execute', {
                rows: analysisData.rows,
                decisions: userDecisions
            });
            setImportSummary(res.data);
            setStep(5);
            if (onImportSuccess) onImportSuccess();
        } catch (error) {
            toast.error("Execution failed.");
        } finally {
            setIsExecuting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-5xl h-[85vh] flex flex-col shadow-2xl border border-gray-200 dark:border-gray-800"
            >
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-800">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <FileSpreadsheet className="w-5 h-5 text-indigo-500" />
                        Import Wizard
                    </h2>
                    <button onClick={handleClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-500 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Stepper */}
                <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/30 border-b border-gray-100 dark:border-gray-800 flex gap-4 overflow-x-auto">
                    {[
                        { num: 1, title: 'Upload' },
                        { num: 2, title: 'Map Columns' },
                        { num: 3, title: 'Validation' },
                        { num: 4, title: 'Review Duplicates' },
                        { num: 5, title: 'Summary' }
                    ].map(s => (
                        <div key={s.num} className={`flex items-center gap-2 whitespace-nowrap ${step === s.num ? 'text-indigo-600 dark:text-indigo-400 font-bold' : step > s.num ? 'text-gray-900 dark:text-gray-300' : 'text-gray-400 dark:text-gray-600'}`}>
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step === s.num ? 'bg-indigo-100 dark:bg-indigo-900/50' : step > s.num ? 'bg-gray-200 dark:bg-gray-700' : 'bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700'}`}>
                                {step > s.num ? <CheckCircle className="w-4 h-4" /> : s.num}
                            </div>
                            <span className="text-sm">{s.title}</span>
                            {s.num < 5 && <ChevronRight className="w-4 h-4 ml-2 opacity-50" />}
                        </div>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 relative">
                    {step === 1 && (
                        <div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800/30 transition-all hover:bg-gray-100 dark:hover:bg-gray-800">
                            <input 
                                type="file" 
                                id="fileUpload" 
                                className="hidden" 
                                accept=".csv,.json,.xlsx,.xls" 
                                onChange={handleFileUpload} 
                            />
                            <label htmlFor="fileUpload" className="cursor-pointer flex flex-col items-center p-12">
                                <UploadCloud className="w-16 h-16 text-indigo-500 mb-4" />
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Drag & Drop or Click to Upload</h3>
                                <p className="text-gray-500 dark:text-gray-400 text-sm">Supported formats: CSV, Excel (.xlsx), JSON</p>
                            </label>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6">
                            <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl">
                                <h3 className="font-bold text-indigo-800 dark:text-indigo-300 mb-1">Map Your Columns</h3>
                                <p className="text-sm text-indigo-600 dark:text-indigo-400">We auto-detected mappings based on headers. Adjust them below if needed.</p>
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {REQUIRED_FIELDS.map(target => (
                                    <div key={target} className="flex flex-col gap-1">
                                        <label className="text-xs font-bold text-gray-700 dark:text-gray-300 capitalize">{target} <span className="text-red-500">*</span></label>
                                        <select 
                                            value={columnMapping[target] || ''}
                                            onChange={(e) => setColumnMapping({...columnMapping, [target]: e.target.value})}
                                            className="px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
                                        >
                                            <option value="">Select column...</option>
                                            {rawHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                                        </select>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {step === 3 && analysisData && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-3 gap-4">
                                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{analysisData.totalRows}</div>
                                    <div className="text-sm text-gray-500">Total Rows</div>
                                </div>
                                <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl border border-red-200 dark:border-red-900/50">
                                    <div className="text-2xl font-bold text-red-600 dark:text-red-400">{analysisData.errorCount}</div>
                                    <div className="text-sm text-red-600/80">Validation Errors</div>
                                </div>
                                <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-xl border border-amber-200 dark:border-amber-900/50">
                                    <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{analysisData.duplicateCount}</div>
                                    <div className="text-sm text-amber-600/80">Duplicates Found</div>
                                </div>
                            </div>

                            {analysisData.errors.length > 0 && (
                                <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/50 rounded-xl p-4">
                                    <h3 className="font-bold text-red-700 dark:text-red-400 flex items-center gap-2 mb-3">
                                        <AlertTriangle className="w-4 h-4" /> Critical Errors (Will be skipped)
                                    </h3>
                                    <div className="max-h-48 overflow-y-auto space-y-2">
                                        {analysisData.errors.map((err, i) => (
                                            <div key={i} className="text-sm text-red-600 dark:text-red-300">
                                                <strong>Row {err.row}:</strong> {err.message}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {step === 4 && analysisData && (
                        <div className="space-y-4">
                            <h3 className="font-bold text-gray-900 dark:text-white text-lg">Review Duplicates</h3>
                            {analysisData.duplicates.length === 0 ? (
                                <div className="text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 p-4 rounded-xl">
                                    No duplicates found! You are good to go.
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {analysisData.duplicates.map((dup, idx) => (
                                        <div key={idx} className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden bg-white dark:bg-gray-800">
                                            <div className="bg-gray-50 dark:bg-gray-900/50 px-4 py-2 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                                                <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                                                    dup.type === 'exact' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                                                }`}>
                                                    {dup.type === 'exact' ? 'Exact Match (100%)' : `Near Match (${dup.confidence}%)`}
                                                </span>
                                                <div className="flex gap-2">
                                                    <button onClick={() => setUserDecisions({...userDecisions, [dup.rowId]: 'skip'})} className={`px-3 py-1.5 text-sm font-bold rounded-lg ${userDecisions[dup.rowId] === 'skip' ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200'}`}>Skip</button>
                                                    <button onClick={() => setUserDecisions({...userDecisions, [dup.rowId]: 'replace'})} className={`px-3 py-1.5 text-sm font-bold rounded-lg ${userDecisions[dup.rowId] === 'replace' ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200'}`}>Replace</button>
                                                    <button onClick={() => setUserDecisions({...userDecisions, [dup.rowId]: 'new'})} className={`px-3 py-1.5 text-sm font-bold rounded-lg ${userDecisions[dup.rowId] === 'new' ? 'bg-green-600 text-white' : 'bg-white border border-gray-200'}`}>Import as New</button>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 divide-x divide-gray-200 dark:divide-gray-700">
                                                <div className="p-4">
                                                    <div className="text-xs font-bold text-gray-500 mb-2">Existing Question in DB</div>
                                                    <p className="text-sm text-gray-800 dark:text-gray-200">{dup.existingText}</p>
                                                </div>
                                                <div className="p-4 bg-indigo-50/30 dark:bg-indigo-900/10">
                                                    <div className="text-xs font-bold text-indigo-500 mb-2">New Row {dup.row} to Import</div>
                                                    <p className="text-sm text-gray-800 dark:text-gray-200">{dup.incomingText}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {step === 5 && importSummary && (
                        <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
                            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                                <CheckCircle className="w-10 h-10" />
                            </div>
                            <div>
                                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Import Complete!</h2>
                                <p className="text-gray-500 mt-2">Successfully processed the file.</p>
                            </div>
                            <div className="flex gap-6 mt-8">
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{importSummary.importedCount}</div>
                                    <div className="text-sm text-gray-500">Imported</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-indigo-600">{importSummary.replacedCount || 0}</div>
                                    <div className="text-sm text-indigo-500">Replaced</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-gray-400">{importSummary.skippedCount || 0}</div>
                                    <div className="text-sm text-gray-500">Skipped</div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 dark:border-gray-800 flex justify-between bg-gray-50 dark:bg-gray-800/30 rounded-b-2xl">
                    <button onClick={handleClose} className="px-5 py-2.5 text-gray-600 dark:text-gray-400 font-bold hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors">
                        {step === 5 ? 'Close' : 'Cancel'}
                    </button>
                    
                    <div className="flex gap-2">
                        {step === 2 && (
                            <button onClick={handleAnalyze} disabled={isAnalyzing} className="px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 flex items-center gap-2">
                                {isAnalyzing ? 'Analyzing...' : 'Analyze & Validate'} <ChevronRight className="w-4 h-4" />
                            </button>
                        )}
                        {step === 3 && (
                            <button onClick={() => setStep(4)} className="px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 flex items-center gap-2">
                                Review Duplicates <ChevronRight className="w-4 h-4" />
                            </button>
                        )}
                        {step === 4 && (
                            <button onClick={handleExecute} disabled={isExecuting} className="px-6 py-2.5 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 flex items-center gap-2">
                                {isExecuting ? 'Importing...' : 'Confirm & Import'} <Save className="w-4 h-4" />
                            </button>
                        )}
                        {step === 5 && (
                            <button onClick={handleClose} className="px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700">
                                Done
                            </button>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default ImportWizard;
