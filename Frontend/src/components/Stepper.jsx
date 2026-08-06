import React from 'react';
import { FileText, Target, CheckSquare, Check } from 'lucide-react';
import { motion } from 'framer-motion';

const Stepper = ({ currentStep, onStepClick }) => {
    const steps = [
        { id: 1, title: '① Basic Information', icon: <FileText className="w-5 h-5" /> },
        { id: 2, title: '② Configure Sections', icon: <Target className="w-5 h-5" /> },
        { id: 3, title: '③ Review & Generate', icon: <CheckSquare className="w-5 h-5" /> },
    ];

    return (
        <div className="w-full py-6 pb-12">
            <div className="flex items-center justify-between max-w-2xl mx-auto relative px-8">
                {/* Background connector line */}
                <div className="absolute left-8 right-8 top-1/2 -translate-y-1/2 h-1 bg-gray-200 rounded-full" />
                
                {/* Active connector line */}
                <motion.div 
                    className="absolute left-8 top-1/2 -translate-y-1/2 h-1 bg-purple-600 rounded-full"
                    initial={{ width: '0%' }}
                    animate={{ width: `calc(${((currentStep - 1) / (steps.length - 1)) * 100}% - 4rem)` }}
                    transition={{ duration: 0.4, ease: "easeInOut" }}
                    style={{ maxWidth: 'calc(100% - 4rem)' }}
                />

                {steps.map((step, index) => {
                    const isCompleted = currentStep > step.id;
                    const isActive = currentStep === step.id;
                    const isUpcoming = currentStep < step.id;
                    const isClickable = isCompleted;

                    return (
                        <div key={step.id} className="relative z-10 flex flex-col items-center">
                            <motion.div 
                                role="button"
                                tabIndex={isClickable ? 0 : -1}
                                onKeyDown={(e) => {
                                    if (isClickable && (e.key === 'Enter' || e.key === ' ')) {
                                        onStepClick(step.id);
                                    }
                                }}
                                onClick={() => isClickable && onStepClick(step.id)}
                                initial={false}
                                animate={{
                                    backgroundColor: isCompleted ? '#16a34a' : isActive ? '#9333ea' : '#ffffff', // Green : Purple : White
                                    borderColor: isCompleted ? '#16a34a' : isActive ? '#9333ea' : '#d1d5db',
                                    color: isCompleted || isActive ? '#ffffff' : '#9ca3af',
                                    scale: isActive ? 1.1 : 1
                                }}
                                transition={{ duration: 0.3 }}
                                className={`w-12 h-12 rounded-full border-2 flex items-center justify-center shadow-sm ${
                                    isClickable ? 'cursor-pointer hover:shadow-md' : isUpcoming ? 'cursor-not-allowed' : 'bg-white'
                                } ${isActive ? 'ring-4 ring-purple-100' : ''}`}
                            >
                                {isCompleted ? <Check className="w-6 h-6" /> : step.icon}
                            </motion.div>
                            <span 
                                onClick={() => isClickable && onStepClick(step.id)}
                                className={`absolute top-14 whitespace-nowrap text-xs font-bold transition-colors duration-300 ${
                                    isCompleted ? 'text-green-600 cursor-pointer hover:text-green-700' : 
                                    isActive ? 'text-purple-600' : 
                                    'text-gray-400'
                                }`}
                            >
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
