import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Authenticator, useAuthenticator } from '@aws-amplify/ui-react';
import { Layout } from './components/Layout';
import { ChatInterface } from './components/ChatInterface';
import { Profile } from './pages/Profile';
import { History } from './pages/History';
import { UploadReport } from './pages/UploadReport';

export function AppRouter() {
    return (
        <Authenticator.Provider>
            <BrowserRouter>
                <Routes>
                    {/* Public Routes (wrapped in Layout for consistent UI) */}
                    <Route path="/" element={<Layout />}>
                        <Route index element={<Navigate to="/chat" replace />} />
                        <Route path="chat" element={<ChatInterface />} />
                        <Route path="chat/:chatId" element={<ChatInterface />} />

                        {/* Protected Routes */}
                        <Route path="profile" element={
                            <RequireAuth>
                                <Profile />
                            </RequireAuth>
                        } />
                        <Route path="history" element={
                            <RequireAuth>
                                <History />
                            </RequireAuth>
                        } />
                        <Route path="upload" element={
                            <RequireAuth>
                                <UploadReport />
                            </RequireAuth>
                        } />
                    </Route>
                    <Route path="/login" element={<LoginPage />} />
                </Routes>
            </BrowserRouter>
        </Authenticator.Provider>
    );
}

function RequireAuth({ children }: { children: React.ReactNode }) {
    return (
        <Authenticator>
            {({ user }) => (
                user ? <>{children}</> : <LoginPage />
            )}
        </Authenticator>
    );
}

function LoginPage() {
    const { authStatus } = useAuthenticator((context) => [context.authStatus]);
    const navigate = useNavigate();

    useEffect(() => {
        if (authStatus === 'authenticated') {
            navigate('/chat', { replace: true });
        }
    }, [authStatus, navigate]);

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
            <Authenticator />
        </div>
    );
}
