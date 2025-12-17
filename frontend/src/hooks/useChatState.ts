/**
 * Chat State Machine Hook
 * Manages UI state throughout the request lifecycle
 */

import { useReducer, useCallback } from 'react';
import type { ChatResponse, StepImage } from '../types/api';

// State machine states
export type ChatState =
    | 'IDLE'           // Ready for input
    | 'SUBMITTING'     // User pressed send
    | 'WAITING'        // Request in flight (cold start / LLM reasoning)
    | 'PROCESSING'     // Response received, processing images
    | 'READY'          // All complete, everything successful
    | 'DEGRADED'       // Response received but some images failed
    | 'ERROR';         // Request failed

export interface ChatStateData {
    state: ChatState;
    response: ChatResponse | null;
    error: string | null;
    startTime: number | null;
    elapsedTime: number;
}

type ChatAction =
    | { type: 'SUBMIT' }
    | { type: 'WAITING' }
    | { type: 'SUCCESS'; payload: ChatResponse }
    | { type: 'ERROR'; payload: string }
    | { type: 'RESET' }
    | { type: 'TICK' };

const initialState: ChatStateData = {
    state: 'IDLE',
    response: null,
    error: null,
    startTime: null,
    elapsedTime: 0,
};

function determineResultState(response: ChatResponse): ChatState {
    // Check if any images failed
    const stepImages = response.step_images || [];
    const hasFailedImages = stepImages.some((img: StepImage) => img.image_failed);

    if (hasFailedImages) {
        return 'DEGRADED';
    }
    return 'READY';
}

function chatReducer(state: ChatStateData, action: ChatAction): ChatStateData {
    switch (action.type) {
        case 'SUBMIT':
            return {
                ...state,
                state: 'SUBMITTING',
                error: null,
                startTime: Date.now(),
                elapsedTime: 0,
            };

        case 'WAITING':
            return {
                ...state,
                state: 'WAITING',
            };

        case 'SUCCESS':
            return {
                ...state,
                state: determineResultState(action.payload),
                response: action.payload,
                error: null,
            };

        case 'ERROR':
            return {
                ...state,
                state: 'ERROR',
                error: action.payload,
            };

        case 'RESET':
            return initialState;

        case 'TICK':
            if (state.startTime === null) {
                return state;
            }
            return {
                ...state,
                elapsedTime: Math.floor((Date.now() - state.startTime) / 1000),
            };

        default:
            return state;
    }
}

export function useChatState() {
    const [state, dispatch] = useReducer(chatReducer, initialState);

    const submit = useCallback(() => {
        dispatch({ type: 'SUBMIT' });
    }, []);

    const setWaiting = useCallback(() => {
        dispatch({ type: 'WAITING' });
    }, []);

    const setSuccess = useCallback((response: ChatResponse) => {
        dispatch({ type: 'SUCCESS', payload: response });
    }, []);

    const setError = useCallback((error: string) => {
        dispatch({ type: 'ERROR', payload: error });
    }, []);

    const reset = useCallback(() => {
        dispatch({ type: 'RESET' });
    }, []);

    const tick = useCallback(() => {
        dispatch({ type: 'TICK' });
    }, []);

    return {
        ...state,
        submit,
        setWaiting,
        setSuccess,
        setError,
        reset,
        tick,
    };
}
