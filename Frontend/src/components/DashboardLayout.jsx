import React, { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useAuth } from '../context/AuthContext';

const DashboardLayout = () => {
  const { user, loading } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
      
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <Header setIsSidebarOpen={setIsSidebarOpen} />
        
        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 md:ml-64 bg-gray-50 dark:bg-gray-900 min-h-[calc(100vh-80px)] text-gray-900 dark:text-gray-100 overflow-x-hidden w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
