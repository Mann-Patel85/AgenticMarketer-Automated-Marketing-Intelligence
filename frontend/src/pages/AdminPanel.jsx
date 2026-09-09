import React from 'react';
import Navbar from '../components/Navbar';
import { Users, Key, Activity, Cpu } from 'lucide-react';

export default function AdminPanel() {
    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
            <Navbar />
            <main className="max-w-6xl mx-auto p-8 space-y-8">
                <div>
                    <h1 className="text-2xl font-bold">Admin Console</h1>
                    <p className="text-xs text-slate-400">Manage API infrastructure, system performance, and workspace seats.</p>
                </div>

                {/* System Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
                        <div>
                            <p className="text-xs text-slate-400">Gemini Token Usage</p>
                            <h3 className="text-lg font-bold text-slate-100">142,800</h3>
                        </div>
                        <Cpu className="w-6 h-6 text-indigo-400" />
                    </div>

                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
                        <div>
                            <p className="text-xs text-slate-400">Vector Embeddings</p>
                            <h3 className="text-lg font-bold text-slate-100">1,240 Chunks</h3>
                        </div>
                        <Activity className="w-6 h-6 text-emerald-400" />
                    </div>

                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
                        <div>
                            <p className="text-xs text-slate-400">Active Teammates</p>
                            <h3 className="text-lg font-bold text-slate-100">3 Members</h3>
                        </div>
                        <Users className="w-6 h-6 text-sky-400" />
                    </div>

                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
                        <div>
                            <p className="text-xs text-slate-400">Agent API Status</p>
                            <h3 className="text-sm font-bold text-emerald-400">Operational</h3>
                        </div>
                        <Key className="w-6 h-6 text-amber-400" />
                    </div>
                </div>

                {/* Team Members List */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                    <h2 className="text-sm font-semibold mb-4">Workspace Collaborators</h2>
                    <div className="space-y-3">
                        {[
                            { name: 'Mann (Lead)', role: 'Admin', status: 'Active' },
                            { name: 'Member 2', role: 'Backend / RAG', status: 'Active' },
                            { name: 'Member 3', role: 'Frontend UI', status: 'Active' },
                        ].map((user, i) => (
                            <div key={i} className="flex justify-between items-center p-3 bg-slate-950/60 rounded-lg text-xs">
                                <div>
                                    <p className="font-medium text-slate-200">{user.name}</p>
                                    <p className="text-slate-500">{user.role}</p>
                                </div>
                                <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md">
                                    {user.status}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
}