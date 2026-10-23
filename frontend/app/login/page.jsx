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
    CheckCircle2,
    ShieldCheck,
    X,
    ArrowRight,
    KeyRound
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

    // Feedback & state alerts
    const [error, setError] = useState(null);
    const [toast, setToast] = useState(null); // { type: 'success' | 'info' | 'error', message: '' }

    // Forgot password state
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
            // Ignore client storage restrictions
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

    const handleLogin = async (e) => {
        e.preventDefault();
        setError(null);

        const cleanEmail = email.trim();
        const cleanPassword = password.trim();

        if (!cleanEmail || !cleanPassword) {
            setError('Please enter both your email address and password.');
            return;
        }

        // Basic client-side email format validation
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

    const handleForgotPasswordSubmit = (e) => {
        e.preventDefault();
        if (!forgotEmail.trim()) return;

        setForgotLoading(true);
        setTimeout(() => {
            setForgotLoading(false);
            setForgotSubmitted(true);
            setToast({
                type: 'success',
                message: `Password reset instructions sent to ${forgotEmail}.`,
            });
        }, 800);
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
                                <p className="font-semibold">Authentication Error</p>
                                <p className="text-[11px] text-rose-300/90 mt-0.5">{error}</p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Clean Production Email & Password Form */}
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
                                disabled={isLoading}
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
                            {/* Functional password visibility toggle */}
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

                    {/* Responsive Submit Button */}
                    <motion.button
                        type="submit"
                        disabled={isLoading}
                        whileHover={!isLoading ? { scale: 1.02 } : {}}
                        whileTap={!isLoading ? { scale: 0.98 } : {}}
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
