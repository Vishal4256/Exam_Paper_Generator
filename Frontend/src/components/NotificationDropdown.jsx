import React, { useState, useRef, useEffect } from 'react';
import { Bell, Check, Trash2, Info, CheckCircle2, AlertTriangle, XCircle, X } from 'lucide-react';
import { useNotifications } from '../context/NotificationsContext';
import { motion, AnimatePresence } from 'framer-motion';

const NotificationDropdown = () => {
    const [isOpen, setIsOpen] = useState(false);
    const { notifications, markAsRead, markAllAsRead, removeNotification, clearAll, unreadCount } = useNotifications();
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const getIcon = (type) => {
        switch(type) {
            case 'success': return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
            case 'warning': return <AlertTriangle className="w-5 h-5 text-amber-500" />;
            case 'error': return <XCircle className="w-5 h-5 text-red-500" />;
            default: return <Info className="w-5 h-5 text-indigo-500" />;
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors focus:outline-none"
            >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-gray-800"></span>
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden z-50 origin-top-right"
                    >
                        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-700/50">
                            <h3 className="font-bold text-gray-900 dark:text-white">Notifications</h3>
                            <div className="flex gap-2">
                                {unreadCount > 0 && (
                                    <button onClick={markAllAsRead} className="text-xs text-indigo-600 dark:text-indigo-400 font-medium hover:underline flex items-center gap-1">
                                        <Check className="w-3 h-3" /> Mark all read
                                    </button>
                                )}
                                {notifications.length > 0 && (
                                    <button onClick={clearAll} className="text-xs text-gray-500 hover:text-red-500 font-medium hover:underline flex items-center gap-1 ml-2">
                                        <Trash2 className="w-3 h-3" /> Clear
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="max-h-[400px] overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                                    <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                    <p className="text-sm">You have no new notifications.</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-50 dark:divide-gray-700">
                                    {notifications.map((notif) => (
                                        <div 
                                            key={notif.id} 
                                            className={`p-4 flex gap-3 group relative transition-colors ${notif.read ? 'bg-white dark:bg-gray-800' : 'bg-indigo-50/50 dark:bg-indigo-900/10'}`}
                                            onMouseEnter={() => !notif.read && markAsRead(notif.id)}
                                        >
                                            <div className="mt-0.5 flex-shrink-0">
                                                {getIcon(notif.type)}
                                            </div>
                                            <div className="flex-1 min-w-0 pr-6">
                                                <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{notif.title}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{notif.message}</p>
                                                <p className="text-[10px] text-gray-400 mt-1 font-medium">{new Date(notif.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                                            </div>
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); removeNotification(notif.id); }}
                                                className="absolute right-3 top-4 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                            {!notif.read && (
                                                <div className="absolute right-3 top-4 w-2 h-2 bg-indigo-500 rounded-full group-hover:hidden"></div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        
                        {notifications.length > 0 && (
                            <div className="p-3 border-t border-gray-100 dark:border-gray-700 text-center bg-gray-50/50 dark:bg-gray-700/50">
                                <span className="text-xs text-gray-500 font-medium">Showing {notifications.length} notifications</span>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default NotificationDropdown;
