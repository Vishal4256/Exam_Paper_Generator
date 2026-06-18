import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/axiosConfig';
import { motion } from 'framer-motion';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [step, setStep] = useState('email'); // 'email', 'otp', 'reset'
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSendOTP = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        setLoading(true);
        try {
            const res = await api.post('/auth/forgot-password', { email });
            if (res.status === 200) {
                setMessage('Password reset OTP sent to your email. Please check and verify.');
                setStep('otp');
            }
        } catch (err) {
            setError(err.response?.data?.msg || "Email not found");
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        setLoading(true);
        try {
            const res = await api.post('/auth/verify-password-reset-otp', { email, otp });
            if (res.status === 200) {
                setMessage('OTP verified successfully. Please set your new password.');
                setStep('reset');
            }
        } catch (err) {
            setError(err.response?.data?.msg || "Invalid OTP");
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (newPassword.length < 6) {
            setError('Password must be at least 6 characters long');
            return;
        }

        setLoading(true);
        try {
            const res = await api.post('/auth/reset-password', { 
                email, 
                otp, 
                newPassword 
            });
            if (res.status === 200) {
                setMessage('Password reset successfully! Redirecting to login...');
                setTimeout(() => { navigate('/login'); }, 2000);
            }
        } catch (err) {
            setError(err.response?.data?.msg || "Password reset failed");
        } finally {
            setLoading(false);
        }
    };

    const handleResendOTP = async () => {
        setError('');
        setMessage('');
        setLoading(true);
        try {
            const res = await api.post('/auth/forgot-password', { email });
            if (res.status === 200) {
                setMessage('OTP resent to your email');
            }
        } catch (err) {
            setError(err.response?.data?.msg || "Failed to resend OTP");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#09090b] px-4 relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none" />

            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-md w-full space-y-8 bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 p-10 rounded-[2.5rem] shadow-2xl relative z-10"
            >
                {step === 'email' && (
                    <>
                        <div>
                            <h2 className="text-center text-3xl font-black text-white tracking-tight">Reset Password</h2>
                            <p className="mt-2 text-center text-zinc-500 text-sm">Enter your email to receive a reset OTP</p>
                        </div>

                        <form className="mt-8 space-y-5" onSubmit={handleSendOTP}>
                            <input 
                                type="email" 
                                placeholder="Email address" 
                                required 
                                disabled={loading}
                                value={email}
                                className="rounded-2xl block w-full px-5 py-4 bg-zinc-950/50 border border-zinc-800 text-white placeholder-zinc-600 focus:ring-2 focus:ring-blue-500/40 outline-none transition-all disabled:opacity-50"
                                onChange={(e) => setEmail(e.target.value)} 
                            />

                            {error && <div className="text-rose-500 text-sm text-center bg-rose-500/10 py-2 rounded-xl border border-rose-500/20">{error}</div>}
                            {message && <div className="text-emerald-500 text-sm text-center bg-emerald-500/10 py-2 rounded-xl border border-emerald-500/20">{message}</div>}

                            <button 
                                type="submit" 
                                disabled={loading}
                                className="w-full py-4 text-white font-bold bg-blue-600 rounded-2xl hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Sending OTP...' : 'Send Reset OTP'}
                            </button>
                        </form>

                        <p className="text-center text-sm text-zinc-500">
                            Remember your password? <Link to="/login" className="text-blue-500 hover:underline font-bold">Login here</Link>
                        </p>
                    </>
                )}

                {step === 'otp' && (
                    <>
                        <div>
                            <h2 className="text-center text-3xl font-black text-white tracking-tight">Verify OTP</h2>
                            <p className="mt-2 text-center text-zinc-500 text-sm">Enter the OTP sent to {email}</p>
                        </div>

                        <form className="mt-8 space-y-5" onSubmit={handleVerifyOTP}>
                            <input 
                                type="text" 
                                placeholder="Enter 6-digit OTP" 
                                required 
                                maxLength="6"
                                disabled={loading}
                                value={otp}
                                className="rounded-2xl block w-full px-5 py-4 bg-zinc-950/50 border border-zinc-800 text-white placeholder-zinc-600 focus:ring-2 focus:ring-blue-500/40 outline-none transition-all text-center text-2xl tracking-widest font-bold disabled:opacity-50"
                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} 
                            />

                            {error && <div className="text-rose-500 text-sm text-center bg-rose-500/10 py-2 rounded-xl border border-rose-500/20">{error}</div>}
                            {message && <div className="text-emerald-500 text-sm text-center bg-emerald-500/10 py-2 rounded-xl border border-emerald-500/20">{message}</div>}

                            <button 
                                type="submit" 
                                disabled={loading || otp.length !== 6}
                                className="w-full py-4 text-white font-bold bg-blue-600 rounded-2xl hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Verifying...' : 'Verify OTP'}
                            </button>

                            <div className="flex items-center justify-between text-sm">
                                <button
                                    type="button"
                                    onClick={() => setStep('email')}
                                    className="text-zinc-400 hover:text-white transition-colors"
                                >
                                    ← Back
                                </button>
                                <button
                                    type="button"
                                    onClick={handleResendOTP}
                                    disabled={loading}
                                    className="text-blue-500 hover:text-blue-400 transition-colors disabled:opacity-50"
                                >
                                    Resend OTP
                                </button>
                            </div>
                        </form>
                    </>
                )}

                {step === 'reset' && (
                    <>
                        <div>
                            <h2 className="text-center text-3xl font-black text-white tracking-tight">Set New Password</h2>
                            <p className="mt-2 text-center text-zinc-500 text-sm">Enter your new password</p>
                        </div>

                        <form className="mt-8 space-y-5" onSubmit={handleResetPassword}>
                            <div className="space-y-4">
                                <input 
                                    type="password" 
                                    placeholder="New Password" 
                                    required 
                                    disabled={loading}
                                    value={newPassword}
                                    className="rounded-2xl block w-full px-5 py-4 bg-zinc-950/50 border border-zinc-800 text-white placeholder-zinc-600 focus:ring-2 focus:ring-blue-500/40 outline-none transition-all disabled:opacity-50"
                                    onChange={(e) => setNewPassword(e.target.value)} 
                                />
                                <input 
                                    type="password" 
                                    placeholder="Confirm New Password" 
                                    required 
                                    disabled={loading}
                                    value={confirmPassword}
                                    className="rounded-2xl block w-full px-5 py-4 bg-zinc-950/50 border border-zinc-800 text-white placeholder-zinc-600 focus:ring-2 focus:ring-blue-500/40 outline-none transition-all disabled:opacity-50"
                                    onChange={(e) => setConfirmPassword(e.target.value)} 
                                />
                            </div>

                            {error && <div className="text-rose-500 text-sm text-center bg-rose-500/10 py-2 rounded-xl border border-rose-500/20">{error}</div>}
                            {message && <div className="text-emerald-500 text-sm text-center bg-emerald-500/10 py-2 rounded-xl border border-emerald-500/20">{message}</div>}

                            <button 
                                type="submit" 
                                disabled={loading || !newPassword || !confirmPassword}
                                className="w-full py-4 text-white font-bold bg-blue-600 rounded-2xl hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Resetting...' : 'Reset Password'}
                            </button>

                            <button
                                type="button"
                                onClick={() => setStep('otp')}
                                className="w-full text-zinc-400 hover:text-white transition-colors text-sm"
                            >
                                ← Back to OTP
                            </button>
                        </form>
                    </>
                )}
            </motion.div>
        </div>
    );
};

export default ForgotPassword;