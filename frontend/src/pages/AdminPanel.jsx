import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import {
    Users,
    Key,
    Activity,
    Cpu,
    CheckCircle2,
    Shield,
    Plus,
    Trash2,
    Database,
    Globe,
    Share2,
    Lock,
    Eye,
    EyeOff,
    Sparkles
} from 'lucide-react';

export default function AdminPanel() {
    const [collaborators, setCollaborators] = useState([
        { id: 1, name: 'Mann Patel', email: 'mann@company.com', role: 'leader', status: 'Active' },
        { id: 2, name: 'Alex Rivera', email: 'alex@company.com', role: 'backend_dev', status: 'Active' },
        { id: 3, name: 'Elena Chen', email: 'elena@company.com', role: 'marketer', status: 'Active' },
    ]);

    const [newCollab, setNewCollab] = useState({ name: '', email: '', role: 'marketer' });
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [geminiKey, setGeminiKey] = useState('AIzaSyD-sample-gemini-key-9988223');
    const [showKey, setShowKey] = useState(false);
    const [savedNotice, setSavedNotice] = useState('');

    const handleAddCollaborator = (e) => {
        e.preventDefault();
        if (!newCollab.name || !newCollab.email) return;

        setCollaborators((prev) => [
            ...prev,
            { id: Date.now(), name: newCollab.name, email: newCollab.email, role: newCollab.role, status: 'Active' },
        ]);
        setNewCollab({ name: '', email: '', role: 'marketer' });
        setShowInviteModal(false);
    };

    const handleRemoveCollaborator = (id) => {
        setCollaborators((prev) => prev.filter((c) => c.id !== id));
    };

    const handleSaveKey = () => {
        setSavedNotice('API key updated and validated with Gemini orchestrator.');
        setTimeout(() => setSavedNotice(''), 3000);
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white pb-16">
            <Navbar />
            <main className="max-w-6xl mx-auto p-6 sm:p-8 space-y-8">
                <div>
                    <h1 className="text-xl font-bold text-white tracking-tight">Admin & Infrastructure Console</h1>
                    <p className="text-xs text-slate-400 mt-1">
                        Manage API credentials, microservice connections, ChromaDB vector telemetry, and workspace seats.
                    </p>
                </div>

                {/* System Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
                        <div>
                            <p className="text-xs text-slate-400">Gemini 1.5 Token Usage</p>
                            <h3 className="text-xl font-bold text-white mt-1">142,800</h3>
                            <span className="text-[10px] text-emerald-400">Within Free Tier Quota</span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                            <Cpu className="w-5 h-5" />
                        </div>
                    </div>

                    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
                        <div>
                            <p className="text-xs text-slate-400">ChromaDB Vectors</p>
                            <h3 className="text-xl font-bold text-white mt-1">1,240 Chunks</h3>
                            <span className="text-[10px] text-emerald-400">Persistent Storage OK</span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                            <Database className="w-5 h-5" />
                        </div>
                    </div>

                    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
                        <div>
                            <p className="text-xs text-slate-400">Workspace Seats</p>
                            <h3 className="text-xl font-bold text-white mt-1">{collaborators.length} Members</h3>
                            <span className="text-[10px] text-indigo-400">3 of 10 Seats Active</span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
                            <Users className="w-5 h-5" />
                        </div>
                    </div>

                    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
                        <div>
                            <p className="text-xs text-slate-400">FastAPI Microservice</p>
                            <h3 className="text-base font-bold text-emerald-400 mt-1">Operational (28ms)</h3>
                            <span className="text-[10px] text-slate-400">Port 8000 Connected</span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                            <Activity className="w-5 h-5" />
                        </div>
                    </div>
                </div>

                {/* API & Microservices Connectors */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
                    <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                        <Key className="w-4 h-4 text-amber-400" />
                        Microservices & API Integrations
                    </h2>

                    {savedNotice && (
                        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            <span>{savedNotice}</span>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Gemini Key Config */}
                        <div className="p-4 bg-slate-950 border border-slate-800/80 rounded-xl space-y-2">
                            <div className="flex justify-between items-center">
                                <label className="text-xs font-semibold text-slate-200">Google Gemini API Key</label>
                                <span className="text-[10px] text-emerald-400 font-mono">Authenticated</span>
                            </div>
                            <div className="relative">
                                <input
                                    type={showKey ? 'text' : 'password'}
                                    value={geminiKey}
                                    onChange={(e) => setGeminiKey(e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 pr-16 text-xs text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
                                />
                                <div className="absolute right-2 top-2 flex items-center gap-1 text-slate-400">
                                    <button
                                        type="button"
                                        onClick={() => setShowKey(!showKey)}
                                        className="hover:text-slate-200 p-0.5"
                                    >
                                        {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleSaveKey}
                                        className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium ml-1"
                                    >
                                        Save
                                    </button>
                                </div>
                            </div>
                            <p className="text-[10px] text-slate-500">Used by Copywriter and Multimodal Vision Agents.</p>
                        </div>

                        {/* ChromaDB Status */}
                        <div className="p-4 bg-slate-950 border border-slate-800/80 rounded-xl space-y-2">
                            <div className="flex justify-between items-center">
                                <label className="text-xs font-semibold text-slate-200">ChromaDB Local Vector Engine</label>
                                <span className="text-[10px] text-emerald-400 font-mono">Running (Localhost)</span>
                            </div>
                            <div className="flex items-center justify-between p-2 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-slate-300">
                                <span>./chroma_data</span>
                                <span className="text-indigo-400 text-[10px]">Collection: `marketing_grounding`</span>
                            </div>
                            <p className="text-[10px] text-slate-500">Stores chunked RAG embeddings with cosine similarity search.</p>
                        </div>

                        {/* DuckDuckGo Search API */}
                        <div className="p-4 bg-slate-950 border border-slate-800/80 rounded-xl space-y-2">
                            <div className="flex justify-between items-center">
                                <label className="text-xs font-semibold text-slate-200">DuckDuckGo Search Engine</label>
                                <span className="text-[10px] text-emerald-400 font-mono">Ready (Rate Unlimited)</span>
                            </div>
                            <div className="flex items-center justify-between p-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-300">
                                <span>SERP & Trends Scraper</span>
                                <span className="text-slate-500 text-[10px]">DuckDuckGo Python Tool</span>
                            </div>
                            <p className="text-[10px] text-slate-500">Conducts market sentiment and competitor teardowns for Research Agent.</p>
                        </div>

                        {/* Omnichannel Social & Webhook Connectors */}
                        <div className="p-4 bg-slate-950 border border-slate-800/80 rounded-xl space-y-2">
                            <div className="flex justify-between items-center">
                                <label className="text-xs font-semibold text-slate-200">Omnichannel Social & Webhook Gateway</label>
                                <span className="text-[10px] text-emerald-400 font-mono">10 Channels Connected</span>
                            </div>
                            <div className="flex items-center justify-between p-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-300">
                                <span className="flex items-center gap-1.5">
                                    <Share2 className="w-3.5 h-3.5 text-pink-400" />
                                    LinkedIn, X, Meta, YouTube, TikTok, Reddit + Webhook
                                </span>
                                <button className="text-indigo-400 hover:text-indigo-300 text-[10px] font-medium">Manage Keys</button>
                            </div>
                            <p className="text-[10px] text-slate-500">Coordinates autonomous broadcasts across all networks via Social Publisher Agent.</p>
                        </div>
                    </div>
                </div>

                {/* Team Members List */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3.5">
                        <div>
                            <h2 className="text-sm font-semibold text-white">Workspace Collaborators & Roles</h2>
                            <p className="text-xs text-slate-400">Configure team access privileges across the Swarm platform.</p>
                        </div>
                        <button
                            onClick={() => setShowInviteModal(true)}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold py-2 px-3.5 rounded-xl shadow transition flex items-center gap-1.5 cursor-pointer"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Invite Collaborator</span>
                        </button>
                    </div>

                    <div className="space-y-2.5">
                        {collaborators.map((user) => (
                            <div
                                key={user.id}
                                className="flex items-center justify-between p-3.5 bg-slate-950/70 border border-slate-800/80 rounded-xl text-xs"
                            >
                                <div className="flex items-center space-x-3">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center font-bold text-white text-xs">
                                        {user.name.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-slate-200">{user.name}</p>
                                        <p className="text-[11px] text-slate-500">{user.email}</p>
                                    </div>
                                </div>

                                <div className="flex items-center space-x-3">
                                    <span className="px-2.5 py-1 rounded-md text-[10px] font-mono capitalize bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                                        {user.role.replace('_', ' ')}
                                    </span>
                                    <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md text-[10px]">
                                        {user.status}
                                    </span>
                                    {user.role !== 'leader' && (
                                        <button
                                            onClick={() => handleRemoveCollaborator(user.id)}
                                            className="text-slate-500 hover:text-rose-400 p-1 transition cursor-pointer"
                                            title="Revoke seat"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </main>

            {/* Invite Teammate Modal */}
            {showInviteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
                        <h3 className="text-sm font-bold text-white">Invite Workspace Collaborator</h3>
                        <form onSubmit={handleAddCollaborator} className="space-y-3 text-xs">
                            <div>
                                <label className="block text-[11px] font-medium text-slate-300 mb-1">Full Name</label>
                                <input
                                    type="text"
                                    required
                                    value={newCollab.name}
                                    onChange={(e) => setNewCollab((prev) => ({ ...prev, name: e.target.value }))}
                                    placeholder="Jane Doe"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-medium text-slate-300 mb-1">Work Email</label>
                                <input
                                    type="email"
                                    required
                                    value={newCollab.email}
                                    onChange={(e) => setNewCollab((prev) => ({ ...prev, email: e.target.value }))}
                                    placeholder="jane@company.com"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-medium text-slate-300 mb-1">Role Permissions</label>
                                <select
                                    value={newCollab.role}
                                    onChange={(e) => setNewCollab((prev) => ({ ...prev, role: e.target.value }))}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                                >
                                    <option value="marketer">Marketer (Campaigns & Copy)</option>
                                    <option value="backend_dev">Backend / RAG Developer</option>
                                    <option value="frontend_dev">Frontend UI Developer</option>
                                    <option value="admin">System Admin</option>
                                </select>
                            </div>
                            <div className="pt-2 flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setShowInviteModal(false)}
                                    className="flex-1 py-2 rounded-xl border border-slate-800 hover:bg-slate-800 text-slate-400 text-xs font-medium cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow cursor-pointer"
                                >
                                    Send Invite
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}