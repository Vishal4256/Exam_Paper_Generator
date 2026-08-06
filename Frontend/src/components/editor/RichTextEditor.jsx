import React, { useEffect, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { getExtensions } from './EditorExtensions';
import Toolbar from './Toolbar';
import DOMPurify from 'dompurify';
import api from '../../utils/axiosConfig';
import QuestionQualityDashboard from '../QuestionQualityDashboard';
import { Activity, AlertTriangle } from 'lucide-react';

const RichTextEditor = ({ 
    value, 
    onChange, 
    placeholder = 'Start typing...', 
    readOnly = false,
    showToolbar = true,
    minHeight = '150px',
    enableQualityAnalysis = false,
    onQualityChange = null
}) => {
    // We use a ref to handle the 800ms debounce for onChange
    const timeoutRef = useRef(null);
    // Ref for 2000ms debounce for AI Analysis
    const analysisTimeoutRef = useRef(null);

    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisData, setAnalysisData] = useState(null);
    const [showDashboard, setShowDashboard] = useState(false);

    const editor = useEditor({
        extensions: getExtensions(),
        content: value?.content || value || '',
        editable: !readOnly,
        editorProps: {
            attributes: {
                class: 'prose dark:prose-invert max-w-none focus:outline-none w-full p-4',
            },
        },
        onUpdate: ({ editor }) => {
            if (readOnly) return;
            
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }

            timeoutRef.current = setTimeout(() => {
                const json = editor.getJSON();
                const html = editor.getHTML();
                const plainText = editor.getText();
                
                if (onChange) {
                    onChange({
                        content: json,
                        plainText: plainText,
                        htmlCache: DOMPurify.sanitize(html)
                    });
                }

                // Background Quality Analysis (Debounced 2s)
                if (enableQualityAnalysis && plainText.trim().length > 10) {
                    if (analysisTimeoutRef.current) clearTimeout(analysisTimeoutRef.current);
                    setIsAnalyzing(true);
                    
                    analysisTimeoutRef.current = setTimeout(async () => {
                        try {
                            const res = await api.post('/questions/analyze-quality', {
                                questionData: { plainText, type: 'MCQ' } // Minimal payload for live check
                            });
                            setAnalysisData(res.data);
                            if (onQualityChange) onQualityChange(res.data);
                        } catch (err) {
                            console.error("Live Analysis Error", err);
                        } finally {
                            setIsAnalyzing(false);
                        }
                    }, 2000);
                }
            }, 800);
        }
    });

    // Handle external value changes (like resetting the form or switching questions)
    useEffect(() => {
        if (editor && value && !editor.isFocused) {
            const currentContent = editor.getJSON();
            const newContent = value.content || value;
            // Extremely basic check to prevent cursor jumping if they are roughly the same
            if (JSON.stringify(currentContent) !== JSON.stringify(newContent)) {
                editor.commands.setContent(newContent);
            }
        }
    }, [value, editor]);

    useEffect(() => {
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            if (analysisTimeoutRef.current) clearTimeout(analysisTimeoutRef.current);
        };
    }, []);

    if (!editor) {
        return <div className={`w-full bg-gray-50 dark:bg-gray-800 rounded-xl animate-pulse`} style={{ minHeight }} />;
    }

    const handleInsertTemplate = (type) => {
        if (type === 'mcq') {
            editor.chain().focus().setContent({
                type: 'doc',
                content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Enter your question here...' }] }]
            }).run();
        }
        // ... more templates
    };

    return (
        <div className={`flex flex-col bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm transition-colors focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 ${readOnly ? 'opacity-90' : ''}`}>
            {showToolbar && !readOnly && (
                <Toolbar editor={editor} onInsertTemplate={handleInsertTemplate} />
            )}
            <div className="flex-1 overflow-y-auto cursor-text bg-white dark:bg-gray-900" style={{ minHeight }} onClick={() => editor.chain().focus().run()}>
                <EditorContent editor={editor} />
            </div>
            
            {showToolbar && !readOnly && (
                <div className="px-3 py-1.5 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700 text-xs font-medium flex justify-between items-center h-9">
                    <div className="text-gray-500 dark:text-gray-400">
                        {editor.storage.characterCount.characters()} chars &bull; {editor.storage.characterCount.words()} words
                    </div>
                    
                    {enableQualityAnalysis && (
                        <div className="flex items-center gap-2">
                            {isAnalyzing ? (
                                <span className="flex items-center gap-1 text-gray-500">
                                    <div className="w-3 h-3 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                                    Analyzing...
                                </span>
                            ) : analysisData ? (
                                <button 
                                    onClick={(e) => { e.stopPropagation(); setShowDashboard(true); }}
                                    className={`flex items-center gap-1.5 px-2 py-0.5 rounded transition-colors ${
                                        analysisData.status === 'Excellent' || analysisData.status === 'Good' ? 'bg-green-100 text-green-700 hover:bg-green-200' :
                                        analysisData.status === 'Fair' ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' : 
                                        'bg-red-100 text-red-700 hover:bg-red-200'
                                    }`}
                                >
                                    {analysisData.status === 'Poor' ? <AlertTriangle className="w-3 h-3" /> : <Activity className="w-3 h-3" />}
                                    <span className="font-bold">Quality: {analysisData.overall}/100</span>
                                </button>
                            ) : null}
                        </div>
                    )}
                </div>
            )}

            {enableQualityAnalysis && (
                <QuestionQualityDashboard 
                    isOpen={showDashboard}
                    onClose={() => setShowDashboard(false)}
                    analysisData={analysisData}
                    loading={isAnalyzing}
                    currentPlainText={editor.getText()}
                    currentHtml={editor.getHTML()}
                    onApplyImprovement={(improvedHtml) => {
                        editor.commands.setContent(improvedHtml);
                        setShowDashboard(false);
                    }}
                />
            )}
        </div>
    );
};

export default React.memo(RichTextEditor, (prevProps, nextProps) => {
    // Only re-render if readOnly, showToolbar, or the actual incoming value reference changes
    return (
        prevProps.readOnly === nextProps.readOnly &&
        prevProps.showToolbar === nextProps.showToolbar &&
        JSON.stringify(prevProps.value) === JSON.stringify(nextProps.value)
    );
});
