import React, { useState, useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { GraduationCap } from 'lucide-react';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsOpen(false);
  };

  const navLinks = user 
    ? [
        { name: 'Dashboard', path: '/dashboard' },
        { name: 'Questions', path: '/questions' },
        { name: 'Generate', path: '/generate' },
        { name: 'Exams', path: '/exams' },
      ]
    : [];

  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={`fixed w-full top-0 z-50 transition-all duration-300 ${
        scrolled 
        ? 'bg-white/80 backdrop-blur-md border-b border-gray-100 py-3' 
        : 'bg-white py-5 border-b border-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          
          {/* Logo */}
          <div className="shrink-0 flex items-center">
            <Link to="/" className="group flex items-center gap-3">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-md shadow-indigo-600/20 group-hover:rotate-12 transition-transform">
                <GraduationCap className="w-5 h-5 text-white" strokeWidth={2.5} />
              </div>
              <div className="hidden sm:block">
                <span className="font-bold text-lg tracking-tight text-gray-900 leading-none block">ExamFlow</span>
                <span className="text-[10px] text-gray-500 font-medium tracking-wide">Academic Intelligence</span>
              </div>
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex space-x-1 items-center">
            {navLinks.map((link) => (
              <Link 
                key={link.name}
                to={link.path} 
                className="px-4 py-2 text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-all text-sm font-semibold"
              >
                {link.name}
              </Link>
            ))}
            
            <div className="h-4 w-[1px] bg-gray-200 mx-2" />

            {user ? (
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-gray-500 hover:text-red-500 transition-colors text-sm font-semibold"
              >
                Logout
              </button>
            ) : (
              <div className="flex items-center gap-4 ml-2">
                <Link to="/login" className="text-gray-500 hover:text-gray-900 text-sm font-semibold">
                  Login
                </Link>
                <Link 
                  to="/register" 
                  className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition-all shadow-md shadow-indigo-600/20 text-sm font-bold"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Button */}
          <div className="md:hidden flex items-center">
            <button 
              onClick={() => setIsOpen(!isOpen)} 
              className="p-2 text-gray-500 hover:text-gray-900 bg-gray-50 rounded-lg border border-gray-100"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isOpen 
                  ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                }
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-b border-gray-100 absolute w-full"
          >
            <div className="px-4 pt-4 pb-6 space-y-2">
              {navLinks.map((link) => (
                <Link 
                  key={link.name}
                  to={link.path} 
                  onClick={() => setIsOpen(false)}
                  className="block px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-xl transition-colors font-medium"
                >
                  {link.name}
                </Link>
              ))}
              {user ? (
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors font-medium"
                >
                  Logout
                </button>
              ) : (
                <div className="pt-4 flex flex-col gap-3">
                  <Link 
                    to="/login" 
                    onClick={() => setIsOpen(false)}
                    className="block w-full text-center px-4 py-3 text-gray-700 bg-gray-50 rounded-xl border border-gray-100 font-bold"
                  >
                    Login
                  </Link>
                  <Link 
                    to="/register" 
                    onClick={() => setIsOpen(false)}
                    className="block w-full text-center px-4 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-md shadow-indigo-600/20"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default Navbar;