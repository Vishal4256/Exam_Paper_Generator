import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/axiosConfig';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { Key, ArrowLeft, BookOpen } from 'lucide-react';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSendResetLink = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await api.post('/auth/forgot-password', { email });
            if (res.status === 200) {
                toast.success('Password reset link sent to your email.');
            }
        } catch (err) {
            toast.error(err.response?.data?.msg || "Failed to send reset link.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex w-full bg-white dark:bg-zinc-950">
            {/* Left Side - Branding (Hidden on mobile) */}
            <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-indigo-700 to-indigo-900 p-12 flex-col justify-between relative overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:20px_20px]" />
                
                <div className="relative z-10">
                    <Link to="/" className="flex items-center gap-2 text-white">
                        <BookOpen className="w-8 h-8" />
                        <span className="text-xl font-bold tracking-tight">ExamFlow</span>
                    </Link>
                </div>

                <div className="relative z-10 flex flex-col items-center text-center max-w-lg mx-auto">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="w-full aspect-square max-w-[400px] mb-10 rounded-3xl bg-indigo-950/40 p-4 border border-indigo-500/20 shadow-2xl backdrop-blur-sm flex items-center justify-center"
                    >
                        <img 
                            src="https://images.unsplash.com/photo-1559757175-5700dde675bc?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
                            alt="Academic Intelligence" 
                            className="rounded-2xl object-cover w-full h-full opacity-90 mix-blend-screen"
                        />
                    </motion.div>
                    
                    <motion.h1 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="text-4xl font-bold text-white mb-4 tracking-tight"
                    >
                        Harness Academic Intelligence
                    </motion.h1>
                    
                    <motion.p 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                        className="text-indigo-200 text-lg"
                    >
                        Experience the world's most intuitive exam generation platform, designed for precision and academic rigor.
                    </motion.p>
                </div>

                <div className="relative z-10 flex justify-between items-center text-indigo-300 text-sm">
                    <p>© {new Date().getFullYear()} ExamFlow Pro</p>
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                        System Online
                    </div>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 lg:p-24 relative">
                {/* Mobile Logo */}
                <div className="absolute top-8 left-8 lg:hidden">
                    <Link to="/" className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                        <BookOpen className="w-8 h-8" />
                        <span className="text-xl font-bold tracking-tight">ExamFlow</span>
                    </Link>
                </div>

                <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="w-full max-w-md space-y-8"
                >
                    <div className="text-center">
                        <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-950/50 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-indigo-100 dark:border-indigo-900/50">
                            <Key className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Forgot password?</h2>
                        <p className="mt-3 text-gray-500 dark:text-gray-400">
                            No worries, we'll send you reset instructions.
                        </p>
                    </div>

                    <form className="mt-8 space-y-6" onSubmit={handleSendResetLink}>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Email Address
                            </label>
                            <input 
                                id="email"
                                type="email" 
                                placeholder="Enter your email address" 
                                required 
                                disabled={loading}
                                value={email}
                                className="block w-full px-4 py-3.5 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all disabled:opacity-50 shadow-sm"
                                onChange={(e) => setEmail(e.target.value)} 
                            />
                        </div>

                        <button 
                            type="submit" 
                            disabled={loading || !email}
                            className="w-full py-3.5 text-white font-semibold bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-md shadow-indigo-500/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Sending...
                                </>
                            ) : (
                                'Reset Password'
                            )}
                        </button>
                    </form>

                    <div className="text-center mt-8">
                        <Link to="/login" className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                            <ArrowLeft className="w-4 h-4" />
                            Back to login
                        </Link>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default ForgotPassword;