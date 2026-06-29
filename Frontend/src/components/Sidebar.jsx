import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Database, FilePlus2, Files, Settings, LogOut, GraduationCap, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ isSidebarOpen, setIsSidebarOpen }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { name: 'Question Bank', icon: Database, path: '/questions' },
    { name: 'AI Generator', icon: Sparkles, path: '/ai-generator' },
    { name: 'Generate Exam', icon: FilePlus2, path: '/generate' },
    { name: 'Exam Papers', icon: Files, path: '/exams' },
    { name: 'Settings', icon: Settings, path: '/settings' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <div className={`w-64 h-screen bg-gray-50/50 dark:bg-gray-800/50 border-r border-gray-100 dark:border-gray-700 flex flex-col fixed left-0 top-0 z-40 transform transition-transform duration-300 ease-in-out md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      {/* Brand */}
      <Link to="/" className="h-20 flex items-center px-6 hover:bg-gray-100/50 transition-colors">
        <div className="flex items-center gap-3 text-indigo-600">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-md shadow-indigo-600/20">
            <GraduationCap className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <span className="font-bold text-lg tracking-tight text-gray-900 dark:text-white leading-none block">ExamFlow</span>
            <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium tracking-wide">Academic Intelligence</span>
          </div>
        </div>
      </Link>

      {/* Navigation */}
      <div className="flex-1 py-6 px-3 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            onClick={() => setIsSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
              }`
            }
          >
            <item.icon className="w-5 h-5" strokeWidth={2} />
            <span className="text-sm">{item.name}</span>
          </NavLink>
        ))}
      </div>

      {/* Upgrade / Logout */}
      <div className="p-4">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-xl font-medium text-gray-500 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-all duration-200"
        >
          <LogOut className="w-5 h-5" strokeWidth={2} />
          <span className="text-sm">Logout</span>
        </button>
      </div>
      </div>
    </>
  );
};

export default Sidebar;
