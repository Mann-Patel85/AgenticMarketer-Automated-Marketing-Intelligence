'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    Bot,
    Lock,
    Mail,
    User,
    Eye,
    EyeOff,
    Sparkles,
    AlertCircle,
    Loader2,
    CheckCircle2,
    X,
    ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../utils/api';

function RegisterContent() {
    const { user, register } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        if (user) {
            router.replace('/dashboard');
        }
    }, [user, router]);

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [agreeTerms, setAgreeTerms] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);
    const [error, setError] = useState(null);
    const [toast, setToast] = useState(null);

    // Auto-dismiss toasts
    useEffect(() => {
        if (!toast) return;
        const timer = setTimeout(() => {
            setToast(null);
        }, 5000);
        return () => clearTimeout(timer);
    }, [toast]);

    // Check for query param errors
    useEffect(() => {
        const queryError = searchParams.get('error');
        if (queryError) {
            setError(queryError);
            setToast({
                type: 'error',
                message: queryError,
            });
        }
    }, [searchParams]);

    const handleGoogleSignUp = () => {
        setIsGoogleLoading(true);
        setError(null);
        window.location.href = `${API_BASE_URL}/auth/google/login`;
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setError(null);

        const cleanName = name.trim();
        const cleanEmail = email.trim();

        if (!cleanName) {
            setError('Please enter your full name.');
            return;
        }

        if (!cleanEmail) {
            setError('Please enter your email address.');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(cleanEmail)) {
            setError('Please enter a valid email address (e.g., you@domain.com).');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters in length.');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match. Please verify both fields.');
            return;
        }

        if (!agreeTerms) {
            setError('Please accept the Terms of Service to proceed.');
            return;
        }

        try {
            setIsLoading(true);
            await register({
                name: cleanName,
                email: cleanEmail,
                password: password,
            });

            setToast({
                type: 'success',
                message: 'Account successfully initialized! Redirecting to workspace...',
            });

            setTimeout(() => {
                router.push('/dashboard');
            }, 600);
        } catch (err) {
            console.error('Registration error:', err);
            const errMsg = err?.message || 'Registration failed. Please try again.';
            setError(errMsg);
            setToast({
                type: 'error',
                message: errMsg,
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 sm:p-6 relative overflow-hidden font-sans">
            {/* Ambient Background Glows */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] bg-violet-600/15 rounded-full blur-3xl pointer-events-none" />

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
                                : 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200'
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

            {/* Registration Card */}
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
                        Create Account
                    </h1>
                    <p className="text-xs text-slate-400 mt-1">
                        Get started with your <span className="text-indigo-400 font-semibold">AgenticMarketer</span> workspace
                    </p>
                </div>

                {/* Inline Error Alert */}
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
                                <p className="font-semibold">Registration Notice</p>
                                <p className="text-[11px] text-rose-300/90 mt-0.5">{error}</p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Google Sign-Up Button */}
                <button
                    type="button"
                    disabled={isLoading || isGoogleLoading}
                    onClick={handleGoogleSignUp}
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
                            <span>Sign up with Google</span>
                        </>
                    )}
                </button>

                {/* Divider */}
                <div className="relative my-4 flex items-center justify-center">
                    <div className="border-t border-slate-800 w-full" />
                    <span className="bg-slate-900/90 px-3 text-[11px] font-mono uppercase tracking-wider text-slate-500 absolute">
                        Or register with email
                    </span>
                </div>

                <form onSubmit={handleRegister} className="space-y-3.5">
                    <div>
                        <label htmlFor="register-name" className="block text-xs font-medium text-slate-300 mb-1">
                            Full Name
                        </label>
                        <div className="relative">
                            <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                            <input
                                id="register-name"
                                name="name"
                                type="text"
                                autoComplete="name"
                                required
                                disabled={isLoading || isGoogleLoading}
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Your Name"
                                className="w-full bg-slate-950/90 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40 transition disabled:opacity-50"
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="register-email" className="block text-xs font-medium text-slate-300 mb-1">
                            Email Address
                        </label>
                        <div className="relative">
                            <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                            <input
                                id="register-email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                disabled={isLoading || isGoogleLoading}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@domain.com"
                                className="w-full bg-slate-950/90 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40 transition disabled:opacity-50"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label htmlFor="register-password" className="block text-xs font-medium text-slate-300 mb-1">
                                Password
                            </label>
                            <div className="relative">
                                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                                <input
                                    id="register-password"
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    autoComplete="new-password"
                                    required
                                    disabled={isLoading || isGoogleLoading}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full bg-slate-950/90 border border-slate-800 rounded-xl py-2.5 pl-10 pr-9 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40 transition disabled:opacity-50"
                                />
                                <button
                                    type="button"
                                    disabled={isLoading || isGoogleLoading}
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-2.5 top-2.5 text-slate-500 hover:text-slate-300 transition p-0.5 cursor-pointer"
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label htmlFor="register-confirm-password" className="block text-xs font-medium text-slate-300 mb-1">
                                Confirm Password
                            </label>
                            <div className="relative">
                                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                                <input
                                    id="register-confirm-password"
                                    name="confirmPassword"
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    autoComplete="new-password"
                                    required
                                    disabled={isLoading || isGoogleLoading}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full bg-slate-950/90 border border-slate-800 rounded-xl py-2.5 pl-10 pr-9 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40 transition disabled:opacity-50"
                                />
                                <button
                                    type="button"
                                    disabled={isLoading || isGoogleLoading}
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-2.5 top-2.5 text-slate-500 hover:text-slate-300 transition p-0.5 cursor-pointer"
                                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="pt-1">
                        <label className="flex items-start gap-2 cursor-pointer select-none text-[11px] text-slate-400">
                            <input
                                type="checkbox"
                                checked={agreeTerms}
                                disabled={isLoading || isGoogleLoading}
                                onChange={(e) => setAgreeTerms(e.target.checked)}
                                className="rounded border-slate-800 bg-slate-950 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-slate-900 w-3.5 h-3.5 mt-0.5 cursor-pointer disabled:opacity-50"
                            />
                            <span>
                                I agree to the{' '}
                                <span className="text-indigo-400 hover:underline">Terms of Service</span> and{' '}
                                <span className="text-indigo-400 hover:underline">Privacy Policy</span>.
                            </span>
                        </label>
                    </div>

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
                                <span>Creating Account...</span>
                            </>
                        ) : (
                            'Create Account'
                        )}
                    </motion.button>
                </form>

                <p className="text-xs text-slate-400 text-center mt-5">
                    Already have an account?{' '}
                    <Link
                        href="/login"
                        className="text-indigo-400 hover:text-indigo-300 font-semibold hover:underline inline-flex items-center gap-1"
                    >
                        <span>Sign In</span>
                        <ArrowRight className="w-3 h-3 inline" />
                    </Link>
                </p>
            </motion.div>
        </div>
    );
}

export default function RegisterPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                </div>
            }
        >
            <RegisterContent />
        </Suspense>
    );
}
