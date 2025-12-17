/**
 * StepCard Component
 * Displays a single treatment step with image or fallback text
 * Stateless component driven entirely by backend data
 */

import React from 'react';
import type { StepImage, FallbackText } from '../types/api';
import './StepCard.css';

interface StepCardProps {
    step: StepImage;
}

// Fallback panel when image generation fails
function FallbackPanel({ data }: { data: FallbackText }) {
    return (
        <div className="step-fallback">
            <div className="fallback-header">
                <span className="fallback-icon">📋</span>
                <span className="fallback-label">Visual temporarily unavailable</span>
            </div>
            <div className="fallback-panels">
                <div className="fallback-panel">
                    <div className="panel-label">Action</div>
                    <div className="panel-content">{data.action}</div>
                </div>
                <div className="fallback-panel">
                    <div className="panel-label">Method</div>
                    <div className="panel-content">{data.method}</div>
                </div>
                <div className="fallback-panel warning">
                    <div className="panel-label">⚠️ Caution</div>
                    <div className="panel-content">{data.caution}</div>
                </div>
                <div className="fallback-panel success">
                    <div className="panel-label">✓ Expected Result</div>
                    <div className="panel-content">{data.result}</div>
                </div>
            </div>
        </div>
    );
}

// Image display with lazy loading
function StepImageDisplay({ step }: { step: StepImage }) {
    const [loaded, setLoaded] = React.useState(false);
    const [error, setError] = React.useState(false);

    const imageUrl = step.image_url || (step.image ? `data:image/png;base64,${step.image}` : null);

    if (!imageUrl || error) {
        // If no image URL or loading failed, show fallback
        if (step.fallback_text) {
            return <FallbackPanel data={step.fallback_text} />;
        }
        return (
            <div className="step-no-image">
                <span className="no-image-icon">🖼️</span>
                <span>Image not available</span>
            </div>
        );
    }

    return (
        <div className="step-image-container">
            {!loaded && (
                <div className="image-placeholder">
                    <div className="image-loader"></div>
                    <span>Loading visual guide...</span>
                </div>
            )}
            <img
                src={imageUrl}
                alt={`Step ${step.step_number}: ${step.title}`}
                className={`step-image ${loaded ? 'loaded' : 'loading'}`}
                loading="lazy"
                onLoad={() => setLoaded(true)}
                onError={() => setError(true)}
            />
        </div>
    );
}

export function StepCard({ step }: StepCardProps) {
    // Tier 1 fallback: Backend returned image_failed = true
    if (step.image_failed && step.fallback_text) {
        return (
            <div className="step-card degraded">
                <div className="step-header">
                    <span className="step-number">Step {step.step_number}</span>
                    <h3 className="step-title">{step.title}</h3>
                </div>
                <div className="step-content">
                    <p className="step-description">{step.description}</p>
                    <FallbackPanel data={step.fallback_text} />
                </div>
            </div>
        );
    }

    // Normal case: Display step with image
    return (
        <div className="step-card">
            <div className="step-header">
                <span className="step-number">Step {step.step_number}</span>
                <h3 className="step-title">{step.title}</h3>
            </div>
            <div className="step-content">
                <p className="step-description">{step.description}</p>
                <StepImageDisplay step={step} />
            </div>
        </div>
    );
}
