'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Bot, LayoutDashboard, Database, ShieldAlert, LogOut, User, Activity } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
    const { user, logout } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    const handleSignOut = () => {
        logout();
        router.push('/login');
    };

    const navItems = [
        { path: '/dashboard', label: 'Swarm Launcher', icon: LayoutDashboard, visible: true },
        { path: '/knowledge', label: 'Knowledge Base', icon: Database, visible: true },
        {
            path: '/admin',
            label: 'Admin Panel',
            icon: ShieldAlert,
            visible: Boolean(user && (user.role === 'leader' || user.role === 'admin')),
        },
    ];

    // Hide navbar on auth pages
    if (pathname === '/login' || pathname === '/register') {
        return null;
    }

    return (
        <header className="sticky top-0 z-50 backdrop-blur-xl bg-slate-950/80 border-b border-indigo-500/20 shadow-lg shadow-black/40">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16 gap-4">
                    {/* Brand */}
                    <div className="flex items-center gap-8">
                        <Link href="/dashboard" className="flex items-center gap-3 group">
                            <div className="relative p-2.5 rounded-xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-fuchsia-600 group-hover:from-indigo-500 group-hover:to-fuchsia-500 transition-all duration-300 shadow-md shadow-indigo-600/30 group-hover:shadow-indigo-500/50">
                                <Bot className="w-5 h-5 text-white" />
                                <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
                                </span>
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="font-extrabold text-base sm:text-lg bg-gradient-to-r from-white via-slate-200 to-indigo-300 bg-clip-text text-transparent tracking-tight">
                                        AgenticMarketer
                                    </span>
                                    <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono font-semibold tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                                        <Activity className="w-2.5 h-2.5 text-cyan-400 animate-pulse" />
                                        NEXT·GEN
                                    </span>
                                </div>
                                <p className="text-[10px] text-slate-500 hidden sm:block font-mono tracking-wide">
                                    Autonomous Intelligence Swarm
                                </p>
                            </div>
                        </Link>

                        {/* Navigation Links */}
                        <nav className="hidden md:flex items-center gap-1.5">
                            {navItems
                                .filter((item) => item.visible)
                                .map((item) => {
                                    const Icon = item.icon;
                                    const isActive = pathname === item.path;
                                    return (
                                        <Link
                                            key={item.path}
                                            href={item.path}
                                            className={`flex items-center gap-2 text-xs font-medium py-2 px-3.5 rounded-xl transition-all duration-200 ${
                                                isActive
                                                    ? 'bg-gradient-to-r from-indigo-500/20 to-violet-500/20 text-indigo-300 border border-indigo-500/40 shadow-sm shadow-indigo-500/20 font-semibold'
                                                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/80 border border-transparent'
                                            }`}
                                        >
                                            <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                                            <span>{item.label}</span>
                                        </Link>
                                    );
                                })}
                        </nav>
                    </div>

                    {/* User profile & actions */}
                    <div className="flex items-center gap-3">
                        {user ? (
                            <div className="flex items-center gap-2.5 px-3 py-1.5 bg-slate-900/90 border border-slate-800 rounded-xl shadow-inner">
                                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 border border-white/20 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                                    {user.name ? user.name.charAt(0).toUpperCase() : <User className="w-3.5 h-3.5" />}
                                </div>
                                <div className="text-left hidden sm:block">
                                    <p className="text-xs font-semibold text-slate-200 leading-none">{user.name || 'User'}</p>
                                    <span className="text-[10px] text-cyan-400 font-mono uppercase tracking-wider">
                                        {user.role || 'operator'}
                                    </span>
                                </div>
                            </div>
                        ) : null}

                        {user ? (
                            <button
                                onClick={handleSignOut}
                                className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-rose-400 py-1.5 px-3 rounded-xl hover:bg-rose-500/10 border border-transparent hover:border-rose-500/30 transition-colors cursor-pointer"
                                title="Sign Out of Workspace"
                            >
                                <LogOut className="w-4 h-4" />
                                <span className="hidden sm:inline">Sign Out</span>
                            </button>
                        ) : (
                            <Link
                                href="/login"
                                className="text-xs font-semibold px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition"
                            >
                                Sign In
                            </Link>
                        )}
                    </div>
                </div>
            </div>

            {/* Mobile Navigation bar */}
            <div className="md:hidden flex items-center justify-around border-t border-slate-800/80 bg-slate-950/95 px-2 py-1.5">
                {navItems
                    .filter((item) => item.visible)
                    .map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                href={item.path}
                                className={`flex flex-col items-center gap-1 py-1.5 px-3 rounded-lg text-[11px] font-medium transition ${
                                    isActive ? 'text-indigo-400 font-semibold' : 'text-slate-400'
                                }`}
                            >
                                <Icon className="w-4 h-4" />
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
            </div>
        </header>
    );
}
