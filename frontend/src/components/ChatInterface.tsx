/**
 * ChatInterface Component
 * Main chat UI with state machine, progressive loading, and proper timeout handling
 */

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { fetchAuthSession } from 'aws-amplify/auth';
import { Send, Loader2, Plus } from 'lucide-react';
import { useChatState } from '../hooks/useChatState';
import { sendChatMessage, getPresignedUrl, uploadFileToS3, getChat, ApiError } from '../api/client';
import { StepCard } from './StepCard';
import type { ChatResponse, ConversationMessage } from '../types/api';
import './ChatInterface.css';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    response?: ChatResponse;
    timestamp: Date;
    steps?: any[];
}

// Loading state messages that change over time
const LOADING_MESSAGES = [
    { time: 0, message: 'Connecting to AI...' },
    { time: 3, message: 'AI is researching your question...' },
    { time: 10, message: 'Generating detailed response...' },
    { time: 30, message: 'Creating visual guides for each step...' },
    { time: 60, message: 'Almost there... Complex queries take longer.' },
    { time: 120, message: 'Still working... Thank you for your patience.' },
    { time: 180, message: 'Finalizing response... Large image sets take time.' },
];

function getLoadingMessage(elapsedSeconds: number): string {
    let message = LOADING_MESSAGES[0].message;
    for (const item of LOADING_MESSAGES) {
        if (elapsedSeconds >= item.time) {
            message = item.message;
        }
    }
    return message;
}

// Status indicator component
function StatusIndicator({ state, elapsed }: { state: string; elapsed: number }) {
    const getMessage = () => {
        switch (state) {
            case 'SUBMITTING':
                return 'Sending...';
            case 'WAITING':
                return getLoadingMessage(elapsed);
            case 'DEGRADED':
                return 'Response received (some visuals unavailable)';
            case 'ERROR':
                return 'An error occurred';
            default:
                return '';
        }
    };

    if (state === 'IDLE' || state === 'READY') {
        return null;
    }

    return (
        <div className={`status-indicator status-${state.toLowerCase()}`}>
            {(state === 'SUBMITTING' || state === 'WAITING') && (
                <div className="status-spinner"></div>
            )}
            <span className="status-message">{getMessage()}</span>
            {state === 'WAITING' && elapsed > 0 && (
                <span className="status-time">{elapsed}s</span>
            )}
        </div>
    );
}

