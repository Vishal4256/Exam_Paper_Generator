import React from 'react';
import { Shield, Lock, Key, Server } from 'lucide-react';

const Security = () => {
  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Security at ExamFlow</h1>
        <p className="text-lg text-gray-600 mb-12">We take the security of your data and academic materials seriously. Here's how we protect your information.</p>
        
        <div className="space-y-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex gap-4">
            <div className="bg-indigo-50 p-3 rounded-lg h-fit"><Lock className="text-indigo-600" /></div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Authentication & JWT</h3>
              <p className="mt-2 text-gray-600">All sessions are securely managed using JSON Web Tokens (JWT). Tokens are encrypted and signed, ensuring your session cannot be hijacked or tampered with.</p>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex gap-4">
            <div className="bg-indigo-50 p-3 rounded-lg h-fit"><Key className="text-indigo-600" /></div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Password Encryption</h3>
              <p className="mt-2 text-gray-600">We never store plaintext passwords. Passwords are salted and hashed using bcrypt, the industry standard for secure password hashing.</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex gap-4">
            <div className="bg-indigo-50 p-3 rounded-lg h-fit"><Server className="text-indigo-600" /></div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Data Protection</h3>
              <p className="mt-2 text-gray-600">All data in transit is encrypted using TLS/SSL. Our databases are secured within private virtual networks, preventing unauthorized external access.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Security;
