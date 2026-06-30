import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const InstitutionCombobox = ({ value, onChange, options = [] }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const wrapperRef = useRef(null);

    // Close when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Sync external value
    useEffect(() => {
        setSearch(value || '');
    }, [value]);

    const filteredOptions = options.filter(opt => 
        opt.toLowerCase().includes(search.toLowerCase())
    );

    const handleSelect = (val) => {
        setSearch(val);
        onChange(val);
        setIsOpen(false);
    };

    const handleInputChange = (e) => {
        const val = e.target.value;
        setSearch(val);
        onChange(val); // Allow custom values by updating immediately
        if (!isOpen) setIsOpen(true);
    };

    return (
        <div ref={wrapperRef} className="relative w-full">
            <div className="relative flex items-center">
                <input
                    type="text"
                    placeholder="Select an institution or enter custom name"
                    value={search}
                    onChange={handleInputChange}
                    onFocus={() => setIsOpen(true)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-4 pr-10 py-3 text-gray-900 font-medium outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
                <button 
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className="absolute right-3 p-1 text-gray-400 hover:text-gray-600"
                >
                    <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>
            </div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute z-50 w-full mt-2 bg-white border border-gray-100 rounded-xl shadow-lg max-h-60 overflow-y-auto"
                    >
                        {filteredOptions.length > 0 ? (
                            <ul className="py-2">
                                {filteredOptions.map((opt, idx) => (
                                    <li 
                                        key={idx}
                                        onClick={() => handleSelect(opt)}
                                        className={`px-4 py-2.5 text-sm cursor-pointer flex items-center justify-between hover:bg-gray-50 ${value === opt ? 'text-indigo-600 font-bold bg-indigo-50/50' : 'text-gray-700'}`}
                                    >
                                        {opt}
                                        {value === opt && <Check className="w-4 h-4 text-indigo-600" />}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="px-4 py-3 text-sm text-gray-500 italic flex items-center gap-2">
                                <Search className="w-4 h-4" />
                                Press enter to use "{search}" as custom institution
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default InstitutionCombobox;
