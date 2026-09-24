'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

export default function ProtectedRoute({ children, allowedRoles }) {
    const { user, isLoadingAuth } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoadingAuth) {
            if (!user) {
                router.replace('/login');
            } else if (allowedRoles && !allowedRoles.includes(user.role)) {
                router.replace('/dashboard');
            }
        }
    }, [user, isLoadingAuth, allowedRoles, router]);

    if (isLoadingAuth) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl shadow-xl shadow-indigo-500/10">
                        <Loader2 className="w-7 h-7 text-indigo-400 animate-spin" />
                    </div>
                    <p className="text-xs text-slate-400 font-mono tracking-wider animate-pulse">
                        Authenticating Swarm Session...
                    </p>
                </div>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        return null;
    }

    return children;
}
