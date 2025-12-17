
import { useState, useEffect } from 'react';
import { fetchAuthSession } from 'aws-amplify/auth';
import { useNavigate } from 'react-router-dom';
import { getChatHistory, type ChatHistoryItem } from '../api/client';
import { Calendar, ChevronRight } from 'lucide-react';

export function History() {
    const [history, setHistory] = useState<ChatHistoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [authToken, setAuthToken] = useState<string | undefined>(undefined);
    const navigate = useNavigate();

    useEffect(() => {
        fetchAuthSession().then(session => {
            const token = session.tokens?.idToken?.toString();
            setAuthToken(token);
        });
    }, []);

    useEffect(() => {
        if (!authToken) return;
        loadHistory();
    }, [authToken]);

    const loadHistory = async () => {
        try {
            setLoading(true);
            const data = await getChatHistory(authToken!);
            setHistory(data.items);
        } catch (err) {
            setError('Failed to load history');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div style={{ padding: '2rem' }}>Loading history...</div>;

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
            <h1 style={{ marginBottom: '2rem' }}>Chat History</h1>

            {error && <div style={{ background: '#fee2e2', color: '#dc2626', padding: '1rem', marginBottom: '1rem', borderRadius: '4px' }}>{error}</div>}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {history.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem', background: 'white', borderRadius: '8px', color: '#6b7280' }}>
                        No chat history found. Start a new conversation!
                    </div>
                ) : (
                    history.map((item) => (
                        <div
                            key={item.chat_id}
                            onClick={() => navigate(`/chat/${item.chat_id}`)}
                            style={{
                                background: 'white',
                                padding: '1.5rem',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                border: '1px solid #e5e7eb',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                transition: 'all 0.2s'
                            }}
                            className="history-item"
                        >
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                    <span style={{
                                        background: '#bfdbfe',
                                        color: '#1e40af',
                                        padding: '0.25rem 0.75rem',
                                        borderRadius: '9999px',
                                        fontSize: '0.75rem',
                                        fontWeight: 600,
                                        textTransform: 'uppercase'
                                    }}>
                                        {item.topic || 'General'}
                                    </span>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#6b7280', fontSize: '0.875rem' }}>
                                        <Calendar size={14} />
                                        {new Date(item.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                                <h3 style={{ margin: 0, fontSize: '1.125rem', color: '#111827' }}>{item.query}</h3>
                            </div>
                            <ChevronRight style={{ color: '#9ca3af' }} />
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
