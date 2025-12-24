/**
 * Toast Notification Components
 * Provider and display components for toast notifications.
 */

import React, { useState, useCallback } from 'react';
import { ToastContext, type Toast, type ToastType, type ToastContextValue } from './ToastContext';
import './Toast.css';

/**
 * Toast Provider - Wrap your app with this
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const addToast = useCallback((type: ToastType, message: string, duration = 5000) => {
        const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        setToasts(prev => [...prev, { id, type, message, duration }]);

        if (duration > 0) {
            setTimeout(() => removeToast(id), duration);
        }
    }, [removeToast]);

    const success = useCallback((message: string, duration?: number) =>
        addToast('success', message, duration), [addToast]);
    const error = useCallback((message: string, duration?: number) =>
        addToast('error', message, duration ?? 8000), [addToast]);
    const warning = useCallback((message: string, duration?: number) =>
        addToast('warning', message, duration), [addToast]);
    const info = useCallback((message: string, duration?: number) =>
        addToast('info', message, duration), [addToast]);

    const value: ToastContextValue = { toasts, addToast, removeToast, success, error, warning, info };

    return (
        <ToastContext.Provider value={value}>
            {children}
            <ToastContainer toasts={toasts} onDismiss={removeToast} />
        </ToastContext.Provider>
    );
}

/**
 * Toast Container - Renders all active toasts
 */
function ToastContainer({
    toasts,
    onDismiss
}: {
    toasts: Toast[];
    onDismiss: (id: string) => void;
}) {
    if (toasts.length === 0) return null;

    return (
        <div
            className="toast-container"
            role="region"
            aria-label="Notifications"
            aria-live="polite"
        >
            {toasts.map(toast => (
                <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
            ))}
        </div>
    );
}

/**
 * Individual Toast Item
 */
function ToastItem({
    toast,
    onDismiss
}: {
    toast: Toast;
    onDismiss: (id: string) => void;
}) {
    const [isExiting, setIsExiting] = useState(false);

    const handleDismiss = () => {
        setIsExiting(true);
        setTimeout(() => onDismiss(toast.id), 200);
    };

    const icons: Record<ToastType, string> = {
        success: '✓',
        error: '✕',
        warning: '⚠',
        info: 'ℹ',
    };

    return (
        <div
            className={`toast toast--${toast.type} ${isExiting ? 'toast--exiting' : ''}`}
            role="alert"
            aria-live={toast.type === 'error' ? 'assertive' : 'polite'}
        >
            <span className="toast__icon" aria-hidden="true">{icons[toast.type]}</span>
            <span className="toast__message">{toast.message}</span>
            <button
                className="toast__dismiss"
                onClick={handleDismiss}
                aria-label="Dismiss notification"
            >
                ×
            </button>
        </div>
    );
}

export default ToastProvider;
