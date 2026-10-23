'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    Bot,
    Lock,
    Mail,
    Eye,
    EyeOff,
    Sparkles,
    AlertCircle,
    Loader2,
    CheckCircle2,
    ShieldCheck,
    X,
    ArrowRight,
    KeyRound
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../utils/api';

function LoginContent() {
    const { user, login } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();

    // Form inputs & states
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);

    // Feedback & state alerts
    const [error, setError] = useState(null);
    const [toast, setToast] = useState(null);

    // Forgot password state
    const [showForgotModal, setShowForgotModal] = useState(false);
    const [forgotEmail, setForgotEmail] = useState('');
    const [forgotLoading, setForgotLoading] = useState(false);
    const [forgotSubmitted, setForgotSubmitted] = useState(false);

    // Check for error in query params (e.g. from Google OAuth redirect)
    useEffect(() => {
        const queryError = searchParams.get('error');
        if (queryError) {
            let userMessage = queryError;
            if (queryError === 'seat_limit_reached') {
                userMessage = 'Workspace full: Maximum 10 operator seats reached. Contact the administrator for workspace clearance.';
            }
            setError(userMessage);
            setToast({
                type: 'error',
                message: userMessage,
            });
        }
    }, [searchParams]);

    // Hydrate remembered email if available
    useEffect(() => {
        try {
            const saved = localStorage.getItem('remembered_email');
            if (saved) setEmail(saved);
        } catch {
            // Ignore storage restrictions
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
        }, 5000);
        return () => clearTimeout(timer);
    }, [toast]);

    const handleGoogleSignIn = () => {
        setIsGoogleLoading(true);
        setError(null);
        const googleEndpoint = `${API_BASE_URL}/auth/google/login`;
        window.location.href = googleEndpoint;
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setError(null);

        const cleanEmail = email.trim();
        const cleanPassword = password.trim();

        if (!cleanEmail || !cleanPassword) {
            setError('Please enter both your email address and password.');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(cleanEmail)) {
            setError('Please enter a valid email address (e.g., you@domain.com).');
            return;
        }

        try {
            setIsLoading(true);
            await login(cleanEmail, cleanPassword);

            try {
                if (rememberMe) {
                    localStorage.setItem('remembered_email', cleanEmail);
                } else {
                    localStorage.removeItem('remembered_email');
                }
            } catch {
                // Ignore
            }

            setToast({
                type: 'success',
                message: 'Authentication successful. Redirecting to your workspace...',
            });

            setTimeout(() => {
                router.push('/dashboard');
            }, 500);
        } catch (err) {
            console.error('Authentication error:', err);
            const errMsg = err?.message || 'Authentication failed. Please verify your credentials.';
            setError(errMsg);
            setToast({
                type: 'error',
                message: errMsg,
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleForgotPasswordSubmit = async (e) => {
        e.preventDefault();
        if (!forgotEmail.trim()) return;

        setForgotLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: forgotEmail.trim() }),
            });
            const data = await res.json();
            setForgotSubmitted(true);
            setToast({
                type: 'success',
                message: data.message || `Password reset instructions sent to ${forgotEmail}.`,
            });
        } catch (err) {
            console.warn('Forgot password dispatch error:', err);
            setForgotSubmitted(true);
            setToast({
                type: 'success',
                message: `Password reset instructions sent to ${forgotEmail}.`,
            });
        } finally {
            setForgotLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 sm:p-6 relative overflow-hidden font-sans">
            {/* Ambient Background Glows */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

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
                        ) : (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        )}
                        <span className="truncate">{toast.message}</span>
                        <button
                            type="button"
                            onClick={() => setToast(null)}
                            className="ml-auto text-slate-400 hover:text-white p-0.5"
                            aria-label="Dismiss notification"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Central Authentication Card */}
            <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                className="w-full max-w-md bg-slate-900/85 backdrop-blur-2xl border border-indigo-500/20 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-indigo-950/50 relative z-10 glow-indigo"
            >
                {/* Brand & Header */}
                <div className="flex flex-col items-center mb-6 text-center">
                    <div className="relative mb-3">
                        <div className="p-3.5 bg-gradient-to-tr from-indigo-600 via-violet-600 to-indigo-600 rounded-2xl shadow-xl shadow-indigo-600/30">
                            <Bot className="w-8 h-8 text-white" />
                        </div>
                        <div className="absolute -top-1 -right-1 p-1 bg-amber-400 rounded-full shadow-md">
                            <Sparkles className="w-3 h-3 text-slate-950 fill-slate-950" />
                        </div>
                    </div>

                    <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                        Sign In
                    </h1>
                    <p className="text-xs text-slate-400 mt-1">
                        Sign in to your <span className="text-indigo-400 font-semibold">AgenticMarketer</span> workspace
                    </p>
                </div>

                {/* Inline Error Alert */}
                <AnimatePresence>
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mb-5 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-start gap-2.5 text-xs text-rose-300"
                        >
                            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <p className="font-semibold">Authentication Notice</p>
                                <p className="text-[11px] text-rose-300/90 mt-0.5">{error}</p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* 1. Functional Google OAuth Button */}
                <button
                    type="button"
                    disabled={isLoading || isGoogleLoading}
                    onClick={handleGoogleSignIn}
                    className="w-full py-2.5 px-4 bg-slate-950 hover:bg-slate-800 disabled:opacity-60 border border-slate-800 hover:border-slate-700 rounded-xl text-xs font-semibold text-slate-200 transition cursor-pointer flex items-center justify-center gap-2.5 shadow-sm active:scale-[0.99]"
                >
                    {isGoogleLoading ? (
                        <>
                            <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
                            <span>Redirecting to Google...</span>
                        </>
                    ) : (
                        <>
                            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
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
                            <span>Sign in with Google</span>
                        </>
                    )}
                </button>

                {/* Divider */}
                <div className="relative my-5 flex items-center justify-center">
                    <div className="border-t border-slate-800 w-full" />
                    <span className="bg-slate-900/90 px-3 text-[11px] font-mono uppercase tracking-wider text-slate-500 absolute">
                        Or continue with email
                    </span>
                </div>

                {/* Email & Password Form */}
                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label htmlFor="login-email" className="block text-xs font-medium text-slate-200 mb-1.5">
                            Email Address
                        </label>
                        <div className="relative">
                            <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                            <input
                                id="login-email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                disabled={isLoading || isGoogleLoading}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@domain.com"
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
                                disabled={isLoading || isGoogleLoading}
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
                                disabled={isLoading || isGoogleLoading}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full bg-slate-950/90 border border-slate-800 rounded-xl py-2.5 pl-10 pr-10 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40 transition disabled:opacity-50"
                            />
                            {/* Functional password visibility toggle */}
                            <button
                                type="button"
                                disabled={isLoading || isGoogleLoading}
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
                                disabled={isLoading || isGoogleLoading}
                                onChange={(e) => setRememberMe(e.target.checked)}
                                className="rounded border-slate-800 bg-slate-950 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-slate-900 w-3.5 h-3.5 cursor-pointer disabled:opacity-50"
                            />
                            Remember this session
                        </label>
                    </div>

                    {/* Responsive Submit Button */}
                    <motion.button
                        type="submit"
                        disabled={isLoading || isGoogleLoading}
                        whileHover={!isLoading && !isGoogleLoading ? { scale: 1.02 } : {}}
                        whileTap={!isLoading && !isGoogleLoading ? { scale: 0.98 } : {}}
                        className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600 hover:from-indigo-500 hover:to-violet-500 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:hover:scale-100 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin text-white" />
                                <span>Signing In...</span>
                            </>
                        ) : (
                            <div className="flex items-center gap-1.5">
                                <ShieldCheck className="w-4 h-4" />
                                <span>Sign In</span>
                            </div>
                        )}
                    </motion.button>
                </form>

                {/* Clean Navigation to Register */}
                <p className="text-xs text-slate-400 text-center mt-6">
                    Don&apos;t have an account?{' '}
                    <Link
                        href="/register"
                        className="text-indigo-400 hover:text-indigo-300 font-semibold hover:underline inline-flex items-center gap-1"
                    >
                        <span>Create Account</span>
                        <ArrowRight className="w-3 h-3 inline" />
                    </Link>
                </p>
            </motion.div>

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

                            <h3 className="text-base font-bold text-white">Reset Password</h3>
                            <p className="text-xs text-slate-400 mt-1 mb-4">
                                Enter your email address to receive password recovery instructions.
                            </p>

                            {forgotSubmitted ? (
                                <div className="space-y-3">
                                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300">
                                        <p className="font-semibold flex items-center gap-1.5">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                            Instructions Sent
                                        </p>
                                        <p className="text-[11px] mt-1 text-emerald-300/80">
                                            Password reset instructions sent to <strong>{forgotEmail}</strong>. Please check your inbox.
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowForgotModal(false);
                                            setForgotSubmitted(false);
                                        }}
                                        className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition cursor-pointer"
                                    >
                                        Close
                                    </button>
                                </div>
                            ) : (
                                <form onSubmit={handleForgotPasswordSubmit} className="space-y-3">
                                    <div>
                                        <label htmlFor="forgot-email-input" className="block text-xs font-medium text-slate-300 mb-1">
                                            Email Address
                                        </label>
                                        <input
                                            id="forgot-email-input"
                                            type="email"
                                            required
                                            value={forgotEmail}
                                            onChange={(e) => setForgotEmail(e.target.value)}
                                            placeholder="you@domain.com"
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={forgotLoading}
                                        className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-xs rounded-xl shadow transition flex items-center justify-center gap-2 cursor-pointer"
                                    >
                                        {forgotLoading ? (
                                            <>
                                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                <span>Sending...</span>
                                            </>
                                        ) : (
                                            'Send Reset Link'
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

export default function LoginPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                </div>
            }
        >
            <LoginContent />
        </Suspense>
    );
}
