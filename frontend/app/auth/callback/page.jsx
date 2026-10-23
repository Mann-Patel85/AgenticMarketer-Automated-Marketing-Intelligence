'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Bot, Loader2, AlertCircle } from 'lucide-react';
import API from '../../../utils/api';
import { useAuth } from '../../../context/AuthContext';

function CallbackContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { setAuthSession } = useAuth();
    const [statusText, setStatusText] = useState('Verifying Google Clearance...');
    const [errorMessage, setErrorMessage] = useState(null);

    useEffect(() => {
        const token = searchParams.get('token');
        const error = searchParams.get('error');

        let activeToken = token;
        if (!activeToken && typeof document !== 'undefined') {
            const match = document.cookie.match(/(?:^|;\s*)token=([^;]+)/);
            if (match) activeToken = match[1];
        }

        if (error) {
            const displayErr = error === 'seat_limit_reached' ? 'Workspace full: Maximum 10 operator seats reached.' : error;
            setErrorMessage(displayErr);
            setTimeout(() => {
                router.replace(`/login?error=${encodeURIComponent(error)}`);
            }, 1200);
            return;
        }

        if (!activeToken) {
            setErrorMessage('No authentication token received.');
            setTimeout(() => {
                router.replace('/login?error=Authentication+token+missing');
            }, 1500);
            return;
        }

        const handleAuthSuccess = async () => {
            try {
                setStatusText('Synchronizing Workspace Identity...');

                // 1. Fetch authenticated user profile using activeToken
                let profile = null;
                try {
                    const res = await API.get('/auth/me', {
                        headers: { Authorization: `Bearer ${activeToken}` },
                    });
                    profile = res.data;
                } catch (fetchErr) {
                    console.warn('Profile fetch fallback:', fetchErr);
                }

                if (!profile) {
                    profile = {
                        name: 'Workspace Operator',
                        email: 'operator@agenticmarketer.com',
                        role: 'user',
                    };
                }

                // 2. Hydrate AuthContext state, localStorage, and cookie
                if (setAuthSession) {
                    setAuthSession(activeToken, profile);
                } else {
                    localStorage.setItem('token', activeToken);
                    localStorage.setItem('agentic_user', JSON.stringify(profile));
                    if (typeof document !== 'undefined') {
                        document.cookie = `token=${activeToken}; path=/; max-age=604800; SameSite=Lax`;
                    }
                }

                setStatusText('Access Granted. Launching Swarm Dashboard...');

                // 3. Navigate cleanly to dashboard
                setTimeout(() => {
                    window.location.replace('/dashboard');
                }, 200);
            } catch (err) {
                console.warn('OAuth callback hydration error:', err);
                window.location.replace('/dashboard');
            }
        };

        handleAuthSuccess();
    }, [searchParams, router, setAuthSession]);

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
            <div className="w-full max-w-sm bg-slate-900/90 border border-indigo-500/20 rounded-3xl p-8 text-center shadow-2xl backdrop-blur-xl">
                <div className="inline-flex p-3.5 bg-gradient-to-tr from-indigo-600 to-violet-600 rounded-2xl shadow-lg shadow-indigo-600/30 mb-4">
                    <Bot className="w-8 h-8 text-white" />
                </div>

                {errorMessage ? (
                    <div className="space-y-3">
                        <div className="inline-flex items-center justify-center p-2 rounded-full bg-rose-500/10 text-rose-400">
                            <AlertCircle className="w-6 h-6" />
                        </div>
                        <h2 className="text-base font-bold text-white">OAuth Error</h2>
                        <p className="text-xs text-rose-300">{errorMessage}</p>
                        <p className="text-[11px] text-slate-500">Redirecting to sign in...</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <div className="flex items-center justify-center">
                            <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
                        </div>
                        <h2 className="text-base font-bold text-white tracking-tight">Authenticating Swarm Session</h2>
                        <p className="text-xs text-slate-400 font-mono">{statusText}</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function AuthCallbackPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                </div>
            }
        >
            <CallbackContent />
        </Suspense>
    );
}
