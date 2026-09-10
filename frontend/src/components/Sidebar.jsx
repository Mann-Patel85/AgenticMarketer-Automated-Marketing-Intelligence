import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Database, ShieldAlert, Sparkles, Cpu, Layers } from 'lucide-react';

export default function Sidebar({ isOpen, onClose }) {
    const navItems = [
        { path: '/dashboard', label: 'Swarm Launcher', icon: LayoutDashboard },
        { path: '/knowledge', label: 'Knowledge Base', icon: Database },
        { path: '/admin', label: 'Admin Console', icon: ShieldAlert },
    ];

    return (
        <aside
            className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800 p-5 transform transition-transform duration-300 md:translate-x-0 ${
                isOpen ? 'translate-x-0' : '-translate-x-full md:relative md:translate-x-0'
            }`}
        >
            <div className="flex items-center space-x-3 mb-8">
                <div className="p-2 bg-gradient-to-tr from-indigo-600 to-violet-600 rounded-xl">
                    <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                    <h2 className="font-bold text-sm text-white">AgenticMarketer</h2>
                    <p className="text-[10px] text-indigo-400 font-mono">Swarm Orchestrator</p>
                </div>
            </div>

            <nav className="space-y-1.5">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    return (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            onClick={onClose}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition ${
                                    isActive
                                        ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/30'
                                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                                }`
                            }
                        >
                            <Icon className="w-4 h-4" />
                            <span>{item.label}</span>
                        </NavLink>
                    );
                })}
            </nav>

            <div className="mt-8 p-4 bg-slate-950/60 border border-slate-800/80 rounded-xl space-y-2 text-xs">
                <div className="flex items-center gap-2 text-indigo-400 font-semibold text-[11px]">
                    <Cpu className="w-3.5 h-3.5" />
                    <span>Swarm Node v2.4</span>
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed">
                    4 autonomous agents active in local cluster topology.
                </p>
            </div>
        </aside>
    );
}
