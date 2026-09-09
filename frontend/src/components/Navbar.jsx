import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bot, LayoutDashboard, Database, ShieldAlert, LogOut, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleSignOut = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav className="bg-slate-900 border-b border-slate-800 px-6 py-3.5 flex justify-between items-center">
            <div className="flex items-center space-x-8">
                <Link to="/dashboard" className="flex items-center space-x-3 group">
                    <div className="p-2 bg-indigo-600 rounded-lg group-hover:bg-indigo-500 transition shadow-md shadow-indigo-600/20">
                        <Bot className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-bold text-lg text-white tracking-wide">AgenticMarketer</span>
                </Link>

                <div className="flex space-x-2">
                    <Link to="/dashboard" className="flex items-center gap-2 text-xs font-medium text-slate-300 hover:text-indigo-400 py-1.5 px-3 rounded-lg hover:bg-slate-800 transition">
                        <LayoutDashboard className="w-4 h-4" /> Swarm Launcher
                    </Link>
                    <Link to="/knowledge" className="flex items-center gap-2 text-xs font-medium text-slate-300 hover:text-indigo-400 py-1.5 px-3 rounded-lg hover:bg-slate-800 transition">
                        <Database className="w-4 h-4" /> Knowledge Base
                    </Link>
                    {(!user || user.role === 'leader' || user.role === 'admin') && (
                        <Link to="/admin" className="flex items-center gap-2 text-xs font-medium text-slate-300 hover:text-indigo-400 py-1.5 px-3 rounded-lg hover:bg-slate-800 transition">
                            <ShieldAlert className="w-4 h-4" /> Admin Panel
                        </Link>
                    )}
                </div>
            </div>

            <div className="flex items-center space-x-4">
                {user && (
                    <div className="flex items-center space-x-2.5 px-3 py-1.5 bg-slate-950/60 border border-slate-800 rounded-xl">
                        <div className="w-6 h-6 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 text-xs font-semibold">
                            {user.name ? user.name.charAt(0).toUpperCase() : <User className="w-3 h-3" />}
                        </div>
                        <div className="text-left">
                            <p className="text-xs font-medium text-slate-200 leading-none">{user.name || 'User'}</p>
                            <span className="text-[10px] text-slate-500 uppercase tracking-wider capitalize">{user.role || 'Member'}</span>
                        </div>
                    </div>
                )}
                <button
                    onClick={handleSignOut}
                    className="flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-rose-400 py-1.5 px-3 rounded-lg hover:bg-slate-800/50 transition"
                    title="Sign Out"
                >
                    <LogOut className="w-4 h-4" /> Sign Out
                </button>
            </div>
        </nav>
    );
}