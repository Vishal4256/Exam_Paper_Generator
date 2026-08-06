import React, { useState } from 'react';
import { Filter, X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const FilterSection = ({ title, options, selected, onChange }) => {
    return (
        <div className="space-y-2">
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">{title}</h4>
            <div className="flex flex-wrap gap-2">
                {options.map(opt => {
                    const isSelected = selected.includes(opt);
                    return (
                        <button
                            key={opt}
                            onClick={() => onChange(opt)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 border
                                ${isSelected 
                                    ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-900/30 dark:border-indigo-500/30 dark:text-indigo-300' 
                                    : 'bg-white border-gray-200 text-gray-600 hover:border-indigo-300 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:border-indigo-500/50'
                                }
                            `}
                        >
                            {isSelected && <Check className="w-3 h-3" />}
                            {opt}
                        </button>
                    )
                })}
            </div>
        </div>
    );
};

const AdvancedFilters = ({ isOpen, onClose, filters, setFilters, availableSubjects }) => {
    const handleToggle = (field, value) => {
        setFilters(prev => {
            const current = prev[field] || [];
            const updated = current.includes(value) 
                ? current.filter(item => item !== value)
                : [...current, value];
            return { ...prev, [field]: updated };
        });
    };

    const clearFilters = () => {
        setFilters({
            subject: [],
            difficulty: [],
            type: [],
            bloomLevel: [],
            status: []
        });
    };

    const activeFilterCount = Object.values(filters).reduce((acc, curr) => acc + (Array.isArray(curr) ? curr.length : 0), 0);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30"
                >
                    <div className="p-4 md:p-6 space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <Filter className="w-4 h-4 text-indigo-500" /> Advanced Filters
                            </h3>
                            <div className="flex items-center gap-4">
                                {activeFilterCount > 0 && (
                                    <button onClick={clearFilters} className="text-xs font-bold text-gray-500 hover:text-red-500 transition-colors">
                                        Clear All ({activeFilterCount})
                                    </button>
                                )}
                                <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 bg-gray-100 dark:bg-gray-700 rounded-lg">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <FilterSection 
                                title="Subject" 
                                options={availableSubjects} 
                                selected={filters.subject || []} 
                                onChange={(val) => handleToggle('subject', val)} 
                            />
                            
                            <FilterSection 
                                title="Difficulty" 
                                options={['Easy', 'Medium', 'Hard']} 
                                selected={filters.difficulty || []} 
                                onChange={(val) => handleToggle('difficulty', val)} 
                            />
                            
                            <FilterSection 
                                title="Question Type" 
                                options={['MCQ', 'Short Answer', 'Long Answer', 'True/False', 'Coding']} 
                                selected={filters.type || []} 
                                onChange={(val) => handleToggle('type', val)} 
                            />

                            <FilterSection 
                                title="Bloom's Taxonomy" 
                                options={['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create']} 
                                selected={filters.bloomLevel || []} 
                                onChange={(val) => handleToggle('bloomLevel', val)} 
                            />

                            <FilterSection 
                                title="Status" 
                                options={['active', 'draft', 'archived']} 
                                selected={filters.status || []} 
                                onChange={(val) => handleToggle('status', val)} 
                            />
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default AdvancedFilters;
