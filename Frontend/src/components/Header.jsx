import React, { useRef, useEffect } from 'react';
import { Search, Bell, Moon, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSearch } from '../context/SearchContext';

const Header = ({ setIsSidebarOpen }) => {
  const { user, toggleTheme } = useAuth();
  const { globalSearchQuery, setGlobalSearchQuery } = useSearch();
  const searchInputRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl + K to focus search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      // Esc to clear search
      if (e.key === 'Escape' && document.activeElement === searchInputRef.current) {
        setGlobalSearchQuery('');
        searchInputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setGlobalSearchQuery]);

  const handleSearchChange = (e) => {
    setGlobalSearchQuery(e.target.value);
  };

  const handleClearSearch = () => {
    setGlobalSearchQuery('');
    searchInputRef.current?.focus();
  };

  const handleInputKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      searchInputRef.current?.blur();
    }
  };

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

        <div className="relative hidden md:block max-w-md w-full">
          <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            ref={searchInputRef}
            type="text"
            value={globalSearchQuery}
            onChange={handleSearchChange}
            onKeyDown={handleInputKeyDown}
            placeholder="Search across the app (Ctrl+K)..."
            className="w-full pl-11 pr-10 py-2 bg-gray-50/80 dark:bg-gray-700/80 border border-gray-100 dark:border-gray-600 rounded-full text-sm focus:ring-2 focus:ring-indigo-100 focus:bg-white dark:focus:bg-gray-800 text-gray-900 dark:text-gray-100 transition-all outline-none"
          />
          {globalSearchQuery && (
            <button 
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3 pr-6 border-r border-gray-200 dark:border-gray-700">
          <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full transition-colors">
            <Bell className="w-5 h-5" />
          </button>
          <button onClick={toggleTheme} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full transition-colors">
            {user?.theme === 'dark' ? <Search className="w-5 h-5 hidden" /> : null}
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
