"use client";
import React, { useState, useEffect } from "react";
import { Bell, X, CheckCircle, AlertTriangle, Info, Trash2 } from "lucide-react";

export default function NotificationsCenter() {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState([
        { id: 1, type: 'warning', title: 'License Expiring', message: 'Driver John Doe (LIC-12345) expires in 3 days.', time: '2 hours ago', read: false },
        { id: 2, type: 'success', title: 'Pairing Created', message: 'Successfully paired Vehicle ABC-123 with Driver Jane Smith.', time: '5 hours ago', read: true },
        { id: 3, type: 'info', title: 'System Update', message: 'TLC Registry maintenance scheduled for Sunday 2AM.', time: '1 day ago', read: true },
    ]);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        setUnreadCount(notifications.filter(n => !n.read).length);
    }, [notifications]);

    const markAsRead = (id) => {
        setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
    };

    const markAllAsRead = () => {
        setNotifications(notifications.map(n => ({ ...n, read: true })));
    };

    const deleteNotification = (e, id) => {
        e.stopPropagation();
        setNotifications(notifications.filter(n => n.id !== id));
    };

    const getIcon = (type) => {
        switch (type) {
            case 'success': return <CheckCircle className="w-5 h-5 text-emerald-500" />;
            case 'warning': return <AlertTriangle className="w-5 h-5 text-amber-500" />;
            case 'error': return <X className="w-5 h-5 text-red-500" />;
            default: return <Info className="w-5 h-5 text-blue-500" />;
        }
    };

    return (
        <div className="relative z-50">
            {/* Bell Icon Trigger */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all"
            >
                <Bell className="w-6 h-6" />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white">
                        {unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown / Slide-over */}
            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 bg-transparent z-40"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="absolute right-0 mt-4 w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                        {/* Header */}
                        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <h3 className="font-bold text-slate-900">Notifications</h3>
                            <div className="flex items-center gap-2">
                                {unreadCount > 0 && (
                                    <button
                                        onClick={markAllAsRead}
                                        className="text-xs font-medium text-blue-600 hover:text-blue-700 px-2 py-1 hover:bg-blue-50 rounded-md transition-colors"
                                    >
                                        Mark all read
                                    </button>
                                )}
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* List */}
                        <div className="max-h-[400px] overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="p-8 text-center text-slate-500">
                                    <Bell className="w-12 h-12 mx-auto mb-3 text-slate-200" />
                                    <p>No notifications yet</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-50">
                                    {notifications.map(notification => (
                                        <div
                                            key={notification.id}
                                            onClick={() => markAsRead(notification.id)}
                                            className={`p-4 hover:bg-slate-50 transition-colors cursor-pointer relative group ${!notification.read ? 'bg-blue-50/30' : ''}`}
                                        >
                                            <div className="flex gap-3">
                                                <div className="mt-1 flex-shrink-0">
                                                    {getIcon(notification.type)}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex justify-between items-start mb-1">
                                                        <h4 className={`text-sm font-semibold ${!notification.read ? 'text-slate-900' : 'text-slate-700'}`}>
                                                            {notification.title}
                                                        </h4>
                                                        <span className="text-xs text-slate-400 whitespace-nowrap ml-2">
                                                            {notification.time}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-slate-600 leading-relaxed">
                                                        {notification.message}
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={(e) => deleteNotification(e, notification.id)}
                                                    className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all absolute right-2 bottom-2"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                            {!notification.read && (
                                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500" />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
                            <button className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
                                View All History
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
