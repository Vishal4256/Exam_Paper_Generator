import React from 'react';
import { Bell, Moon, Menu } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Header = ({ setIsSidebarOpen }) => {
  const { user, toggleTheme } = useAuth();



  return (
    <header className="h-20 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-b border-gray-100 dark:border-gray-700 flex items-center justify-between px-4 sm:px-6 md:px-8 sticky top-0 z-20 transition-all duration-300">
      <div className="flex items-center flex-1 gap-4">
        {/* Hamburger Menu (Mobile Only) */}
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="md:hidden p-2 -ml-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3 pr-6 border-r border-gray-200 dark:border-gray-700">
          <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full transition-colors">
            <Bell className="w-5 h-5" />
          </button>
          <button onClick={toggleTheme} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full transition-colors">
            {/* Keeping Moon for simplicity, maybe replace with Sun dynamically */}
            <Moon className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-3 cursor-pointer">
          <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm overflow-hidden">
            <img src={user?.profilePicture || `https://ui-avatars.com/api/?name=${user?.name || 'Sarah'}&background=e0e7ff&color=4f46e5`} alt="Profile" className="w-full h-full object-cover" />
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-bold text-gray-900 dark:text-gray-100 leading-none">{user?.name || 'Prof. Sarah'}</p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
