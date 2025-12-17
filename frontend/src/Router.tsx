import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Authenticator } from '@aws-amplify/ui-react';
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
                    <Route path="/" element={
                        <RequireAuth>
                            <Layout />
                        </RequireAuth>
                    }>
                        <Route index element={<Navigate to="/chat" replace />} />
                        <Route path="chat" element={<ChatInterface />} />
                        <Route path="chat/:chatId" element={<ChatInterface />} />
                        <Route path="profile" element={<Profile />} />
                        <Route path="history" element={<History />} />
                        <Route path="upload" element={<UploadReport />} />
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
    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
            <Authenticator />
        </div>
    );
}
