import React, { useEffect, useState, useCallback, useRef } from 'react';
import { usePage } from '@inertiajs/react';
import type { PageProps } from '@/types';

export interface ToastMessage {
    id: string;
    type: 'success' | 'error' | 'info';
    title: string;
    message: string;
}

export function showToast(messageOrPayload: string | { type?: 'success' | 'error' | 'info'; title?: string; message: string }) {
    if (typeof window === 'undefined') return;

    const payload = typeof messageOrPayload === 'string'
        ? { type: 'success' as const, title: 'Success', message: messageOrPayload }
        : {
            type: messageOrPayload.type || ('success' as const),
            title: messageOrPayload.title || (messageOrPayload.type === 'error' ? 'Error' : messageOrPayload.type === 'info' ? 'Information' : 'Success'),
            message: messageOrPayload.message,
        };

    window.dispatchEvent(new CustomEvent('portal-toast', { detail: payload }));
}

export default function ToastContainer() {
    const { flash } = usePage<PageProps>().props;
    const [toasts, setToasts] = useState<ToastMessage[]>([]);
    const lastMessageRef = useRef<{ message: string; timestamp: number } | null>(null);
    const lastFlashTimestampRef = useRef<number | string | null>(null);

    const addToast = useCallback((toast: Omit<ToastMessage, 'id'>) => {
        const now = Date.now();
        // Prevent duplicate identical toasts within 800ms (e.g. rapid double submit or React StrictMode)
        if (
            lastMessageRef.current &&
            lastMessageRef.current.message === toast.message &&
            now - lastMessageRef.current.timestamp < 800
        ) {
            return;
        }

        lastMessageRef.current = { message: toast.message, timestamp: now };
        const id = `${now}-${Math.random().toString(36).substring(2, 9)}`;

        setToasts((prev) => [...prev, { ...toast, id }]);

        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 4500);
    }, []);

    const removeToast = (id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    // Listen to Inertia flash props changes
    useEffect(() => {
        if (!flash) return;

        if (flash.timestamp !== undefined && flash.timestamp !== null) {
            if (lastFlashTimestampRef.current === flash.timestamp) {
                return;
            }
            lastFlashTimestampRef.current = flash.timestamp;
        }

        if (flash.success) {
            addToast({
                type: 'success',
                title: 'Success',
                message: flash.success,
            });
        }
        if (flash.error) {
            addToast({
                type: 'error',
                title: 'Error',
                message: flash.error,
            });
        }
        if (flash.info) {
            addToast({
                type: 'info',
                title: 'Information',
                message: flash.info,
            });
        }
    }, [flash, addToast]);

    // Listen to custom dispatch events
    useEffect(() => {
        const handleCustomToast = (event: Event) => {
            const customEvent = event as CustomEvent<{ type: 'success' | 'error' | 'info'; title: string; message: string }>;
            if (customEvent.detail && customEvent.detail.message) {
                addToast(customEvent.detail);
            }
        };

        window.addEventListener('portal-toast', handleCustomToast);
        return () => window.removeEventListener('portal-toast', handleCustomToast);
    }, [addToast]);

    if (toasts.length === 0) return null;

    return (
        <div
            aria-live="assertive"
            className="fixed top-4 right-4 z-[9999] flex flex-col gap-2.5 max-w-sm sm:max-w-md w-full pointer-events-none px-3 sm:px-0"
        >
            {toasts.map((toast) => {
                const isSuccess = toast.type === 'success';
                const isError = toast.type === 'error';
                const isInfo = toast.type === 'info';

                return (
                    <div
                        key={toast.id}
                        className={`pointer-events-auto relative rounded-2xl bg-slate-900/95 backdrop-blur-md border shadow-2xl p-4 flex items-start gap-3.5 transition-all duration-300 animate-in slide-in-from-top-4 fade-in ${
                            isSuccess
                                ? 'border-emerald-500/30 shadow-emerald-500/10'
                                : isError
                                ? 'border-rose-500/30 shadow-rose-500/10'
                                : 'border-indigo-500/30 shadow-indigo-500/10'
                        }`}
                    >
                        {/* Icon */}
                        <div
                            className={`p-2 rounded-xl shrink-0 ${
                                isSuccess
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                    : isError
                                    ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                    : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                            }`}
                        >
                            {isSuccess && (
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            )}
                            {isError && (
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            )}
                            {isInfo && (
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0 pt-0.5">
                            <h4 className="text-xs font-bold text-white tracking-tight">
                                {toast.title}
                            </h4>
                            <p className="mt-0.5 text-xs text-slate-300 leading-relaxed break-words">
                                {toast.message}
                            </p>
                        </div>

                        {/* Dismiss */}
                        <button
                            type="button"
                            onClick={() => removeToast(toast.id)}
                            className="rounded-lg p-1 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
                            title="Dismiss"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                );
            })}
        </div>
    );
}
