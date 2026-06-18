import React from 'react';

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white p-8 md:p-12 rounded-2xl shadow-sm border border-gray-200">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Privacy Policy</h1>
        <p className="text-gray-600 mb-4">Last updated: {new Date().toLocaleDateString()}</p>
        
        <h2 className="text-xl font-semibold mt-8 mb-4">1. Information We Collect</h2>
        <p className="text-gray-600 mb-4">We collect information you provide directly to us, such as when you create or modify your account, request on-demand services, contact customer support, or otherwise communicate with us. This information may include: name, email, and encrypted password.</p>

        <h2 className="text-xl font-semibold mt-8 mb-4">2. How We Use Information</h2>
        <p className="text-gray-600 mb-4">We use the information we collect about you to provide, maintain, and improve our services, such as to facilitate exam generation, provide customer support, and develop new features.</p>

        <h2 className="text-xl font-semibold mt-8 mb-4">3. Data Sharing and Disclosure</h2>
        <p className="text-gray-600 mb-4">We do not sell your personal information. We may share information with third-party vendors and service providers that perform services on our behalf, such as AI generation models, strictly for the purpose of operating ExamFlow.</p>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
