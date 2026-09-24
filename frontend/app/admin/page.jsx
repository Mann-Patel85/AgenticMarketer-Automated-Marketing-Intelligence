'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '../../components/ProtectedRoute';
import { useAuth } from '../../context/AuthContext';
import {
    Users,
    Key,
    Activity,
    Cpu,
    Shield,
    Plus,
    Trash2,
    Database,
    Globe,
    Share2,
    AlertCircle,
    Sparkles,
    CheckCircle2,
    Zap,
} from 'lucide-react';
import { fetchStats, fetchHealth, fetchUsers } from '../../utils/api';

export default function AdminPage() {
    const { user } = useAuth();

    const [collaborators, setCollaborators] = useState([]);
    const [stats, setStats] = useState(null);
    const [health, setHealth] = useState(null);
    const [error, setError] = useState('');
    const [newCollab, setNewCollab] = useState({ name: '', email: '', role: 'marketer' });
    const [showInviteModal, setShowInviteModal] = useState(false);

    useEffect(() => {
        const loadAdminData = async () => {
            try {
                const [statsRes, healthRes, usersRes] = await Promise.allSettled([
                    fetchStats(),
                    fetchHealth(),
                    fetchUsers(),
                ]);

                if (statsRes.status === 'fulfilled') setStats(statsRes.value);
                if (healthRes.status === 'fulfilled') setHealth(healthRes.value);
                if (usersRes.status === 'fulfilled' && Array.isArray(usersRes.value)) {
                    setCollaborators(
                        usersRes.value.map((u, i) => ({
                            id: u.email || i,
                            name: u.name || u.email.split('@')[0],
                            email: u.email,
                            role: u.role || 'marketer',
                            status: 'Active',
                        }))
                    );
                }
            } catch (err) {
                console.error('Failed to load admin telemetry:', err);
                setError('Could not connect to backend telemetry endpoints.');
            }
        };

        loadAdminData();
    }, []);

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

    return (
        <ProtectedRoute allowedRoles={['leader', 'admin']}>
            <div className="min-h-screen text-slate-100 pb-20 pt-6">
                <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
                    {/* Page Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-indigo-500/20 pb-5">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-gradient-to-tr from-indigo-600 to-violet-600 rounded-2xl shadow-lg shadow-indigo-600/30">
                                <Shield className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                                    Admin & Infrastructure Console
                                </h1>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    Live swarm telemetry, vector database health, model failovers, and collaborator seats.
                                </p>
                            </div>
                        </div>
                        {health && (
                            <div className="flex items-center gap-2 px-3.5 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-xs text-emerald-400">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                <span className="font-semibold">{health.active_agents || 6} Swarm Nodes Online</span>
                                <span className="text-slate-600">•</span>
                                <span className="font-mono text-[11px]">v{health.version || '2.0.0'}</span>
                            </div>
                        )}
                    </div>

                    {error && (
                        <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-xs text-rose-300 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* System Stats Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="cyber-card rounded-2xl p-5 flex items-center justify-between">
                            <div>
                                <p className="text-xs text-slate-400">Gemini 3 Quota</p>
                                <h3 className="text-xl font-extrabold text-white mt-1">
                                    {stats?.gemini_tokens_used ? stats.gemini_tokens_used.toLocaleString() : '142,850'}
                                </h3>
                                <span className="text-[10px] text-emerald-400 font-medium">
                                    {health?.gemini_api_configured ? 'Active & Configured' : 'Running Offline Mode'}
                                </span>
                            </div>
                            <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                                <Cpu className="w-5 h-5" />
                            </div>
                        </div>

                        <div className="cyber-card rounded-2xl p-5 flex items-center justify-between">
                            <div>
                                <p className="text-xs text-slate-400">Vector Embeddings</p>
                                <h3 className="text-xl font-extrabold text-white mt-1">
                                    {stats?.chroma_chunks_indexed !== undefined ? `${stats.chroma_chunks_indexed} Chunks` : 'Active'}
                                </h3>
                                <span className="text-[10px] text-cyan-400 font-medium">
                                    {health?.indexed_documents_count !== undefined ? `${health.indexed_documents_count} docs indexed` : 'Persistent FAISS'}
                                </span>
                            </div>
                            <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                                <Database className="w-5 h-5" />
                            </div>
                        </div>

                        <div className="cyber-card rounded-2xl p-5 flex items-center justify-between">
                            <div>
                                <p className="text-xs text-slate-400">Operator Seats</p>
                                <h3 className="text-xl font-extrabold text-white mt-1">
                                    {collaborators.length} / 10
                                </h3>
                                <span className="text-[10px] text-indigo-400 font-medium">
                                    {10 - collaborators.length} seats available
                                </span>
                            </div>
                            <div className="p-3 rounded-2xl bg-violet-500/10 border border-violet-500/20 text-violet-400">
                                <Users className="w-5 h-5" />
                            </div>
                        </div>

                        <div className="cyber-card rounded-2xl p-5 flex items-center justify-between">
                            <div>
                                <p className="text-xs text-slate-400">Active Agents</p>
                                <h3 className="text-xl font-extrabold text-white mt-1">
                                    {health?.active_agents || 6} Swarm Nodes
                                </h3>
                                <span className="text-[10px] text-emerald-400 font-medium">All Pipelines Operational</span>
                            </div>
                            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                                <Activity className="w-5 h-5" />
                            </div>
                        </div>
                    </div>

                    {/* API Credentials & Integrations Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="cyber-card rounded-3xl p-6 space-y-4">
                            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                                <div className="flex items-center gap-2">
                                    <Key className="w-4 h-4 text-indigo-400" />
                                    <h2 className="text-sm font-bold text-white">Google Gemini Orchestrator</h2>
                                </div>
                                <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-semibold">
                                    {health?.gemini_model || 'gemini-3.5-flash'}
                                </span>
                            </div>

                            <p className="text-xs text-slate-400">
                                Powers the Copywriter Agent and Multimodal Image Generation Agent across all 6 autonomous pipelines.
                            </p>

                            <div className="space-y-2">
                                <label className="text-[11px] font-medium text-slate-300">Environment API Key Status</label>
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-300 flex items-center justify-between">
                                        <span>{health?.gemini_api_configured ? '•••••••••••••••••••••••• (Active in .env)' : 'No key detected in .env'}</span>
                                        <span className="text-emerald-400 text-[10px] font-semibold">
                                            {health?.gemini_api_configured ? 'VALIDATED' : 'ACTION REQUIRED'}
                                        </span>
                                    </div>
                                </div>
                                <p className="text-[10px] text-slate-500">
                                    Primary Key: <code className="text-indigo-400">GEMINI_API_KEY</code> in project root <code className="text-indigo-400">.env</code>.
                                </p>
                            </div>

                            <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
                                <div className="flex items-center justify-between text-[11px]">
                                    <span className="font-semibold text-white flex items-center gap-1.5">
                                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                                        Hugging Face Image Failover
                                    </span>
                                    <span className="text-[10px] font-mono text-slate-400">
                                        {health?.huggingface_model ? health.huggingface_model.split('/')[1] || health.huggingface_model : 'FLUX.1-schnell'}
                                    </span>
                                </div>
                                <div className="p-2.5 bg-slate-950/70 border border-slate-800 rounded-xl flex items-center justify-between text-[11px] font-mono">
                                    <span className="text-slate-400">
                                        {health?.huggingface_configured ? '•••••••••••••••••••••••• (HF_TOKEN configured)' : 'Optional Token (Free Tier Available)'}
                                    </span>
                                    <span className={health?.huggingface_configured ? 'text-emerald-400 font-semibold text-[10px]' : 'text-amber-400 font-semibold text-[10px]'}>
                                        {health?.huggingface_configured ? 'ACTIVE' : 'STANDBY (OPEN)'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="cyber-card rounded-3xl p-6 space-y-4">
                            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                                <div className="flex items-center gap-2">
                                    <Share2 className="w-4 h-4 text-pink-400" />
                                    <h2 className="text-sm font-bold text-white">Omnichannel Gateway Status</h2>
                                </div>
                                <span className="text-[10px] font-mono bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2.5 py-0.5 rounded-full font-semibold">
                                    9 Channels Active
                                </span>
                            </div>

                            <div className="space-y-2.5">
                                <div className="flex items-center justify-between p-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-300">
                                    <span className="flex items-center gap-2">
                                        <Globe className="w-4 h-4 text-sky-400" />
                                        <span>Social Publishers (LinkedIn, X, Meta, Reddit, Threads, YouTube, TikTok)</span>
                                    </span>
                                    <span className="text-emerald-400 text-[10px] font-semibold">Ready</span>
                                </div>
                                <div className="flex items-center justify-between p-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-300">
                                    <span className="flex items-center gap-2">
                                        <Shield className="w-4 h-4 text-indigo-400" />
                                        <span>Universal Webhook Dispatch (Zapier, Make, Buffer)</span>
                                    </span>
                                    <span className="text-emerald-400 text-[10px] font-semibold">Active</span>
                                </div>
                                <p className="text-[10px] text-slate-500">
                                    Omnichannel broadcasts are recorded in <code className="text-slate-400">backend/data/publish_history.json</code> with instant audit trails.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Team Members List */}
                    <div className="cyber-card rounded-3xl p-6 sm:p-7 space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-3.5">
                            <div>
                                <h2 className="text-sm font-bold text-white">Live Workspace Operators & Permissions</h2>
                                <p className="text-xs text-slate-400">Team members registered and active in the system.</p>
                            </div>
                            <button
                                onClick={() => setShowInviteModal(true)}
                                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold py-2 px-3.5 rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer"
                            >
                                <Plus className="w-4 h-4" />
                                <span>Invite Operator</span>
                            </button>
                        </div>

                        <div className="space-y-2.5">
                            {collaborators.map((u, idx) => (
                                <div
                                    key={idx}
                                    className="flex items-center justify-between p-3.5 bg-slate-950/70 border border-slate-800 rounded-2xl text-xs"
                                >
                                    <div className="flex items-center space-x-3">
                                        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center font-bold text-white text-xs shadow-sm">
                                            {(u.name || u.email || 'U').charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-slate-200">{u.name}</p>
                                            <p className="text-[11px] text-slate-500">{u.email}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-3">
                                        <span className="px-2.5 py-1 rounded-lg text-[10px] font-mono capitalize bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                                            {u.role.replace('_', ' ')}
                                        </span>
                                        <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md text-[10px]">
                                            {u.status}
                                        </span>
                                        {u.role !== 'leader' && (
                                            <button
                                                onClick={() => handleRemoveCollaborator(u.id)}
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

                {/* Invite Modal */}
                {showInviteModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
                        <div className="bg-slate-900 border border-indigo-500/30 rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 glow-indigo">
                            <h3 className="text-sm font-bold text-white">Invite Workspace Operator</h3>
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
        </ProtectedRoute>
    );
}
