import React, { useState, useEffect } from 'react';
import { User, Lock, Key, Palette, Save, Moon, Sun, Eye, EyeOff } from 'lucide-react';
import api from '../utils/axiosConfig';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

const Settings = () => {
  const { user, updateUser, toggleTheme } = useAuth();
  const [profileData, setProfileData] = useState({ name: '', email: '', profilePicture: '' });
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  const [showPassword, setShowPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchSettingsData = async () => {
      try {
        const profileRes = await api.get('/users/profile');
        
        setProfileData({ 
            name: profileRes.data.name, 
            email: profileRes.data.email, 
            profilePicture: profileRes.data.profilePicture || '' 
        });
      } catch (err) {
        toast.error('Failed to load settings');
      }
    };
    fetchSettingsData();
  }, []);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    if(profileData.name.length < 3) {
      toast.error('Name must be at least 3 characters');
      return;
    }
    setLoading(true);
    try {
      await api.put('/users/profile', { name: profileData.name, profilePicture: profileData.profilePicture });
      toast.success('Profile updated successfully');
      updateUser({ name: profileData.name, profilePicture: profileData.profilePicture });
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await api.put('/users/password', { 
        currentPassword: passwordData.currentPassword, 
        newPassword: passwordData.newPassword 
      });
      toast.success('Password updated successfully');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };





  const calculateStrength = (pwd) => {
      if(!pwd) return { label: '', color: 'bg-transparent' };
      if(pwd.length < 6) return { label: 'Weak', color: 'bg-red-500 w-1/3' };
      if(pwd.length < 10) return { label: 'Medium', color: 'bg-yellow-500 w-2/3' };
      return { label: 'Strong', color: 'bg-emerald-500 w-full' };
  };
  const strength = calculateStrength(passwordData.newPassword);

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          <Palette className="w-8 h-8 text-indigo-600" />
          Settings
        </h1>
        <p className="text-gray-500 mt-2">Manage your account settings and preferences.</p>
      </div>

      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <User className="w-5 h-5 text-indigo-500" /> Profile Information
            </h2>
            {user?.createdAt && (
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest bg-gray-50 dark:bg-gray-700 px-3 py-1 rounded-full">
                    Member Since: {new Date(user.createdAt).getFullYear()}
                </span>
            )}
          </div>
          <form onSubmit={handleProfileUpdate} className="space-y-4 max-w-lg">
            <div className="flex gap-4 items-center mb-6">
                <div className="w-16 h-16 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xl overflow-hidden shadow-inner">
                    <img src={user?.profilePicture || `https://ui-avatars.com/api/?name=${user?.name || 'User'}&background=e0e7ff&color=4f46e5`} alt="Avatar" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Avatar URL</label>
                    <input type="url" placeholder="https://example.com/avatar.png" value={profileData.profilePicture || ''} onChange={(e) => setProfileData({...profileData, profilePicture: e.target.value})} className="w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2 border text-sm" />
                </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
              <input type="text" value={profileData.name} onChange={(e) => setProfileData({...profileData, name: e.target.value})} className="w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2.5 border" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email (Read Only)</label>
              <input type="email" value={profileData.email} disabled className="w-full border-gray-200 bg-gray-50 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-400 rounded-lg shadow-sm p-2.5 border cursor-not-allowed" />
            </div>
            <button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-70 mt-2">
              <Save className="w-4 h-4" /> Save Profile
            </button>
          </form>
        </div>

        {/* Password Update */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Lock className="w-5 h-5 text-indigo-500" /> Update Password
          </h2>
          <form onSubmit={handlePasswordUpdate} className="space-y-4 max-w-lg">
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Current Password</label>
              <input type={showPassword ? "text" : "password"} value={passwordData.currentPassword} onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})} className="w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2.5 pr-10 border" required />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-9 text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">New Password</label>
              <input type={showPassword ? "text" : "password"} value={passwordData.newPassword} onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})} className="w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2.5 border" required minLength="8" />
              {passwordData.newPassword && (
                  <div className="mt-2">
                      <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-500">Password Strength</span>
                          <span className={`font-bold ${strength.color.split(' ')[0].replace('bg-', 'text-')}`}>{strength.label}</span>
                      </div>
                      <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                          <div className={`h-full transition-all ${strength.color}`}></div>
                      </div>
                  </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirm New Password</label>
              <input type={showPassword ? "text" : "password"} value={passwordData.confirmPassword} onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})} className="w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2.5 border" required minLength="8" />
            </div>
            <button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-70">
              <Save className="w-4 h-4" /> Update Password
            </button>
          </form>
        </div>


        {/* Appearance Settings */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Palette className="w-5 h-5 text-indigo-500" /> Appearance
          </h2>
          <div className="flex items-center justify-between max-w-lg">
            <div>
              <p className="font-medium text-gray-700 dark:text-gray-300">Dark Mode</p>
              <p className="text-sm text-gray-500">Toggle dark mode interface</p>
            </div>
            <button onClick={toggleTheme} className={`p-2 rounded-xl transition-colors ${user?.theme === 'dark' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
              {user?.theme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>
          </div>
        </div>


      </div>
    </div>
  );
};

export default Settings;
