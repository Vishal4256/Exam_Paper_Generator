import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../utils/axiosConfig';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { 
    ArrowLeft, 
    BookOpen, 
    ShieldCheck, 
    Lock,
    CheckCircle,
    Eye,
    EyeOff
} from 'lucide-react';

const ResetPassword = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    // Validation states
    const [validations, setValidations] = useState({
        length: false,
        symbolOrNumber: false,
        upperAndLower: false,
        match: false
    });

    useEffect(() => {
        setValidations({
            length: password.length >= 8,
            symbolOrNumber: /[\d\W]/.test(password),
            upperAndLower: /[a-z]/.test(password) && /[A-Z]/.test(password),
            match: password !== '' && password === confirmPassword
        });
    }, [password, confirmPassword]);

    const isAllValid = Object.values(validations).every(Boolean);

    const handleResetPassword = async (e) => {
        e.preventDefault();
        
        if (!isAllValid) return;

        setLoading(true);
        try {
            const res = await api.post(`/auth/reset-password/${token}`, { password });
            if (res.status === 200) {
                toast.success('Password has been reset successfully!');
                setTimeout(() => navigate('/login'), 2000);
            }
        } catch (err) {
            toast.error(err.response?.data?.msg || "Failed to reset password. Link may be expired.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex w-full bg-white dark:bg-zinc-950">
            {/* Left Side - Branding (Hidden on mobile) */}
            <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-indigo-700 to-indigo-900 p-12 flex-col justify-between relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:20px_20px]" />
                
                <div className="relative z-10">
                    <Link to="/" className="flex items-center gap-2 text-white">
                        <BookOpen className="w-8 h-8" />
                        <span className="text-xl font-bold tracking-tight">ExamFlow</span>
                    </Link>
                </div>

                <div className="relative z-10 max-w-lg">
                    <motion.h1 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="text-5xl font-bold text-white mb-6 tracking-tight leading-tight"
                    >
                        Secure your academic excellence.
                    </motion.h1>
                    
                    <motion.p 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="text-indigo-200 text-lg leading-relaxed mb-12"
                    >
                        Your security is our priority. We use industry-standard encryption to ensure your data and exams remain private.
                    </motion.p>

                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                        className="flex gap-4"
                    >
                        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 flex-1 border border-white/10">
                            <ShieldCheck className="w-6 h-6 text-emerald-400 mb-2" />
                            <h3 className="text-white font-semibold mb-1 text-sm">Verified</h3>
                            <p className="text-indigo-200 text-xs">SOC2 Type II Compliant architecture.</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 flex-1 border border-white/10">
                            <Lock className="w-6 h-6 text-blue-400 mb-2" />
                            <h3 className="text-white font-semibold mb-1 text-sm">Encrypted</h3>
                            <p className="text-indigo-200 text-xs">AES-256 bit end-to-end encryption.</p>
                        </div>
                    </motion.div>
                </div>

                <div className="relative z-10 flex justify-between items-center text-indigo-300 text-sm">
                    <p>© {new Date().getFullYear()} ExamFlow SaaS</p>
                    <div className="flex gap-4">
                        <Link to="/privacy-policy" className="hover:text-white transition-colors">Privacy</Link>
                        <Link to="/terms" className="hover:text-white transition-colors">Terms</Link>
                    </div>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 lg:p-24 relative overflow-y-auto">
                <div className="absolute top-8 left-8 lg:hidden">
                    <Link to="/" className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                        <BookOpen className="w-8 h-8" />
                        <span className="text-xl font-bold tracking-tight">ExamFlow</span>
                    </Link>
                </div>

                <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="w-full max-w-md"
                >
                    <div className="mb-8">
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight mb-2">Set new password</h2>
                        <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
                            Your new password must be different from previously used passwords.
                        </p>
                    </div>

                    <form className="space-y-5" onSubmit={handleResetPassword}>
                        <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                New Password
                            </label>
                            <div className="relative">
                                <input 
                                    type={showPassword ? "text" : "password"} 
                                    placeholder="••••••••" 
                                    required 
                                    disabled={loading}
                                    value={password}
                                    className="block w-full px-4 py-3 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all pr-12"
                                    onChange={(e) => setPassword(e.target.value)} 
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                Confirm New Password
                            </label>
                            <input 
                                type={showPassword ? "text" : "password"} 
                                placeholder="••••••••" 
                                required 
                                disabled={loading}
                                value={confirmPassword}
                                className="block w-full px-4 py-3 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                                onChange={(e) => setConfirmPassword(e.target.value)} 
                            />
                        </div>

                        {/* Password Requirements */}
                        <div className="bg-gray-50 dark:bg-zinc-900/50 rounded-xl p-5 border border-gray-100 dark:border-zinc-800/50 mt-6">
                            <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wider">Password Requirements</h4>
                            <ul className="space-y-2">
                                <li className="flex items-center gap-2 text-sm">
                                    <CheckCircle className={`w-4 h-4 ${validations.length ? 'text-emerald-500' : 'text-gray-300 dark:text-zinc-700'}`} />
                                    <span className={validations.length ? 'text-gray-900 dark:text-gray-200' : 'text-gray-500 dark:text-gray-500'}>Must be at least 8 characters</span>
                                </li>
                                <li className="flex items-center gap-2 text-sm">
                                    <CheckCircle className={`w-4 h-4 ${validations.symbolOrNumber ? 'text-emerald-500' : 'text-gray-300 dark:text-zinc-700'}`} />
                                    <span className={validations.symbolOrNumber ? 'text-gray-900 dark:text-gray-200' : 'text-gray-500 dark:text-gray-500'}>Include a symbol or number</span>
                                </li>
                                <li className="flex items-center gap-2 text-sm">
                                    <CheckCircle className={`w-4 h-4 ${validations.upperAndLower ? 'text-emerald-500' : 'text-gray-300 dark:text-zinc-700'}`} />
                                    <span className={validations.upperAndLower ? 'text-gray-900 dark:text-gray-200' : 'text-gray-500 dark:text-gray-500'}>Include uppercase and lowercase</span>
                                </li>
                                <li className="flex items-center gap-2 text-sm">
                                    <CheckCircle className={`w-4 h-4 ${validations.match ? 'text-emerald-500' : 'text-gray-300 dark:text-zinc-700'}`} />
                                    <span className={validations.match ? 'text-gray-900 dark:text-gray-200' : 'text-gray-500 dark:text-gray-500'}>Passwords must match</span>
                                </li>
                            </ul>
                        </div>

                        <button 
                            type="submit" 
                            disabled={loading || !isAllValid}
                            className="w-full py-3.5 mt-2 text-white font-semibold bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-md shadow-indigo-500/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Resetting...
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

export default ResetPassword;
