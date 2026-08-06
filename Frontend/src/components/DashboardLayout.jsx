import React, { useState, useEffect } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import CommandPalette from './CommandPalette';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const DashboardLayout = () => {
  const { user, loading } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleGlobalShortcuts = (e) => {
      const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName) || document.activeElement.isContentEditable;
      
      // Ctrl+N -> New Exam
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        if (isInput) return;
        e.preventDefault();
        navigate('/generate');
      }
    };
    document.addEventListener('keydown', handleGlobalShortcuts);
    return () => document.removeEventListener('keydown', handleGlobalShortcuts);
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex text-gray-900 dark:text-gray-100 overflow-x-hidden">
        <Sidebar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
        <CommandPalette />
        
        <div className="flex-1 flex flex-col min-w-0 min-h-screen md:pl-64 w-full">
          <Header setIsSidebarOpen={setIsSidebarOpen} />
          
          {/* Main Content Area */}
          <main className="flex-1 p-4 md:p-6 lg:p-8 bg-gray-50 dark:bg-gray-900 min-h-[calc(100vh-80px)] text-gray-900 dark:text-gray-100 overflow-x-hidden w-full">
            <Outlet />
          </main>
        </div>
      </div>
  );
};

export default DashboardLayout;
