import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import { Database, Upload, Trash2, FileText, CheckCircle2, Search, Plus, Sparkles } from 'lucide-react';

export default function KnowledgeBase() {
    const [documents, setDocuments] = useState([
        { id: 1, name: 'Brand_Guidelines_2026.pdf', size: '2.4 MB', status: 'Indexed', chunks: 48, updated: 'Today' },
        { id: 2, name: 'Q3_Competitor_Analysis.docx', size: '1.1 MB', status: 'Indexed', chunks: 24, updated: 'Yesterday' },
        { id: 3, name: 'ICP_Buyer_Personas_Enterprise.pdf', size: '3.8 MB', status: 'Indexed', chunks: 64, updated: '3 days ago' },
    ]);
    const [searchQuery, setSearchQuery] = useState('');
    const [notification, setNotification] = useState('');

    const handleFileUpload = (e) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const newDocs = Array.from(files).map((file, i) => ({
            id: Date.now() + i,
            name: file.name,
            size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
            status: 'Indexed',
            chunks: Math.floor(Math.random() * 40) + 16,
            updated: 'Just now',
        }));

        setDocuments((prev) => [...newDocs, ...prev]);
        setNotification(`Successfully ingested and indexed ${files.length} document(s) into vector memory.`);
        setTimeout(() => setNotification(''), 3500);
    };

    const handleDelete = (id) => {
        setDocuments((prev) => prev.filter((doc) => doc.id !== id));
    };

    const filteredDocuments = documents.filter((doc) =>
        doc.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white pb-16">
            <Navbar />
            <main className="max-w-6xl mx-auto p-6 sm:p-8 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2.5">
                            <span className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
                                <Database className="w-5 h-5" />
                            </span>
                            <h1 className="text-xl font-bold text-white tracking-tight">
                                Vector Knowledge Base & Grounding
                            </h1>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                            Ground your multi-agent marketing swarm with company data, pitch decks, and brand voice guidelines.
                        </p>
                    </div>

                    <label className="cursor-pointer bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-xs font-semibold py-2.5 px-4 rounded-xl shadow-lg shadow-indigo-600/20 transition flex items-center justify-center gap-2 self-start sm:self-auto active:scale-95">
                        <Upload className="w-4 h-4" />
                        <span>Upload Brand File</span>
                        <input
                            type="file"
                            multiple
                            accept=".pdf,.docx,.txt,.md"
                            onChange={handleFileUpload}
                            className="hidden"
                        />
                    </label>
                </div>

                {notification && (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>{notification}</span>
                    </div>
                )}

                {/* Document List */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
                        <div className="flex items-center gap-2">
                            <h2 className="text-sm font-semibold text-white">Indexed Grounding Assets</h2>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                                {filteredDocuments.length} files
                            </span>
                        </div>

                        <div className="relative w-full sm:w-64">
                            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search indexed assets..."
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-9 pr-3 text-xs text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition"
                            />
                        </div>
                    </div>

                    {filteredDocuments.length === 0 ? (
                        <div className="text-center py-12 text-slate-500 space-y-2">
                            <Database className="w-8 h-8 text-slate-600 mx-auto" />
                            <p className="text-xs font-medium">No grounding assets match your search.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filteredDocuments.map((doc) => (
                                <div
                                    key={doc.id}
                                    className="flex items-center justify-between p-4 bg-slate-950/70 border border-slate-800/80 rounded-xl hover:border-slate-700/80 transition"
                                >
                                    <div className="flex items-center space-x-3.5 min-w-0 pr-2">
                                        <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl shrink-0">
                                            <FileText className="w-5 h-5 text-indigo-400" />
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="text-xs font-semibold text-slate-200 truncate">{doc.name}</h3>
                                            <p className="text-[10px] text-slate-400 mt-0.5">
                                                {doc.size} • <span className="text-indigo-400 font-mono">{doc.chunks} semantic chunks</span> • Updated {doc.updated}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-3 shrink-0">
                                        <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg text-[10px] font-medium flex items-center gap-1.5">
                                            <CheckCircle2 className="w-3.5 h-3.5" /> {doc.status}
                                        </span>
                                        <button
                                            onClick={() => handleDelete(doc.id)}
                                            className="text-slate-500 hover:text-rose-400 transition p-1.5 hover:bg-rose-500/10 rounded-lg"
                                            title="Delete asset"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}