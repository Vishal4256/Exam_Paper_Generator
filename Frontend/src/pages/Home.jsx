import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AuthContext } from '../context/AuthContext';
import { Zap, BookOpen, Layers } from 'lucide-react';

const Home = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleAuth = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/register');
    }
  };

  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  };

  return (
    <div className="relative bg-gray-50 text-gray-900 font-sans w-full min-h-screen flex flex-col">
      
      {/* 1. Hero Section */}
      <section className="px-6 max-w-7xl mx-auto flex flex-col items-center justify-center text-center w-full flex-grow py-32">
        <motion.div initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.1 } } }}>
          <motion.h1 variants={fadeInUp} className="text-5xl md:text-6xl font-black tracking-tight mb-6 leading-tight">
            Professional <span className="text-indigo-600">Exam Paper Generator</span>
          </motion.h1>

          <motion.p variants={fadeInUp} className="text-lg text-gray-500 max-w-2xl mx-auto mb-10 font-medium">
            Create, manage, and generate perfect academic assessment papers with automatic marking distributions and PDF generation.
          </motion.p>

          <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row justify-center gap-4 mb-16">
            <button onClick={handleAuth} className="px-8 py-3.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 transition-all">
              {user ? 'Open Dashboard' : 'Get Started'}
            </button>
            <Link to={user ? "/dashboard" : "/login"} className="px-8 py-3.5 bg-white text-gray-700 font-bold rounded-xl border border-gray-200 hover:bg-gray-50 transition-all">
              {user ? 'Go to Dashboard' : 'Login to Dashboard'}
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* 2. Features Section */}
      <section id="features" className="py-24 bg-white w-full border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900">Everything you need to succeed</h2>
            <p className="mt-4 text-gray-500 max-w-2xl mx-auto">Powerful features designed to make exam creation and management a breeze.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-6">
                <Zap className="text-indigo-600 w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">AI Generation</h3>
              <p className="text-gray-500">Instantly generate high-quality questions using advanced AI models tailored to your curriculum.</p>
            </div>
            <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-6">
                <Layers className="text-indigo-600 w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Custom Templates</h3>
              <p className="text-gray-500">Save your exam structures as templates to quickly reuse formats across different classes.</p>
            </div>
            <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-6">
                <BookOpen className="text-indigo-600 w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">PDF Export</h3>
              <p className="text-gray-500">Download beautifully formatted, ready-to-print PDFs for your students with just one click.</p>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};

export default Home;