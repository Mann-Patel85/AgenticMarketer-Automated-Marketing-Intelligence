import React, { useState, useEffect, useRef } from 'react';
import Navbar from '../components/Navbar';
import {
    Bot,
    UploadCloud,
    FileText,
    CheckCircle2,
    Copy,
    Check,
    Play,
    RotateCcw,
    Sparkles,
    Search,
    PenTool,
    Gauge,
    Layers,
    Trash2,
    Download,
    Cpu,
    Zap,
    Terminal,
    Share2,
    Image as ImageIcon,
    Calendar,
    Send,
    X,
    ExternalLink,
    Sliders,
    Globe,
    Webhook,
    MessageSquare,
    Video,
    Tv,
    Bookmark
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Dashboard() {
    // Campaign Control Panel State
    const [campaignGoal, setCampaignGoal] = useState('');
    const [campaignType, setCampaignType] = useState('Product Launch');
    const [targetAudience, setTargetAudience] = useState('B2B Tech Executives & Marketing Leaders');
    const [tone, setTone] = useState('Authoritative & High-Energy');
    const [isDragging, setIsDragging] = useState(false);

    // Grounding Files Queue State
    const [fileQueue, setFileQueue] = useState([
        { id: 'file-1', name: 'Brand_Identity_Voice_2026.pdf', size: '2.4 MB', status: 'Ready', chunks: 48 },
        { id: 'file-2', name: 'Competitor_Landscape_Analysis.docx', size: '1.2 MB', status: 'Ready', chunks: 24 },
    ]);

    // Swarm Execution State
    const [isExecuting, setIsExecuting] = useState(false);
    const [activeAgentIndex, setActiveAgentIndex] = useState(-1); // -1 = idle
    const [progress, setProgress] = useState(0);
    const [copied, setCopied] = useState(false);
    const [activeOutputTab, setActiveOutputTab] = useState('output'); // 'output' | 'visuals' | 'terminal' | 'seo'
    const [executionLogs, setExecutionLogs] = useState([]);
    const [generatedOutput, setGeneratedOutput] = useState('');
    
    // Omnichannel Social Publishing State
    const [showPublishModal, setShowPublishModal] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [publishPlatforms, setPublishPlatforms] = useState({
        linkedin: true,
        twitter: true,
        instagram: false,
        facebook: false,
        youtube: false,
        tiktok: false,
        pinterest: false,
        reddit: false,
        threads: false,
        webhook: false,
    });
    const [webhookUrl, setWebhookUrl] = useState('https://hooks.zapier.com/hooks/catch/custom-marketing-hub');
    const [isPublishing, setIsPublishing] = useState(false);
    const [publishSuccess, setPublishSuccess] = useState(false);
    const [scheduleDate, setScheduleDate] = useState('');
    const [publishedChannels, setPublishedChannels] = useState([]);

    const executionIntervalRef = useRef(null);
    const terminalBottomRef = useRef(null);

    // Supported Social & Webhook Platforms
    const socialPlatformsList = [
        {
            id: 'linkedin',
            name: 'LinkedIn',
            category: 'b2b',
            icon: Share2,
            limit: '3,000 chars',
            type: 'Company Page & Personal Profile',
            color: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
        },
        {
            id: 'twitter',
            name: 'X (Twitter)',
            category: 'b2b',
            icon: Globe,
            limit: '280 chars / Auto-Thread',
            type: 'Thread Broadcast',
            color: 'text-slate-200 bg-slate-800/80 border-slate-700',
        },
        {
            id: 'threads',
            name: 'Meta Threads',
            category: 'b2b',
            icon: MessageSquare,
            limit: '500 chars',
            type: 'Conversational Microblog',
            color: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
        },
        {
            id: 'instagram',
            name: 'Instagram',
            category: 'visual',
            icon: ImageIcon,
            limit: '2,200 chars',
            type: 'Carousel & Feed Caption',
            color: 'text-pink-400 bg-pink-500/10 border-pink-500/20',
        },
        {
            id: 'facebook',
            name: 'Facebook',
            category: 'visual',
            icon: Globe,
            limit: '63,206 chars',
            type: 'Page & Group Post',
            color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
        },
        {
            id: 'pinterest',
            name: 'Pinterest',
            category: 'visual',
            icon: Bookmark,
            limit: '500 chars',
            type: 'Rich Pin & Link',
            color: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
        },
        {
            id: 'youtube',
            name: 'YouTube Community',
            category: 'video',
            icon: Tv,
            limit: '10,000 chars',
            type: 'Community Tab & Shorts Copy',
            color: 'text-red-400 bg-red-500/10 border-red-500/20',
        },
        {
            id: 'tiktok',
            name: 'TikTok',
            category: 'video',
            icon: Video,
            limit: '2,200 chars',
            type: 'Video Script & Hashtag Bank',
            color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
        },
        {
            id: 'reddit',
            name: 'Reddit',
            category: 'community',
            icon: MessageSquare,
            limit: '40,000 chars',
            type: 'Subreddit Post & Comment',
            color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
        },
        {
            id: 'webhook',
            name: 'Universal Webhook',
            category: 'universal',
            icon: Webhook,
            limit: 'Raw JSON Payload',
            type: 'Zapier / Make / Buffer / Custom CMS',
            color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
        },
    ];

    // 5 Autonomous Agents in the CrewAI Swarm Pipeline
    const agents = [
        {
            id: 'ingestion',
            name: 'Ingestion Agent',
            role: 'Document RAG & ChromaDB',
            icon: Layers,
            color: 'from-blue-500 to-cyan-500',
            borderColor: 'border-cyan-500/30',
            textColor: 'text-cyan-400',
            description: 'Extracts tokens via pdfplumber/docx, creates dense vector embeddings for RAG.',
        },
        {
            id: 'research',
            name: 'Research Agent',
            role: 'DuckDuckGo SERP Intel',
            icon: Search,
            color: 'from-violet-500 to-indigo-500',
            borderColor: 'border-violet-500/30',
            textColor: 'text-violet-400',
            description: 'Scrapes live search trends, competitor positioning gaps, and buyer friction points.',
        },
        {
            id: 'copywriter',
            name: 'Copywriter & Visual Agent',
            role: 'Multimodal Copy & Creatives',
            icon: PenTool,
            color: 'from-amber-500 to-orange-500',
            borderColor: 'border-amber-500/30',
            textColor: 'text-amber-400',
            description: 'Synthesizes high-converting copy angles and multimodal Gemini image generation prompts.',
        },
        {
            id: 'seo',
            name: 'SEO & Analytics Agent',
            role: 'Flesch-Kincaid & Keyword Audit',
            icon: Gauge,
            color: 'from-emerald-500 to-teal-500',
            borderColor: 'border-emerald-500/30',
            textColor: 'text-emerald-400',
            description: 'Evaluates readability index (Grade 8), search intent alignment, and keyword density.',
        },
        {
            id: 'publisher',
            name: 'Social Publisher Agent',
            role: 'Omnichannel Publishing Engine',
            icon: Share2,
            color: 'from-pink-500 to-rose-500',
            borderColor: 'border-pink-500/30',
            textColor: 'text-pink-400',
            description: 'Automates scheduling and broadcasting to LinkedIn, X, Meta, YouTube, TikTok, Pinterest, Reddit & Webhooks.',
        },
    ];

    // Auto-scroll terminal logs
    useEffect(() => {
        if (terminalBottomRef.current) {
            terminalBottomRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [executionLogs]);

    // Sample Preset Goals for quick testing
    const handlePresetGoal = (presetGoal, type) => {
        setCampaignGoal(presetGoal);
        setCampaignType(type);
    };

    // File Upload Handlers
    const handleFileUpload = (incomingFiles) => {
        if (!incomingFiles || incomingFiles.length === 0) return;
        const newFiles = Array.from(incomingFiles).map((file, idx) => ({
            id: `upload-${Date.now()}-${idx}`,
            name: file.name,
            size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
            status: 'Ready',
            chunks: Math.floor(Math.random() * 30) + 12,
        }));
        setFileQueue((prev) => [...prev, ...newFiles]);
    };

    const handleRemoveFile = (id) => {
        setFileQueue((prev) => prev.filter((f) => f.id !== id));
    };

    // Trigger Swarm Execution Simulation
    const handleLaunchSwarm = () => {
        if (isExecuting) return;

        const effectiveGoal = campaignGoal.trim() || 'Launch an autonomous AI growth campaign to capture mid-market B2B accounts.';
        if (!campaignGoal.trim()) {
            setCampaignGoal(effectiveGoal);
        }

        setIsExecuting(true);
        setActiveAgentIndex(0);
        setProgress(5);
        setGeneratedOutput('');
        setActiveOutputTab('output');
        setPublishSuccess(false);

        const timestamp = () => new Date().toLocaleTimeString();

        setExecutionLogs([
            { id: 1, time: timestamp(), agent: 'System', text: 'Initializing CrewAI Swarm Orchestrator...' },
            { id: 2, time: timestamp(), agent: 'System', text: `Loaded ${fileQueue.length} grounding assets into ChromaDB memory.` },
            { id: 3, time: timestamp(), agent: 'Ingestion Agent', text: 'Chunking documents via pdfplumber and indexing embeddings in ChromaDB...' },
        ]);

        let currentStep = 0;
        const totalSteps = 10;

        const outputChunks = [
            `# 🚀 Autonomous Swarm Campaign Report: ${campaignType.toUpperCase()}\n\n`,
            `> **Target Audience:** ${targetAudience}\n`,
            `> **Tone Profile:** ${tone}\n`,
            `> **Grounding Vector Chunks:** ${fileQueue.map((f) => f.name).join(', ') || 'ChromaDB Default Store'}\n\n`,
            `---\n\n`,
            `### 🎯 1. High-Impact Value Propositions & Hook Angles\n\n`,
            `- **Hook 1 (The Efficiency Angle):** "Stop managing marketing piecemeal. Deploy an autonomous multi-agent swarm that researches, writes, and optimizes 24/7."\n`,
            `- **Hook 2 (The ROI Metric Angle):** "94% lower CAC and 10x faster campaign iteration with grounding-backed AI intelligence."\n`,
            `- **Hook 3 (The Pain Relief Angle):** "No more disjointed copy or SEO guesswork. Every paragraph is verified against your brand voice guidelines."\n\n`,
            `### ✍️ 2. Multi-Channel Omnichannel Copy Assets\n\n`,
            `#### 💼 LinkedIn Thought-Leadership Post:\n`,
            `The traditional marketing funnel is dead. Autonomous swarms are replacing 40-hour agency brainstorms in 40 seconds.\n\n`,
            `Here is how intelligent marketing teams are running ahead in 2026:\n`,
            `1️⃣ **Grounding-first Ingestion:** Feeding pure brand guidelines and competitor teardowns into local ChromaDB stores.\n`,
            `2️⃣ **Agentic Consensus:** Copywriters and SEO agents debating keyword density vs human readability before publishing.\n`,
            `3️⃣ **Continuous Feedback Loops:** Real-time optimization across all inbound ad channels.\n\n`,
            `👉 Ready to deploy your first agentic marketing swarm? Test your workflow today.\n\n`,
            `#### 🐦 X / Twitter Thread (3-Tweet Sequence):\n`,
            `1/3 Most marketing teams don't have a content problem—they have a velocity and grounding problem. When you prompt LLMs blindly, you get generic noise.\n\n`,
            `2/3 Here is how 5-agent swarms fix this: Ingestion embeds your private IP -> Research scrapes live competitor SERPs -> Copywriter drafts multi-format assets -> SEO audits readability -> Publisher broadcasts across all networks.\n\n`,
            `3/3 Zero manual copy-pasting. Pure automated intelligence. Deploy yours at AgenticMarketer.\n\n`,
            `#### 📸 Instagram & Meta Carousel Slide Captions:\n`,
            `Slide 1: Why 90% of AI marketing fails (and how swarms fix it).\nSlide 2: Step 1: ChromaDB RAG Grounding.\nSlide 3: Step 2: Live DuckDuckGo SERP scraping.\nSlide 4: Step 3: Flesch-Kincaid SEO optimization.\nSlide 5: Step 4: 1-click publishing across LinkedIn, X, TikTok, and YouTube.\n\n`,
            `#### 💼 Cold Outbound Sequence (Subject Line + Body):\n`,
            `**Subject:** Scaling ${targetAudience.split(' ')[0] || 'Enterprise'} pipeline without bloating headcount\n\n`,
            `Hi {{First_Name}},\n\n`,
            `Noticed your team is scaling marketing operations this quarter. Most marketing leaders we speak with face the same bottleneck: producing high-relevance, brand-aligned content at the speed of search.\n\n`,
            `We built an autonomous intelligence swarm that automates ingestion, market research, copywriting, and technical SEO audit into a unified 5-agent pipeline.\n\n`,
            `Would you be open to a 5-minute preview of your competitive SERP landscape generated by our research agent?\n\n`,
            `Best regards,\nGrowth Intelligence Team\n\n`,
            `### 🔍 3. Technical SEO & Performance Audit\n\n`,
            `- **Flesch-Kincaid Readability Score:** 88/100 (Optimal for B2B engagement)\n`,
            `- **Primary LSI Keywords Targeted:** \`autonomous marketing\`, \`AI agent swarm\`, \`multi-agent intelligence\`, \`B2B growth orchestration\`\n`,
            `- **Search Intent Alignment:** 96% Match with Commercial & Transactional search profiles\n`,
            `- **Recommended Meta Title:** Autonomous Marketing Intelligence Swarm | 10x Inbound Pipeline\n`,
            `- **Recommended Meta Description:** Deploy an autonomous swarm of AI agents for end-to-end research, copywriting, and SEO optimization backed by your private brand data.\n`
        ];

        let chunkIndex = 0;

        if (executionIntervalRef.current) clearInterval(executionIntervalRef.current);

        executionIntervalRef.current = setInterval(() => {
            currentStep += 1;
            const newProgress = Math.min(Math.round((currentStep / totalSteps) * 100), 100);
            setProgress(newProgress);

            if (currentStep === 2) {
                setActiveAgentIndex(1); // Research Agent
                setExecutionLogs((prev) => [
                    ...prev,
                    { id: Date.now(), time: timestamp(), agent: 'Ingestion Agent', text: 'ChromaDB embeddings indexed: 72 vectors stored in collection.' },
                    { id: Date.now() + 1, time: timestamp(), agent: 'Research Agent', text: 'Executing live DuckDuckGo SERP queries and competitive sentiment analysis...' },
                ]);
            } else if (currentStep === 4) {
                setActiveAgentIndex(2); // Copywriter & Visual Agent
                setExecutionLogs((prev) => [
                    ...prev,
                    { id: Date.now(), time: timestamp(), agent: 'Research Agent', text: 'SERP analysis complete. Found 3 competitor gaps in speed, governance, and grounding.' },
                    { id: Date.now() + 1, time: timestamp(), agent: 'Copywriter & Visual Agent', text: 'Synthesizing omnichannel copy and generating multimodal Gemini visual prompts...' },
                ]);
            } else if (currentStep === 6) {
                setActiveAgentIndex(3); // SEO Agent
                setExecutionLogs((prev) => [
                    ...prev,
                    { id: Date.now(), time: timestamp(), agent: 'Copywriter & Visual Agent', text: 'Copy drafted. Multimodal creative prompts dispatched to Gemini.' },
                    { id: Date.now() + 1, time: timestamp(), agent: 'SEO & Analytics Agent', text: 'Running Flesch-Kincaid scoring and checking keyword density...' },
                ]);
            } else if (currentStep === 8) {
                setActiveAgentIndex(4); // Social Publisher Agent
                setExecutionLogs((prev) => [
                    ...prev,
                    { id: Date.now(), time: timestamp(), agent: 'SEO & Analytics Agent', text: 'SEO audit passed: 88/100 readability index and optimal density.' },
                    { id: Date.now() + 1, time: timestamp(), agent: 'Social Publisher Agent', text: 'Staging distribution connectors: LinkedIn, X, Meta, YouTube, TikTok, Reddit, Pinterest & Webhooks...' },
                ]);
            }

            if (chunkIndex < outputChunks.length) {
                const nextChunk = outputChunks.slice(0, chunkIndex + 3).join('');
                setGeneratedOutput(nextChunk);
                chunkIndex += 2;
            }

            if (currentStep >= totalSteps) {
                clearInterval(executionIntervalRef.current);
                setActiveAgentIndex(-1);
                setIsExecuting(false);
                setProgress(100);
                setGeneratedOutput(outputChunks.join(''));
                setExecutionLogs((prev) => [
                    ...prev,
                    { id: Date.now(), time: timestamp(), agent: 'Social Publisher Agent', text: 'Omnichannel campaign package staged and ready for broadcast across all platforms!' },
                    { id: Date.now() + 1, time: timestamp(), agent: 'System', text: '✅ Complete 5-agent swarm pipeline successfully executed.' },
                ]);
            }
        }, 1000);
    };

    const handleResetSwarm = () => {
        if (executionIntervalRef.current) clearInterval(executionIntervalRef.current);
        setIsExecuting(false);
        setActiveAgentIndex(-1);
        setProgress(0);
        setGeneratedOutput('');
        setExecutionLogs([]);
        setPublishSuccess(false);
    };

    const handleCopyOutput = () => {
        if (!generatedOutput) return;
        navigator.clipboard.writeText(generatedOutput);
        setCopied(true);
        setTimeout(() => setCopied(false), 2200);
    };

    const handleDownloadOutput = () => {
        if (!generatedOutput) return;
        const blob = new Blob([generatedOutput], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `AgenticSwarm_Campaign_${Date.now()}.md`;
        a.click();
        URL.revokeObjectURL(url);
    };

    // Omnichannel Publishing Trigger
    const handlePublishToSocials = async () => {
        const activeChannels = Object.keys(publishPlatforms).filter((k) => publishPlatforms[k]);
        if (activeChannels.length === 0) return;

        setIsPublishing(true);
        setPublishedChannels([]);

        // Progressive simulated broadcast per channel
        for (let i = 0; i < activeChannels.length; i++) {
            await new Promise((resolve) => setTimeout(resolve, 300));
            setPublishedChannels((prev) => [...prev, activeChannels[i]]);
        }

        setIsPublishing(false);
        setPublishSuccess(true);
        setTimeout(() => {
            setShowPublishModal(false);
        }, 2200);
    };

    const toggleAllChannels = (selectAll) => {
        const nextState = {};
        socialPlatformsList.forEach((p) => {
            nextState[p.id] = selectAll;
        });
        setPublishPlatforms(nextState);
    };

    const filteredPlatforms = socialPlatformsList.filter((p) => {
        if (selectedCategory === 'all') return true;
        return p.category === selectedCategory;
    });

    const activeSelectedCount = Object.values(publishPlatforms).filter(Boolean).length;

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white pb-16">
            <Navbar />

            {/* Sub-header Banner */}
            <header className="border-b border-slate-800/80 bg-slate-900/40 backdrop-blur-md px-6 py-4">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2.5">
                            <span className="p-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-indigo-400">
                                <Bot className="w-5 h-5" />
                            </span>
                            <h1 className="text-xl font-bold text-white tracking-tight">Swarm Launcher Workspace</h1>
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                Omnichannel Social Swarm
                            </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                            Orchestrate document ingestion, live SERP research, multimodal copywriting, SEO auditing, and universal publishing to all social platforms.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        {isExecuting && (
                            <div className="flex items-center gap-2.5 px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/30 rounded-xl">
                                <span className="relative flex h-2.5 w-2.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-500"></span>
                                </span>
                                <span className="text-xs font-medium text-indigo-300">
                                    Swarm Active ({progress}%)
                                </span>
                            </div>
                        )}

                        {generatedOutput && (
                            <button
                                onClick={() => setShowPublishModal(true)}
                                className="flex items-center gap-1.5 text-xs font-semibold text-white py-2 px-3.5 rounded-xl bg-gradient-to-r from-pink-600 via-rose-600 to-amber-600 hover:from-pink-500 hover:to-rose-500 shadow-md shadow-pink-600/20 transition cursor-pointer"
                            >
                                <Share2 className="w-3.5 h-3.5" />
                                <span>Omnichannel Broadcast</span>
                            </button>
                        )}

                        <button
                            onClick={handleResetSwarm}
                            disabled={!generatedOutput && !isExecuting && executionLogs.length === 0}
                            className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-slate-200 py-2 px-3 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-900/60 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                            title="Reset workspace"
                        >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Reset</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content Layout */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
                {/* 5-Agent Swarm Topology Grid */}
                <section>
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <Cpu className="w-4 h-4 text-indigo-400" />
                            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                5-Agent Swarm Topology & Active State
                            </h2>
                        </div>
                        <span className="text-[11px] text-slate-500">
                            {isExecuting ? 'Swarm executing sequentially' : 'All agents standing by'}
                        </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
                        {agents.map((agent, index) => {
                            const IconComponent = agent.icon;
                            const isActive = isExecuting && activeAgentIndex === index;
                            const isCompleted = isExecuting ? activeAgentIndex > index : generatedOutput !== '';

                            return (
                                <motion.div
                                    key={agent.id}
                                    layout
                                    className={`relative p-3.5 rounded-2xl border transition-all duration-300 ${
                                        isActive
                                            ? `bg-slate-900/90 ${agent.borderColor} shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-500/40`
                                            : isCompleted
                                            ? 'bg-slate-900/70 border-emerald-500/30'
                                            : 'bg-slate-900/50 border-slate-800/80 hover:border-slate-700'
                                    }`}
                                >
                                    <div className="flex items-start justify-between mb-2.5">
                                        <div className={`p-2 rounded-xl bg-gradient-to-br ${agent.color} shadow-md`}>
                                            <IconComponent className="w-4 h-4 text-white" />
                                        </div>

                                        {/* Status Badge */}
                                        <div>
                                            {isActive ? (
                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 flex items-center gap-1.5 animate-pulse">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping" />
                                                    Active
                                                </span>
                                            ) : isCompleted ? (
                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                                                    <CheckCircle2 className="w-3 h-3" /> Ready
                                                </span>
                                            ) : (
                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-800 text-slate-400 border border-slate-700/60">
                                                    Idle
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <h3 className="text-xs font-bold text-white leading-tight">{agent.name}</h3>
                                    <p className={`text-[10px] font-medium mt-0.5 ${agent.textColor}`}>{agent.role}</p>
                                    <p className="text-[10px] text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                                        {agent.description}
                                    </p>

                                    {isActive && (
                                        <div className="mt-2.5 pt-2 border-t border-slate-800 flex items-center gap-1.5 text-[10px] text-indigo-300">
                                            <Sparkles className="w-3 h-3 animate-spin" />
                                            <span>Processing...</span>
                                        </div>
                                    )}
                                </motion.div>
                            );
                        })}
                    </div>
                </section>

                {/* Workspace Split: Control Panel (Left) & Feed / Output (Right) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* SECTION 1: Control Panel Section (5 cols) */}
                    <div className="lg:col-span-5 space-y-5">
                        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5">
                            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3.5">
                                <div className="flex items-center gap-2">
                                    <Zap className="w-4 h-4 text-amber-400" />
                                    <h2 className="text-sm font-bold text-white">Campaign Control Panel</h2>
                                </div>
                                <span className="text-[10px] font-mono text-slate-400 bg-slate-800/60 px-2 py-0.5 rounded">
                                    STEP 1 OF 2
                                </span>
                            </div>

                            {/* Preset Starters */}
                            <div>
                                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                                    Preset Starter Templates
                                </label>
                                <div className="flex flex-wrap gap-1.5">
                                    <button
                                        type="button"
                                        onClick={() => handlePresetGoal('Launch an enterprise B2B SaaS campaign targeting Chief Technology Officers for automated cloud cost intelligence across LinkedIn and X.', 'Product Launch')}
                                        className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-indigo-600/30 text-slate-300 hover:text-indigo-300 border border-slate-700/60 transition active:scale-95 cursor-pointer"
                                    >
                                        🚀 SaaS Launch
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handlePresetGoal('Create high-converting cold email sequences and omnichannel hooks for AI marketing automation across Reddit, Threads, and Meta.', 'Lead Generation')}
                                        className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-indigo-600/30 text-slate-300 hover:text-indigo-300 border border-slate-700/60 transition active:scale-95 cursor-pointer"
                                    >
                                        💼 B2B Outbound
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handlePresetGoal('Generate an SEO and video script cluster targeting autonomous agentic workflows for YouTube, TikTok, and blogs.', 'SEO Domination')}
                                        className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-indigo-600/30 text-slate-300 hover:text-indigo-300 border border-slate-700/60 transition active:scale-95 cursor-pointer"
                                    >
                                        🔍 SEO Authority
                                    </button>
                                </div>
                            </div>

                            {/* Campaign Goal Input */}
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label htmlFor="campaign-goal" className="text-xs font-semibold text-slate-300">
                                        Campaign Goal & Directives <span className="text-rose-400">*</span>
                                    </label>
                                    <span className="text-[10px] text-slate-500 font-mono">
                                        {campaignGoal.length}/500 chars
                                    </span>
                                </div>
                                <textarea
                                    id="campaign-goal"
                                    rows={4}
                                    value={campaignGoal}
                                    onChange={(e) => setCampaignGoal(e.target.value)}
                                    placeholder="Describe your marketing objective (e.g., 'Position our new autonomous agent solution to VP Marketers, highlighting ground truth accuracy and omnichannel publishing across LinkedIn, X, Meta, YouTube')..."
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition resize-none leading-relaxed"
                                />
                            </div>

                            {/* Parameters Grid */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[11px] font-medium text-slate-400 mb-1">
                                        Audience Segment
                                    </label>
                                    <input
                                        type="text"
                                        value={targetAudience}
                                        onChange={(e) => setTargetAudience(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-medium text-slate-400 mb-1">
                                        Brand Voice & Tone
                                    </label>
                                    <select
                                        value={tone}
                                        onChange={(e) => setTone(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition cursor-pointer"
                                    >
                                        <option value="Authoritative & High-Energy">Authoritative & Bold</option>
                                        <option value="Conversational & Friendly">Engaging & Conversational</option>
                                        <option value="Data-driven & Technical">Data-driven & Rigorous</option>
                                        <option value="Luxury & Exclusive">Minimalist & Premium</option>
                                    </select>
                                </div>
                            </div>

                            {/* Grounding Document Upload Interface */}
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                                        <FileText className="w-3.5 h-3.5 text-indigo-400" />
                                        Grounding Documents (ChromaDB RAG)
                                    </label>
                                    <span className="text-[10px] text-slate-500">PDF, DOCX, TXT, MD</span>
                                </div>

                                <div
                                    onDragOver={(e) => {
                                        e.preventDefault();
                                        setIsDragging(true);
                                    }}
                                    onDragLeave={() => setIsDragging(false)}
                                    onDrop={(e) => {
                                        e.preventDefault();
                                        setIsDragging(false);
                                        handleFileUpload(e.dataTransfer.files);
                                    }}
                                    className={`relative border-2 border-dashed rounded-xl p-4 text-center transition-all cursor-pointer ${
                                        isDragging
                                            ? 'border-indigo-500 bg-indigo-500/10'
                                            : 'border-slate-800 hover:border-slate-700 bg-slate-950/60'
                                    }`}
                                >
                                    <input
                                        type="file"
                                        multiple
                                        onChange={(e) => handleFileUpload(e.target.files)}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />
                                    <div className="flex flex-col items-center pointer-events-none">
                                        <UploadCloud className="w-6 h-6 text-indigo-400 mb-1.5" />
                                        <p className="text-xs font-medium text-slate-200">
                                            Click or drag grounding assets here
                                        </p>
                                        <p className="text-[10px] text-slate-500 mt-0.5">
                                            Parsed via pdfplumber into ChromaDB vector memory
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* File Queue Display with Status Indicators */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                                        File Queue ({fileQueue.length})
                                    </span>
                                    {fileQueue.length > 0 && (
                                        <span className="text-[10px] text-emerald-400 font-medium">
                                            All files indexed
                                        </span>
                                    )}
                                </div>

                                {fileQueue.length === 0 ? (
                                    <div className="text-center py-4 bg-slate-950/40 border border-slate-800/60 rounded-xl text-slate-500 text-xs">
                                        No grounding files attached yet.
                                    </div>
                                ) : (
                                    <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                                        {fileQueue.map((file) => (
                                            <div
                                                key={file.id}
                                                className="flex items-center justify-between p-2.5 bg-slate-950/80 border border-slate-800/80 rounded-xl text-xs group"
                                            >
                                                <div className="flex items-center space-x-2.5 min-w-0 pr-2">
                                                    <div className="p-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-lg shrink-0">
                                                        <FileText className="w-3.5 h-3.5 text-indigo-400" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="font-medium text-slate-200 truncate text-[11px]">
                                                            {file.name}
                                                        </p>
                                                        <p className="text-[10px] text-slate-500">
                                                            {file.size} • {file.chunks} Chunks
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center space-x-2 shrink-0">
                                                    <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                                                        <CheckCircle2 className="w-3 h-3" /> {file.status}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveFile(file.id)}
                                                        className="text-slate-500 hover:text-rose-400 transition p-1 cursor-pointer"
                                                        title="Remove file"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Launch Swarm Trigger Button */}
                            <div className="pt-2">
                                <button
                                    type="button"
                                    onClick={handleLaunchSwarm}
                                    disabled={isExecuting}
                                    className={`w-full py-3.5 px-5 rounded-xl font-semibold text-xs tracking-wide shadow-xl transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] ${
                                        isExecuting
                                            ? 'bg-indigo-600/70 text-indigo-200 cursor-not-allowed border border-indigo-500/30'
                                            : 'bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-500 hover:from-indigo-500 hover:to-violet-500 text-white shadow-indigo-600/30 hover:shadow-indigo-600/50'
                                    }`}
                                >
                                    {isExecuting ? (
                                        <>
                                            <Sparkles className="w-4 h-4 animate-spin text-indigo-300" />
                                            <span>Swarm Executing ({progress}%)...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Play className="w-4 h-4 fill-white" />
                                            <span>Launch 5-Agent Swarm</span>
                                        </>
                                    )}
                                </button>
                                <p className="text-[10px] text-slate-500 text-center mt-2">
                                    Coordinates Ingestion, Research, Copywriter, SEO, and Omnichannel Social Publisher.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* SECTION 2: Swarm Feed & Output Workspace (7 cols) */}
                    <div className="lg:col-span-7 space-y-5">
                        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl shadow-xl overflow-hidden flex flex-col min-h-[580px]">
                            {/* Header Tabs & Actions */}
                            <div className="border-b border-slate-800/80 px-4 sm:px-5 py-3.5 bg-slate-900 flex flex-wrap items-center justify-between gap-3">
                                <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                                    <button
                                        type="button"
                                        onClick={() => setActiveOutputTab('output')}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 cursor-pointer ${
                                            activeOutputTab === 'output'
                                                ? 'bg-indigo-600 text-white shadow'
                                                : 'text-slate-400 hover:text-slate-200'
                                        }`}
                                    >
                                        <Sparkles className="w-3.5 h-3.5" />
                                        <span>Campaign Copy</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setActiveOutputTab('visuals')}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 cursor-pointer ${
                                            activeOutputTab === 'visuals'
                                                ? 'bg-indigo-600 text-white shadow'
                                                : 'text-slate-400 hover:text-slate-200'
                                        }`}
                                    >
                                        <ImageIcon className="w-3.5 h-3.5" />
                                        <span>Visual Creatives</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setActiveOutputTab('terminal')}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 cursor-pointer ${
                                            activeOutputTab === 'terminal'
                                                ? 'bg-indigo-600 text-white shadow'
                                                : 'text-slate-400 hover:text-slate-200'
                                        }`}
                                    >
                                        <Terminal className="w-3.5 h-3.5" />
                                        <span>Terminal ({executionLogs.length})</span>
                                        {isExecuting && (
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                                        )}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setActiveOutputTab('seo')}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 cursor-pointer ${
                                            activeOutputTab === 'seo'
                                                ? 'bg-indigo-600 text-white shadow'
                                                : 'text-slate-400 hover:text-slate-200'
                                        }`}
                                    >
                                        <Gauge className="w-3.5 h-3.5" />
                                        <span>SEO & Audit</span>
                                    </button>
                                </div>

                                {/* Action Buttons (Copy, Download) */}
                                <div className="flex items-center space-x-2">
                                    <button
                                        type="button"
                                        onClick={handleCopyOutput}
                                        disabled={!generatedOutput}
                                        className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer ${
                                            copied
                                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                                : 'bg-slate-800/80 hover:bg-slate-700 text-slate-200 border-slate-700'
                                        }`}
                                        title="Copy output content"
                                    >
                                        {copied ? (
                                            <>
                                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                                <span>Copied!</span>
                                            </>
                                        ) : (
                                            <>
                                                <Copy className="w-3.5 h-3.5 text-slate-400" />
                                                <span>Copy Output</span>
                                            </>
                                        )}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={handleDownloadOutput}
                                        disabled={!generatedOutput}
                                        className="p-1.5 rounded-xl text-xs font-medium border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                                        title="Download Markdown Report"
                                    >
                                        <Download className="w-4 h-4 text-slate-400" />
                                    </button>
                                </div>
                            </div>

                            {/* Dynamic Workspace Tab Content */}
                            <div className="p-5 flex-1 flex flex-col bg-slate-950/40">
                                {/* TAB 1: Campaign Copy Output */}
                                {activeOutputTab === 'output' && (
                                    <div className="flex-1 flex flex-col">
                                        {!generatedOutput && !isExecuting ? (
                                            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-500 space-y-3">
                                                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                                                    <Bot className="w-10 h-10 text-indigo-400/60" />
                                                </div>
                                                <div className="max-w-sm">
                                                    <h3 className="text-sm font-semibold text-slate-300">
                                                        Workspace Standby
                                                    </h3>
                                                    <p className="text-xs text-slate-500 mt-1">
                                                        Define your campaign goal or choose a preset starter on the left, then click{' '}
                                                        <strong className="text-slate-300">Launch 5-Agent Swarm</strong> to generate omnichannel copy, visuals, and SEO audits.
                                                    </p>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-4 flex-1">
                                                {isExecuting && (
                                                    <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-between text-xs text-indigo-300 animate-pulse">
                                                        <span className="flex items-center gap-2">
                                                            <Sparkles className="w-4 h-4 animate-spin" />
                                                            Autonomous swarm collaborating in real-time...
                                                        </span>
                                                        <span className="font-mono">{progress}% Complete</span>
                                                    </div>
                                                )}

                                                <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 text-xs text-slate-200 font-mono leading-relaxed whitespace-pre-wrap selection:bg-indigo-600 overflow-y-auto max-h-[560px]">
                                                    {generatedOutput}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* TAB 2: Multimodal Visual Creatives */}
                                {activeOutputTab === 'visuals' && (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h3 className="text-xs font-bold text-white">Multimodal Campaign Visuals</h3>
                                                <p className="text-[10px] text-slate-400">Generated by Copywriter & Visual Agent via Gemini Multimodal Prompting.</p>
                                            </div>
                                            <span className="text-[10px] font-mono text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded">
                                                Omnichannel Formats Ready
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {/* Visual Asset 1 */}
                                            <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden group">
                                                <div className="h-40 bg-gradient-to-tr from-indigo-900 via-slate-900 to-violet-900 p-4 flex flex-col justify-between relative">
                                                    <div className="flex justify-between items-start">
                                                        <span className="px-2 py-0.5 bg-slate-900/80 backdrop-blur rounded text-[9px] font-mono text-indigo-300 border border-indigo-500/20">
                                                            LinkedIn / Instagram (1:1 Square)
                                                        </span>
                                                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-bold text-white">Autonomous Marketing Intelligence</p>
                                                        <p className="text-[10px] text-slate-300 mt-0.5">Grounding RAG • Omnichannel Broadcasting</p>
                                                    </div>
                                                </div>
                                                <div className="p-3 bg-slate-900/60 text-[11px] space-y-1">
                                                    <p className="text-slate-400 truncate">Prompt: "Futuristic glowing AI nodes orchestrating marketing analytics, dark theme neon cyan and violet"</p>
                                                    <div className="flex justify-between items-center pt-1 text-[10px]">
                                                        <span className="text-slate-500">1080 x 1080px</span>
                                                        <button className="text-indigo-400 hover:text-indigo-300 font-medium cursor-pointer">Download High-Res</button>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Visual Asset 2 */}
                                            <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden group">
                                                <div className="h-40 bg-gradient-to-tr from-slate-900 via-emerald-950 to-slate-900 p-4 flex flex-col justify-between relative">
                                                    <div className="flex justify-between items-start">
                                                        <span className="px-2 py-0.5 bg-slate-900/80 backdrop-blur rounded text-[9px] font-mono text-emerald-300 border border-emerald-500/20">
                                                            X / YouTube / Facebook (16:9 Banner)
                                                        </span>
                                                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-bold text-white">Scale Pipeline Without Bloat</p>
                                                        <p className="text-[10px] text-slate-300 mt-0.5">Deploy 5-Agent Swarm Across All Networks</p>
                                                    </div>
                                                </div>
                                                <div className="p-3 bg-slate-900/60 text-[11px] space-y-1">
                                                    <p className="text-slate-400 truncate">Prompt: "Sleek SaaS dashboard hologram with competitive metrics, dark slate background"</p>
                                                    <div className="flex justify-between items-center pt-1 text-[10px]">
                                                        <span className="text-slate-500">1920 x 1080px</span>
                                                        <button className="text-indigo-400 hover:text-indigo-300 font-medium cursor-pointer">Download High-Res</button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* TAB 3: Live Agent Execution Logs Terminal */}
                                {activeOutputTab === 'terminal' && (
                                    <div className="flex-1 flex flex-col bg-slate-950 border border-slate-800/80 rounded-xl p-4 font-mono text-xs overflow-y-auto max-h-[560px] space-y-2">
                                        <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-[11px] text-slate-500">
                                            <span>CrewAI Orchestrator Terminal Stream</span>
                                            <span className="flex items-center gap-1.5 text-emerald-400">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                                WebSocket: Connected
                                            </span>
                                        </div>

                                        {executionLogs.length === 0 ? (
                                            <p className="text-slate-600 text-xs italic py-8 text-center">
                                                No execution events logged yet. Launch the swarm to inspect agent interactions.
                                            </p>
                                        ) : (
                                            executionLogs.map((log) => (
                                                <div key={log.id} className="flex items-start space-x-2 text-[11px]">
                                                    <span className="text-slate-600 shrink-0">[{log.time}]</span>
                                                    <span
                                                        className={`font-semibold shrink-0 ${
                                                            log.agent === 'System'
                                                                ? 'text-indigo-400'
                                                                : log.agent === 'Ingestion Agent'
                                                                ? 'text-cyan-400'
                                                                : log.agent === 'Research Agent'
                                                                ? 'text-violet-400'
                                                                : log.agent === 'Copywriter & Visual Agent'
                                                                ? 'text-amber-400'
                                                                : log.agent === 'SEO & Analytics Agent'
                                                                ? 'text-emerald-400'
                                                                : 'text-pink-400'
                                                        }`}
                                                    >
                                                        [{log.agent}]:
                                                    </span>
                                                    <span className="text-slate-300">{log.text}</span>
                                                </div>
                                            ))
                                        )}
                                        <div ref={terminalBottomRef} />
                                    </div>
                                )}

                                {/* TAB 4: SEO & Readability Insights */}
                                {activeOutputTab === 'seo' && (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                            <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl">
                                                <p className="text-[10px] text-slate-400 uppercase tracking-wider">
                                                    Flesch-Kincaid Readability
                                                </p>
                                                <h4 className="text-lg font-bold text-emerald-400 mt-1">88 / 100</h4>
                                                <p className="text-[10px] text-slate-500 mt-0.5">Grade 8 (Optimal for conversion)</p>
                                            </div>

                                            <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl">
                                                <p className="text-[10px] text-slate-400 uppercase tracking-wider">
                                                    Search Intent Alignment
                                                </p>
                                                <h4 className="text-lg font-bold text-indigo-400 mt-1">96% Match</h4>
                                                <p className="text-[10px] text-slate-500 mt-0.5">Commercial & Informational</p>
                                            </div>

                                            <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl">
                                                <p className="text-[10px] text-slate-400 uppercase tracking-wider">
                                                    ChromaDB Grounding Score
                                                </p>
                                                <h4 className="text-lg font-bold text-cyan-400 mt-1">99.2%</h4>
                                                <p className="text-[10px] text-slate-500 mt-0.5">Zero hallucination risk</p>
                                            </div>
                                        </div>

                                        <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                                            <h4 className="text-xs font-semibold text-slate-300">Target LSI Keyword Distribution</h4>
                                            <div className="space-y-2">
                                                {[
                                                    { keyword: 'autonomous marketing swarm', count: '14 mentions', density: '2.8%', status: 'Optimal' },
                                                    { keyword: 'multi-agent intelligence', count: '9 mentions', density: '1.9%', status: 'Optimal' },
                                                    { keyword: 'ChromaDB vector grounding', count: '6 mentions', density: '1.2%', status: 'Balanced' },
                                                    { keyword: 'enterprise AI growth', count: '8 mentions', density: '1.6%', status: 'Optimal' },
                                                ].map((kw, i) => (
                                                    <div key={i} className="flex items-center justify-between p-2 bg-slate-900/60 rounded-lg text-xs">
                                                        <span className="font-mono text-slate-300">{kw.keyword}</span>
                                                        <div className="flex items-center space-x-3">
                                                            <span className="text-[11px] text-slate-400">{kw.count}</span>
                                                            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                                                {kw.density}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Omnichannel Social Publishing Modal (Universal Gateways) */}
            <AnimatePresence>
                {showPublishModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 my-8"
                        >
                            <div className="flex justify-between items-center border-b border-slate-800 pb-3.5">
                                <div className="flex items-center gap-2.5">
                                    <div className="p-2 rounded-xl bg-pink-500/10 border border-pink-500/20 text-pink-400">
                                        <Share2 className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-white">Social Publisher Agent: Omnichannel Broadcast</h3>
                                        <p className="text-[11px] text-slate-400">Deploy campaign copy and visual assets across any social network or custom webhook.</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowPublishModal(false)}
                                    className="text-slate-400 hover:text-slate-200 p-1 cursor-pointer"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {publishSuccess ? (
                                <div className="py-8 text-center space-y-3">
                                    <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
                                        <CheckCircle2 className="w-8 h-8" />
                                    </div>
                                    <h4 className="text-base font-bold text-white">Omnichannel Broadcast Completed!</h4>
                                    <p className="text-xs text-slate-400 max-w-md mx-auto">
                                        Successfully published and scheduled across <strong className="text-emerald-400">{publishedChannels.length} connected platform(s)</strong>.
                                    </p>
                                    <div className="flex flex-wrap justify-center gap-2 pt-2">
                                        {publishedChannels.map((ch) => (
                                            <span key={ch} className="px-2.5 py-1 rounded-lg text-[10px] font-mono capitalize bg-slate-950 border border-emerald-500/30 text-emerald-300">
                                                ✓ {ch}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4 text-xs">
                                    {/* Category Filter & Select All / Clear All */}
                                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                                        <div className="flex flex-wrap gap-1.5">
                                            {[
                                                { id: 'all', label: 'All Channels (10)' },
                                                { id: 'b2b', label: 'B2B & Thought Leadership' },
                                                { id: 'visual', label: 'Visual & Consumer' },
                                                { id: 'video', label: 'Video & Creator' },
                                                { id: 'community', label: 'Communities' },
                                                { id: 'universal', label: 'Webhook / Custom' },
                                            ].map((cat) => (
                                                <button
                                                    key={cat.id}
                                                    type="button"
                                                    onClick={() => setSelectedCategory(cat.id)}
                                                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition cursor-pointer ${
                                                        selectedCategory === cat.id
                                                            ? 'bg-indigo-600 text-white'
                                                            : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                                                    }`}
                                                >
                                                    {cat.label}
                                                </button>
                                            ))}
                                        </div>

                                        <div className="flex items-center gap-2 text-[11px]">
                                            <button
                                                type="button"
                                                onClick={() => toggleAllChannels(true)}
                                                className="text-indigo-400 hover:underline cursor-pointer"
                                            >
                                                Select All
                                            </button>
                                            <span className="text-slate-600">•</span>
                                            <button
                                                type="button"
                                                onClick={() => toggleAllChannels(false)}
                                                className="text-slate-400 hover:text-slate-200 cursor-pointer"
                                            >
                                                Clear
                                            </button>
                                        </div>
                                    </div>

                                    {/* Platforms Grid */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-64 overflow-y-auto pr-1">
                                        {filteredPlatforms.map((platform) => {
                                            const IconComponent = platform.icon;
                                            const isSelected = !!publishPlatforms[platform.id];
                                            const isBeingPublished = isPublishing && publishedChannels.includes(platform.id);

                                            return (
                                                <label
                                                    key={platform.id}
                                                    className={`flex items-center justify-between p-3 rounded-xl border transition cursor-pointer select-none ${
                                                        isSelected
                                                            ? 'bg-slate-950 border-indigo-500/40 ring-1 ring-indigo-500/20'
                                                            : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 opacity-75'
                                                    }`}
                                                >
                                                    <div className="flex items-center space-x-3 min-w-0 pr-2">
                                                        <div className={`p-2 rounded-lg border ${platform.color} shrink-0`}>
                                                            <IconComponent className="w-3.5 h-3.5" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="font-semibold text-slate-200 text-xs truncate">
                                                                {platform.name}
                                                            </p>
                                                            <p className="text-[10px] text-slate-500 truncate">
                                                                {platform.type} • <span className="text-slate-400">{platform.limit}</span>
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center space-x-2 shrink-0">
                                                        {isBeingPublished && (
                                                            <span className="text-[10px] text-emerald-400 animate-pulse font-mono">
                                                                ✓ Staged
                                                            </span>
                                                        )}
                                                        <input
                                                            type="checkbox"
                                                            checked={isSelected}
                                                            onChange={(e) =>
                                                                setPublishPlatforms((prev) => ({
                                                                    ...prev,
                                                                    [platform.id]: e.target.checked,
                                                                }))
                                                            }
                                                            className="rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                                                        />
                                                    </div>
                                                </label>
                                            );
                                        })}
                                    </div>

                                    {/* Custom Webhook URL field (when enabled) */}
                                    {publishPlatforms.webhook && (
                                        <div className="p-3 bg-slate-950 border border-emerald-500/30 rounded-xl space-y-1.5">
                                            <div className="flex justify-between items-center text-[11px]">
                                                <label className="font-semibold text-emerald-400 flex items-center gap-1.5">
                                                    <Webhook className="w-3.5 h-3.5" />
                                                    Custom Webhook Destination URL
                                                </label>
                                                <span className="text-slate-500 text-[10px]">Zapier / Make / Buffer / Custom CMS</span>
                                            </div>
                                            <input
                                                type="url"
                                                value={webhookUrl}
                                                onChange={(e) => setWebhookUrl(e.target.value)}
                                                placeholder="https://hooks.zapier.com/hooks/catch/..."
                                                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-emerald-500"
                                            />
                                        </div>
                                    )}

                                    {/* Schedule Date & Submit */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                                        <div>
                                            <label className="block text-[11px] font-medium text-slate-400 mb-1">
                                                Schedule Broadcast (Blank for Instant)
                                            </label>
                                            <input
                                                type="datetime-local"
                                                value={scheduleDate}
                                                onChange={(e) => setScheduleDate(e.target.value)}
                                                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                                            />
                                        </div>

                                        <div className="flex items-end gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setShowPublishModal(false)}
                                                className="py-2.5 px-4 rounded-xl border border-slate-800 hover:bg-slate-800 text-slate-400 text-xs font-medium transition cursor-pointer"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handlePublishToSocials}
                                                disabled={isPublishing || activeSelectedCount === 0}
                                                className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-pink-600 via-rose-600 to-amber-600 hover:from-pink-500 hover:to-amber-500 text-white text-xs font-semibold shadow-lg shadow-pink-600/25 transition flex items-center justify-center gap-1.5 disabled:opacity-40 cursor-pointer"
                                            >
                                                {isPublishing ? (
                                                    <>
                                                        <Sparkles className="w-3.5 h-3.5 animate-spin" />
                                                        <span>Broadcasting to {activeSelectedCount} Channels...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Send className="w-3.5 h-3.5" />
                                                        <span>
                                                            {scheduleDate ? `Schedule to ${activeSelectedCount} Channels` : `Broadcast Live (${activeSelectedCount} Channels)`}
                                                        </span>
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
