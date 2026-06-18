import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../utils/axiosConfig';
import { Mail, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'react-toastify';

const VerifyEmail = () => {
    const { state } = useLocation();
    const navigate = useNavigate();
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    
    // Fallback if accessed without state
    const email = state?.email || '';

    const handleVerify = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await api.post('/auth/verify-email-otp', { email, otp });
            toast.success(res.data.msg);
            navigate('/login');
        } catch (err) {
            toast.error(err.response?.data?.msg || 'Verification failed');
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        try {
            const res = await api.post('/auth/resend-verification-otp', { email });
            toast.success(res.data.msg);
        } catch (err) {
            toast.error(err.response?.data?.msg || 'Failed to resend OTP');
        }
    };

    if (!email) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Invalid Session</h2>
                    <button onClick={() => navigate('/register')} className="text-indigo-600 font-medium">Return to Registration</button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-white">
            <div className="w-full flex items-center justify-center p-8">
                <div className="w-full max-w-md">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Mail className="w-8 h-8" />
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">Verify your email</h2>
                        <p className="text-gray-500 text-sm">We've sent a code to <span className="font-semibold text-gray-800">{email}</span></p>
                    </div>

                    <form onSubmit={handleVerify} className="space-y-6">
                        <div>
                            <input
                                type="text"
                                required
                                placeholder="Enter 6-digit OTP"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                className="w-full px-4 py-4 text-center text-2xl tracking-[0.5em] font-bold bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-gray-900"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading || otp.length < 6}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-70 flex items-center justify-center gap-2"
                        >
                            {loading ? 'Verifying...' : <><CheckCircle className="w-5 h-5" /> Verify Email</>}
                        </button>
                    </form>

                    <p className="mt-8 text-center text-sm text-gray-500">
                        Didn't receive the code?{' '}
                        <button type="button" onClick={handleResend} className="font-semibold text-indigo-600 hover:text-indigo-500">
                            Click to resend
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default VerifyEmail;
