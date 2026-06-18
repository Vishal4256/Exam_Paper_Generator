import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const Home = () => {
  const handleAuth = () => {
    const token = localStorage.getItem('token');
    if (token) {
      window.location.href = '/dashboard';
    } else {
      window.location.href = '/register';
    }
  };

  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  };

  return (
    <div className="relative bg-gray-50 text-gray-900 font-sans w-full min-h-screen flex items-center">
      
      {/* 1. Hero Section */}
      <section className="px-6 max-w-7xl mx-auto flex flex-col items-center text-center w-full">
        <motion.div initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.1 } } }}>
          <motion.h1 variants={fadeInUp} className="text-5xl md:text-6xl font-black tracking-tight mb-6 leading-tight">
            Professional <span className="text-indigo-600">Exam Paper Generator</span>
          </motion.h1>

          <motion.p variants={fadeInUp} className="text-lg text-gray-500 max-w-2xl mx-auto mb-10 font-medium">
            Create, manage, and generate perfect academic assessment papers with automatic marking distributions and PDF generation.
          </motion.p>

          <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row justify-center gap-4 mb-16">
            <button onClick={handleAuth} className="px-8 py-3.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 transition-all">
              Get Started
            </button>
            <Link to="/login" className="px-8 py-3.5 bg-white text-gray-700 font-bold rounded-xl border border-gray-200 hover:bg-gray-50 transition-all">
              Login to Dashboard
            </Link>
          </motion.div>
        </motion.div>
      </section>

    </div>
  );
};

export default Home;