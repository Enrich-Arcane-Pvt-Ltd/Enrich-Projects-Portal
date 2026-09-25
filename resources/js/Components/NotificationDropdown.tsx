import React, { useState, useEffect, useRef } from 'react';
import { usePage, router, Link } from '@inertiajs/react';
import type { PageProps, InertiaNotification } from '@/types';

export default function NotificationDropdown() {
    const { notifications } = usePage<PageProps>().props;
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const unreadCount = notifications?.unread_count || 0;
    const notificationList: InertiaNotification[] = notifications?.recent || [];

    // Filter by tab
    const filteredNotifications = notificationList.filter((n) => {
        if (activeTab === 'unread') {
            return !n.read_at;
        }
        return true;
    });

    const isAllSelected =
        filteredNotifications.length > 0 &&
        filteredNotifications.every((n) => selectedIds.includes(n.id));

    // Auto-poll notifications every 30 seconds (matching Filament's 30s interval)
    useEffect(() => {
        const interval = setInterval(() => {
            router.reload({
                only: ['notifications'],
            });
        }, 30000);

        return () => clearInterval(interval);
    }, []);

    // Close on click outside or escape key
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };

        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('keydown', handleEscape);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [isOpen]);

    const markAsRead = (id: string, e?: React.MouseEvent) => {
        e?.stopPropagation();
        router.post(
            `/notifications/${id}/mark-as-read`,
            {},
            {
                preserveScroll: true,
            }
        );
    };

    const markAllAsRead = (e: React.MouseEvent) => {
        e.stopPropagation();
        router.post(
            '/notifications/mark-all-read',
            {},
            {
                preserveScroll: true,
            }
        );
    };

    // Delete single notification with 'x' mark
    const deleteNotification = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        router.delete(`/notifications/${id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setSelectedIds((prev) => prev.filter((item) => item !== id));
            },
        });
    };

    // Delete all notifications
    const deleteAllNotifications = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (notificationList.length === 0) return;
        router.delete('/notifications/delete-all', {
            preserveScroll: true,
            onSuccess: () => {
                setSelectedIds([]);
            },
        });
    };

    // Delete selected notifications
    const deleteSelectedNotifications = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (selectedIds.length === 0) return;
        router.post(
            '/notifications/bulk-delete',
            { ids: selectedIds },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setSelectedIds([]);
                },
            }
        );
    };

    // Checkbox selection
    const toggleSelect = (id: string, e: React.ChangeEvent<HTMLInputElement> | React.MouseEvent) => {
        e.stopPropagation();
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = (e: React.ChangeEvent<HTMLInputElement> | React.MouseEvent) => {
        e.stopPropagation();
        const currentVisibleIds = filteredNotifications.map((n) => n.id);
        if (isAllSelected) {
            setSelectedIds((prev) => prev.filter((id) => !currentVisibleIds.includes(id)));
        } else {
            setSelectedIds((prev) => Array.from(new Set([...prev, ...currentVisibleIds])));
        }
    };

    // Icon renderer based on notification content
    const renderIcon = (n: InertiaNotification) => {
        const iconKey = (n.icon || '').toLowerCase();
        const titleKey = n.title.toLowerCase();

        if (iconKey.includes('trash') || titleKey.includes('delete')) {
            return (
                <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 shrink-0">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </div>
            );
        }

        if (iconKey.includes('user-plus') || titleKey.includes('added') || titleKey.includes('member')) {
            return (
                <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 shrink-0">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                </div>
            );
        }

        if (iconKey.includes('user-minus') || titleKey.includes('removed')) {
            return (
                <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 shrink-0">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM21 12h-6" />
                    </svg>
                </div>
            );
        }

        if (iconKey.includes('folder') || titleKey.includes('project created')) {
            return (
                <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                    </svg>
                </div>
            );
        }

        if (iconKey.includes('check') || titleKey.includes('approved')) {
            return (
                <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M5 13l4 4L19 7" />
                    </svg>
                </div>
            );
        }

        return (
            <div className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 shrink-0">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
            </div>
        );
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell Trigger Button */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                aria-label="Open notifications"
                title="Notifications"
            >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.75}
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                </svg>

                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white shadow-lg shadow-indigo-600/50 animate-pulse">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Notification Dropdown Panel */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl z-50 overflow-hidden text-slate-200 animate-in fade-in slide-in-from-top-2 duration-150">
                    {/* Header */}
                    <div className="p-3.5 sm:p-4 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-white">Notifications</span>
                            {unreadCount > 0 && (
                                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                    {unreadCount} new
                                </span>
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                            {unreadCount > 0 && (
                                <button
                                    type="button"
                                    onClick={markAllAsRead}
                                    className="text-[11px] font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
                                >
                                    Mark all read
                                </button>
                            )}

                            {notificationList.length > 0 && (
                                <button
                                    type="button"
                                    onClick={deleteAllNotifications}
                                    className="text-[11px] font-medium text-rose-400 hover:text-rose-300 transition-colors"
                                    title="Delete all notifications"
                                >
                                    Delete all
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex border-b border-slate-800 px-3 bg-slate-950/40 text-xs font-medium">
                        <button
                            type="button"
                            onClick={() => setActiveTab('all')}
                            className={`py-2 px-3 border-b-2 transition-colors ${
                                activeTab === 'all'
                                    ? 'border-indigo-500 text-white font-semibold'
                                    : 'border-transparent text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            All ({notificationList.length})
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('unread')}
                            className={`py-2 px-3 border-b-2 transition-colors ${
                                activeTab === 'unread'
                                    ? 'border-indigo-500 text-white font-semibold'
                                    : 'border-transparent text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            Unread ({unreadCount})
                        </button>
                    </div>

                    {/* Bulk Selection Bar (Select All & Delete Selected) */}
                    {filteredNotifications.length > 0 && (
                        <div className="px-3.5 py-2 border-b border-slate-800/80 bg-slate-950/60 flex items-center justify-between text-xs text-slate-300">
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={isAllSelected}
                                    onChange={toggleSelectAll}
                                    className="rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-0 focus:ring-offset-0 w-3.5 h-3.5 cursor-pointer"
                                />
                                <span className="text-[11px] font-medium text-slate-400 hover:text-slate-200">
                                    Select all
                                </span>
                            </label>

                            {selectedIds.length > 0 && (
                                <button
                                    type="button"
                                    onClick={deleteSelectedNotifications}
                                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-400 hover:text-rose-300 transition-colors"
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                    Delete selected ({selectedIds.length})
                                </button>
                            )}
                        </div>
                    )}

                    {/* Notification Items List */}
                    <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-800/60 [scrollbar-width:thin]">
                        {filteredNotifications.length > 0 ? (
                            filteredNotifications.map((n) => {
                                const isUnread = !n.read_at;
                                const isSelected = selectedIds.includes(n.id);

                                // Filter out "Open Dashboard" actions
                                const validActions = (n.actions || []).filter(
                                    (a) =>
                                        a.url &&
                                        a.url !== '/dashboard' &&
                                        (a.label || '').toLowerCase() !== 'open dashboard'
                                );

                                return (
                                    <div
                                        key={n.id}
                                        onClick={() => isUnread && markAsRead(n.id)}
                                        className={`group p-3 sm:p-3.5 transition-colors flex items-start gap-2.5 hover:bg-slate-800/40 cursor-pointer ${
                                            isUnread ? 'bg-indigo-950/15' : 'bg-transparent'
                                        }`}
                                    >
                                        {/* Individual Checkbox */}
                                        <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={(e) => toggleSelect(n.id, e)}
                                            onClick={(e) => e.stopPropagation()}
                                            className="mt-1 rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-0 focus:ring-offset-0 w-3.5 h-3.5 cursor-pointer shrink-0"
                                        />

                                        {renderIcon(n)}

                                        <div className="min-w-0 flex-1 space-y-1">
                                            <div className="flex items-start justify-between gap-1.5">
                                                <div className="flex items-center gap-1.5 min-w-0">
                                                    <h4 className="text-xs font-semibold text-white leading-snug break-words">
                                                        {n.title}
                                                    </h4>
                                                    {isUnread && (
                                                        <span
                                                            className="h-1.5 w-1.5 rounded-full bg-indigo-500 shrink-0 shadow-sm shadow-indigo-500/50"
                                                            title="Unread"
                                                        />
                                                    )}
                                                </div>

                                                {/* X mark to delete notification */}
                                                <button
                                                    type="button"
                                                    onClick={(e) => deleteNotification(n.id, e)}
                                                    className="p-1 -mr-1 -mt-1 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors shrink-0"
                                                    title="Delete notification"
                                                    aria-label="Delete notification"
                                                >
                                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            </div>

                                            <p className="text-xs text-slate-400 leading-relaxed break-words whitespace-pre-line">
                                                {n.body}
                                            </p>

                                            <div className="flex items-center justify-between pt-1 gap-2">
                                                <span className="text-[10px] text-slate-500">{n.created_at}</span>

                                                {/* Action link if available (excluding Open Dashboard) */}
                                                {validActions.length > 0 && validActions[0].url && (
                                                    <Link
                                                        href={validActions[0].url}
                                                        onClick={() => {
                                                            if (isUnread) markAsRead(n.id);
                                                            setIsOpen(false);
                                                        }}
                                                        className="text-[10px] font-semibold text-indigo-400 hover:text-indigo-300 underline"
                                                    >
                                                        {validActions[0].label || 'View'}
                                                    </Link>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="py-12 px-4 text-center space-y-2">
                                <div className="inline-flex p-3 rounded-full bg-slate-800/60 text-slate-500">
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                    </svg>
                                </div>
                                <p className="text-xs font-medium text-slate-300">No notifications</p>
                                <p className="text-[11px] text-slate-500">
                                    {activeTab === 'unread' ? 'All caught up! No unread notifications.' : 'You have no notifications yet.'}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
