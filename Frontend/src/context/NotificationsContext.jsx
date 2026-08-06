import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const NotificationsContext = createContext(null);

const NOTIFICATIONS_KEY = 'examflow_notifications';

export const NotificationsProvider = ({ children }) => {
    const [notifications, setNotifications] = useState(() => {
        try {
            const stored = localStorage.getItem(NOTIFICATIONS_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error("Failed to parse notifications:", error);
            return [];
        }
    });

    useEffect(() => {
        localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
    }, [notifications]);

    const addNotification = useCallback((notification) => {
        const newNotification = {
            id: crypto.randomUUID(),
            createdAt: new Date().toISOString(),
            read: false,
            ...notification
            // Expected fields: type ('success', 'warning', 'error', 'info'), title, message
        };
        
        setNotifications(prev => [newNotification, ...prev]);
    }, []);

    const markAsRead = useCallback((id) => {
        setNotifications(prev => 
            prev.map(notif => notif.id === id ? { ...notif, read: true } : notif)
        );
    }, []);

    const markAllAsRead = useCallback(() => {
        setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
    }, []);

    const removeNotification = useCallback((id) => {
        setNotifications(prev => prev.filter(notif => notif.id !== id));
    }, []);

    const clearAll = useCallback(() => {
        setNotifications([]);
    }, []);

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <NotificationsContext.Provider value={{
            notifications,
            addNotification,
            markAsRead,
            markAllAsRead,
            removeNotification,
            clearAll,
            unreadCount
        }}>
            {children}
        </NotificationsContext.Provider>
    );
};

export const useNotifications = () => {
    const context = useContext(NotificationsContext);
    if (!context) {
        throw new Error('useNotifications must be used within a NotificationsProvider');
    }
    return context;
};
