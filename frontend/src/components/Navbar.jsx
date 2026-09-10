import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Bot, LayoutDashboard, Database, ShieldAlert, LogOut, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleSignOut = () => {
        logout();
        navigate('/login');
    };

    const navItems = [
        { path: '/dashboard', label: 'Swarm Launcher', icon: LayoutDashboard, visible: true },
        { path: '/knowledge', label: 'Knowledge Base', icon: Database, visible: true },
        {
            path: '/admin',
            label: 'Admin Panel',
            icon: ShieldAlert,
            visible: !user || user.role === 'leader' || user.role === 'admin',
        },
    ];

    return (
        <nav className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-6 py-3 flex flex-wrap justify-between items-center gap-3 sticky top-0 z-40">
            <div className="flex items-center space-x-6 sm:space-x-8">
                <Link to="/dashboard" className="flex items-center space-x-3 group">
                    <div className="p-2 bg-gradient-to-tr from-indigo-600 to-violet-600 rounded-xl group-hover:from-indigo-500 group-hover:to-violet-500 transition shadow-md shadow-indigo-600/25">
                        <Bot className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <span className="font-bold text-base sm:text-lg text-white tracking-tight">AgenticMarketer</span>
                        <span className="hidden sm:inline-block ml-2 text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                            Swarm AI
                        </span>
                    </div>
                </Link>

                <div className="flex items-center space-x-1.5">
                    {navItems
                        .filter((item) => item.visible)
                        .map((item) => {
                            const Icon = item.icon;
                            const isActive = location.pathname === item.path;
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={`flex items-center gap-2 text-xs font-medium py-1.5 px-3 rounded-xl transition ${
                                        isActive
                                            ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/30 font-semibold shadow-sm'
                                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
                                    }`}
                                >
                                    <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                                    <span>{item.label}</span>
                                </Link>
                            );
                        })}
                </div>
            </div>

            <div className="flex items-center space-x-3 sm:space-x-4">
                {user && (
                    <div className="flex items-center space-x-2.5 px-3 py-1.5 bg-slate-950/80 border border-slate-800/80 rounded-xl">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 border border-indigo-400/30 flex items-center justify-center text-white text-xs font-semibold">
                            {user.name ? user.name.charAt(0).toUpperCase() : <User className="w-3 h-3" />}
                        </div>
                        <div className="text-left hidden sm:block">
                            <p className="text-xs font-medium text-slate-200 leading-none">{user.name || 'User'}</p>
                            <span className="text-[10px] text-indigo-400 uppercase tracking-wider capitalize font-mono">
                                {user.role || 'Member'}
                            </span>
                        </div>
                    </div>
                )}
                <button
                    onClick={handleSignOut}
                    className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-rose-400 py-1.5 px-3 rounded-xl hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition cursor-pointer"
                    title="Sign Out of Workspace"
                >
                    <LogOut className="w-4 h-4" />
                    <span className="hidden sm:inline">Sign Out</span>
                </button>
            </div>
        </nav>
    );
}