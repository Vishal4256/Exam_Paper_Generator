import React from 'react';

const Terms = () => {
  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white p-8 md:p-12 rounded-2xl shadow-sm border border-gray-200">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Terms of Service</h1>
        <p className="text-gray-600 mb-4">Last updated: {new Date().toLocaleDateString()}</p>
        
        <h2 className="text-xl font-semibold mt-8 mb-4">1. Acceptance of Terms</h2>
        <p className="text-gray-600 mb-4">By accessing or using ExamFlow, you agree to be bound by these Terms. If you disagree with any part of the terms, then you may not access the service.</p>

        <h2 className="text-xl font-semibold mt-8 mb-4">2. Use of Service</h2>
        <p className="text-gray-600 mb-4">You agree not to use the service for any unlawful purpose or in any way that interrupts, damages, or impairs the service. AI-generated content should be reviewed by an educator before final use.</p>

        <h2 className="text-xl font-semibold mt-8 mb-4">3. Account Responsibilities</h2>
        <p className="text-gray-600 mb-4">You are responsible for safeguarding the password that you use to access the service and for any activities or actions under your password.</p>
      </div>
    </div>
  );
};

export default Terms;
