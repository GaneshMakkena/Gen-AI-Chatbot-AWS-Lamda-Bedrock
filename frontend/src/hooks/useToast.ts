/**
 * Toast Hook
 * Hook to use toast notifications from Toast context.
 */

import { useContext } from 'react';
import { ToastContext, type ToastContextValue } from '../components/ToastContext';

/**
 * Hook to use toast notifications
 */
export function useToast(): ToastContextValue {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}
