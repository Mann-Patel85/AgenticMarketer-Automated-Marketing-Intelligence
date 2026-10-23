'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    Bot,
    Lock,
    Mail,
    Eye,
    EyeOff,
    Sparkles,
    AlertCircle,
    Loader2,
    KeyRound,
    CheckCircle2,
    ShieldCheck,
    Zap,
    X,
    ExternalLink,
    Building2,
    ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';

export default function LoginPage() {
    const { user, login } = useAuth();
    const router = useRouter();

    // Form inputs & states
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(true);
    const [isLoading, setIsLoading] = useState(false);

    // Feedback & preset indicators
    const [error, setError] = useState(null);
    const [toast, setToast] = useState(null); // { type: 'success' | 'info' | 'error', message: '' }
    const [activePreset, setActivePreset] = useState(null); // 'mann' | 'sarah' | null

    // Modals
    const [showOAuthModal, setShowOAuthModal] = useState(false);
    const [oauthProvider, setOauthProvider] = useState('');
    const [showForgotModal, setShowForgotModal] = useState(false);
    const [forgotEmail, setForgotEmail] = useState('');
    const [forgotLoading, setForgotLoading] = useState(false);
    const [forgotSubmitted, setForgotSubmitted] = useState(false);

    // Hydrate remembered email if available
    useEffect(() => {
        try {
            const saved = localStorage.getItem('remembered_email');
            if (saved) setEmail(saved);
        } catch {
            // ignore client storage restrictions
        }
    }, []);

    // Redirect if already authenticated
    useEffect(() => {
        if (user) {
            router.replace('/dashboard');
        }
    }, [user, router]);

    // Auto-dismiss transient toasts
    useEffect(() => {
        if (!toast) return;
        const timer = setTimeout(() => {
            setToast(null);
        }, 4500);
        return () => clearTimeout(timer);
    }, [toast]);

    // ── 1. Preset Interactivity ─────────────────────────────────────
    const handleSelectPreset = (presetKey, presetEmail, presetPassword) => {
        setEmail(presetEmail);
        setPassword(presetPassword);
        setError(null);
        setActivePreset(presetKey);

        setToast({
            type: 'info',
            message: `Preset loaded for ${presetKey === 'mann' ? 'Mann Patel (Swarm Leader)' : 'Sarah Jenkins (Growth Marketer)'}.`,
        });

        // Clear active visual pulse after 2.5s
        setTimeout(() => {
            setActivePreset(null);
        }, 2500);
    };

    // ── 2. Form Submission & Dynamic Authentication ─────────────────
    const handleLogin = async (e) => {
        e.preventDefault();
        setError(null);

        const cleanEmail = email.trim();
        const cleanPassword = password.trim();

        if (!cleanEmail || !cleanPassword) {
            setError('Please provide both your Workspace Email and Password.');
            return;
        }

        try {
            setIsLoading(true);
            await login(cleanEmail, cleanPassword);

            // Persist remembered email preference
            try {
                if (rememberMe) {
                    localStorage.setItem('remembered_email', cleanEmail);
                } else {
                    localStorage.removeItem('remembered_email');
                }
            } catch {
                // ignore
            }

            setToast({
                type: 'success',
                message: 'Swarm Clearance Verified! Redirecting to Command Console...',
            });

            // Smooth route transition
            setTimeout(() => {
                router.push('/dashboard');
            }, 600);
        } catch (err) {
            console.error('Authentication error:', err);
            const errMsg = err?.message || 'Authentication failed. Please verify credentials.';
            setError(errMsg);
            setToast({
                type: 'error',
                message: errMsg,
            });
        } finally {
            setIsLoading(false);
        }
    };

    // ── 3. Social OAuth & Modals ────────────────────────────────────
    const handleSocialAuth = (providerName) => {
        setOauthProvider(providerName);
        setShowOAuthModal(true);
    };

    const handleForgotPasswordSubmit = (e) => {
        e.preventDefault();
        if (!forgotEmail.trim()) return;

        setForgotLoading(true);
        setTimeout(() => {
            setForgotLoading(false);
            setForgotSubmitted(true);
            setToast({
                type: 'success',
                message: `Password reset dispatched to ${forgotEmail}.`,
            });
        }, 900);
    };

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 sm:p-6 relative overflow-hidden font-sans">
            {/* Ambient Sci-Fi Background Glows */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-[420px] h-[420px] bg-fuchsia-600/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute top-1/3 left-1/4 w-[380px] h-[380px] bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

            {/* Dynamic Toast Notification (Floating Top Center) */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -15, scale: 0.95 }}
                        className={`fixed top-5 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl shadow-2xl backdrop-blur-xl border flex items-center gap-2.5 text-xs font-medium max-w-[90vw] sm:max-w-md ${
                            toast.type === 'error'
                                ? 'bg-rose-950/90 border-rose-500/40 text-rose-200'
                                : toast.type === 'success'
                                ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200'
                                : 'bg-indigo-950/90 border-indigo-500/40 text-indigo-200'
                        }`}
                    >
                        {toast.type === 'error' ? (
                            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                        ) : toast.type === 'success' ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        ) : (
                            <Zap className="w-4 h-4 text-cyan-400 shrink-0" />
                        )}
                        <span className="truncate">{toast.message}</span>
                        <button
                            type="button"
                            onClick={() => setToast(null)}
                            className="ml-auto text-slate-400 hover:text-white p-0.5"
                            aria-label="Dismiss toast"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Central Glowing Cyber Command Card */}
            <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                className="w-full max-w-md bg-slate-900/85 backdrop-blur-2xl border border-indigo-500/20 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-indigo-950/50 relative z-10 glow-indigo"
            >
                {/* Header & Swarm Logo */}
                <div className="flex flex-col items-center mb-6 text-center">
                    <div className="relative mb-3">
                        <div className="p-3.5 bg-gradient-to-tr from-indigo-600 via-violet-600 to-fuchsia-600 rounded-2xl shadow-xl shadow-indigo-600/30">
                            <Bot className="w-8 h-8 text-white" />
                        </div>
                        <div className="absolute -top-1 -right-1 p-1 bg-amber-400 rounded-full shadow-md">
                            <Sparkles className="w-3 h-3 text-slate-950 fill-slate-950" />
                        </div>
                    </div>

                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/25 text-indigo-400 text-[11px] font-mono mb-2">
                        <Zap className="w-3 h-3 text-cyan-400" />
                        <span>NEXT.JS CYBER COMMAND</span>
                    </div>

                    <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                        Swarm Console Login
                    </h1>
                    <p className="text-xs text-slate-400 mt-1">
                        Access your autonomous intelligence orchestrator
                    </p>
                </div>

                {/* 1. Instant Access Presets Interactivity */}
                <div className="mb-5 p-3.5 bg-slate-950/80 border border-indigo-500/20 rounded-2xl shadow-inner">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300 mb-2.5">
                        <div className="flex items-center gap-1.5">
                            <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                            <span>Instant Access Presets:</span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-normal">Click to quick-fill</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {/* Preset 1: Mann Patel */}
                        <button
                            type="button"
                            disabled={isLoading}
                            onClick={() => handleSelectPreset('mann', 'mann@company.com', 'admin123')}
                            className={`group text-left px-3 py-2.5 rounded-xl border transition-all duration-200 cursor-pointer active:scale-[0.98] relative overflow-hidden ${
                                activePreset === 'mann'
                                    ? 'bg-indigo-950/80 border-indigo-400 ring-2 ring-indigo-500/40 shadow-lg shadow-indigo-600/20'
                                    : 'bg-slate-900/90 hover:bg-indigo-950/40 border-slate-800 hover:border-indigo-500/40'
                            }`}
                        >
                            <div className="flex items-center justify-between">
                                <span className="font-semibold text-indigo-300 text-xs block group-hover:text-indigo-200 transition">
                                    Mann Patel
                                </span>
                                {activePreset === 'mann' && (
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] bg-indigo-500 text-white font-mono">
                                        ACTIVE
                                    </span>
                                )}
                            </div>
                            <span className="text-slate-400 font-mono text-[10px] block truncate mt-0.5">
                                Leader • admin123
                            </span>
                        </button>

                        {/* Preset 2: Sarah Jenkins */}
                        <button
                            type="button"
                            disabled={isLoading}
                            onClick={() => handleSelectPreset('sarah', 'sarah@company.com', 'market123')}
                            className={`group text-left px-3 py-2.5 rounded-xl border transition-all duration-200 cursor-pointer active:scale-[0.98] relative overflow-hidden ${
                                activePreset === 'sarah'
                                    ? 'bg-emerald-950/80 border-emerald-400 ring-2 ring-emerald-500/40 shadow-lg shadow-emerald-600/20'
                                    : 'bg-slate-900/90 hover:bg-emerald-950/40 border-slate-800 hover:border-emerald-500/40'
                            }`}
                        >
                            <div className="flex items-center justify-between">
                                <span className="font-semibold text-emerald-300 text-xs block group-hover:text-emerald-200 transition">
                                    Sarah
                                </span>
                                {activePreset === 'sarah' && (
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] bg-emerald-500 text-white font-mono">
                                        ACTIVE
                                    </span>
                                )}
                            </div>
                            <span className="text-slate-400 font-mono text-[10px] block truncate mt-0.5">
                                Marketer • market123
                            </span>
                        </button>
                    </div>
                </div>

                {/* Inline Error Banner */}
                <AnimatePresence>
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-start gap-2.5 text-xs text-rose-300"
                        >
                            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <p className="font-semibold">Authentication Notice</p>
                                <p className="text-[11px] text-rose-300/90 mt-0.5">{error}</p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* 3. Social OAuth Buttons */}
                <div className="grid grid-cols-2 gap-3 mb-5">
                    <button
                        type="button"
                        disabled={isLoading}
                        onClick={() => handleSocialAuth('Google')}
                        className="flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-950 hover:bg-slate-800 disabled:opacity-50 border border-slate-800 hover:border-slate-700 rounded-xl text-xs font-medium text-slate-200 transition cursor-pointer active:scale-[0.98]"
                    >
                        <svg className="w-4 h-4" viewBox="0 0 24 24">
                            <path
                                fill="#4285F4"
                                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                            />
                            <path
                                fill="#34A853"
                                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.25 21.36 7.33 24 12 24z"
                            />
                            <path
                                fill="#FBBC05"
                                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.94 0 12s.46 3.84 1.26 5.42l4.02-3.15z"
                            />
                            <path
                                fill="#EA4335"
                                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.25 2.64 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                            />
                        </svg>
                        Google
                    </button>

                    <button
                        type="button"
                        disabled={isLoading}
                        onClick={() => handleSocialAuth('GitHub')}
                        className="flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-950 hover:bg-slate-800 disabled:opacity-50 border border-slate-800 hover:border-slate-700 rounded-xl text-xs font-medium text-slate-200 transition cursor-pointer active:scale-[0.98]"
                    >
                        <svg className="w-4 h-4 fill-slate-200" viewBox="0 0 24 24">
                            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                        </svg>
                        GitHub
                    </button>
                </div>

                {/* Divider */}
                <div className="relative my-6 flex items-center justify-center">
                    <div className="border-t border-slate-800 w-full" />
                    <span className="bg-slate-900/90 px-3 text-[11px] font-mono uppercase tracking-wider text-slate-400 absolute">
                        Or authenticate with key
                    </span>
                </div>

                {/* 2. Email & Password Form */}
                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label htmlFor="login-email" className="block text-xs font-medium text-slate-200 mb-1.5">
                            Workspace Email
                        </label>
                        <div className="relative">
                            <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                            <input
                                id="login-email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                disabled={isLoading}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="name@company.com"
                                className="w-full bg-slate-950/90 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40 transition disabled:opacity-50"
                            />
                        </div>
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-1.5">
                            <label htmlFor="login-password" className="text-xs font-medium text-slate-200">
                                Password
                            </label>
                            <button
                                type="button"
                                disabled={isLoading}
                                onClick={() => {
                                    setForgotEmail(email);
                                    setShowForgotModal(true);
                                }}
                                className="text-[11px] text-indigo-400 hover:text-indigo-300 transition font-medium cursor-pointer"
                            >
                                Forgot password?
                            </button>
                        </div>
                        <div className="relative">
                            <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                            <input
                                id="login-password"
                                name="password"
                                type={showPassword ? 'text' : 'password'}
                                autoComplete="current-password"
                                required
                                disabled={isLoading}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full bg-slate-950/90 border border-slate-800 rounded-xl py-2.5 pl-10 pr-10 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40 transition disabled:opacity-50"
                            />
                            {/* Toggle password visibility */}
                            <button
                                type="button"
                                disabled={isLoading}
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200 transition p-0.5 cursor-pointer"
                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                            >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center justify-between text-xs py-1">
                        <label className="flex items-center gap-2 cursor-pointer select-none text-slate-300">
                            <input
                                type="checkbox"
                                checked={rememberMe}
                                disabled={isLoading}
                                onChange={(e) => setRememberMe(e.target.checked)}
                                className="rounded border-slate-800 bg-slate-950 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-slate-900 w-3.5 h-3.5 cursor-pointer disabled:opacity-50"
                            />
                            Remember this session
                        </label>
                    </div>

                    {/* Primary Submit Button with Framer Motion hover effects */}
                    <motion.button
                        type="submit"
                        disabled={isLoading}
                        whileHover={!isLoading ? { scale: 1.02 } : {}}
                        whileTap={!isLoading ? { scale: 0.98 } : {}}
                        className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600 hover:from-indigo-500 hover:to-violet-500 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:hover:scale-100 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin text-white" />
                                <span>Authenticating Swarm...</span>
                            </>
                        ) : (
                            <div className="flex items-center gap-1.5">
                                <ShieldCheck className="w-4 h-4" />
                                <span>Access Command Console</span>
                            </div>
                        )}
                    </motion.button>
                </form>

                {/* Footer link to Register */}
                <p className="text-xs text-slate-400 text-center mt-6">
                    Need workspace credentials?{' '}
                    <Link
                        href="/register"
                        className="text-indigo-400 hover:text-indigo-300 font-semibold hover:underline inline-flex items-center gap-1"
                    >
                        <span>Create Account</span>
                        <ArrowRight className="w-3 h-3 inline" />
                    </Link>
                </p>
            </motion.div>

            {/* Modal: OAuth Enterprise Notice */}
            <AnimatePresence>
                {showOAuthModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="bg-slate-900 border border-indigo-500/30 rounded-2xl p-6 max-w-sm w-full shadow-2xl relative"
                        >
                            <button
                                type="button"
                                onClick={() => setShowOAuthModal(false)}
                                className="absolute top-4 right-4 text-slate-400 hover:text-white p-1"
                                aria-label="Close modal"
                            >
                                <X className="w-4 h-4" />
                            </button>

                            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-3 text-indigo-400">
                                <Building2 className="w-5 h-5" />
                            </div>

                            <h3 className="text-base font-bold text-white">
                                {oauthProvider} Single Sign-On
                            </h3>
                            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                                OAuth sign-in coming soon for Enterprise Swarm workspaces.
                            </p>
                            <p className="text-[11px] text-slate-400 mt-2 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                                In this preview deployment, please authenticate directly with your assigned operator email or use the <strong>Instant Access Presets</strong> above.
                            </p>

                            <button
                                type="button"
                                onClick={() => setShowOAuthModal(false)}
                                className="mt-4 w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition"
                            >
                                Return to Console
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Modal: Forgot Password */}
            <AnimatePresence>
                {showForgotModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="bg-slate-900 border border-indigo-500/30 rounded-2xl p-6 max-w-sm w-full shadow-2xl relative"
                        >
                            <button
                                type="button"
                                onClick={() => {
                                    setShowForgotModal(false);
                                    setForgotSubmitted(false);
                                }}
                                className="absolute top-4 right-4 text-slate-400 hover:text-white p-1"
                                aria-label="Close modal"
                            >
                                <X className="w-4 h-4" />
                            </button>

                            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-3 text-amber-400">
                                <KeyRound className="w-5 h-5" />
                            </div>

                            <h3 className="text-base font-bold text-white">Reset Swarm Clearance</h3>
                            <p className="text-xs text-slate-400 mt-1 mb-4">
                                Enter your registered workspace email to receive security recovery instructions.
                            </p>

                            {forgotSubmitted ? (
                                <div className="space-y-3">
                                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300">
                                        <p className="font-semibold flex items-center gap-1.5">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                            Dispatch Transmitted
                                        </p>
                                        <p className="text-[11px] mt-1 text-emerald-300/80">
                                            Security key recovery link sent to <strong>{forgotEmail}</strong>. Check your corporate inbox.
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowForgotModal(false);
                                            setForgotSubmitted(false);
                                        }}
                                        className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition"
                                    >
                                        Close
                                    </button>
                                </div>
                            ) : (
                                <form onSubmit={handleForgotPasswordSubmit} className="space-y-3">
                                    <div>
                                        <label htmlFor="forgot-email-input" className="block text-xs font-medium text-slate-300 mb-1">
                                            Workspace Email
                                        </label>
                                        <input
                                            id="forgot-email-input"
                                            type="email"
                                            required
                                            value={forgotEmail}
                                            onChange={(e) => setForgotEmail(e.target.value)}
                                            placeholder="name@company.com"
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={forgotLoading}
                                        className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-xs rounded-xl shadow transition flex items-center justify-center gap-2"
                                    >
                                        {forgotLoading ? (
                                            <>
                                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                <span>Transmitting Dispatch...</span>
                                            </>
                                        ) : (
                                            'Send Reset Instructions'
                                        )}
                                    </button>
                                </form>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
