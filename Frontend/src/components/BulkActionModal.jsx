import React, { useState } from 'react';
import { X, AlertTriangle, Check, Tag, Copy, Archive, RefreshCw, BookOpen, BarChart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const BulkActionModal = ({ isOpen, onClose, actionType, selectedCount, onConfirm, subjects = [] }) => {
    const [inputValue, setInputValue] = useState('');
    const [tagAction, setTagAction] = useState('add');
    const [tags, setTags] = useState([]);
    const [tagInput, setTagInput] = useState('');

    if (!isOpen) return null;

    const handleAddTag = (e) => {
        if (e.key === 'Enter' || e.type === 'blur') {
            e.preventDefault();
            const val = tagInput.trim();
            if (val && !tags.includes(val)) {
                setTags([...tags, val]);
            }
            setTagInput('');
        }
    };

    const handleRemoveTag = (tag) => {
        setTags(tags.filter(t => t !== tag));
    };

    const handleSubmit = () => {
        let payload = {};
        if (actionType === 'subject' || actionType === 'difficulty') {
            payload = { [actionType]: inputValue };
        } else if (actionType === 'tags') {
            payload = { tags, action: tagAction };
        }
        onConfirm(actionType, payload);
    };

    const renderContent = () => {
        switch (actionType) {
            case 'delete':
                return (
                    <div className="space-y-4">
                        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-xl flex gap-3 text-sm font-medium border border-red-100 dark:border-red-900/30">
                            <AlertTriangle className="w-5 h-5 shrink-0" />
                            <p>This action cannot be undone. Questions linked to existing exams will not be deleted.</p>
                        </div>
                    </div>
                );
            case 'archive':
                return (
                    <div className="space-y-4">
                        <p className="text-sm text-gray-600 dark:text-gray-400">Archived questions will be hidden from the default view but can be restored later.</p>
                    </div>
                );
            case 'restore':
                return (
                    <div className="space-y-4">
                        <p className="text-sm text-gray-600 dark:text-gray-400">These questions will become active and visible in the default Question Bank again.</p>
                    </div>
                );
            case 'duplicate':
                return (
                    <div className="space-y-4">
                        <p className="text-sm text-gray-600 dark:text-gray-400">A copy of each selected question will be created. The title will have "(Copy)" appended.</p>
                    </div>
                );
            case 'subject':
                return (
                    <div className="space-y-4">
                        <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Select New Subject</label>
                        <select 
                            value={inputValue} 
                            onChange={(e) => setInputValue(e.target.value)}
                            className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm font-medium dark:text-white transition-all"
                        >
                            <option value="">Choose a subject...</option>
                            {subjects.map(s => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                    </div>
                );
            case 'difficulty':
                return (
                    <div className="space-y-4">
                        <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Select New Difficulty</label>
                        <div className="flex gap-3">
                            {['Easy', 'Medium', 'Hard'].map(diff => (
                                <button
                                    key={diff}
                                    onClick={() => setInputValue(diff)}
                                    className={`flex-1 py-3 rounded-xl border font-bold text-sm transition-all ${
                                        inputValue === diff 
                                            ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-900/30 dark:border-indigo-500/30 dark:text-indigo-300' 
                                            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700'
                                    }`}
                                >
                                    {diff}
                                </button>
                            ))}
                        </div>
                    </div>
                );
            case 'tags':
                return (
                    <div className="space-y-5">
                        <div className="flex gap-3">
                            {[
                                { id: 'add', label: 'Add Tags' },
                                { id: 'remove', label: 'Remove Tags' },
                                { id: 'replace', label: 'Replace Tags' }
                            ].map(act => (
                                <button
                                    key={act.id}
                                    onClick={() => setTagAction(act.id)}
                                    className={`flex-1 py-2 rounded-lg border font-bold text-xs transition-all ${
                                        tagAction === act.id 
                                            ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-900/30 dark:border-indigo-500/30 dark:text-indigo-300' 
                                            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700'
                                    }`}
                                >
                                    {act.label}
                                </button>
                            ))}
                        </div>
                        
                        <div>
                            <input
                                type="text"
                                placeholder="Type a tag and press Enter"
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                onKeyDown={handleAddTag}
                                onBlur={handleAddTag}
                                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm font-medium dark:text-white transition-all"
                            />
                            <div className="flex flex-wrap gap-2 mt-3">
                                {tags.map(tag => (
                                    <span key={tag} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 text-xs font-bold border border-indigo-100 dark:border-indigo-800/50">
                                        {tag}
                                        <button onClick={() => handleRemoveTag(tag)} className="hover:text-red-500 transition-colors"><X className="w-3 h-3"/></button>
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    const getActionTitle = () => {
        switch (actionType) {
            case 'delete': return 'Delete Questions';
            case 'archive': return 'Archive Questions';
            case 'restore': return 'Restore Questions';
            case 'subject': return 'Change Subject';
            case 'difficulty': return 'Change Difficulty';
            case 'tags': return 'Manage Tags';
            case 'duplicate': return 'Duplicate Questions';
            default: return 'Bulk Action';
        }
    };



    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                />
                <motion.div 
                    initial={{ scale: 0.95, opacity: 0, y: 10 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 10 }}
                    className="relative bg-white dark:bg-gray-800 w-full max-w-md rounded-2xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-700"
                >
                    <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white dark:bg-gray-700 rounded-xl shadow-sm border border-gray-100 dark:border-gray-600">
                                {actionType === 'delete' ? <AlertTriangle className="w-5 h-5 text-red-500" /> : <Check className="w-5 h-5 text-indigo-500" />}
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{getActionTitle()}</h3>
                                <p className="text-sm font-medium text-gray-500">{selectedCount} questions selected</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors dark:hover:bg-gray-700">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    
                    <div className="p-6">
                        {renderContent()}
                    </div>

                    <div className="p-6 pt-0 flex gap-3">
                        <button 
                            onClick={onClose}
                            className="flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 font-bold text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={handleSubmit}
                            disabled={(actionType === 'subject' || actionType === 'difficulty') && !inputValue}
                            className={`flex-1 px-4 py-3 rounded-xl font-bold text-sm text-white transition-all shadow-sm ${
                                actionType === 'delete' 
                                    ? 'bg-red-500 hover:bg-red-600' 
                                    : 'bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed'
                            }`}
                        >
                            {actionType === 'delete' ? 'Delete Permanently' : 'Apply Changes'}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default BulkActionModal;
