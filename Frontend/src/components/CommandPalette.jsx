import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, FileText, Database, Settings, Sparkles, LayoutDashboard, History, Command, X } from 'lucide-react';

const CommandPalette = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef(null);
    const navigate = useNavigate();

    const actions = [
        { id: 'dashboard', name: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5 text-indigo-500" />, path: '/dashboard', description: 'Go to your dashboard' },
        { id: 'generate', name: 'Generate Exam', icon: <FileText className="w-5 h-5 text-emerald-500" />, path: '/generate', description: 'Create a new exam manually' },
        { id: 'ai-generator', name: 'AI Generator', icon: <Sparkles className="w-5 h-5 text-purple-500" />, path: '/ai-generator', description: 'Generate exams using AI' },
        { id: 'questions', name: 'Question Bank', icon: <Database className="w-5 h-5 text-blue-500" />, path: '/questions', description: 'Manage your question repository' },
        { id: 'import', name: 'Import Questions', icon: <Database className="w-5 h-5 text-amber-500" />, path: '/ai-import', description: 'Import questions from PDF or images' },
        { id: 'history', name: 'History', icon: <History className="w-5 h-5 text-gray-500" />, path: '/history', description: 'View your import and generation history' },
        { id: 'settings', name: 'Settings', icon: <Settings className="w-5 h-5 text-slate-500" />, path: '/settings', description: 'Manage your account settings' }
    ];

    useEffect(() => {
        const handleKeyDown = (e) => {
            const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName) || document.activeElement?.isContentEditable;
            
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                if (isInput) return; // Don't trigger if user is typing
                e.preventDefault();
                setIsOpen(true);
            }
            if (e.key === 'Escape' && isOpen) {
                e.preventDefault();
                setIsOpen(false);
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen]);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
            setQuery('');
            setSelectedIndex(0);
        }
    }, [isOpen]);

    const filteredActions = actions.filter(action => 
        action.name.toLowerCase().includes(query.toLowerCase()) || 
        action.description.toLowerCase().includes(query.toLowerCase())
    );

    useEffect(() => {
        setSelectedIndex(0);
    }, [query]);

    const executeAction = (action) => {
        navigate(action.path);
        setIsOpen(false);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex((prev) => (prev + 1) % filteredActions.length);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex((prev) => (prev - 1 + filteredActions.length) % filteredActions.length);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (filteredActions[selectedIndex]) {
                executeAction(filteredActions[selectedIndex]);
            }
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-start justify-center pt-[10vh] sm:pt-[15vh] px-4"
                onClick={() => setIsOpen(false)}
            >
                <motion.div 
                    initial={{ scale: 0.95, opacity: 0, y: -20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: -20 }}
                    className="bg-white dark:bg-gray-900 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-800"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex items-center px-4 border-b border-gray-100 dark:border-gray-800">
                        <Search className="w-5 h-5 text-gray-400" />
                        <input
                            ref={inputRef}
                            type="text"
                            placeholder="Type a command or search..."
                            className="w-full bg-transparent border-none text-gray-900 dark:text-white px-4 py-5 focus:outline-none focus:ring-0 placeholder-gray-400 text-lg font-medium"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={handleKeyDown}
                        />
                        <button onClick={() => setIsOpen(false)} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="max-h-[60vh] overflow-y-auto p-2">
                        {filteredActions.length === 0 ? (
                            <div className="py-14 text-center">
                                <Command className="w-8 h-8 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
                                <p className="text-gray-500 dark:text-gray-400 font-medium">No results found for "{query}"</p>
                            </div>
                        ) : (
                            <div className="space-y-1">
                                {filteredActions.map((action, index) => (
                                    <div
                                        key={action.id}
                                        className={`flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-colors ${
                                            index === selectedIndex 
                                                ? 'bg-indigo-50 dark:bg-indigo-900/30' 
                                                : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                                        }`}
                                        onMouseEnter={() => setSelectedIndex(index)}
                                        onClick={() => executeAction(action)}
                                    >
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${index === selectedIndex ? 'bg-white dark:bg-gray-800 shadow-sm' : 'bg-gray-100 dark:bg-gray-800'}`}>
                                            {action.icon}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm font-bold truncate ${index === selectedIndex ? 'text-indigo-900 dark:text-indigo-300' : 'text-gray-900 dark:text-white'}`}>
                                                {action.name}
                                            </p>
                                            <p className={`text-xs truncate mt-0.5 ${index === selectedIndex ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400'}`}>
                                                {action.description}
                                            </p>
                                        </div>
                                        {index === selectedIndex && (
                                            <span className="text-[10px] font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-wider pr-2">Enter</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    
                    <div className="border-t border-gray-100 dark:border-gray-800 p-3 bg-gray-50 dark:bg-gray-900 flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
                        <div className="flex gap-4">
                            <span className="flex items-center gap-1"><span className="px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-700 font-mono shadow-sm bg-white dark:bg-gray-800">↑</span><span className="px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-700 font-mono shadow-sm bg-white dark:bg-gray-800">↓</span> to navigate</span>
                            <span className="flex items-center gap-1"><span className="px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-700 font-mono shadow-sm bg-white dark:bg-gray-800">Enter</span> to select</span>
                        </div>
                        <span><span className="px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-700 font-mono shadow-sm bg-white dark:bg-gray-800">Esc</span> to close</span>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default CommandPalette;
