import React from 'react';
import { Trash2, Copy, ChevronUp, ChevronDown, GripVertical } from 'lucide-react';
import { motion } from 'framer-motion';

const SectionCard = ({ 
    section, 
    index, 
    totalSections,
    onChange, 
    onDelete, 
    onMoveUp, 
    onMoveDown, 
    onDuplicate 
}) => {
    
    const SUGGESTION_CHIPS = [
        "Easy for Revision",
        "More Numerical Problems",
        "Important Concepts Only",
        "Application-Based Questions",
        "Conceptual Questions",
        "Exam-Oriented Questions"
    ];

    const handleChange = (field, value) => {
        onChange(index, { ...section, [field]: value });
    };

    const totalMarks = (Number(section.questionCount) || 0) * (Number(section.marksPerQuestion) || 0);

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5 md:p-6 mb-6 group relative"
        >
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 border-b border-gray-100 pb-4">
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 hidden md:block">
                        <GripVertical className="w-5 h-5" />
                    </div>
                    <div className="flex-1 md:w-64">
                        <input 
                            type="text" 
                            placeholder="Section Name (e.g. Section A)"
                            value={section.sectionName}
                            onChange={(e) => handleChange('sectionName', e.target.value)}
                            className="w-full text-lg font-bold text-gray-900 border-none bg-transparent outline-none focus:ring-0 p-0 placeholder-gray-300"
                        />
                    </div>
                </div>
                <div className="flex items-center gap-2 self-end md:self-auto">
                    <button 
                        onClick={() => onMoveUp(index)} 
                        disabled={index === 0}
                        className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-400"
                        title="Move Up"
                    >
                        <ChevronUp className="w-5 h-5" />
                    </button>
                    <button 
                        onClick={() => onMoveDown(index)} 
                        disabled={index === totalSections - 1}
                        className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-400"
                        title="Move Down"
                    >
                        <ChevronDown className="w-5 h-5" />
                    </button>
                    <div className="w-px h-6 bg-gray-200 mx-1"></div>
                    <button 
                        onClick={() => onDuplicate(index)}
                        className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Duplicate Section"
                    >
                        <Copy className="w-4 h-4" />
                    </button>
                    <button 
                        onClick={() => onDelete(index)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Section"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Question Type</label>
                    <select 
                        value={section.type} 
                        onChange={(e) => handleChange('type', e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium outline-none focus:border-indigo-500"
                    >
                        <option value="MCQ">Multiple Choice (MCQ)</option>
                        <option value="Short Answer">Short Answer</option>
                        <option value="Long Answer">Long Answer</option>
                        <option value="True/False">True / False</option>
                        <option value="Fill in the Blanks">Fill in the Blanks</option>
                        <option value="Case Study">Case Study</option>
                        <option value="Numerical">Numerical</option>
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Difficulty Level</label>
                    <select 
                        value={section.difficulty} 
                        onChange={(e) => handleChange('difficulty', e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium outline-none focus:border-indigo-500"
                    >
                        <option value="Easy">Easy</option>
                        <option value="Medium">Medium</option>
                        <option value="Hard">Hard</option>
                        <option value="Mixed">Mixed (All Levels)</option>
                    </select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Total Questions</label>
                        <input 
                            type="number" 
                            min="1"
                            value={section.questionCount}
                            onChange={(e) => handleChange('questionCount', parseInt(e.target.value) || 1)}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium outline-none focus:border-indigo-500"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Optional (Choice)</label>
                        <input 
                            type="number" 
                            min="0"
                            placeholder="e.g. 2"
                            value={section.optionalQuestions || 0}
                            onChange={(e) => handleChange('optionalQuestions', parseInt(e.target.value) || 0)}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium outline-none focus:border-indigo-500"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Marks per Question</label>
                    <input 
                        type="number" 
                        min="0.5"
                        step="0.5"
                        value={section.marksPerQuestion}
                        onChange={(e) => handleChange('marksPerQuestion', parseFloat(e.target.value) || 1)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium outline-none focus:border-indigo-500"
                    />
                </div>

                <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-gray-800">Question Preferences <span className="text-gray-400 font-medium">(Optional)</span></label>
                    <p className="text-xs text-gray-500 mb-3 mt-1">Tell us how you want the questions to be generated.</p>
                    
                    <textarea 
                        placeholder="Example: Generate easy questions for revision, include more numerical problems, focus on important concepts only, or create application-based questions."
                        value={section.topics || ''}
                        onChange={(e) => handleChange('topics', e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all h-[120px] resize-y"
                    ></textarea>

                    <div className="flex flex-wrap gap-2 mt-3">
                        {SUGGESTION_CHIPS.map((chip, idx) => {
                            const isSelected = (section.topics || '').includes(chip);
                            return (
                                <button
                                    key={idx}
                                    type="button"
                                    onClick={() => {
                                        let currentText = section.topics || '';
                                        if (isSelected) {
                                            // Remove the chip text and clean up loose commas
                                            currentText = currentText.replace(new RegExp(`\\b${chip}\\b,?\\s*`, 'gi'), '').trim();
                                            if (currentText.endsWith(',')) currentText = currentText.slice(0, -1);
                                        } else {
                                            // Append the chip text
                                            currentText = currentText ? `${currentText}, ${chip}` : chip;
                                        }
                                        handleChange('topics', currentText);
                                    }}
                                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                                        isSelected 
                                            ? 'bg-indigo-100 border-indigo-300 text-indigo-700' 
                                            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300'
                                    }`}
                                >
                                    {chip}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end">
                <div className="bg-indigo-50 border border-indigo-100 rounded-lg px-4 py-2 flex items-center gap-2">
                    <span className="text-xs font-bold text-indigo-500 uppercase tracking-wide">Section Total</span>
                    <span className="text-lg font-black text-indigo-700">{totalMarks} Marks</span>
                </div>
            </div>
        </motion.div>
    );
};

export default SectionCard;