// Response display component - renders only after JSON integrity verified
function ResponseDisplay({ response }: { response: ChatResponse }) {
    const stepImages = response.step_images || [];
    const hasDegradedImages = stepImages.some(img => img.image_failed);

    return (
        <div className="response-display">
            {hasDegradedImages && (
                <div className="degraded-notice">
                    <span className="notice-icon">⚠️</span>
                    <span>Some visual guides couldn't be generated. Text instructions are provided instead.</span>
                </div>
            )}

            <div className="response-text">
                <div dangerouslySetInnerHTML={{ __html: formatMarkdown(response.answer) }} />
            </div>

            {stepImages.length > 0 && (
                <div className="steps-section">
                    <h2 className="steps-heading">
                        Step-by-Step Visual Guide
                        <span className="steps-count">{response.steps_count} steps</span>
                    </h2>
                    <div className="steps-list">
                        {stepImages.map((step, index) => (
                            <StepCard key={`${step.step_number}-${index}`} step={step} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// Simple markdown formatting (bold, headers, lists)
function formatMarkdown(text: string): string {
    return text
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/^### (.+)$/gm, '<h4>$1</h4>')
        .replace(/^## (.+)$/gm, '<h3>$1</h3>')
        .replace(/^# (.+)$/gm, '<h2>$1</h2>')
        .replace(/^- (.+)$/gm, '<li>$1</li>')
        .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
        .replace(/\n\n/g, '</p><p>')
        .replace(/^/, '<p>')
        .replace(/$/, '</p>')
        .replace(/<p><\/p>/g, '');
}

export function ChatInterface() {
    // chatId will be used later for history logic
    const { chatId } = useParams();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [generateImages, setGenerateImages] = useState(true);
    const [uploading, setUploading] = useState(false); // New state
    const fileInputRef = useRef<HTMLInputElement>(null); // New ref
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    // Auth
    const [authToken, setAuthToken] = useState<string | undefined>(undefined);

    useEffect(() => {
        fetchAuthSession().then(session => {
            const token = session.tokens?.idToken?.toString();
            setAuthToken(token);
        }).catch(err => console.error("Auth error", err));
    }, []);

    const chatState = useChatState(); // Declare chatState here!

    // Load existing chat if ID provided
    useEffect(() => {
        if (chatId && authToken) {
            const loadChat = async () => {
                try {
                    // Reset to clean state first, but keep loading indicator if desired
                    setMessages([]);
                    chatState.setWaiting();

                    const data = await getChat(authToken, chatId);

                    if (data) {
                        const loadedMessages: Message[] = [];

                        // User Message
                        loadedMessages.push({
                            id: `user-${data.timestamp}`,
                            role: 'user',
                            content: data.query,
                            timestamp: new Date(data.timestamp * 1000)
                        });

                        // Assistant Message
                        // We construct a partial ChatResponse to satisfy the type
                        const simulatedResponse: ChatResponse = {
                            answer: data.response,
                            original_query: data.query,
                            detected_language: data.language,
                            topic: data.topic,
                            steps_count: data.step_images?.length || 0,
                            images: data.images,
                            step_images: data.step_images || [] // Use the loaded steps!
                        };

                        loadedMessages.push({
                            id: `ai-${data.timestamp}`,
                            role: 'assistant',
                            content: data.response,
                            timestamp: new Date(data.timestamp * 1000),
                            response: simulatedResponse
                        });

                        setMessages(loadedMessages);
                        chatState.setSuccess(simulatedResponse); // Set state to READY
                    }
                } catch (error) {
                    console.error("Failed to load chat:", error);
                    chatState.setError("Failed to load conversation history.");
                }
            };

            loadChat();
        } else {
            // New Chat Mode - Reset everything
            setMessages([]);
            chatState.reset();
        }
    }, [chatId, authToken]); // Keep dependency on chatId to trigger on route change

    // Elapsed time ticker
    useEffect(() => {
        let interval: number | undefined;
        if (chatState.state === 'WAITING' || chatState.state === 'SUBMITTING') {
            interval = window.setInterval(() => {
                chatState.tick();
            }, 1000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [chatState.state, chatState.tick]);

    // Auto-focus input on mount
    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !e.target.files.length || !authToken) return;

        const file = e.target.files[0];

        // 5MB Limit check (adjust as needed, user asked for 50MB) 
        // 50MB is huge for browser upload without chunking/progress, but let's allow it as per requirements.
        if (file.size > 50 * 1024 * 1024) {
            alert("File is too large. Max limit is 50MB.");
            return;
        }

        try {
            setUploading(true);


            // 1. Get Presigned URL
            const { upload_url, s3_key } = await getPresignedUrl(authToken, file.name, file.type);

            // 2. Upload to S3
            await uploadFileToS3(upload_url, file);

            // 3. Send message with attachment reference
            const userMessage: Message = {
                id: Date.now().toString(),
                role: 'user',
                content: `Attached file: ${file.name}`,
                timestamp: new Date()
            };

            setMessages(prev => [...prev, userMessage]);

            // Trigger chat state manually since we are bypassing standard submit
            chatState.submit();
            chatState.setWaiting();

            // Determine type
            const type = file.type === 'application/pdf' ? 'pdf' : 'image';

            const data = await sendChatMessage({
                query: `Please analyze this ${type} file: ${file.name}`,
                conversation_history: messages.map(m => ({ role: m.role, content: m.content })),
                attachments: [{
                    filename: file.name,
                    content_type: file.type,
                    s3_key: s3_key,
                    type: type
                }]
            }, authToken);

            const aiMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: data.answer,
                timestamp: new Date(),
                response: data // Use response field not 'steps'
            };

            setMessages(prev => [...prev, aiMessage]);
            chatState.setSuccess(data);
        } catch (err) {
            console.error(err);
            const errorMessage = "I'm sorry, I failed to upload or analyze that file. Please try again.";
            const errorMsgObj: Message = {
                id: Date.now().toString(),
                role: 'assistant',
                content: errorMessage,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMsgObj]);
            chatState.setError(errorMessage);
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const query = input.trim();
        // Allow submission from IDLE, READY, or DEGRADED states
        const canSubmit = ['IDLE', 'READY', 'DEGRADED'].includes(chatState.state);
        if (!query || !canSubmit) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: query,
            timestamp: new Date(),
        };
        setMessages(prev => [...prev, userMessage]);
        setInput('');

        chatState.submit();
        chatState.setWaiting();

        try {
            const conversationHistory: ConversationMessage[] = messages.slice(-4).map(m => ({
                role: m.role,
                content: m.role === 'assistant' && m.response ? m.response.answer : m.content,
            }));

            const response = await sendChatMessage({
                query,
                generate_images: generateImages,
                conversation_history: conversationHistory,
            }, authToken); // Pass auth token

            const assistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: response.answer,
                response,
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, assistantMessage]);
            chatState.setSuccess(response);
        } catch (error) {
            let errorMessage = 'An unexpected error occurred. Please try again.';
            if (error instanceof ApiError) {
                errorMessage = error.message;
                if (error.code === 'TIMEOUT') {
                    errorMessage = 'The request took too long. Please try a simpler question.';
                }
            } else if (error instanceof Error) {
                if (error.name === 'AbortError') {
                    errorMessage = 'Request was cancelled or timed out.';
                }
            }
            chatState.setError(errorMessage);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    const handleReset = () => {
        chatState.reset();
    };

    const isLoading = chatState.state === 'SUBMITTING' || chatState.state === 'WAITING';

    return (
        <div className="chat-interface">
            <div className="chat-header">
                <h1 className="chat-title">
                    <span className="logo">🏥</span>
                    MediBot
                </h1>
                <p className="chat-subtitle">AI-Powered Medical Assistant with Visual Guides</p>
            </div>

            <div className="chat-messages">
                {messages.length === 0 && (
                    <div className="welcome-message">
                        <h2>Welcome to MediBot</h2>
                        <p>Ask me any medical question and I'll provide step-by-step guidance with visual illustrations.</p>
                        <div className="example-queries">
                            <p>Try asking:</p>
                            <ul>
                                <li onClick={() => setInput("How do I perform CPR?")}>"How do I perform CPR?"</li>
                                <li onClick={() => setInput("How to treat a minor burn?")}>"How to treat a minor burn?"</li>
                                <li onClick={() => setInput("What are the steps to bandage a wound?")}>"What are the steps to bandage a wound?"</li>
                            </ul>
                        </div>
                    </div>
                )}

                {messages.map(message => (
                    <div key={message.id} className={`message message-${message.role}`}>
                        <div className="message-header">
                            <span className="message-role">
                                {message.role === 'user' ? '👤 You' : '🤖 MediBot'}
                            </span>
                            <span className="message-time">
                                {message.timestamp.toLocaleTimeString()}
                            </span>
                        </div>
                        <div className="message-content">
                            {message.role === 'user' ? (
                                <p>{message.content}</p>
                            ) : message.response ? (
                                <ResponseDisplay response={message.response} />
                            ) : (
                                <p>{message.content}</p>
                            )}
                        </div>
                    </div>
                ))}

                <StatusIndicator state={chatState.state} elapsed={chatState.elapsedTime} />

                {chatState.state === 'ERROR' && (
                    <div className="error-display">
                        <div className="error-message">
                            <span className="error-icon">❌</span>
                            <span>{chatState.error}</span>
                        </div>
                        <button onClick={handleReset} className="retry-button">
                            Try Again
                        </button>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            <form className="chat-input-form" onSubmit={handleSubmit}>
                <div className="input-options">
                    <label className="image-toggle">
                        <input
                            type="checkbox"
                            checked={generateImages}
                            onChange={(e) => setGenerateImages(e.target.checked)}
                            disabled={isLoading}
                        />
                        <span>Generate visual guides</span>
                    </label>
                </div>
                <form onSubmit={handleSubmit} className="input-form">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        style={{ display: 'none' }}
                        accept=".pdf,image/*"
                    />
                    <button
                        type="button"
                        className="attach-button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isLoading || uploading}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 0.5rem', color: '#6b7280' }}
                    >
                        <Plus size={24} />
                    </button>

                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask a medical question..."
                        disabled={isLoading || uploading}
                        onKeyDown={handleKeyDown} // Added onKeyDown for Enter key submission
                    />
                    <button
                        type="submit"
                        disabled={isLoading || uploading || !input.trim()}
                        className={isLoading || uploading ? 'loading' : ''}
                    >
                        {isLoading || uploading ? <Loader2 className="spin" size={20} /> : <Send size={20} />}
                    </button>
                </form>
                <p className="disclaimer">
                    ⚠️ MediBot provides general health information only. Always consult a healthcare professional for medical advice.
                </p>
            </form>
        </div>
    );
}
