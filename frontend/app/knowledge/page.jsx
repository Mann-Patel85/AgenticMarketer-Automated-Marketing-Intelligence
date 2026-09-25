'use client';

import { useState, useEffect, useRef } from 'react';
import ProtectedRoute from '../../components/ProtectedRoute';
import {
    Database,
    Upload,
    UploadCloud,
    Trash2,
    FileText,
    CheckCircle2,
    Search,
    Sparkles,
    AlertCircle,
    Loader2,
    X,
    Sliders,
    Zap,
    Copy,
    Check,
    Layers,
    Clock,
    Target,
    BarChart3,
    ChevronDown,
    ChevronUp,
    History,
    TrendingUp,
    Brain,
    ShieldAlert,
} from 'lucide-react';
import { fetchDocuments, uploadDocument, deleteDocument, queryKnowledgeBase } from '../../utils/api';

const getPerformanceNow = () => (typeof window !== 'undefined' && window.performance ? window.performance.now() : 0);

export default function KnowledgePage() {
    const [documents, setDocuments] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [notification, setNotification] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [stagedFiles, setStagedFiles] = useState([]);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef(null);

    // Advanced Vector Search Tester State
    const [testQuery, setTestQuery] = useState('');
    const [queryResults, setQueryResults] = useState(null);
    const [isQuerying, setIsQuerying] = useState(false);
    const [topK, setTopK] = useState(4);
    const [minScoreThreshold, setMinScoreThreshold] = useState(0);
    const [queryLatencyMs, setQueryLatencyMs] = useState(null);
    const [copiedChunkIdx, setCopiedChunkIdx] = useState(null);
    const [highlightKeywords, setHighlightKeywords] = useState(true);
    const [showSettings, setShowSettings] = useState(false);
    const [expandedChunks, setExpandedChunks] = useState({});
    const [queryHistory, setQueryHistory] = useState([]);
    const [showHistory, setShowHistory] = useState(false);
    const [synthesizedAnswer, setSynthesizedAnswer] = useState('');

    const loadDocuments = async () => {
        try {
            setIsLoading(true);
            const data = await fetchDocuments();
            if (Array.isArray(data)) {
                setDocuments(
                    data.map((d, i) => ({
                        id: d.id || d.filename || i,
                        filename: d.filename,
                        name: d.filename || 'Document',
                        size: d.size_formatted || `${((d.size_bytes || 1024) / 1024).toFixed(1)} KB`,
                        status: 'Indexed',
                        chunks: d.chunk_count || 1,
                        updated: 'Active Vector Store',
                    }))
                );
            }
        } catch (err) {
            console.error('Error fetching documents:', err);
            setError('Could not connect to vector store. Ensure backend is running.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadDocuments();
    }, []);

    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files || []);
        if (files.length > 0) {
            setStagedFiles((prev) => [...prev, ...files]);
            setError('');
        }
    };

    const handleDropFiles = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const files = Array.from(e.dataTransfer.files || []);
        if (files.length > 0) {
            setStagedFiles((prev) => [...prev, ...files]);
            setError('');
        }
    };

    const handleRemoveStagedFile = (idx) => {
        setStagedFiles((prev) => prev.filter((_, i) => i !== idx));
    };

    const handleIngestStagedFiles = async () => {
        if (stagedFiles.length === 0) return;
        setIsUploading(true);
        setError('');
        setNotification('');
        try {
            let uploadedCount = 0;
            for (let i = 0; i < stagedFiles.length; i++) {
                await uploadDocument(stagedFiles[i]);
                uploadedCount++;
            }
            setNotification(`Successfully ingested ${uploadedCount} document(s) into ChromaDB vector memory!`);
            setStagedFiles([]);
            await loadDocuments();
            setTimeout(() => setNotification(''), 5000);
        } catch (err) {
            console.error('Ingestion failed:', err);
            setError(err.response?.data?.detail || 'Failed to ingest and index document into vectors.');
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleDelete = async (doc) => {
        const idToDelete = doc.id || doc.filename;
        const displayName = doc.filename || doc.name || 'document';
        if (!window.confirm(`Delete "${displayName}" from vector memory?`)) return;
        try {
            await deleteDocument(idToDelete);
            setNotification(`Deleted "${displayName}" from vector store.`);
            setError('');
            await loadDocuments();
            setTimeout(() => setNotification(''), 3000);
        } catch (err) {
            console.error('Delete failed:', err);
            setError(err.response?.data?.detail || 'Failed to delete document.');
        }
    };

    const handleTestQuery = async (e, customQuery = null) => {
        if (e && e.preventDefault) e.preventDefault();
        const queryToRun = (customQuery !== null ? customQuery : testQuery).trim();
        if (!queryToRun) return;

        if (customQuery !== null) {
            setTestQuery(customQuery);
        }

        setIsQuerying(true);
        setError('');
        setExpandedChunks({});
        const startTime = getPerformanceNow();

        try {
            const res = await queryKnowledgeBase(queryToRun, topK);
            const results = Array.isArray(res) ? res : (res?.results || []);
            const answerText = Array.isArray(res) ? '' : (res?.answer || '');
            setQueryResults(results);
            setSynthesizedAnswer(answerText);
            const latency = Math.round(getPerformanceNow() - startTime);
            setQueryLatencyMs(latency);
            setQueryHistory((prev) => {
                const next = [{ query: queryToRun, latency, count: results.length, ts: Date.now() }, ...prev];
                return next.slice(0, 8);
            });
        } catch (err) {
            console.error('RAG query failed:', err);
            setError(err.response?.data?.detail || 'Vector search failed.');
        } finally {
            setIsQuerying(false);
        }
    };

    const toggleChunkExpand = (idx) => {
        setExpandedChunks((prev) => ({ ...prev, [idx]: !prev[idx] }));
    };

    const handleCopyChunk = (text, idx) => {
        navigator.clipboard.writeText(text);
        setCopiedChunkIdx(idx);
        setTimeout(() => setCopiedChunkIdx(null), 2000);
    };

    const renderHighlightedText = (text, query) => {
        if (!highlightKeywords || !query || !query.trim()) return text;
        const words = query.toLowerCase().match(/\b\w{3,}\b/g);
        if (!words || words.length === 0) return text;

        const uniqueWords = Array.from(new Set(words));
        const escaped = uniqueWords.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
        const regex = new RegExp(`(${escaped})`, 'gi');
        const parts = text.split(regex);

        return parts.map((part, i) =>
            part.match(new RegExp(`^(${escaped})$`, 'i')) ? (
                <mark
                    key={i}
                    className="bg-indigo-500/30 text-indigo-200 px-1 py-0.5 rounded font-medium border border-indigo-500/40"
                >
                    {part}
                </mark>
            ) : (
                part
            )
        );
    };

    const PRESET_QUERIES = [
        { label: '🎯 Brand Voice & Tone', query: 'What is our brand voice, tone profile, and communication style?' },
        { label: '💡 Core Value Proposition', query: 'What is our main value proposition and competitive differentiator?' },
        { label: '👥 Target Audience & ICP', query: 'Who is our primary target audience, ICP persona, and key pain points?' },
        { label: '🎨 Visual Style & Colors', query: 'What are our brand visual style, hex color codes, and visual metaphors?' },
        { label: '⚔️ Competitor Positioning', query: 'How do we position against competitors and what are our key battlecard hooks?' },
        { label: '⚡ Pricing & Offerings', query: 'What are our primary SaaS pricing tiers, plans, and feature packages?' },
    ];

    const filteredDocuments = documents.filter((doc) =>
        (doc.name || doc.filename || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredQueryResults = queryResults
        ? queryResults.filter((r) => r.score * 100 >= minScoreThreshold)
        : null;

    const totalChunksIndexed = documents.reduce((sum, d) => sum + (d.chunks || 0), 0);

    return (
        <ProtectedRoute>
            <div className="min-h-screen text-slate-100 pb-20 pt-6">
                <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-indigo-500/20 pb-5">
                        <div>
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-gradient-to-tr from-indigo-600 to-violet-600 rounded-2xl shadow-lg shadow-indigo-600/30">
                                    <Database className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                                        Vector Knowledge Base & RAG Memory
                                    </h1>
                                    <p className="text-xs text-slate-400 mt-0.5">
                                        Ground multi-agent marketing runs with proprietary brand guidelines, battlecards, and messaging playbooks.
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/30 rounded-full text-xs font-mono text-indigo-300">
                                FAISS / ChromaDB
                            </span>
                        </div>
                    </div>

                    {/* DEDICATED INGESTION CARD */}
                    <div className="cyber-card rounded-3xl p-6 sm:p-7 space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <UploadCloud className="w-5 h-5 text-indigo-400" />
                                <h2 className="text-sm font-bold text-white tracking-wide">
                                    Upload & Ingest Brand Guidelines
                                </h2>
                            </div>
                            <span className="text-[11px] font-mono text-cyan-300 bg-cyan-950/60 border border-cyan-800/60 px-3 py-1 rounded-full">
                                PDF • DOCX • TXT • MD
                            </span>
                        </div>

                        <div
                            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                            onDragLeave={() => setIsDragging(false)}
                            onDrop={handleDropFiles}
                            onClick={() => fileInputRef.current?.click()}
                            className={`relative border-2 border-dashed rounded-2xl p-7 text-center transition-all cursor-pointer ${
                                isDragging
                                    ? 'border-indigo-400 bg-indigo-500/15'
                                    : 'border-slate-800 hover:border-indigo-500/40 bg-slate-950/50'
                            }`}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                accept=".pdf,.docx,.txt,.md"
                                onChange={handleFileSelect}
                                className="hidden"
                            />
                            <div className="flex flex-col items-center pointer-events-none space-y-2">
                                <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 shadow-md">
                                    <UploadCloud className="w-7 h-7" />
                                </div>
                                <p className="text-xs font-bold text-slate-200">
                                    Click to browse files or drag & drop here
                                </p>
                                <p className="text-[11px] text-slate-400 max-w-md">
                                    Stage your documents for chunking, embedding, and vector storage in the RAG index.
                                </p>
                            </div>
                        </div>

                        {/* STAGED FILES AND INGEST BUTTON */}
                        {stagedFiles.length > 0 && (
                            <div className="p-4 bg-slate-950/90 border border-indigo-500/30 rounded-2xl space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-semibold text-indigo-300">
                                        Staged Files Ready to Ingest ({stagedFiles.length}):
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => setStagedFiles([])}
                                        className="text-[10px] text-slate-500 hover:text-slate-300 transition cursor-pointer"
                                    >
                                        Clear all
                                    </button>
                                </div>
                                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                                    {stagedFiles.map((file, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                                            <div className="flex items-center gap-2 min-w-0 pr-2">
                                                <FileText className="w-4 h-4 text-indigo-400 shrink-0" />
                                                <span className="text-slate-200 font-medium truncate text-xs">{file.name}</span>
                                                <span className="text-slate-500 text-[10px]">({(file.size / 1024).toFixed(1)} KB)</span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveStagedFile(idx)}
                                                className="text-slate-500 hover:text-rose-400 p-1 cursor-pointer"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                <button
                                    type="button"
                                    onClick={handleIngestStagedFiles}
                                    disabled={isUploading}
                                    className={`w-full py-3 px-4 rounded-xl text-xs font-semibold text-white shadow-lg transition flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] ${
                                        isUploading
                                            ? 'bg-indigo-600/60 cursor-not-allowed'
                                            : 'bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-500 hover:from-indigo-500 hover:to-violet-500 shadow-indigo-600/30'
                                    }`}
                                >
                                    {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                                    <span>{isUploading ? 'Chunking & Embedding into Vectors...' : 'Ingest Document into ChromaDB'}</span>
                                </button>
                            </div>
                        )}
                    </div>

                    {notification && (
                        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-xs text-emerald-300 flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                            <span>{notification}</span>
                        </div>
                    )}

                    {error && (
                        <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-xs text-rose-300 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Document List */}
                    <div className="cyber-card rounded-3xl p-6 sm:p-7 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
                            <div className="flex items-center gap-2">
                                <h2 className="text-sm font-bold text-white">Indexed Grounding Assets</h2>
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                                    {filteredDocuments.length} live files
                                </span>
                            </div>

                            <div className="relative w-full sm:w-64">
                                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Filter indexed assets..."
                                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl py-2 pl-9 pr-3 text-xs text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition"
                                />
                            </div>
                        </div>

                        {isLoading ? (
                            <div className="text-center py-12 text-slate-500 space-y-2">
                                <Loader2 className="w-6 h-6 text-indigo-400 animate-spin mx-auto" />
                                <p className="text-xs">Loading vector collections from backend...</p>
                            </div>
                        ) : filteredDocuments.length === 0 ? (
                            <div className="text-center py-12 text-slate-500 space-y-2">
                                <Database className="w-8 h-8 text-slate-600 mx-auto" />
                                <p className="text-xs font-medium">No grounding assets found in vector store.</p>
                                <p className="text-[11px] text-slate-600">Upload a .pdf, .docx, .txt, or .md file above to ground your agents.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {filteredDocuments.map((doc) => (
                                    <div
                                        key={doc.id}
                                        className="flex items-center justify-between p-4 bg-slate-950/70 border border-slate-800/80 rounded-2xl hover:border-indigo-500/30 transition"
                                    >
                                        <div className="flex items-center space-x-3.5 min-w-0 pr-2">
                                            <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl shrink-0">
                                                <FileText className="w-5 h-5 text-indigo-400" />
                                            </div>
                                            <div className="min-w-0">
                                                <h3 className="text-xs font-semibold text-slate-200 truncate">{doc.name}</h3>
                                                <p className="text-[10px] text-slate-400 mt-0.5">
                                                    {doc.size} • <span className="text-indigo-400 font-mono">{doc.chunks} semantic chunks</span> • {doc.updated}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-3 shrink-0">
                                            <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg text-[10px] font-medium flex items-center gap-1.5">
                                                <CheckCircle2 className="w-3.5 h-3.5" /> {doc.status}
                                            </span>
                                            <button
                                                onClick={() => handleDelete(doc)}
                                                className="text-slate-500 hover:text-rose-400 transition p-1.5 hover:bg-rose-500/10 rounded-lg cursor-pointer"
                                                title="Delete asset from RAG memory"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* LIVE SEMANTIC VECTOR SEARCH TESTER */}
                    <div className="cyber-card rounded-3xl shadow-2xl relative overflow-hidden">
                        {/* Header */}
                        <div className="p-6 sm:p-7 border-b border-slate-800/80">
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                                <div className="flex items-start gap-3">
                                    <div className="p-3 bg-gradient-to-tr from-indigo-600/30 to-violet-600/30 border border-indigo-500/30 rounded-2xl text-indigo-400 shrink-0">
                                        <Brain className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h2 className="text-base font-extrabold text-white tracking-tight">
                                                Live Semantic Vector Search Tester
                                            </h2>
                                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                                Live
                                            </span>
                                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center gap-1">
                                                <Zap className="w-3 h-3 text-cyan-400" /> Hybrid Cosine + Dense
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-400 mt-1 max-w-xl">
                                            Test how your knowledge base retrieves and ranks grounding context.
                                            Inspect chunk relevance scores, word distributions, and latency before feeding to Swarm agents.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                    {queryHistory.length > 0 && (
                                        <button
                                            type="button"
                                            onClick={() => setShowHistory((p) => !p)}
                                            className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition flex items-center gap-1.5 cursor-pointer ${
                                                showHistory
                                                    ? 'bg-violet-600/20 border-violet-500/40 text-violet-300'
                                                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                                            }`}
                                        >
                                            <History className="w-3.5 h-3.5" />
                                            <span>History ({queryHistory.length})</span>
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => setShowSettings((prev) => !prev)}
                                        className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition flex items-center gap-1.5 cursor-pointer ${
                                            showSettings
                                                ? 'bg-indigo-600/20 border-indigo-500/40 text-indigo-300'
                                                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                                        }`}
                                    >
                                        <Sliders className="w-3.5 h-3.5" />
                                        <span>Hyperparameters</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 sm:p-7 space-y-5">
                            {/* Search History Panel */}
                            {showHistory && queryHistory.length > 0 && (
                                <div className="p-4 bg-slate-950/80 border border-violet-500/20 rounded-2xl space-y-2">
                                    <div className="flex items-center gap-2 mb-3">
                                        <History className="w-3.5 h-3.5 text-violet-400" />
                                        <span className="text-[11px] font-semibold text-violet-300 uppercase tracking-wider">Recent Queries</span>
                                    </div>
                                    <div className="space-y-1.5">
                                        {queryHistory.map((h, i) => (
                                            <button
                                                key={i}
                                                type="button"
                                                onClick={(e) => handleTestQuery(e, h.query)}
                                                className="w-full text-left flex items-center justify-between gap-3 p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 transition group cursor-pointer"
                                            >
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <Search className="w-3 h-3 text-slate-500 shrink-0" />
                                                    <span className="text-xs text-slate-300 truncate group-hover:text-white transition">{h.query}</span>
                                                </div>
                                                <div className="flex items-center gap-2 shrink-0">
                                                    <span className="text-[10px] font-mono text-indigo-400">{h.count} chunks</span>
                                                    <span className="text-[10px] font-mono text-slate-500">{h.latency}ms</span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Hyperparameters Drawer */}
                            {showSettings && (
                                <div className="p-4 bg-slate-950/90 border border-indigo-500/20 rounded-2xl grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-semibold text-slate-300 flex items-center justify-between">
                                            <span>Top-K Chunks:</span>
                                            <span className="font-mono text-indigo-400 font-bold">{topK}</span>
                                        </label>
                                        <div className="flex gap-1.5">
                                            {[2, 4, 6, 8].map((k) => (
                                                <button
                                                    key={k}
                                                    type="button"
                                                    onClick={() => setTopK(k)}
                                                    className={`flex-1 py-1 rounded-lg font-mono text-[11px] transition ${
                                                        topK === k
                                                            ? 'bg-indigo-600 text-white font-bold'
                                                            : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
                                                    }`}
                                                >
                                                    {k}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-semibold text-slate-300 flex items-center justify-between">
                                            <span>Relevance Cutoff:</span>
                                            <span className="font-mono text-indigo-400 font-bold">{minScoreThreshold}%</span>
                                        </label>
                                        <input
                                            type="range"
                                            min="0"
                                            max="90"
                                            step="5"
                                            value={minScoreThreshold}
                                            onChange={(e) => setMinScoreThreshold(Number(e.target.value))}
                                            className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                                        />
                                    </div>

                                    <div className="space-y-1.5 flex flex-col justify-between">
                                        <label className="flex items-center gap-2 cursor-pointer text-[11px] text-slate-300 select-none">
                                            <input
                                                type="checkbox"
                                                checked={highlightKeywords}
                                                onChange={(e) => setHighlightKeywords(e.target.checked)}
                                                className="rounded accent-indigo-600 cursor-pointer"
                                            />
                                            <span>Highlight Query Matches</span>
                                        </label>
                                        <div className="text-[10px] text-slate-500 space-y-0.5">
                                            <div>Index: <strong className="text-slate-400">{totalChunksIndexed} chunks</strong> in memory</div>
                                            <div>Documents: <strong className="text-slate-400">{documents.length} files</strong> indexed</div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Preset Queries */}
                            <div className="space-y-2">
                                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                    <Target className="w-3.5 h-3.5 text-indigo-400" /> Grounding Directive Presets:
                                </span>
                                <div className="flex flex-wrap gap-2">
                                    {PRESET_QUERIES.map((p, idx) => (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={(e) => handleTestQuery(e, p.query)}
                                            className="px-3 py-1.5 rounded-xl bg-slate-950/80 hover:bg-indigo-600/20 border border-slate-800 hover:border-indigo-500/40 text-[11px] font-medium text-slate-300 hover:text-indigo-300 transition cursor-pointer active:scale-[0.97]"
                                        >
                                            {p.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Query Input */}
                            <form onSubmit={handleTestQuery} className="flex flex-col sm:flex-row gap-3">
                                <div className="relative flex-1">
                                    <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                                    <input
                                        type="text"
                                        value={testQuery}
                                        onChange={(e) => setTestQuery(e.target.value)}
                                        placeholder="Enter marketing directive or query to test vector grounding..."
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-10 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition"
                                    />
                                    {testQuery && (
                                        <button
                                            type="button"
                                            onClick={() => { setTestQuery(''); setQueryResults(null); }}
                                            className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300 p-1 cursor-pointer"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>
                                <button
                                    type="submit"
                                    disabled={isQuerying || !testQuery.trim()}
                                    className="bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-500 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold px-6 py-2.5 rounded-xl transition shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
                                >
                                    {isQuerying ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            <span>Searching Vectors...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Search className="w-4 h-4" />
                                            <span>Run Vector Query</span>
                                        </>
                                    )}
                                </button>
                            </form>

                            {/* Telemetry Stats Bar */}
                            {!isQuerying && queryResults && (
                                <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-950/70 border border-slate-800/80 rounded-2xl text-xs">
                                    <div className="flex items-center gap-4 flex-wrap">
                                        {queryLatencyMs !== null && (
                                            <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[11px]">
                                                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                                                <span>Latency: <strong className="text-slate-200">{queryLatencyMs} ms</strong></span>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[11px]">
                                            <Layers className="w-3.5 h-3.5 text-indigo-400" />
                                            <span>Matches: <strong className="text-slate-200">{filteredQueryResults?.length || 0} chunks</strong></span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[11px]">
                                            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                                            <span>Top Score: <strong className="text-emerald-400">{filteredQueryResults && filteredQueryResults[0] ? `${(filteredQueryResults[0].score * 100).toFixed(1)}%` : '0%'}</strong></span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[11px]">
                                            <BarChart3 className="w-3.5 h-3.5 text-violet-400" />
                                            <span>Avg Score: <strong className="text-violet-400">{
                                                filteredQueryResults && filteredQueryResults.length > 0
                                                    ? `${(filteredQueryResults.reduce((s, r) => s + r.score, 0) / filteredQueryResults.length * 100).toFixed(1)}%`
                                                    : '0%'
                                            }</strong></span>
                                        </div>
                                    </div>
                                    {filteredQueryResults && filteredQueryResults.length > 0 && (
                                        <div className="flex items-end gap-1 h-6">
                                            {filteredQueryResults.map((r, i) => {
                                                const h = Math.max(4, Math.round(r.score * 100 * 0.24));
                                                const col = r.score * 100 >= 75 ? 'bg-emerald-500' : r.score * 100 >= 50 ? 'bg-amber-500' : 'bg-indigo-500';
                                                return <div key={i} className={`w-3 ${col} rounded-sm opacity-80`} style={{ height: `${h}px` }} title={`Chunk ${i}: ${(r.score * 100).toFixed(1)}%`} />;
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Query Results */}
                            {!isQuerying && queryResults && (
                                <div className="space-y-4 pt-1">
                                    {/* AI Synthesized Executive Answer Card */}
                                    {synthesizedAnswer && (
                                        <div className="p-5 bg-gradient-to-r from-indigo-950/80 via-slate-900 to-violet-950/80 border border-indigo-500/40 rounded-2xl space-y-3 shadow-xl shadow-indigo-950/40">
                                            <div className="flex items-center justify-between border-b border-indigo-500/20 pb-3">
                                                <div className="flex items-center gap-2">
                                                    <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
                                                    <span className="text-xs font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-white to-violet-300 uppercase tracking-wider">
                                                        AI Grounded Executive Answer
                                                    </span>
                                                </div>
                                                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                                    RAG Intelligence Engine
                                                </span>
                                            </div>
                                            <div className="text-xs text-slate-200 leading-relaxed font-sans whitespace-pre-wrap">
                                                {synthesizedAnswer}
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between">
                                        <p className="text-xs font-semibold text-white flex items-center gap-1.5">
                                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                            <span>Retrieved Semantic Grounding Context ({filteredQueryResults?.length || 0}):</span>
                                        </p>
                                    </div>

                                    {!filteredQueryResults || filteredQueryResults.length === 0 ? (
                                        <div className="p-8 text-center bg-slate-950/60 border border-dashed border-slate-800 rounded-2xl space-y-2">
                                            <Database className="w-7 h-7 text-slate-600 mx-auto" />
                                            <p className="text-xs font-medium text-slate-400">
                                                No semantic matches met the cutoff score.
                                            </p>
                                        </div>
                                    ) : (
                                        filteredQueryResults.map((r, idx) => {
                                            const scorePct = (r.score * 100).toFixed(1);
                                            const numScore = r.score * 100;
                                            const isOptimal = numScore >= 75;
                                            const isGood = numScore >= 50 && numScore < 75;
                                            const wordCount = r.text ? r.text.trim().split(/\s+/).length : 0;
                                            const isExpanded = expandedChunks[idx] ?? false;
                                            const previewText = r.text && r.text.length > 280 ? r.text.slice(0, 280) + '…' : r.text;

                                            const scoreColor = isOptimal
                                                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                                                : isGood
                                                ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                                                : 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30';
                                            const barColor = isOptimal
                                                ? 'from-emerald-500 to-teal-400'
                                                : isGood
                                                ? 'from-amber-500 to-yellow-400'
                                                : 'from-indigo-500 to-violet-400';

                                            return (
                                                <div
                                                    key={idx}
                                                    className="bg-slate-950/80 border border-slate-800 rounded-2xl transition-all shadow-md"
                                                >
                                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-4 pb-3">
                                                        <div className="flex items-center gap-2 flex-wrap min-w-0">
                                                            <span className="px-2.5 py-0.5 rounded-lg bg-indigo-500/10 text-indigo-300 font-mono text-[11px] font-semibold border border-indigo-500/20 truncate max-w-[180px]">
                                                                {r.doc_name}
                                                            </span>
                                                            <span className="text-[11px] font-mono text-slate-500">Chunk #{r.chunk_index}</span>
                                                            <span className="text-[10px] text-slate-600">• {wordCount} words</span>
                                                        </div>

                                                        <div className="flex items-center gap-2 shrink-0">
                                                            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold flex items-center gap-1.5 border ${scoreColor}`}>
                                                                <span className={`w-1.5 h-1.5 rounded-full ${isOptimal ? 'bg-emerald-400' : isGood ? 'bg-amber-400' : 'bg-indigo-400'}`} />
                                                                {scorePct}% Match
                                                            </span>

                                                            <button
                                                                type="button"
                                                                onClick={() => handleCopyChunk(r.text, idx)}
                                                                className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 text-[11px] font-medium transition flex items-center gap-1.5 cursor-pointer"
                                                                title="Copy chunk text"
                                                            >
                                                                {copiedChunkIdx === idx ? (
                                                                    <><Check className="w-3.5 h-3.5 text-emerald-400" /><span className="text-emerald-400">Copied</span></>
                                                                ) : (
                                                                    <><Copy className="w-3.5 h-3.5" /><span>Copy</span></>
                                                                )}
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <div className="mx-4 mb-3 bg-slate-900 rounded-full h-1 overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full bg-gradient-to-r ${barColor} transition-all duration-700`}
                                                            style={{ width: `${Math.min(100, Math.max(8, numScore))}%` }}
                                                        />
                                                    </div>

                                                    <div className="mx-4 mb-4">
                                                        <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800/70 text-slate-300 text-xs leading-relaxed select-text whitespace-pre-line">
                                                            {renderHighlightedText(isExpanded ? r.text : previewText, testQuery)}
                                                        </div>

                                                        {r.text && r.text.length > 280 && (
                                                            <button
                                                                type="button"
                                                                onClick={() => toggleChunkExpand(idx)}
                                                                className="mt-2 flex items-center gap-1 text-[11px] font-medium text-indigo-400 hover:text-indigo-300 transition cursor-pointer"
                                                            >
                                                                {isExpanded ? (
                                                                    <><ChevronUp className="w-3.5 h-3.5" /><span>Collapse chunk</span></>
                                                                ) : (
                                                                    <><ChevronDown className="w-3.5 h-3.5" /><span>Expand full chunk ({r.text.length} chars)</span></>
                                                                )}
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            )}

                            {!isQuerying && !queryResults && (
                                <div className="p-8 text-center border border-dashed border-slate-800/80 rounded-2xl space-y-2">
                                    <Sparkles className="w-6 h-6 text-indigo-400 mx-auto" />
                                    <p className="text-xs font-medium text-slate-400">Run a query to test your vector knowledge base</p>
                                    <p className="text-[11px] text-slate-600">
                                        Use the presets above or type a custom directive to test grounding context.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            </div>
        </ProtectedRoute>
    );
}
