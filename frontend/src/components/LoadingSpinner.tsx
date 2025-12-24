/**
 * Loading Spinner Component
 * Accessible loading indicator with customizable size and message.
 */

import './LoadingSpinner.css';

interface LoadingSpinnerProps {
    size?: 'small' | 'medium' | 'large';
    message?: string;
    fullScreen?: boolean;
}

export function LoadingSpinner({
    size = 'medium',
    message = 'Loading...',
    fullScreen = false
}: LoadingSpinnerProps) {
    const spinner = (
        <div
            className={`loading-spinner loading-spinner--${size}`}
            role="status"
            aria-live="polite"
            aria-busy="true"
        >
            <div className="loading-spinner__circle" aria-hidden="true">
                <div className="loading-spinner__inner"></div>
            </div>
            {message && (
                <span className="loading-spinner__message">{message}</span>
            )}
            <span className="sr-only">Loading, please wait</span>
        </div>
    );

    if (fullScreen) {
        return (
            <div className="loading-spinner__overlay" aria-modal="true">
                {spinner}
            </div>
        );
    }

    return spinner;
}

/**
 * Skeleton Loader Component
 * Placeholder content while data is loading.
 */
interface SkeletonProps {
    width?: string | number;
    height?: string | number;
    borderRadius?: string;
    className?: string;
}

export function Skeleton({
    width = '100%',
    height = '1rem',
    borderRadius = '4px',
    className = ''
}: SkeletonProps) {
    return (
        <div
            className={`skeleton ${className}`}
            style={{
                width: typeof width === 'number' ? `${width}px` : width,
                height: typeof height === 'number' ? `${height}px` : height,
                borderRadius
            }}
            aria-hidden="true"
        />
    );
}

/**
 * Progress Bar Component
 * For operations with known progress.
 */
interface ProgressBarProps {
    value: number;
    max?: number;
    label?: string;
    showPercentage?: boolean;
}

export function ProgressBar({
    value,
    max = 100,
    label = 'Progress',
    showPercentage = true
}: ProgressBarProps) {
    const percentage = Math.min(100, Math.max(0, (value / max) * 100));

    return (
        <div className="progress-bar" role="progressbar"
            aria-valuenow={value}
            aria-valuemin={0}
            aria-valuemax={max}
            aria-label={label}
        >
            <div className="progress-bar__track">
                <div
                    className="progress-bar__fill"
                    style={{ width: `${percentage}%` }}
                />
            </div>
            {showPercentage && (
                <span className="progress-bar__text">{Math.round(percentage)}%</span>
            )}
        </div>
    );
}

export default LoadingSpinner;
