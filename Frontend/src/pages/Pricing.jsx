import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { Link } from 'react-router-dom';

const Pricing = () => {
  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto text-center">
        <h2 className="text-3xl font-extrabold text-gray-900 sm:text-5xl">Simple, transparent pricing</h2>
        <p className="mt-4 text-xl text-gray-500">Everything you need to create perfect exams.</p>
      </div>
      <div className="mt-16 max-w-4xl mx-auto grid gap-8 lg:grid-cols-2">
        {/* Free Plan */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <h3 className="text-2xl font-bold text-gray-900">Free</h3>
          <p className="mt-4 text-gray-500">Perfect for getting started</p>
          <p className="mt-8">
            <span className="text-4xl font-extrabold text-gray-900">$0</span>
            <span className="text-base font-medium text-gray-500">/mo</span>
          </p>
          <Link to="/register" className="mt-8 block w-full bg-indigo-50 text-indigo-700 font-bold py-3 px-4 rounded-xl text-center hover:bg-indigo-100 transition-colors">Get Started</Link>
          <ul className="mt-8 space-y-4">
            {['Up to 5 exams per month', 'Basic question generation', 'Standard templates', 'PDF Export'].map((feature) => (
              <li key={feature} className="flex items-center">
                <Check className="h-5 w-5 text-indigo-500 shrink-0" />
                <span className="ml-3 text-gray-600">{feature}</span>
              </li>
            ))}
          </ul>
        </motion.div>
        
        {/* Pro Plan */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-indigo-600 rounded-2xl shadow-xl p-8 relative overflow-hidden">
          <h3 className="text-2xl font-bold text-white">Pro</h3>
          <p className="mt-4 text-indigo-200">For serious educators and institutions</p>
          <p className="mt-8">
            <span className="text-4xl font-extrabold text-white">$29</span>
            <span className="text-base font-medium text-indigo-200">/mo</span>
          </p>
          <Link to="/register" className="mt-8 block w-full bg-white text-indigo-600 font-bold py-3 px-4 rounded-xl text-center hover:bg-gray-50 transition-colors">Start Free Trial</Link>
          <ul className="mt-8 space-y-4">
            {['Unlimited exams', 'Advanced AI generation', 'Custom templates', 'Priority support', 'Analytics'].map((feature) => (
              <li key={feature} className="flex items-center">
                <Check className="h-5 w-5 text-indigo-200 shrink-0" />
                <span className="ml-3 text-white">{feature}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      </div>
    </div>
  );
};

export default Pricing;
