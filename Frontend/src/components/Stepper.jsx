import React from 'react';
import { FileText, Target, CheckSquare, Check } from 'lucide-react';
import { motion } from 'framer-motion';

const Stepper = ({ currentStep }) => {
    const steps = [
        { id: 1, title: 'Basic Information', icon: <FileText className="w-5 h-5" /> },
        { id: 2, title: 'Configure Sections', icon: <Target className="w-5 h-5" /> },
        { id: 3, title: 'Review & Generate', icon: <CheckSquare className="w-5 h-5" /> },
    ];

    return (
        <div className="w-full py-6 pb-12">
            <div className="flex items-center justify-between max-w-2xl mx-auto relative px-8">
                {/* Background connector line */}
                <div className="absolute left-8 right-8 top-1/2 -translate-y-1/2 h-1 bg-gray-200 rounded-full" />
                
                {/* Active connector line */}
                <motion.div 
                    className="absolute left-8 top-1/2 -translate-y-1/2 h-1 bg-indigo-600 rounded-full"
                    initial={{ width: '0%' }}
                    animate={{ width: `calc(${((currentStep - 1) / (steps.length - 1)) * 100}% - 4rem)` }}
                    transition={{ duration: 0.4, ease: "easeInOut" }}
                    style={{ maxWidth: 'calc(100% - 4rem)' }}
                />

                {steps.map((step, index) => {
                    const isCompleted = currentStep > step.id;
                    const isActive = currentStep === step.id;
                    const isUpcoming = currentStep < step.id;

                    return (
                        <div key={step.id} className="relative z-10 flex flex-col items-center">
                            <motion.div 
                                initial={false}
                                animate={{
                                    backgroundColor: isCompleted ? '#16a34a' : isActive ? '#4f46e5' : '#ffffff',
                                    borderColor: isCompleted ? '#16a34a' : isActive ? '#4f46e5' : '#d1d5db',
                                    color: isCompleted || isActive ? '#ffffff' : '#9ca3af',
                                    scale: isActive ? 1.1 : 1
                                }}
                                transition={{ duration: 0.3 }}
                                className={`w-12 h-12 rounded-full border-2 flex items-center justify-center shadow-sm bg-white ${isActive ? 'ring-4 ring-indigo-100' : ''}`}
                            >
                                {isCompleted ? <Check className="w-6 h-6" /> : step.icon}
                            </motion.div>
                            <span className={`absolute top-14 whitespace-nowrap text-xs font-bold transition-colors duration-300 ${isCompleted ? 'text-green-600' : isActive ? 'text-indigo-600' : 'text-gray-400'}`}>
                                {step.title}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default Stepper;
