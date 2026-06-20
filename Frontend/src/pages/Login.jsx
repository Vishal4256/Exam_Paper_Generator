import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/axiosConfig';
import { useAuth } from '../context/AuthContext';
import { GraduationCap, Mail, Lock, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/login', formData);
      login(res.data.token, res.data.user);
      toast.success('Successfully logged in!');
      navigate('/dashboard');
    } catch (err) {
      const message = err.response?.data?.msg || err.response?.data?.message || 'Invalid credentials';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-white">
      {/* Left Panel - Brand / Graphic */}
      <div className="hidden lg:flex lg:w-1/2 bg-indigo-600 flex-col relative overflow-hidden text-white">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-indigo-500 rounded-full blur-3xl opacity-50"></div>
        
        <Link to="/" className="p-12 relative z-10 flex items-center gap-3 hover:opacity-80 transition-opacity w-fit">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                <GraduationCap className="w-8 h-8" />
            </div>
            <span className="font-bold text-2xl tracking-tight">ExamFlow</span>
        </Link>

        <div className="flex-1 flex flex-col justify-center px-16 relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <h1 className="text-5xl font-extrabold mb-6 leading-tight">Empowering Academic<br />Intelligence</h1>
            <p className="text-indigo-200 text-lg max-w-md leading-relaxed mb-12">
              Generate, manage, and analyze academic assessments with AI-driven precision and a seamless user experience.
            </p>
            {/* Abstract Graphic */}
            <div className="w-full max-w-lg aspect-[4/3] bg-gradient-to-tr from-indigo-500/40 to-white/10 rounded-2xl border border-white/20 shadow-2xl overflow-hidden backdrop-blur-sm relative">
                <div className="absolute inset-0 bg-white/5 opacity-50 flex flex-col justify-between p-6">
                    <div className="h-4 w-1/3 bg-white/20 rounded-full"></div>
                    <div className="flex gap-4 items-end h-24">
                        <div className="w-1/4 h-1/2 bg-white/30 rounded-t-lg"></div>
                        <div className="w-1/4 h-full bg-white/40 rounded-t-lg"></div>
                        <div className="w-1/4 h-3/4 bg-white/20 rounded-t-lg"></div>
                        <div className="w-1/4 h-1/4 bg-white/10 rounded-t-lg"></div>
                    </div>
                </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome back</h2>
            <p className="text-gray-500">Please enter your details to sign in to your account</p>
          </div>


          {error && (
            <div className="mb-6 bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-3 text-sm">
              <AlertCircle className="w-5 h-5" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email" required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-gray-900"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-semibold text-gray-700">Password</label>
                <Link to="/forgot-password" className="text-sm font-semibold text-indigo-600 hover:text-indigo-500">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="password" required minLength={6}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-gray-900"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-70 mt-4"
            >
              {loading ? 'Signing in...' : 'Sign in to Workspace'}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-gray-500">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-indigo-600 hover:text-indigo-500">
              Register for free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;