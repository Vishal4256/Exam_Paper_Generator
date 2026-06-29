import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../utils/axiosConfig';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { AlertCircle } from 'lucide-react';

const VerifyOTP = () => {
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const location = useLocation();
  const navigate = useNavigate();
  const { login, user } = useAuth();

  const email = location.state?.email;

  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    } else if (!email) {
      navigate('/register', { replace: true });
    }
  }, [user, email, navigate]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await api.post('/auth/verify-otp', { email, otp });
      toast.success(res.data.message);
      
      if (res.data.token && res.data.user) {
         login(res.data.token, res.data.user);
         navigate('/dashboard', { replace: true });
      } else {
         navigate('/login', { replace: true });
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || err.response?.data?.msg || 'Invalid or expired OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    
    setResendLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/resend-otp', { email });
      toast.success(res.data.message || 'OTP resent successfully!');
      setCountdown(60);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || err.response?.data?.msg || 'Failed to resend OTP.');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Verify your email</h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          We sent a 6-digit verification code to <span className="font-semibold text-indigo-600">{email}</span>.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {error && (
            <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-md flex items-center gap-2 text-sm">
              <AlertCircle className="w-5 h-5" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="otp" className="block text-sm font-medium text-gray-700">
                Verification Code
              </label>
              <div className="mt-1">
                <input
                  id="otp"
                  name="otp"
                  type="text"
                  maxLength="6"
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  className="appearance-none block w-full px-3 py-3 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-center tracking-[0.5em] text-2xl font-bold text-gray-900"
                  placeholder="------"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70 transition-all font-bold"
              >
                {loading ? 'Verifying...' : 'Verify and Create Account'}
              </button>
            </div>
          </form>

          <div className="text-center mt-6 text-sm text-gray-600">
            Didn't receive the code?{' '}
            <button
              type="button"
              onClick={handleResend}
              disabled={countdown > 0 || resendLoading}
              className="font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {resendLoading ? 'Sending...' : countdown > 0 ? `Resend in ${countdown}s` : 'Resend Code'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyOTP;
