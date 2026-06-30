import React from 'react';

const ExamPreview = ({ formData }) => {
    return (
        <div className="bg-white border border-gray-200 shadow-sm rounded-lg p-6 min-h-[500px]">
            <div className="text-center border-b-2 border-gray-900 pb-4 mb-4">
                <h1 className="text-xl font-black uppercase font-serif tracking-wide">
                    {formData.institutionName || 'INSTITUTION NAME'}
                </h1>
                
                {formData.examTitle && (
                    <h2 className="text-md font-bold mt-1 text-gray-800">
                        {formData.examTitle}
                    </h2>
                )}
                
                {formData.selectedSubject && (
                    <p className="text-xs font-semibold text-gray-600 mt-2 uppercase tracking-widest">
                        Subject: {formData.selectedSubject}
                    </p>
                )}
            </div>
            
            <div className="flex flex-wrap justify-between text-xs font-bold text-gray-800 border-b border-gray-300 pb-2 mb-4 gap-2">
                <span className="w-full sm:w-auto">Date: {formData.examDate || '___/___/_____'}</span>
                <span className="w-full sm:w-auto">Time: {formData.duration ? `${formData.duration} mins` : '___ mins'}</span>
                <span className="w-full sm:w-auto">Max Marks: {formData.totalMarks || '___'}</span>
            </div>
            
            <div className="text-xs font-medium text-gray-700 italic mb-6 space-y-1 border-b border-gray-200 pb-4">
                <p>General Instructions:</p>
                <div className="whitespace-pre-line pl-4">
                    {formData.instructions || '1. All questions are compulsory.\n2. Read questions carefully before answering.'}
                </div>
            </div>

            <div className="space-y-6">
                {formData.blueprint && formData.blueprint.length > 0 ? (
                    formData.blueprint.map((section, idx) => {
                        const marksStr = section.marksPerQuestion ? `[${section.marksPerQuestion} Marks Each]` : '';
                        const qCount = parseInt(section.questionCount) || 1;
                        const optionalCount = parseInt(section.optionalQuestions) || 0;
                        const displayCount = Math.min(qCount + optionalCount, 3); // Max 3 questions to show in preview
                        
                        return (
                            <div key={idx} className="mb-6">
                                <h3 className="font-bold text-sm uppercase mb-1">
                                    {section.sectionName || `SECTION ${String.fromCharCode(65 + idx)}`} 
                                    <span className="text-gray-500 font-normal ml-2 capitalize">({section.type})</span>
                                </h3>
                                <p className="text-xs text-gray-600 italic mb-3">
                                    Attempt {optionalCount > 0 ? `any ${qCount} questions from this section` : 'all questions'}. {marksStr}
                                </p>
                                <div className="space-y-3 pl-2">
                                    {Array.from({ length: displayCount }).map((_, qIdx) => (
                                        <div key={qIdx} className="flex gap-2">
                                            <span className="font-bold text-sm">Q{qIdx + 1}.</span>
                                            <div className="h-4 bg-gray-100 rounded w-full max-w-[80%] mt-0.5 animate-pulse"></div>
                                        </div>
                                    ))}
                                    {qCount + optionalCount > 3 && (
                                        <div className="text-xs text-gray-400 italic mt-2 pl-6">
                                            + {qCount + optionalCount - 3} more question(s)...
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="text-center py-12 border-2 border-dashed border-gray-100 rounded-xl">
                        <p className="text-gray-400 text-sm italic">Add sections to see question preview</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ExamPreview;
