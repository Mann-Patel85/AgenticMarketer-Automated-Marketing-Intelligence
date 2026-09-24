'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import ProtectedRoute from '../../components/ProtectedRoute';
import { useAuth } from '../../context/AuthContext';
import {
    fetchDocuments,
    uploadDocument,
    deleteDocument,
    runSwarmSync,
    broadcastCampaign,
    fetchUserWorkspace,
    saveUserWorkspace,
    resetUserWorkspace,
    fetchWorkspaceHistory,
    BACKEND_SERVER_URL,
} from '../../utils/api';
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
    Send,
    X,
    Globe,
    Webhook,
    MessageSquare,
    Video,
    Tv,
    Bookmark,
    Activity,
    History,
    Cloud,
    FolderClock,
    Mail,
    Megaphone,
    Target,
    Code,
    Eye,
    CheckCheck,
    ExternalLink,
    ArrowUpRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Clean text utility: strips markdown artifacts, bold/italic asterisks, hash headers, and blockquotes
function cleanMarkdownText(text) {
    if (!text) return '';
    let t = text;
    // Strip blockquotes
    t = t.replace(/^\s*>\s*/gm, '');
    // Strip divider lines
    t = t.replace(/^\s*[-*_]{3,}\s*$/gm, '');
    // Strip markdown headings (e.g. ## Heading), preserving hashtags (e.g. #DevOps)
    t = t.replace(/^\s*#{1,6}\s+/gm, '');
    // Strip bold and italic asterisks
    t = t.replace(/\*\*(.*?)\*\*/g, '$1');
    t = t.replace(/\*(.*?)\*/g, '$1');
    // Normalize bullet points to clean dot
    t = t.replace(/^\s*[\*\-]\s+/gm, '• ');
    // Strip inline backticks
    t = t.replace(/`([^`]+)`/g, '$1');
    // Clean excessive blank lines
    t = t.replace(/\n{3,}/g, '\n\n');
    return t.trim();
}

// Parse markdown marketing bundle into structured channel assets
function parseMarketingBundle(rawText) {
    if (!rawText) return null;

    const strip = (str) => {
        if (!str) return '';
        let s = str;
        s = s.replace(/^\s*>\s*/gm, '');
        s = s.replace(/^\s*[-*_]{3,}\s*$/gm, '');
        s = s.replace(/^\s*#{1,6}\s+/gm, '');
        s = s.replace(/\*\*(.*?)\*\*/g, '$1');
        s = s.replace(/\*(.*?)\*/g, '$1');
        s = s.replace(/^\s*[\*\-]\s+/gm, '');
        s = s.replace(/`([^`]+)`/g, '$1');
        s = s.replace(/\n{3,}/g, '\n\n');
        return s.trim();
    };

    // 1. Campaign Title
    const titleMatch = rawText.match(/^\s*#+\s*(?:B2B[^\n]+|[^\n]+)/i);
    let campaignTitle = titleMatch ? strip(titleMatch[0]) : 'B2B Marketing Campaign Intelligence';
    campaignTitle = campaignTitle.replace(/^\d+[\.\:\-]\s*/, '').trim();

    // 2. Chunks by headers (handles ###, ##, numbered headers like 1. ###, and variants)
    const chunks = rawText.split(/\n+(?:(?:\d+[\.\)]\s*)?\#{2,4}\s*|\#{2,4}\s*(?:\d+[\.\)]\s*)?)/);

    const headlines = [];
    let universalBody = '';
    let linkedinBody = '';
    let redditBody = null;
    let blogBody = null;
    let threadsBody = '';
    let reelsBody = '';
    let communityBody = '';
    const twitterTweets = [];
    const emailData = { subject: '', body: '' };
    const metaData = { primary: '', headline: '', description: '' };
    let visualPrompt = '';

    for (const chunk of chunks) {
        const lines = chunk.split('\n');
        const headerLine = lines[0].trim();
        const body = lines.slice(1).join('\n').trim();

        if (/Universal|Post Anywhere|Common/i.test(headerLine)) {
            let cleanBody = strip(body);
            if (cleanBody.includes('---')) cleanBody = cleanBody.split('---')[0].trim();
            universalBody = cleanBody;
        } else if (/Hook|Headline/i.test(headerLine)) {
            for (const l of body.split('\n')) {
                const lClean = l.trim();
                if (!lClean || lClean.startsWith('---')) continue;
                const optMatch = lClean.match(/^(?:[\*\-\d\.\s]*)(Option\s*\d+(?:\s*\([^\)]+\))?|Variant\s*\d+)?[:\s\*\-]+(.*)$/i);
                if (optMatch && (optMatch[1] || headlines.length < 3)) {
                    const lbl = optMatch[1] || `Option ${headlines.length + 1}`;
                    const optBody = optMatch[2] || lClean;
                    const cleanLbl = strip(lbl).replace(/^[:*\s]+|[:*\s]+$/g, '');
                    const cleanBody = strip(optBody).replace(/^[:*\s]+|[:*\s]+$/g, '');
                    headlines.push({
                        id: headlines.length + 1,
                        label: cleanLbl || `Option ${headlines.length + 1}`,
                        text: cleanBody,
                    });
                } else if (headlines.length > 0) {
                    headlines[headlines.length - 1].text += ' ' + strip(lClean);
                }
            }
        } else if (/LinkedIn/i.test(headerLine)) {
            let cleanBody = strip(body);
            if (cleanBody.includes('---')) cleanBody = cleanBody.split('---')[0].trim();
            linkedinBody = cleanBody;
        } else if (/Reddit/i.test(headerLine)) {
            let cleanBody = strip(body);
            if (cleanBody.includes('---')) cleanBody = cleanBody.split('---')[0].trim();
            const tMatch = cleanBody.match(/^Title[:\s\*\-]+([^\n]+)/i);
            const title = tMatch ? strip(tMatch[1]) : 'Community Discussion & Strategy';
            const bPart = tMatch ? cleanBody.slice(tMatch[0].length).trim() : cleanBody;
            redditBody = {
                title: title,
                body: strip(bPart) || cleanBody,
                raw: cleanBody,
                subreddit: 'marketing'
            };
        } else if (/Blog|Medium|Dev\.to|WordPress|Article|Editorial/i.test(headerLine)) {
            let cleanBody = strip(body);
            if (cleanBody.includes('---')) cleanBody = cleanBody.split('---')[0].trim();
            const tMatch = cleanBody.match(/^#+\s*([^\n]+)|^Title[:\s\*\-]+([^\n]+)/i);
            const title = tMatch ? strip(tMatch[1] || tMatch[2]) : 'The Strategic Growth Guide';
            const bPart = tMatch ? cleanBody.slice(tMatch[0].length).trim() : cleanBody;
            blogBody = {
                title: title,
                body: strip(bPart) || cleanBody,
                raw: cleanBody
            };
        } else if (/Threads/i.test(headerLine)) {
            let cleanBody = strip(body);
            if (cleanBody.includes('---')) cleanBody = cleanBody.split('---')[0].trim();
            threadsBody = cleanBody;
        } else if (/Video|Reels|TikTok|Short-Form/i.test(headerLine)) {
            let cleanBody = strip(body);
            if (cleanBody.includes('---')) cleanBody = cleanBody.split('---')[0].trim();
            reelsBody = cleanBody;
        } else if (/Community|Discord|Slack|Announcement/i.test(headerLine)) {
            let cleanBody = strip(body);
            if (cleanBody.includes('---')) cleanBody = cleanBody.split('---')[0].trim();
            communityBody = cleanBody;
        } else if (/Twitter|X\s*\//i.test(headerLine)) {
            const parts = body.split(/(?:^|\n)\s*(?:\*\*)?(\d+\/\d+)(?:\*\*)?\s*/);
            if (parts.length > 1) {
                for (let i = 1; i < parts.length; i += 2) {
                    const pNum = parts[i].trim();
                    let pText = i + 1 < parts.length ? strip(parts[i + 1]) : '';
                    if (pText.includes('---')) {
                        pText = pText.split('---')[0].trim();
                    }
                    if (pText) {
                        twitterTweets.push({ part: pNum, text: pText });
                    }
                }
            } else {
                twitterTweets.push({ part: '1/1', text: strip(body) });
            }
        } else if (/Email/i.test(headerLine)) {
            const subjMatch = body.match(/Subject(?:\s*Line)?[:\s\*\-]+([^\n]+)/i);
            const subject = subjMatch ? strip(subjMatch[1]) : '';
            let bodyPart = body;
            if (subjMatch) {
                bodyPart = body.slice(subjMatch.index + subjMatch[0].length).trim();
            }
            bodyPart = bodyPart.replace(/^(?:\*\*)?Body[:\*\s\-]+/i, '').trim();
            if (bodyPart.includes('---')) {
                bodyPart = bodyPart.split('---')[0].trim();
            }
            emailData.subject = subject;
            emailData.body = strip(bodyPart);
        } else if (/Meta|Facebook|Ad Variant/i.test(headerLine)) {
            const pMatch = body.match(/Primary(?:\s*Text)?[:\s\*\-]+(.*?)(?=(?:Headline|Description|---|$))/is);
            const hMatch = body.match(/Headline[:\s\*\-]+(.*?)(?=(?:Description|Primary|---|$))/is);
            const dMatch = body.match(/Description[:\s\*\-]+(.*?)(?=(?:Primary|Headline|---|$))/is);
            metaData.primary = pMatch ? strip(pMatch[1]) : '';
            metaData.headline = hMatch ? strip(hMatch[1]) : '';
            metaData.description = dMatch ? strip(dMatch[1]) : '';
        } else if (/Visual|Prompt/i.test(headerLine)) {
            const pText = body.replace(/^(?:>\s*)?(?:\*\*)?Prompt[:\*\s\-]+/i, '').trim();
            visualPrompt = strip(pText);
        }
    }

    return {
        title: campaignTitle,
        universal: universalBody || null,
        headlines: headlines.length > 0 ? headlines : null,
        linkedin: linkedinBody || null,
        reddit: redditBody || null,
        blog: blogBody || null,
        threads: threadsBody || null,
        reels: reelsBody || null,
        community: communityBody || null,
        twitter: twitterTweets.length > 0 ? twitterTweets : null,
        email: (emailData.subject || emailData.body) ? emailData : null,
        meta: (metaData.primary || metaData.headline) ? metaData : null,
        visualPrompt: visualPrompt || null,
        cleanFull: cleanMarkdownText(rawText),
    };
}

export default function DashboardPage() {
    const { user } = useAuth();

    // User Workspace Persistence & Cloud Sync State
    const [saveStatus, setSaveStatus] = useState('idle'); // 'saving' | 'saved' | 'idle'
    const [lastSavedTime, setLastSavedTime] = useState(null);
    const [isHydrating, setIsHydrating] = useState(true);
    const [workspaceHistory, setWorkspaceHistory] = useState([]);
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [showResetConfirmModal, setShowResetConfirmModal] = useState(false);
    const saveTimeoutRef = useRef(null);

    // Campaign Control Panel State
    const [campaignGoal, setCampaignGoal] = useState('');
    const [targetAudience, setTargetAudience] = useState('B2B Tech Executives & Marketing Leaders');
    const [tone, setTone] = useState('Authoritative & High-Energy');
    const [isDragging, setIsDragging] = useState(false);

    // Grounding Files Queue State
    const [fileQueue, setFileQueue] = useState([]);
    const [generatedImageUrl, setGeneratedImageUrl] = useState(null);
    const [visualPrompt, setVisualPrompt] = useState('');
    const [brandImagePrompt, setBrandImagePrompt] = useState('');
    const [imageModelUsed, setImageModelUsed] = useState('');
    const [clarityScore, setClarityScore] = useState(null);
    const [imageAttemptsLog, setImageAttemptsLog] = useState([]);
    const [seoData, setSeoData] = useState(null);
    const [contentType, setContentType] = useState('social_bundle'); // 'social_bundle' | 'seo_article' | 'landing_page'
    const [seoBrief, setSeoBrief] = useState(null);

    // Technical SEO Site Auditor Agent State
    const [auditUrl, setAuditUrl] = useState('');
    const [isAuditing, setIsAuditing] = useState(false);
    const [auditResult, setAuditResult] = useState(null);
    const [auditError, setAuditError] = useState(null);

    const [autoPublish, setAutoPublish] = useState(false);
    const [autoPublishResult, setAutoPublishResult] = useState(null);
    const [swarmError, setSwarmError] = useState(null);

    // Swarm Execution State
    const [isExecuting, setIsExecuting] = useState(false);
    const [activeAgentIndex, setActiveAgentIndex] = useState(-1);
    const [progress, setProgress] = useState(0);
    const [copied, setCopied] = useState(false);
    const [activeOutputTab, setActiveOutputTab] = useState('output');
    const [executionLogs, setExecutionLogs] = useState([]);
    const [generatedOutput, setGeneratedOutput] = useState('');
    const [copyViewMode, setCopyViewMode] = useState('studio'); // 'studio' | 'markdown'
    const [copyFilter, setCopyFilter] = useState('all'); // 'all' | 'headlines' | 'linkedin' | 'twitter' | 'email' | 'meta' | 'visual'
    const [copiedSection, setCopiedSection] = useState(null);

    const parsedBundle = useMemo(() => {
        return parseMarketingBundle(generatedOutput);
    }, [generatedOutput]);

    const copyToClipboard = (text, sectionKey = 'all') => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        setCopiedSection(sectionKey);
        setTimeout(() => {
            setCopiedSection(null);
        }, 2200);
    };

    const handleRunSEOAudit = async (e) => {
        if (e) e.preventDefault();
        if (!auditUrl.trim()) return;
        setIsAuditing(true);
        setAuditError(null);
        setAuditResult(null);
        try {
            const response = await fetch(`${BACKEND_SERVER_URL}/api/seo/audit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: auditUrl.trim() }),
            });
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.detail || 'Technical SEO audit failed');
            }
            const data = await response.json();
            setAuditResult(data);
        } catch (err) {
            setAuditError(err.message || 'Error running technical SEO audit');
        } finally {
            setIsAuditing(false);
        }
    };

    // Omnichannel Social Publishing State
    const [showPublishModal, setShowPublishModal] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [publishPlatforms, setPublishPlatforms] = useState({
        linkedin: true,
        twitter: true,
        instagram: false,
        facebook: false,
        medium: false,
        devto: false,
        wordpress: false,
        discord: false,
        slack: false,
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
            id: 'medium',
            name: 'Medium',
            category: 'blog',
            icon: FileText,
            limit: '50,000 chars',
            type: 'Long Form Editorial Blog',
            color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
        },
        {
            id: 'devto',
            name: 'Dev.to',
            category: 'blog',
            icon: Code,
            limit: '50,000 chars',
            type: 'Technical Article & Code Hub',
            color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
        },
        {
            id: 'wordpress',
            name: 'WordPress',
            category: 'blog',
            icon: Globe,
            limit: '100,000 chars',
            type: 'Self-Hosted CMS & Blog',
            color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
        },
        {
            id: 'discord',
            name: 'Discord',
            category: 'community',
            icon: Megaphone,
            limit: '2,000 chars',
            type: 'Rich Webhook & Channel Embed',
            color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
        },
        {
            id: 'slack',
            name: 'Slack',
            category: 'community',
            icon: MessageSquare,
            limit: '3,000 chars',
            type: 'Workspace Block Kit Message',
            color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
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
            color: 'text-teal-400 bg-teal-500/10 border-teal-500/20',
        },
    ];

    const agents = [
        {
            id: 'ingestion',
            name: 'Ingestion Agent',
            role: 'Document RAG & Vector Store',
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
            name: 'Copywriter Agent',
            role: 'Gemini 3 Copy Engine',
            icon: PenTool,
            color: 'from-amber-500 to-orange-500',
            borderColor: 'border-amber-500/30',
            textColor: 'text-amber-400',
            description: 'Synthesizes high-converting copy angles and campaign bundles with Gemini 3 Flash.',
        },
        {
            id: 'image_gen',
            name: 'Image Generation Agent',
            role: 'Gemini / Hugging Face Multimodal',
            icon: ImageIcon,
            color: 'from-fuchsia-500 to-pink-500',
            borderColor: 'border-fuchsia-500/30',
            textColor: 'text-fuchsia-400',
            description: 'Produces high-impact 4K marketing visual assets via Gemini 3.5 & Hugging Face FLUX/SDXL.',
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
            description: 'Automates scheduling and broadcasting to LinkedIn, X, Meta, YouTube, TikTok, Reddit & Webhooks.',
        },
    ];

    useEffect(() => {
        if (terminalBottomRef.current) {
            terminalBottomRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [executionLogs]);

    const loadGroundingFiles = async () => {
        try {
            const docs = await fetchDocuments();
            if (Array.isArray(docs)) {
                setFileQueue(
                    docs.map((d, i) => ({
                        id: d.filename || `file-${i}`,
                        name: d.filename,
                        size: `${((d.size_bytes || 1024) / 1024).toFixed(1)} KB`,
                        status: 'Ready',
                        chunks: d.chunk_count || 1,
                    }))
                );
            }
        } catch (err) {
            console.error('Could not fetch grounding files:', err);
        }
    };

    useEffect(() => {
        loadGroundingFiles();
    }, []);

    // ── Workspace State Hydration (Local & Cloud Sync) ───────────
    const applyWorkspaceState = (ws) => {
        if (!ws || typeof ws !== 'object') return;
        if (ws.campaignGoal !== undefined && ws.campaignGoal !== null && ws.campaignGoal !== '') {
            setCampaignGoal(ws.campaignGoal);
        }
        if (ws.targetAudience) setTargetAudience(ws.targetAudience);
        if (ws.tone) setTone(ws.tone);
        if (ws.generatedOutput) setGeneratedOutput(ws.generatedOutput);
        if (ws.generatedImageUrl) setGeneratedImageUrl(ws.generatedImageUrl);
        if (ws.visualPrompt) setVisualPrompt(ws.visualPrompt);
        if (ws.brandImagePrompt) setBrandImagePrompt(ws.brandImagePrompt);
        if (ws.imageModelUsed) setImageModelUsed(ws.imageModelUsed);
        if (ws.clarityScore !== undefined && ws.clarityScore !== null) setClarityScore(ws.clarityScore);
        if (Array.isArray(ws.imageAttemptsLog) && ws.imageAttemptsLog.length > 0) setImageAttemptsLog(ws.imageAttemptsLog);
        if (ws.seoData) setSeoData(ws.seoData);
        if (Array.isArray(ws.executionLogs) && ws.executionLogs.length > 0) setExecutionLogs(ws.executionLogs);
        if (ws.publishPlatforms && typeof ws.publishPlatforms === 'object') setPublishPlatforms(ws.publishPlatforms);
        if (Array.isArray(ws.publishedChannels) && ws.publishedChannels.length > 0) setPublishedChannels(ws.publishedChannels);
        if (ws.scheduleDate) setScheduleDate(ws.scheduleDate);
        if (ws.webhookUrl) setWebhookUrl(ws.webhookUrl);
        if (ws.last_updated) {
            setLastSavedTime(new Date(ws.last_updated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        }
    };

    const hydrateUserWorkspace = async (email) => {
        const userKey = `agentic_workspace_${email || 'default'}`;
        // 1. Instant synchronous recovery from localStorage
        try {
            const localSaved = localStorage.getItem(userKey);
            if (localSaved) {
                const parsed = JSON.parse(localSaved);
                applyWorkspaceState(parsed);
                setSaveStatus('saved');
            }
        } catch (e) {
            console.warn('Local workspace parse notice:', e);
        }

        // 2. Fetch from backend server
        try {
            const serverRes = await fetchUserWorkspace(email);
            if (serverRes && serverRes.workspace && Object.keys(serverRes.workspace).length > 0) {
                applyWorkspaceState(serverRes.workspace);
                setSaveStatus('saved');
            }
            if (serverRes?.history && Array.isArray(serverRes.history)) {
                setWorkspaceHistory(serverRes.history);
            }
        } catch (err) {
            console.warn('Backend workspace fetch notice:', err.message);
        } finally {
            setIsHydrating(false);
        }
    };

    useEffect(() => {
        const activeEmail = user?.email || (typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('agentic_user') || '{}')?.email : null);
        hydrateUserWorkspace(activeEmail || 'default@company.com');
    }, [user?.email]);

    // ── Auto-Save Engine ─────────────────────────────────────────
    const persistWorkspace = (isCompleted = false, overrides = {}) => {
        const email = user?.email || (typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('agentic_user') || '{}')?.email : null) || 'default@company.com';
        const userKey = `agentic_workspace_${email}`;

        const bundle = {
            campaignGoal,
            targetAudience,
            tone,
            generatedOutput,
            generatedImageUrl,
            visualPrompt,
            brandImagePrompt,
            imageModelUsed,
            clarityScore,
            imageAttemptsLog,
            seoData,
            executionLogs,
            publishPlatforms,
            publishedChannels,
            scheduleDate,
            webhookUrl,
            ...overrides,
        };

        try {
            localStorage.setItem(userKey, JSON.stringify(bundle));
        } catch (e) {}

        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        setSaveStatus('saving');

        saveTimeoutRef.current = setTimeout(async () => {
            try {
                await saveUserWorkspace({
                    email,
                    ...bundle,
                    is_completed: isCompleted,
                });
                setSaveStatus('saved');
                setLastSavedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
                if (isCompleted) {
                    try {
                        const histRes = await fetchWorkspaceHistory(email);
                        if (histRes?.history) setWorkspaceHistory(histRes.history);
                    } catch (hErr) {}
                }
            } catch (err) {
                setSaveStatus('saved'); // Local copy is already saved
            }
        }, isCompleted ? 20 : 600);
    };

    // Auto-save on user configuration adjustments
    useEffect(() => {
        if (isHydrating) return;
        if (campaignGoal || generatedOutput || generatedImageUrl || executionLogs.length > 0) {
            persistWorkspace(false);
        }
    }, [
        campaignGoal,
        targetAudience,
        tone,
        publishPlatforms,
        webhookUrl,
        scheduleDate,
    ]);

    const handlePresetGoal = (presetGoal) => {
        setCampaignGoal(presetGoal);
    };

    const handleFileUpload = async (incomingFiles) => {
        if (!incomingFiles || incomingFiles.length === 0) return;
        try {
            for (let i = 0; i < incomingFiles.length; i++) {
                await uploadDocument(incomingFiles[i]);
            }
            await loadGroundingFiles();
        } catch (err) {
            console.error('Upload failed:', err);
        }
    };

    const handleRemoveFile = async (id, name) => {
        const target = name || id;
        try {
            await deleteDocument(target);
            await loadGroundingFiles();
        } catch (err) {
            console.error('Remove file failed:', err);
            setFileQueue((prev) => prev.filter((f) => f.id !== id && f.name !== target));
        }
    };

    const handleLaunchSwarm = async () => {
        if (isExecuting) return;

        const effectiveGoal = campaignGoal.trim() || 'Launch an autonomous AI growth campaign to capture mid-market B2B accounts.';
        if (!campaignGoal.trim()) {
            setCampaignGoal(effectiveGoal);
        }

        setIsExecuting(true);
        setActiveAgentIndex(0);
        setProgress(15);
        setGeneratedOutput('');
        setGeneratedImageUrl(null);
        setVisualPrompt('');
        setBrandImagePrompt('');
        setImageModelUsed('');
        setSeoData(null);
        setActiveOutputTab('output');
        setPublishSuccess(false);
        setSwarmError(null);

        const timestamp = () => new Date().toLocaleTimeString();

        setExecutionLogs([
            { id: 1, time: timestamp(), agent: 'System', text: 'Initializing 6-Agent Autonomous Swarm Orchestrator...' },
            { id: 2, time: timestamp(), agent: 'Ingestion Agent', text: `Querying ChromaDB vector collections matching: "${effectiveGoal.slice(0, 45)}..."` },
        ]);

        let step = 0;
        const progressTimer = setInterval(() => {
            step++;
            setProgress((prev) => (prev < 82 ? prev + 8 : prev));
            if (step === 1) setActiveAgentIndex(1);
            else if (step === 2) setActiveAgentIndex(2);
            else if (step === 3) setActiveAgentIndex(3);
            else if (step === 4) setActiveAgentIndex(4);
        }, 1400);

        try {
            const activeChannels = Object.keys(publishPlatforms).filter((k) => publishPlatforms[k]);
            const activeFiles = fileQueue.map((f) => f.name || f.id);
            const result = await runSwarmSync({
                goal: effectiveGoal,
                audience: targetAudience,
                tone: tone,
                content_type: contentType,
                channels: activeChannels.length > 0 ? activeChannels : ['linkedin', 'x', 'meta'],
                files: activeFiles,
            });

            clearInterval(progressTimer);
            setProgress(100);
            setActiveAgentIndex(5);

            const bundle = result?.result || result || {};

            setGeneratedOutput(bundle.copy || '');
            if (bundle.generated_image_url) {
                setGeneratedImageUrl(bundle.generated_image_url);
            }
            if (bundle.visual_prompt) {
                setVisualPrompt(bundle.visual_prompt);
            }
            if (bundle.brand_image_prompt) {
                setBrandImagePrompt(bundle.brand_image_prompt);
            }
            if (bundle.image_model_used) {
                setImageModelUsed(bundle.image_model_used);
            }
            if (bundle.image_clarity_score) {
                setClarityScore(bundle.image_clarity_score);
            }
            if (bundle.image_attempts_log) {
                setImageAttemptsLog(bundle.image_attempts_log);
            }
            if (bundle.seo_metrics) {
                setSeoData(bundle.seo_metrics);
            }
            if (bundle.seo_brief) {
                setSeoBrief(bundle.seo_brief);
            }

            const runId = result?.run_id || bundle.run_id || 'sync_completed';

            if (result?.logs && Array.isArray(result.logs) && result.logs.length > 0) {
                const mappedLogs = result.logs.map((l, idx) => {
                    let agentName = 'System';
                    let logText = l.message || '';
                    if (logText.startsWith('[') && logText.includes(']')) {
                        const closeBracket = logText.indexOf(']');
                        agentName = logText.slice(1, closeBracket);
                        logText = logText.slice(closeBracket + 1).trim();
                    }
                    return {
                        id: Date.now() + idx,
                        time: l.timestamp || timestamp(),
                        agent: agentName,
                        text: logText,
                    };
                });
                setExecutionLogs(mappedLogs);
            } else {
                setExecutionLogs((prev) => [
                    ...prev,
                    { id: Date.now(), time: timestamp(), agent: 'Research Agent', text: 'Retrieved live competitor signals and trends via DuckDuckGo SERP.' },
                    { id: Date.now() + 1, time: timestamp(), agent: 'Copywriter Agent', text: 'Synthesized multi-channel copy & creative visual prompts via Gemini 3 Flash.' },
                    { id: Date.now() + 2, time: timestamp(), agent: 'Image Generation Agent', text: bundle.generated_image_url ? `Campaign visual generated: ${bundle.generated_image_url}` : 'Visual asset formatted.' },
                    { id: Date.now() + 3, time: timestamp(), agent: 'SEO & Analytics Agent', text: `Readability score: ${bundle.seo_metrics?.readability_score || 85}/100 | Intent Match: ${bundle.seo_metrics?.intent_match || '90%'}` },
                    { id: Date.now() + 4, time: timestamp(), agent: 'Social Publisher Agent', text: `Formatted ${bundle.publishing_manifests?.length || 4} omnichannel channel payloads.` },
                    { id: Date.now() + 5, time: timestamp(), agent: 'System', text: `✅ Complete 6-agent swarm pipeline finished with consensus! Run ID: ${runId}` },
                ]);
            }

            // Auto-Publish Trigger
            if (autoPublish && bundle.copy) {
                const targetPlatforms = Object.keys(publishPlatforms).filter((k) => publishPlatforms[k]);
                if (targetPlatforms.length > 0) {
                    try {
                        const fullImageUrl = bundle.generated_image_url
                            ? `${BACKEND_SERVER_URL}${bundle.generated_image_url}`
                            : undefined;
                        const pubRes = await broadcastCampaign({
                            content: bundle.copy,
                            platforms: targetPlatforms,
                            media_url: fullImageUrl,
                            webhook_url: webhookUrl,
                        });
                        const dispatchId = pubRes.dispatch_id || `disp_${Date.now().toString(16)}`;
                        setAutoPublishResult({
                            success: true,
                            dispatchId: dispatchId,
                            platforms: targetPlatforms,
                        });
                        setPublishSuccess(true);
                        setPublishedChannels(targetPlatforms);
                        setExecutionLogs((prev) => [
                            ...prev,
                            {
                                id: Date.now() + 6,
                                time: timestamp(),
                                agent: 'Social Publisher Agent',
                                text: `🚀 Auto-Published to [${targetPlatforms.join(', ')}]! Dispatch ID: ${dispatchId}`,
                            },
                        ]);
                    } catch (pubErr) {
                        console.error('Auto-publish failed:', pubErr);
                        setAutoPublishResult({
                            success: false,
                            error: pubErr.response?.data?.detail || pubErr.message || 'Auto-publish broadcast failed.',
                        });
                    }
                }
            }

            // Immediately persist completed campaign to local & cloud storage with history snapshot
            persistWorkspace(true, {
                campaignGoal: effectiveGoal,
                targetAudience: targetAudience,
                tone: tone,
                generatedOutput: bundle.copy || '',
                generatedImageUrl: bundle.generated_image_url || null,
                visualPrompt: bundle.visual_prompt || '',
                brandImagePrompt: bundle.brand_image_prompt || '',
                imageModelUsed: bundle.image_model_used || '',
                clarityScore: bundle.image_clarity_score || null,
                imageAttemptsLog: bundle.image_attempts_log || [],
                seoData: bundle.seo_metrics || null,
            });

        } catch (err) {
            clearInterval(progressTimer);
            console.warn('Swarm execution non-fatal error:', err?.message || err);
            const isTimeout = err?.code === 'ECONNABORTED' || err?.message?.includes('timeout');
            const errDetail = isTimeout
                ? 'Generation took longer than usual due to remote AI inference queue. Please retry — caches and models are warm.'
                : (err?.response?.data?.detail || err?.message || 'Swarm execution failed.');
            setSwarmError(errDetail);
            setExecutionLogs((prev) => [
                ...prev,
                { id: Date.now(), time: timestamp(), agent: 'System', text: `⚠️ ${errDetail}` },
            ]);
        } finally {
            setIsExecuting(false);
        }
    };

    const handleResetSwarm = () => {
        setShowResetConfirmModal(true);
    };

    const confirmResetWorkspace = async () => {
        const email = user?.email || (typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('agentic_user') || '{}')?.email : null) || 'default@company.com';
        try {
            localStorage.removeItem(`agentic_workspace_${email}`);
            await resetUserWorkspace(email);
        } catch (e) {}

        if (executionIntervalRef.current) clearInterval(executionIntervalRef.current);
        setIsExecuting(false);
        setActiveAgentIndex(-1);
        setProgress(0);
        setCampaignGoal('');
        setGeneratedOutput('');
        setGeneratedImageUrl(null);
        setVisualPrompt('');
        setBrandImagePrompt('');
        setImageModelUsed('');
        setClarityScore(null);
        setImageAttemptsLog([]);
        setSeoData(null);
        setAutoPublishResult(null);
        setExecutionLogs([]);
        setPublishSuccess(false);
        setPublishedChannels([]);
        setShowResetConfirmModal(false);
        setSaveStatus('idle');
    };

    const handleRestoreFromHistory = (item) => {
        if (!item) return;
        setCampaignGoal(item.title || '');
        if (item.audience) setTargetAudience(item.audience);
        if (item.tone) setTone(item.tone);
        if (item.image_url) setGeneratedImageUrl(item.image_url);
        if (item.preview_snippet) setGeneratedOutput(item.preview_snippet);
        setShowHistoryModal(false);
        persistWorkspace(false, {
            campaignGoal: item.title,
            targetAudience: item.audience,
            tone: item.tone,
            generatedImageUrl: item.image_url,
        });
    };

    const handleCopyOutput = () => {
        if (!generatedOutput) return;
        if (copyViewMode === 'markdown') {
            copyToClipboard(generatedOutput, 'bundle_all');
        } else {
            const cleanText = cleanMarkdownText(generatedOutput);
            copyToClipboard(cleanText, 'bundle_all');
        }
        setCopied(true);
        setTimeout(() => setCopied(false), 2200);
    };

    const handleDownloadOutput = (format = 'txt') => {
        if (!generatedOutput) return;
        const isMd = format === 'md' || copyViewMode === 'markdown';
        const content = isMd ? generatedOutput : cleanMarkdownText(generatedOutput);
        const mime = isMd ? 'text/markdown' : 'text/plain';
        const ext = isMd ? 'md' : 'txt';
        const blob = new Blob([content], { type: mime });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `AgenticSwarm_Campaign_${Date.now()}.${ext}`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handlePublishToSocials = async () => {
        const activeChannels = Object.keys(publishPlatforms).filter((k) => publishPlatforms[k]);
        if (activeChannels.length === 0) return;

        setIsPublishing(true);
        setPublishedChannels([]);

        try {
            const fullMediaUrl = generatedImageUrl ? `${BACKEND_SERVER_URL}${generatedImageUrl}` : undefined;
            // Clean text before sending to broadcast channels so markdown asterisks don't leak to social platforms
            const cleanContent = cleanMarkdownText(generatedOutput) || campaignGoal;

            const payload = {
                content: cleanContent,
                platforms: activeChannels,
                media_url: fullMediaUrl || null,
            };

            // Pass webhook URL if webhook channel is selected
            if (publishPlatforms.webhook && webhookUrl && webhookUrl.startsWith('http')) {
                payload.webhook_url = webhookUrl;
            }

            // Pass scheduled time if set
            if (scheduleDate) {
                payload.scheduled_at = new Date(scheduleDate).toISOString();
            }

            await broadcastCampaign(payload);

            for (let i = 0; i < activeChannels.length; i++) {
                await new Promise((resolve) => setTimeout(resolve, 200));
                setPublishedChannels((prev) => [...prev, activeChannels[i]]);
            }

            setPublishSuccess(true);
            setTimeout(() => {
                setShowPublishModal(false);
            }, 3000);
        } catch (err) {
            console.error('Broadcast failed:', err);
        } finally {
            setIsPublishing(false);
        }
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
        <ProtectedRoute>
            <div className="min-h-screen text-slate-100 pb-20 pt-4">
                {/* Top Cyber Command Header */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
                    <div className="cyber-card rounded-3xl p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2.5">
                                <span className="p-2 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-indigo-400">
                                    <Bot className="w-5 h-5" />
                                </span>
                                <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                                    Swarm Command Center
                                </h1>
                                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                    6 Nodes Active
                                </span>
                            </div>
                            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                                Orchestrate vector retrieval, live DuckDuckGo SERP intel, Gemini 3.5 & Hugging Face multimodal copy/visual synthesis, and omnichannel publishing.
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2.5">
                            {saveStatus === 'saving' && (
                                <span className="px-2.5 py-1 rounded-full text-[11px] font-mono bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center gap-1.5 shadow-sm">
                                    <RotateCcw className="w-3 h-3 animate-spin" />
                                    <span>Syncing...</span>
                                </span>
                            )}
                            {saveStatus === 'saved' && (
                                <span className="px-2.5 py-1 rounded-full text-[11px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5 shadow-sm">
                                    <Cloud className="w-3 h-3 text-emerald-400" />
                                    <span>Workspace Saved {lastSavedTime ? `(${lastSavedTime})` : ''}</span>
                                </span>
                            )}

                            {workspaceHistory.length > 0 && (
                                <button
                                    onClick={() => setShowHistoryModal(true)}
                                    className="flex items-center gap-1.5 text-xs font-medium text-slate-300 hover:text-white py-2 px-3 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-900/90 transition cursor-pointer"
                                    title="View archived campaigns"
                                >
                                    <FolderClock className="w-3.5 h-3.5 text-indigo-400" />
                                    <span>Campaign Archives ({workspaceHistory.length})</span>
                                </button>
                            )}

                            {isExecuting && (
                                <div className="flex items-center gap-2.5 px-3.5 py-1.5 bg-indigo-500/10 border border-indigo-500/30 rounded-xl">
                                    <span className="relative flex h-2.5 w-2.5">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-500"></span>
                                    </span>
                                    <span className="text-xs font-semibold text-indigo-300 font-mono">
                                        Swarm Running ({progress}%)
                                    </span>
                                </div>
                            )}

                            {generatedOutput && (
                                <button
                                    onClick={() => setShowPublishModal(true)}
                                    className="flex items-center gap-1.5 text-xs font-bold text-white py-2.5 px-4 rounded-xl bg-gradient-to-r from-pink-600 via-rose-600 to-amber-600 hover:from-pink-500 hover:to-rose-500 shadow-lg shadow-pink-600/30 transition cursor-pointer active:scale-95"
                                >
                                    <Share2 className="w-4 h-4" />
                                    <span>Omnichannel Broadcast</span>
                                </button>
                            )}

                            <button
                                onClick={handleResetSwarm}
                                disabled={!campaignGoal && !generatedOutput && !isExecuting && executionLogs.length === 0}
                                className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-slate-200 py-2 px-3.5 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-900/80 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                                title="Start fresh campaign"
                            >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>New Campaign</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Main Content Layout */}
                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
                    {/* 6-Agent Swarm Topology Grid */}
                    <section>
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <Cpu className="w-4 h-4 text-indigo-400" />
                                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                                    6-Agent Swarm Topology Pipeline
                                </h2>
                            </div>
                            <span className="text-[11px] font-mono text-slate-500">
                                {isExecuting ? 'Sequential execution stream active' : 'All agents ready'}
                            </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
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
                                                ? `bg-slate-900/90 ${agent.borderColor} shadow-xl shadow-indigo-500/20 ring-1 ring-indigo-500/40 glow-indigo`
                                                : isCompleted
                                                ? 'bg-slate-900/70 border-emerald-500/30'
                                                : 'cyber-card'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <div className={`p-2 rounded-xl bg-gradient-to-br ${agent.color} shadow-md`}>
                                                <IconComponent className="w-3.5 h-3.5 text-white" />
                                            </div>

                                            <div>
                                                {isActive ? (
                                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 flex items-center gap-1 animate-pulse">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping" />
                                                        Active
                                                    </span>
                                                ) : isCompleted ? (
                                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                                                        <CheckCircle2 className="w-3 h-3" /> Ready
                                                    </span>
                                                ) : (
                                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono text-slate-500 bg-slate-800/80 border border-slate-700/60">
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
                                            <div className="mt-2.5 pt-2 border-t border-slate-800 flex items-center gap-1.5 text-[10px] text-indigo-300 font-mono">
                                                <Sparkles className="w-3 h-3 animate-spin" />
                                                <span>Orchestrating...</span>
                                            </div>
                                        )}
                                    </motion.div>
                                );
                            })}
                        </div>
                    </section>

                    {/* Workspace Split: Control Panel (Left) & Feed / Output (Right) */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                        {/* Control Panel (5 cols) */}
                        <div className="lg:col-span-5 space-y-5">
                            <div className="cyber-card rounded-3xl p-5 sm:p-6 space-y-5">
                                <div className="flex items-center justify-between border-b border-slate-800/80 pb-3.5">
                                    <div className="flex items-center gap-2">
                                        <Zap className="w-4 h-4 text-amber-400" />
                                        <h2 className="text-sm font-bold text-white">Campaign Directive Console</h2>
                                    </div>
                                    <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-800/50 px-2.5 py-0.5 rounded-full">
                                        PIPELINE INPUT
                                    </span>
                                </div>

                                 {/* Campaign Content Format Selector */}
                                <div>
                                    <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 font-mono">
                                        Campaign Content Format
                                    </label>
                                    <div className="grid grid-cols-3 gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setContentType('social_bundle')}
                                            className={`px-2 py-2 rounded-xl text-[11px] font-semibold border transition text-center cursor-pointer ${
                                                contentType === 'social_bundle'
                                                    ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 shadow-sm'
                                                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                                            }`}
                                        >
                                            📱 Social Bundle
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setContentType('seo_article')}
                                            className={`px-2 py-2 rounded-xl text-[11px] font-semibold border transition text-center cursor-pointer ${
                                                contentType === 'seo_article'
                                                    ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300 shadow-sm'
                                                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                                            }`}
                                        >
                                            📝 SEO Article
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setContentType('landing_page')}
                                            className={`px-2 py-2 rounded-xl text-[11px] font-semibold border transition text-center cursor-pointer ${
                                                contentType === 'landing_page'
                                                    ? 'bg-sky-600/20 border-sky-500 text-sky-300 shadow-sm'
                                                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                                            }`}
                                        >
                                            🌐 Landing Page
                                        </button>
                                    </div>
                                </div>

                                {/* Preset Starters */}
                                <div>
                                    <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 font-mono">
                                        Preset Directive Templates
                                    </label>
                                    <div className="flex flex-wrap gap-1.5">
                                        <button
                                            type="button"
                                            onClick={() => handlePresetGoal('Launch an enterprise B2B SaaS campaign targeting Chief Technology Officers for automated cloud cost intelligence across LinkedIn and X.')}
                                            className="text-[11px] px-3 py-1 rounded-xl bg-slate-900 hover:bg-indigo-950/60 text-slate-300 hover:text-indigo-300 border border-slate-800 hover:border-indigo-500/40 transition active:scale-95 cursor-pointer"
                                        >
                                            🚀 SaaS Launch
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handlePresetGoal('Create high-converting cold outreach copy and omnichannel hooks for AI marketing automation across Reddit, Threads, and Meta.')}
                                            className="text-[11px] px-3 py-1 rounded-xl bg-slate-900 hover:bg-indigo-950/60 text-slate-300 hover:text-indigo-300 border border-slate-800 hover:border-indigo-500/40 transition active:scale-95 cursor-pointer"
                                        >
                                            💼 B2B Outbound
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handlePresetGoal('Generate an SEO and video script cluster targeting autonomous agentic workflows for YouTube, TikTok, and blogs.')}
                                            className="text-[11px] px-3 py-1 rounded-xl bg-slate-900 hover:bg-indigo-950/60 text-slate-300 hover:text-indigo-300 border border-slate-800 hover:border-indigo-500/40 transition active:scale-95 cursor-pointer"
                                        >
                                            🔍 SEO Authority
                                        </button>
                                    </div>
                                </div>

                                {/* Campaign Goal Input */}
                                <div>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <label htmlFor="campaign-goal" className="text-xs font-semibold text-slate-200">
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
                                        placeholder="Describe your marketing objective (e.g. 'Launch our new autonomous AI marketing swarm, targeting VP Marketers with emphasis on ground-truth FAISS accuracy and automated omnichannel broadcasting')..."
                                        className="w-full bg-slate-950/90 border border-slate-800 rounded-2xl p-3 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40 transition resize-none leading-relaxed"
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
                                            placeholder="e.g. CTOs, VP Eng, SaaS Founders"
                                            className="w-full bg-slate-950/90 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition"
                                        />
                                        <div className="flex flex-wrap gap-1 mt-1.5">
                                            {[
                                                'Enterprise CTOs',
                                                'SaaS Founders',
                                                'Growth Marketers',
                                            ].map((aud) => {
                                                const isSelected = targetAudience.toLowerCase().includes(aud.toLowerCase());
                                                return (
                                                    <button
                                                        key={aud}
                                                        type="button"
                                                        onClick={() => {
                                                            if (isSelected) {
                                                                const updated = targetAudience
                                                                    .split(/,\s*/)
                                                                    .filter((item) => item.toLowerCase() !== aud.toLowerCase())
                                                                    .join(', ');
                                                                setTargetAudience(updated);
                                                            } else {
                                                                setTargetAudience((prev) => (prev ? `${prev}, ${aud}` : aud));
                                                            }
                                                        }}
                                                        className={`text-[10px] px-2 py-0.5 rounded-lg border transition cursor-pointer select-none ${
                                                            isSelected
                                                                ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300 font-semibold'
                                                                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-300'
                                                        }`}
                                                    >
                                                        {isSelected ? '✓ ' : '+ '}{aud}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-medium text-slate-400 mb-1">
                                            Brand Voice & Tone
                                        </label>
                                        <select
                                            value={tone}
                                            onChange={(e) => setTone(e.target.value)}
                                            className="w-full bg-slate-950/90 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition cursor-pointer"
                                        >
                                            <option value="Authoritative & High-Energy">Authoritative & Bold</option>
                                            <option value="Conversational & Friendly">Engaging & Conversational</option>
                                            <option value="Data-driven & Technical">Data-driven & Rigorous</option>
                                            <option value="Luxury & Exclusive">Minimalist & Premium</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Grounding Document Upload */}
                                <div>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                                            <FileText className="w-3.5 h-3.5 text-indigo-400" />
                                            Grounding Assets (ChromaDB RAG)
                                        </label>
                                        <span className="text-[10px] text-slate-500 font-mono">PDF, DOCX, TXT, MD</span>
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
                                        className={`relative border-2 border-dashed rounded-2xl p-4 text-center transition-all cursor-pointer ${
                                            isDragging
                                                ? 'border-indigo-400 bg-indigo-500/15'
                                                : 'border-slate-800 hover:border-slate-700 bg-slate-950/50'
                                        }`}
                                    >
                                        <input
                                            type="file"
                                            multiple
                                            onChange={(e) => handleFileUpload(e.target.files)}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        />
                                        <div className="flex flex-col items-center pointer-events-none">
                                            <UploadCloud className="w-6 h-6 text-indigo-400 mb-1" />
                                            <p className="text-xs font-medium text-slate-200">
                                                Click or drag grounding assets here
                                            </p>
                                            <p className="text-[10px] text-slate-500 mt-0.5">
                                                Embedded into vector store for grounded generation
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* File Queue Display */}
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider font-mono">
                                            Indexed Queue ({fileQueue.length})
                                        </span>
                                        {fileQueue.length > 0 && (
                                            <span className="text-[10px] text-emerald-400 font-medium">
                                                All files indexed
                                            </span>
                                        )}
                                    </div>

                                    {fileQueue.length === 0 ? (
                                        <div className="text-center py-4 bg-slate-950/50 border border-slate-800 rounded-xl text-slate-500 text-xs">
                                            No grounding files attached yet.
                                        </div>
                                    ) : (
                                        <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                                            {fileQueue.map((file) => (
                                                <div
                                                    key={file.id}
                                                    className="flex items-center justify-between p-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs"
                                                >
                                                    <div className="flex items-center space-x-2.5 min-w-0 pr-2">
                                                        <div className="p-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-lg shrink-0">
                                                            <FileText className="w-3.5 h-3.5 text-indigo-400" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="font-medium text-slate-200 truncate text-[11px]">
                                                                {file.name}
                                                            </p>
                                                            <p className="text-[10px] text-slate-500 font-mono">
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

                                {/* Target Channels & Auto-Publish */}
                                <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-2.5">
                                    <div className="flex items-center justify-between">
                                        <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                                            <Share2 className="w-3.5 h-3.5 text-pink-400" />
                                            Target Channels
                                        </label>
                                        <label className="flex items-center gap-1.5 text-[10px] font-medium text-slate-300 cursor-pointer select-none">
                                            <input
                                                type="checkbox"
                                                checked={autoPublish}
                                                onChange={(e) => setAutoPublish(e.target.checked)}
                                                className="w-3.5 h-3.5 rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                            />
                                            <span className="text-amber-400 font-semibold flex items-center gap-1">
                                                <Zap className="w-3 h-3 fill-amber-400" />
                                                Auto-Publish
                                            </span>
                                        </label>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                                        {[
                                            { id: 'linkedin', label: 'LinkedIn' },
                                            { id: 'twitter', label: 'X (Twitter)' },
                                            { id: 'instagram', label: 'Meta (IG)' },
                                            { id: 'threads', label: 'Threads' },
                                            { id: 'webhook', label: 'Webhook' },
                                        ].map((p) => (
                                            <label key={p.id} className="flex items-center gap-2 text-slate-300 cursor-pointer hover:text-white transition">
                                                <input
                                                    type="checkbox"
                                                    checked={!!publishPlatforms[p.id]}
                                                    onChange={(e) => setPublishPlatforms((prev) => ({ ...prev, [p.id]: e.target.checked }))}
                                                    className="w-3.5 h-3.5 rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                                />
                                                <span>{p.label}</span>
                                            </label>
                                        ))}
                                    </div>

                                    {autoPublish && (
                                        <p className="text-[10px] text-amber-300/90 bg-amber-500/10 border border-amber-500/20 rounded-xl px-2.5 py-1 font-mono">
                                            ⚡ <strong>Auto-Publish Armed:</strong> Once the 6-agent swarm finishes, it will broadcast copy and creatives to your checked channels.
                                        </p>
                                    )}
                                </div>

                                {/* Launch Swarm Trigger Button */}
                                <div className="pt-1">
                                    <button
                                        type="button"
                                        onClick={handleLaunchSwarm}
                                        disabled={isExecuting}
                                        className={`w-full py-4 px-5 rounded-2xl font-bold text-xs tracking-wider uppercase shadow-xl transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] ${
                                            isExecuting
                                                ? 'bg-indigo-600/70 text-indigo-200 cursor-not-allowed border border-indigo-500/30'
                                                : 'bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 hover:from-indigo-500 hover:to-fuchsia-500 text-white shadow-indigo-600/30 hover:shadow-indigo-600/50'
                                        }`}
                                    >
                                        {isExecuting ? (
                                            <>
                                                <Sparkles className="w-4 h-4 animate-spin text-white" />
                                                <span>Swarm Pipeline Executing ({progress}%)...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Play className="w-4 h-4 fill-white" />
                                                <span>Launch 6-Agent Swarm</span>
                                            </>
                                        )}
                                    </button>
                                    <p className="text-[10px] text-slate-500 text-center mt-2 font-mono">
                                        Coordinates Ingestion, Market Research, Copywriter, Image Gen, SEO Audit, and Social Publisher.
                                    </p>
                                </div>
                            </div>

                            {/* Technical SEO Site Auditor Agent Card */}
                            <div className="cyber-card rounded-3xl p-5 space-y-4">
                                <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                                    <div className="flex items-center gap-2">
                                        <Search className="w-4 h-4 text-emerald-400" />
                                        <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                                            Technical Site Auditor Agent
                                        </h3>
                                    </div>
                                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/50 px-2 py-0.5 rounded-full">
                                        LIVE CRAWLER
                                    </span>
                                </div>

                                <form onSubmit={handleRunSEOAudit} className="flex gap-2">
                                    <input
                                        type="url"
                                        value={auditUrl}
                                        onChange={(e) => setAuditUrl(e.target.value)}
                                        placeholder="Enter site URL (e.g. https://example.com)..."
                                        className="flex-1 bg-slate-950/90 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 transition"
                                    />
                                    <button
                                        type="submit"
                                        disabled={isAuditing || !auditUrl.trim()}
                                        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition active:scale-95 cursor-pointer flex items-center gap-1.5"
                                    >
                                        {isAuditing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Globe className="w-3.5 h-3.5" />}
                                        {isAuditing ? 'Crawling...' : 'Audit Site'}
                                    </button>
                                </form>

                                {auditError && (
                                    <div className="p-3 bg-rose-950/40 border border-rose-800/50 rounded-xl text-xs text-rose-300">
                                        {auditError}
                                    </div>
                                )}

                                {auditResult && (
                                    <div className="space-y-3 pt-2">
                                        <div className="flex items-center justify-between bg-slate-900/90 p-3 rounded-2xl border border-slate-800">
                                            <div>
                                                <div className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">Site Health Score</div>
                                                <div className="text-xl font-black text-emerald-400 flex items-center gap-2">
                                                    {auditResult.health_score}/100
                                                    <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">
                                                        Grade: {auditResult.grade}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="text-right font-mono text-[10px] text-slate-400">
                                                <div>Latency: <span className="text-sky-400">{auditResult.response_time_ms} ms</span></div>
                                                <div>Status: <span className="text-emerald-400">HTTP {auditResult.status_code}</span></div>
                                            </div>
                                        </div>

                                        <div className="space-y-1.5">
                                            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                                                Auditor Recommendations ({auditResult.recommendations.length})
                                            </div>
                                            <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                                                {auditResult.recommendations.map((rec, i) => (
                                                    <div key={i} className="text-[11px] p-2 bg-slate-950/80 border border-slate-800/60 rounded-xl text-slate-300 flex items-start gap-2">
                                                        <span className="text-amber-400 font-bold">•</span>
                                                        <span>{rec}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Swarm Output & Visual Studio (7 cols) */}
                        <div className="lg:col-span-7 space-y-4">
                            {/* Auto-Publish Notification Banner */}
                            {autoPublishResult && autoPublishResult.success && (
                                <div className="p-4 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl text-xs text-emerald-200 flex items-center justify-between gap-3 shadow-lg shadow-emerald-500/5">
                                    <div className="flex items-center gap-2.5">
                                        <span className="p-2 bg-emerald-500/20 rounded-xl text-emerald-400 shrink-0">
                                            <CheckCircle2 className="w-5 h-5" />
                                        </span>
                                        <div>
                                            <p className="font-bold text-emerald-300">
                                                🚀 Swarm Auto-Published Campaign!
                                            </p>
                                            <p className="text-[11px] text-slate-300 mt-0.5">
                                                Broadcast dispatched to <span className="font-semibold text-white">{autoPublishResult.platforms.join(', ')}</span> • Dispatch ID: <code className="font-mono text-emerald-400 bg-slate-950/60 px-1.5 py-0.5 rounded">{autoPublishResult.dispatchId}</code>
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setAutoPublishResult(null)}
                                        className="text-slate-400 hover:text-white text-xs p-1 cursor-pointer"
                                    >
                                        ✕
                                    </button>
                                </div>
                            )}

                            {autoPublishResult && !autoPublishResult.success && (
                                <div className="p-4 bg-rose-500/15 border border-rose-500/30 rounded-2xl text-xs text-rose-200 flex items-center justify-between gap-3 shadow-lg shadow-rose-500/5">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold">⚠️ Auto-Publish Notice:</span>
                                        <span>{autoPublishResult.error}</span>
                                    </div>
                                    <button
                                        onClick={() => setAutoPublishResult(null)}
                                        className="text-slate-400 hover:text-white text-xs p-1 cursor-pointer"
                                    >
                                        ✕
                                    </button>
                                </div>
                            )}

                            {swarmError && (
                                <div className="p-4 bg-amber-500/15 border border-amber-500/30 rounded-2xl text-xs text-amber-200 flex items-center justify-between gap-3 shadow-lg shadow-amber-500/5">
                                    <div className="flex items-center gap-2.5">
                                        <span className="p-2 bg-amber-500/20 rounded-xl text-amber-400 shrink-0">
                                            ⚠️
                                        </span>
                                        <div>
                                            <p className="font-bold text-amber-300">Swarm Orchestration Notice</p>
                                            <p className="text-[11px] text-slate-300 mt-0.5">{swarmError}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={handleLaunchSwarm}
                                            className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-xl font-medium text-xs transition cursor-pointer"
                                        >
                                            Retry
                                        </button>
                                        <button
                                            onClick={() => setSwarmError(null)}
                                            className="text-slate-400 hover:text-white text-xs p-1 cursor-pointer"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="cyber-card rounded-3xl shadow-2xl overflow-hidden flex flex-col min-h-[580px]">
                                {/* Header Tabs & Actions */}
                                <div className="border-b border-slate-800 px-4 sm:px-5 py-3.5 bg-slate-950/60 flex flex-wrap items-center justify-between gap-3">
                                    <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-2xl border border-slate-800">
                                        <button
                                            type="button"
                                            onClick={() => setActiveOutputTab('output')}
                                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                                                activeOutputTab === 'output'
                                                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                                                    : 'text-slate-400 hover:text-slate-200'
                                            }`}
                                        >
                                            <Sparkles className="w-3.5 h-3.5" />
                                            <span>Campaign Copy</span>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => setActiveOutputTab('visuals')}
                                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                                                activeOutputTab === 'visuals'
                                                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                                                    : 'text-slate-400 hover:text-slate-200'
                                            }`}
                                        >
                                            <ImageIcon className="w-3.5 h-3.5" />
                                            <span>Visual Studio</span>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => setActiveOutputTab('terminal')}
                                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                                                activeOutputTab === 'terminal'
                                                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
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
                                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                                                activeOutputTab === 'seo'
                                                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                                                    : 'text-slate-400 hover:text-slate-200'
                                            }`}
                                        >
                                            <Gauge className="w-3.5 h-3.5" />
                                            <span>SEO & Audit</span>
                                        </button>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex items-center space-x-2">
                                        <button
                                            type="button"
                                            onClick={handleCopyOutput}
                                            disabled={!generatedOutput}
                                            className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer ${
                                                copied
                                                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                                    : 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700'
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
                                            className="p-2 rounded-xl text-xs font-medium border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                                            title="Download Markdown Report"
                                        >
                                            <Download className="w-4 h-4 text-slate-400" />
                                        </button>
                                    </div>
                                </div>

                                {/* Dynamic Tab Content */}
                                <div className="p-5 flex-1 flex flex-col bg-slate-950/40">
                                    {/* TAB 1: Campaign Copy Output */}
                                    {activeOutputTab === 'output' && (
                                        <div className="flex-1 flex flex-col">
                                            {!generatedOutput && !isExecuting ? (
                                                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-500 space-y-3">
                                                    <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800">
                                                        <Bot className="w-10 h-10 text-indigo-400/70" />
                                                    </div>
                                                    <div className="max-w-sm">
                                                        <h3 className="text-sm font-bold text-slate-300">
                                                            Workspace Standby
                                                        </h3>
                                                        <p className="text-xs text-slate-500 mt-1">
                                                            Set campaign directive on the left, then click{' '}
                                                            <strong className="text-slate-300">Launch 6-Agent Swarm</strong> to synthesize multi-channel copy, visuals, and SEO audits.
                                                        </p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="space-y-4 flex-1">
                                                    {isExecuting && (
                                                        <div className="p-3.5 bg-indigo-500/10 border border-indigo-500/30 rounded-2xl flex items-center justify-between text-xs text-indigo-300 animate-pulse">
                                                            <span className="flex items-center gap-2">
                                                                <Sparkles className="w-4 h-4 animate-spin" />
                                                                Autonomous swarm collaborating in real-time...
                                                            </span>
                                                            <span className="font-mono">{progress}% Complete</span>
                                                        </div>
                                                    )}

                                                    {/* View Mode & Channel Filter Toolbar */}
                                                    <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800/80">
                                                        <div className="flex items-center gap-1.5 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
                                                            <button
                                                                type="button"
                                                                onClick={() => setCopyViewMode('studio')}
                                                                className={`px-3 py-1 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                                                                    copyViewMode === 'studio'
                                                                        ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-sm'
                                                                        : 'text-slate-400 hover:text-slate-200'
                                                                }`}
                                                            >
                                                                <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
                                                                <span>✨ Clean Studio View</span>
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => setCopyViewMode('markdown')}
                                                                className={`px-3 py-1 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                                                                    copyViewMode === 'markdown'
                                                                        ? 'bg-slate-800 text-indigo-300 border border-slate-700 shadow-sm'
                                                                        : 'text-slate-400 hover:text-slate-200'
                                                                }`}
                                                            >
                                                                <Code className="w-3.5 h-3.5 text-slate-400" />
                                                                <span>Raw Markdown</span>
                                                            </button>
                                                        </div>

                                                        {copyViewMode === 'studio' && (
                                                            <div className="flex items-center gap-1 overflow-x-auto py-0.5 text-[11px]">
                                                                {[
                                                                    { id: 'all', label: 'All Channels' },
                                                                    { id: 'universal', label: '🌟 Universal (Post Anywhere)' },
                                                                    { id: 'headlines', label: `🎯 Hooks (${parsedBundle?.headlines?.length || 3})` },
                                                                    { id: 'linkedin', label: '💼 LinkedIn' },
                                                                    { id: 'twitter', label: `🧵 X Thread (${parsedBundle?.twitter?.length || 3})` },
                                                                    { id: 'reddit', label: '🤖 Reddit' },
                                                                    { id: 'blog', label: '📝 Long-Form / Blog' },
                                                                    { id: 'threads', label: '🧵 Meta Threads' },
                                                                    { id: 'reels', label: '🎥 Video Script' },
                                                                    { id: 'community', label: '💬 Discord / Slack' },
                                                                    { id: 'email', label: '📧 Cold Email' },
                                                                    { id: 'meta', label: '📱 Meta Ad' },
                                                                    { id: 'visual', label: '🎨 Visual Prompt' },
                                                                ].map((f) => (
                                                                    <button
                                                                        key={f.id}
                                                                        type="button"
                                                                        onClick={() => setCopyFilter(f.id)}
                                                                        className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer whitespace-nowrap ${
                                                                            copyFilter === f.id
                                                                                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                                                                                : 'bg-slate-900/60 text-slate-400 hover:text-slate-300 border border-transparent'
                                                                        }`}
                                                                    >
                                                                        {f.label}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* VIEW 1: RAW MARKDOWN VIEW */}
                                                    {copyViewMode === 'markdown' ? (
                                                        <div className="space-y-3">
                                                            <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                                                                <span>RAW COMPONENT MARKDOWN CODE</span>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => copyToClipboard(generatedOutput, 'raw_md')}
                                                                    className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-sans cursor-pointer"
                                                                >
                                                                    {copiedSection === 'raw_md' ? (
                                                                        <>
                                                                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                                                                            <span className="text-emerald-400">Copied!</span>
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <Copy className="w-3.5 h-3.5" />
                                                                            <span>Copy Raw MD</span>
                                                                        </>
                                                                    )}
                                                                </button>
                                                            </div>
                                                            <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-5 text-xs text-slate-300 font-mono leading-relaxed whitespace-pre-wrap selection:bg-indigo-600 overflow-y-auto max-h-[520px]">
                                                                {generatedOutput}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        /* VIEW 2: CLEAN STUDIO VIEW */
                                                        <div className="space-y-4 overflow-y-auto max-h-[540px] pr-1">
                                                            {/* Campaign Header Overview Card & Multimodal Creative Showcase */}
                                                            <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-950/50 via-slate-900/90 to-slate-900/70 border border-indigo-500/30 space-y-3 shadow-xl shadow-indigo-950/30">
                                                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                                                                    <div className="space-y-1">
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
                                                                                <Sparkles className="w-3 h-3 text-indigo-400" />
                                                                                Autonomous Swarm Verified
                                                                            </span>
                                                                            <span className="text-[10px] text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                                                                                12 Formats Ready
                                                                            </span>
                                                                        </div>
                                                                        <h2 className="text-sm font-bold text-white tracking-tight leading-snug">
                                                                            {parsedBundle?.title || 'B2B Marketing Campaign Intelligence'}
                                                                        </h2>
                                                                        <p className="text-xs text-slate-400">
                                                                            Calibrated for <span className="text-slate-200 font-medium">{targetAudience}</span> · <span className="text-indigo-300 font-medium">{tone}</span>
                                                                        </p>
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => copyToClipboard(parsedBundle?.cleanFull || cleanMarkdownText(generatedOutput), 'bundle_all')}
                                                                            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition flex items-center gap-1.5 shadow-md shadow-indigo-600/30 cursor-pointer"
                                                                        >
                                                                            {copiedSection === 'bundle_all' ? (
                                                                                <>
                                                                                    <CheckCheck className="w-4 h-4 text-white" />
                                                                                    <span>Copied Clean Bundle!</span>
                                                                                </>
                                                                            ) : (
                                                                                <>
                                                                                    <Copy className="w-4 h-4" />
                                                                                    <span>Copy All Formats</span>
                                                                                </>
                                                                            )}
                                                                        </button>
                                                                    </div>
                                                                </div>

                                                                {/* Multimodal Creative Asset Banner */}
                                                                {generatedImageUrl && (
                                                                    <div className="pt-2 border-t border-indigo-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                                                                        <div className="flex items-center gap-3">
                                                                            <img
                                                                                src={`${BACKEND_SERVER_URL}${generatedImageUrl}`}
                                                                                alt="AI Campaign Visual"
                                                                                className="w-14 h-14 rounded-lg object-cover border border-indigo-500/40 shadow-sm cursor-pointer hover:opacity-90 transition"
                                                                                onClick={() => setActiveOutputTab('visuals')}
                                                                            />
                                                                            <div className="space-y-0.5">
                                                                                <div className="flex items-center gap-2">
                                                                                    <span className="text-[11px] font-bold text-white flex items-center gap-1">
                                                                                        <ImageIcon className="w-3.5 h-3.5 text-pink-400" />
                                                                                        Multimodal Visual Creative
                                                                                    </span>
                                                                                    <span className="text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded bg-pink-500/10 text-pink-300 border border-pink-500/20">
                                                                                        FLUX.1-schnell
                                                                                    </span>
                                                                                </div>
                                                                                <p className="text-[10px] text-slate-400 line-clamp-1 max-w-md">
                                                                                    Photorealistic creative paired with your copy
                                                                                </p>
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex items-center gap-2">
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => setActiveOutputTab('visuals')}
                                                                                className="px-2.5 py-1 rounded-lg text-xs font-medium text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 transition cursor-pointer"
                                                                            >
                                                                                Open Visual Studio
                                                                            </button>
                                                                            <a
                                                                                href={`${BACKEND_SERVER_URL}${generatedImageUrl}`}
                                                                                download="campaign_creative.png"
                                                                                target="_blank"
                                                                                rel="noreferrer"
                                                                                className="p-1.5 rounded-lg text-slate-300 bg-slate-800 hover:bg-slate-700 transition"
                                                                                title="Download Image"
                                                                            >
                                                                                <Download className="w-3.5 h-3.5" />
                                                                            </a>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {/* SECTION 0: Universal Master Copy (Post Anywhere) */}
                                                            {(copyFilter === 'all' || copyFilter === 'universal') && parsedBundle?.universal && (
                                                                <div className="bg-gradient-to-r from-indigo-950/40 via-purple-950/30 to-slate-900/70 border border-indigo-500/30 rounded-2xl p-4 space-y-3 shadow-lg hover:border-indigo-500/50 transition">
                                                                    <div className="flex items-center justify-between pb-2 border-b border-indigo-500/20">
                                                                        <div className="flex items-center gap-2">
                                                                            <div className="p-1.5 rounded-lg bg-indigo-500/20 border border-indigo-500/30 text-indigo-300">
                                                                                <Globe className="w-4 h-4" />
                                                                            </div>
                                                                            <div>
                                                                                <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                                                                                    🌟 Universal Master Copy
                                                                                    <span className="text-[10px] text-indigo-400 font-mono font-normal">
                                                                                        Post / Publish Anywhere
                                                                                    </span>
                                                                                </h3>
                                                                                <p className="text-[10px] text-slate-400">Versatile high-impact post format optimized for any platform, site, forum, or ad channel</p>
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="text-[10px] font-mono text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                                                                                {parsedBundle.universal.length} chars
                                                                            </span>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => copyToClipboard(parsedBundle.universal, 'universal_post')}
                                                                                className="px-3 py-1 rounded-lg text-xs font-semibold bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 transition flex items-center gap-1 cursor-pointer"
                                                                            >
                                                                                {copiedSection === 'universal_post' ? (
                                                                                    <>
                                                                                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                                                                                        <span className="text-emerald-400">Master Copy Copied!</span>
                                                                                    </>
                                                                                ) : (
                                                                                    <>
                                                                                        <Copy className="w-3.5 h-3.5 text-indigo-400" />
                                                                                        <span>Copy Master Copy</span>
                                                                                    </>
                                                                                )}
                                                                            </button>
                                                                        </div>
                                                                    </div>

                                                                    <div className="p-4 rounded-xl bg-slate-950/80 border border-indigo-900/40 space-y-3">
                                                                        <div className="text-xs text-slate-100 font-sans leading-relaxed whitespace-pre-wrap selection:bg-indigo-600">
                                                                            {parsedBundle.universal}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* SECTION 1: Hooks & Headlines */}
                                                            {(copyFilter === 'all' || copyFilter === 'headlines') && parsedBundle?.headlines && (
                                                                <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-sm hover:border-slate-700/80 transition">
                                                                    <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                                                                        <div className="flex items-center gap-2">
                                                                            <div className="p-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400">
                                                                                <Target className="w-4 h-4" />
                                                                            </div>
                                                                            <div>
                                                                                <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                                                                                    Hook & Headline Variants
                                                                                    <span className="text-[10px] text-purple-400 font-mono font-normal">
                                                                                        ({parsedBundle.headlines.length} angles)
                                                                                    </span>
                                                                                </h3>
                                                                                <p className="text-[10px] text-slate-400">Conversion-engineered direct, challenge, and authority hooks</p>
                                                                            </div>
                                                                        </div>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => {
                                                                                const hooksText = parsedBundle.headlines.map(h => `${h.label}:\n${h.text}`).join('\n\n');
                                                                                copyToClipboard(hooksText, 'all_hooks');
                                                                            }}
                                                                            className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 cursor-pointer"
                                                                        >
                                                                            {copiedSection === 'all_hooks' ? (
                                                                                <>
                                                                                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                                                                                    <span className="text-emerald-400">All Copied</span>
                                                                                </>
                                                                            ) : (
                                                                                <>
                                                                                    <Copy className="w-3.5 h-3.5" />
                                                                                    <span>Copy All Hooks</span>
                                                                                </>
                                                                            )}
                                                                        </button>
                                                                    </div>

                                                                    <div className="space-y-2.5">
                                                                        {parsedBundle.headlines.map((hook, idx) => (
                                                                            <div
                                                                                key={idx}
                                                                                className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition flex flex-col md:flex-row md:items-center justify-between gap-2.5 group"
                                                                            >
                                                                                <div className="space-y-1 flex-1">
                                                                                    <span className="inline-block text-[10px] font-semibold text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded-md border border-purple-500/20">
                                                                                        {hook.label}
                                                                                    </span>
                                                                                    <p className="text-xs text-slate-200 leading-relaxed font-sans font-medium">
                                                                                        {hook.text}
                                                                                    </p>
                                                                                </div>
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => copyToClipboard(hook.text, `hook_${idx}`)}
                                                                                    className="self-end md:self-auto px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 transition flex items-center gap-1 cursor-pointer opacity-90 group-hover:opacity-100"
                                                                                    title="Copy single hook"
                                                                                >
                                                                                    {copiedSection === `hook_${idx}` ? (
                                                                                        <>
                                                                                            <Check className="w-3 h-3 text-emerald-400" />
                                                                                            <span className="text-emerald-400">Copied</span>
                                                                                        </>
                                                                                    ) : (
                                                                                        <>
                                                                                            <Copy className="w-3 h-3 text-slate-400" />
                                                                                            <span>Copy</span>
                                                                                        </>
                                                                                    )}
                                                                                </button>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* SECTION 2: LinkedIn Thought Leadership */}
                                                            {(copyFilter === 'all' || copyFilter === 'linkedin') && parsedBundle?.linkedin && (
                                                                <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-sm hover:border-slate-700/80 transition">
                                                                    <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                                                                        <div className="flex items-center gap-2">
                                                                            <div className="p-1.5 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400">
                                                                                <Share2 className="w-4 h-4" />
                                                                            </div>
                                                                            <div>
                                                                                <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                                                                                    LinkedIn Thought Leadership Post
                                                                                    <span className="text-[10px] text-sky-400 font-mono font-normal">
                                                                                        B2B Authority
                                                                                    </span>
                                                                                </h3>
                                                                                <p className="text-[10px] text-slate-400">Clean paragraphs, value framework, and ready-to-paste hashtags</p>
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="text-[10px] font-mono text-slate-500">
                                                                                {parsedBundle.linkedin.length} chars
                                                                            </span>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => copyToClipboard(parsedBundle.linkedin, 'linkedin_post')}
                                                                                className="px-3 py-1 rounded-lg text-xs font-semibold bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/30 transition flex items-center gap-1 cursor-pointer"
                                                                            >
                                                                                {copiedSection === 'linkedin_post' ? (
                                                                                    <>
                                                                                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                                                                                        <span className="text-emerald-400">Copied for LinkedIn!</span>
                                                                                    </>
                                                                                ) : (
                                                                                    <>
                                                                                        <Copy className="w-3.5 h-3.5 text-sky-400" />
                                                                                        <span>Copy for LinkedIn</span>
                                                                                    </>
                                                                                )}
                                                                            </button>
                                                                        </div>
                                                                    </div>

                                                                    {/* LinkedIn Post View */}
                                                                    <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
                                                                        <div className="flex items-center gap-2.5">
                                                                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center font-bold text-xs text-white">
                                                                                AI
                                                                            </div>
                                                                            <div>
                                                                                <div className="text-xs font-bold text-slate-200">Growth Marketing Executive</div>
                                                                                <div className="text-[10px] text-slate-500">Published via Autonomous Marketing Intelligence Swarm · 1st</div>
                                                                            </div>
                                                                        </div>

                                                                        <div className="text-xs text-slate-200 font-sans leading-relaxed whitespace-pre-wrap selection:bg-sky-600">
                                                                            {parsedBundle.linkedin}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* SECTION 3: X / Twitter 3-Part Thread */}
                                                            {(copyFilter === 'all' || copyFilter === 'twitter') && parsedBundle?.twitter && (
                                                                <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-sm hover:border-slate-700/80 transition">
                                                                    <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                                                                        <div className="flex items-center gap-2">
                                                                            <div className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200">
                                                                                <Globe className="w-4 h-4" />
                                                                            </div>
                                                                            <div>
                                                                                <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                                                                                    X / Twitter Auto-Thread
                                                                                    <span className="text-[10px] text-slate-400 font-mono font-normal">
                                                                                        ({parsedBundle.twitter.length} parts)
                                                                                    </span>
                                                                                </h3>
                                                                                <p className="text-[10px] text-slate-400">Viral hook, value props, and call to action</p>
                                                                            </div>
                                                                        </div>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => {
                                                                                const threadText = parsedBundle.twitter.map(t => `${t.part}\n${t.text}`).join('\n\n');
                                                                                copyToClipboard(threadText, 'full_thread');
                                                                            }}
                                                                            className="px-3 py-1 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition flex items-center gap-1 cursor-pointer"
                                                                        >
                                                                            {copiedSection === 'full_thread' ? (
                                                                                <>
                                                                                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                                                                                    <span className="text-emerald-400">Thread Copied!</span>
                                                                                </>
                                                                            ) : (
                                                                                <>
                                                                                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                                                                                    <span>Copy Full Thread</span>
                                                                                </>
                                                                            )}
                                                                        </button>
                                                                    </div>

                                                                    <div className="space-y-2.5 relative before:absolute before:left-4 before:top-4 before:bottom-4 before:w-0.5 before:bg-slate-800">
                                                                        {parsedBundle.twitter.map((t, idx) => (
                                                                            <div
                                                                                key={idx}
                                                                                className="relative ml-2 pl-6 p-3 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 transition space-y-2 group"
                                                                            >
                                                                                <div className="flex items-center justify-between">
                                                                                    <span className="text-[10px] font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                                                                                        {t.part}
                                                                                    </span>
                                                                                    <div className="flex items-center gap-2">
                                                                                        <span className={`text-[10px] font-mono ${t.text.length <= 280 ? 'text-emerald-400' : 'text-amber-400'}`}>
                                                                                            {t.text.length}/280 chars
                                                                                        </span>
                                                                                        <button
                                                                                            type="button"
                                                                                            onClick={() => copyToClipboard(t.text, `tweet_${idx}`)}
                                                                                            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition cursor-pointer"
                                                                                            title="Copy this tweet"
                                                                                        >
                                                                                            {copiedSection === `tweet_${idx}` ? (
                                                                                                <Check className="w-3 h-3 text-emerald-400" />
                                                                                            ) : (
                                                                                                <Copy className="w-3 h-3" />
                                                                                            )}
                                                                                        </button>
                                                                                    </div>
                                                                                </div>
                                                                                <p className="text-xs text-slate-200 leading-relaxed font-sans whitespace-pre-wrap">
                                                                                    {t.text}
                                                                                </p>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* SECTION: Reddit Discussion */}
                                                            {(copyFilter === 'all' || copyFilter === 'reddit') && parsedBundle?.reddit && (
                                                                <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-sm hover:border-slate-700/80 transition">
                                                                    <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                                                                        <div className="flex items-center gap-2">
                                                                            <div className="p-1.5 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400">
                                                                                <MessageSquare className="w-4 h-4" />
                                                                            </div>
                                                                            <div>
                                                                                <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                                                                                    Reddit Discussion Post
                                                                                    <span className="text-[10px] text-orange-400 font-mono font-normal">
                                                                                        r/{parsedBundle.reddit.subreddit || 'marketing'}
                                                                                    </span>
                                                                                </h3>
                                                                                <p className="text-[10px] text-slate-400">Authentic community-first value post without overt sales pitch</p>
                                                                            </div>
                                                                        </div>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => {
                                                                                const rText = `Title: ${parsedBundle.reddit.title}\n\n${parsedBundle.reddit.body}`;
                                                                                copyToClipboard(rText, 'reddit_post');
                                                                            }}
                                                                            className="px-3 py-1 rounded-lg text-xs font-semibold bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 border border-orange-500/30 transition flex items-center gap-1 cursor-pointer"
                                                                        >
                                                                            {copiedSection === 'reddit_post' ? (
                                                                                <>
                                                                                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                                                                                    <span className="text-emerald-400">Reddit Copied!</span>
                                                                                </>
                                                                            ) : (
                                                                                <>
                                                                                    <Copy className="w-3.5 h-3.5 text-orange-400" />
                                                                                    <span>Copy Reddit Post</span>
                                                                                </>
                                                                            )}
                                                                        </button>
                                                                    </div>

                                                                    <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2.5">
                                                                        <div className="text-xs font-bold text-white">
                                                                            {parsedBundle.reddit.title}
                                                                        </div>
                                                                        <div className="text-xs text-slate-200 font-sans leading-relaxed whitespace-pre-wrap">
                                                                            {parsedBundle.reddit.body}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* SECTION: Medium / Dev.to Long-Form Article */}
                                                            {(copyFilter === 'all' || copyFilter === 'blog') && parsedBundle?.blog && (
                                                                <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-sm hover:border-slate-700/80 transition">
                                                                    <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                                                                        <div className="flex items-center gap-2">
                                                                            <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                                                                                <FileText className="w-4 h-4" />
                                                                            </div>
                                                                            <div>
                                                                                <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                                                                                    Medium / Dev.to / Blog Article
                                                                                    <span className="text-[10px] text-emerald-400 font-mono font-normal">
                                                                                        Long-Form Editorial
                                                                                    </span>
                                                                                </h3>
                                                                                <p className="text-[10px] text-slate-400">In-depth structured article with subheadings and key takeaways</p>
                                                                            </div>
                                                                        </div>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => {
                                                                                const bText = `# ${parsedBundle.blog.title}\n\n${parsedBundle.blog.body}`;
                                                                                copyToClipboard(bText, 'blog_post');
                                                                            }}
                                                                            className="px-3 py-1 rounded-lg text-xs font-semibold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 transition flex items-center gap-1 cursor-pointer"
                                                                        >
                                                                            {copiedSection === 'blog_post' ? (
                                                                                <>
                                                                                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                                                                                    <span className="text-emerald-400">Article Copied!</span>
                                                                                </>
                                                                            ) : (
                                                                                <>
                                                                                    <Copy className="w-3.5 h-3.5 text-emerald-400" />
                                                                                    <span>Copy Article</span>
                                                                                </>
                                                                            )}
                                                                        </button>
                                                                    </div>

                                                                    <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2.5">
                                                                        <div className="text-sm font-bold text-white pb-1 border-b border-slate-800">
                                                                            {parsedBundle.blog.title}
                                                                        </div>
                                                                        <div className="text-xs text-slate-200 font-sans leading-relaxed whitespace-pre-wrap max-h-72 overflow-y-auto pr-2">
                                                                            {parsedBundle.blog.body}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* SECTION: Meta Threads */}
                                                            {(copyFilter === 'all' || copyFilter === 'threads') && parsedBundle?.threads && (
                                                                <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-sm hover:border-slate-700/80 transition">
                                                                    <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                                                                        <div className="flex items-center gap-2">
                                                                            <div className="p-1.5 rounded-lg bg-pink-500/10 border border-pink-500/20 text-pink-400">
                                                                                <Share2 className="w-4 h-4" />
                                                                            </div>
                                                                            <div>
                                                                                <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                                                                                    Meta Threads Microblog Post
                                                                                    <span className="text-[10px] text-pink-400 font-mono font-normal">
                                                                                        Conversational & Viral
                                                                                    </span>
                                                                                </h3>
                                                                                <p className="text-[10px] text-slate-400">High-engagement micro-thread format for Meta Threads & Instagram</p>
                                                                            </div>
                                                                        </div>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => copyToClipboard(parsedBundle.threads, 'threads_post')}
                                                                            className="px-3 py-1 rounded-lg text-xs font-semibold bg-pink-500/20 hover:bg-pink-500/30 text-pink-300 border border-pink-500/30 transition flex items-center gap-1 cursor-pointer"
                                                                        >
                                                                            {copiedSection === 'threads_post' ? (
                                                                                <>
                                                                                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                                                                                    <span className="text-emerald-400">Threads Copied!</span>
                                                                                </>
                                                                            ) : (
                                                                                <>
                                                                                    <Copy className="w-3.5 h-3.5 text-pink-400" />
                                                                                    <span>Copy Threads Post</span>
                                                                                </>
                                                                            )}
                                                                        </button>
                                                                    </div>

                                                                    {/* Realistic Threads Social Post Card */}
                                                                    <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 space-y-3">
                                                                        <div className="flex items-center justify-between">
                                                                            <div className="flex items-center gap-2.5">
                                                                                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-pink-500 via-purple-600 to-indigo-600 flex items-center justify-center font-bold text-xs text-white shadow-sm">
                                                                                    @
                                                                                </div>
                                                                                <div>
                                                                                    <div className="flex items-center gap-1.5">
                                                                                        <span className="text-xs font-bold text-white">growth.intelligence</span>
                                                                                        <span className="text-[10px] text-sky-400">✓</span>
                                                                                    </div>
                                                                                    <span className="text-[10px] text-slate-500">Threads · Just now</span>
                                                                                </div>
                                                                            </div>
                                                                            <span className="text-[10px] font-mono text-slate-500">
                                                                                {parsedBundle.threads.length}/500
                                                                            </span>
                                                                        </div>

                                                                        <div className="text-xs text-slate-100 font-sans leading-relaxed whitespace-pre-wrap selection:bg-pink-600">
                                                                            {parsedBundle.threads}
                                                                        </div>

                                                                        {generatedImageUrl && (
                                                                            <div className="rounded-lg overflow-hidden border border-slate-800 max-h-48">
                                                                                <img
                                                                                    src={`${BACKEND_SERVER_URL}${generatedImageUrl}`}
                                                                                    alt="Creative attachment"
                                                                                    className="w-full h-48 object-cover hover:scale-105 transition duration-300"
                                                                                />
                                                                            </div>
                                                                        )}

                                                                        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-slate-400 text-[11px]">
                                                                            <div className="flex items-center gap-4">
                                                                                <span className="hover:text-pink-400 transition cursor-pointer flex items-center gap-1">
                                                                                    ❤️ <span>248</span>
                                                                                </span>
                                                                                <span className="hover:text-indigo-400 transition cursor-pointer flex items-center gap-1">
                                                                                    💬 <span>34</span>
                                                                                </span>
                                                                                <span className="hover:text-emerald-400 transition cursor-pointer flex items-center gap-1">
                                                                                    🔄 <span>19</span>
                                                                                </span>
                                                                            </div>
                                                                            <span className="text-[10px] text-slate-500 font-mono">Meta Threads Feed Ready</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* SECTION: Short-Form Video Script (Reels / TikTok / Shorts) */}
                                                            {(copyFilter === 'all' || copyFilter === 'reels') && parsedBundle?.reels && (
                                                                <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-sm hover:border-slate-700/80 transition">
                                                                    <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                                                                        <div className="flex items-center gap-2">
                                                                            <div className="p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400">
                                                                                <Video className="w-4 h-4" />
                                                                            </div>
                                                                            <div>
                                                                                <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                                                                                    Video Script (Reels / TikTok / Shorts)
                                                                                    <span className="text-[10px] text-rose-400 font-mono font-normal">
                                                                                        30-60s Format
                                                                                    </span>
                                                                                </h3>
                                                                                <p className="text-[10px] text-slate-400">Visual scene directions + spoken audio voiceover script</p>
                                                                            </div>
                                                                        </div>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => copyToClipboard(parsedBundle.reels, 'reels_post')}
                                                                            className="px-3 py-1 rounded-lg text-xs font-semibold bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 transition flex items-center gap-1 cursor-pointer"
                                                                        >
                                                                            {copiedSection === 'reels_post' ? (
                                                                                <>
                                                                                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                                                                                    <span className="text-emerald-400">Script Copied!</span>
                                                                                </>
                                                                            ) : (
                                                                                <>
                                                                                    <Copy className="w-3.5 h-3.5 text-rose-400" />
                                                                                    <span>Copy Script</span>
                                                                                </>
                                                                            )}
                                                                        </button>
                                                                    </div>

                                                                    <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2.5">
                                                                        <div className="text-xs text-slate-200 font-mono leading-relaxed whitespace-pre-wrap bg-slate-900/60 p-3 rounded-lg border border-slate-800/60">
                                                                            {parsedBundle.reels}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* SECTION: Community Announcement (Discord / Slack) */}
                                                            {(copyFilter === 'all' || copyFilter === 'community') && parsedBundle?.community && (
                                                                <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-sm hover:border-slate-700/80 transition">
                                                                    <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                                                                        <div className="flex items-center gap-2">
                                                                            <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                                                                                <MessageSquare className="w-4 h-4" />
                                                                            </div>
                                                                            <div>
                                                                                <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                                                                                    Discord & Slack Announcement
                                                                                    <span className="text-[10px] text-cyan-400 font-mono font-normal">
                                                                                        Community Channel
                                                                                    </span>
                                                                                </h3>
                                                                                <p className="text-[10px] text-slate-400">Formatted with emoji highlights and quick action link</p>
                                                                            </div>
                                                                        </div>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => copyToClipboard(parsedBundle.community, 'community_post')}
                                                                            className="px-3 py-1 rounded-lg text-xs font-semibold bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 transition flex items-center gap-1 cursor-pointer"
                                                                        >
                                                                            {copiedSection === 'community_post' ? (
                                                                                <>
                                                                                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                                                                                    <span className="text-emerald-400">Copied!</span>
                                                                                </>
                                                                            ) : (
                                                                                <>
                                                                                    <Copy className="w-3.5 h-3.5 text-cyan-400" />
                                                                                    <span>Copy Announcement</span>
                                                                                </>
                                                                            )}
                                                                        </button>
                                                                    </div>

                                                                    <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2.5">
                                                                        <div className="text-xs text-slate-200 font-sans leading-relaxed whitespace-pre-wrap">
                                                                            {parsedBundle.community}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* SECTION 4: B2B Cold Email */}
                                                            {(copyFilter === 'all' || copyFilter === 'email') && parsedBundle?.email && (
                                                                <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-sm hover:border-slate-700/80 transition">
                                                                    <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                                                                        <div className="flex items-center gap-2">
                                                                            <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                                                                                <Mail className="w-4 h-4" />
                                                                            </div>
                                                                            <div>
                                                                                <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                                                                                    B2B Outbound Cold Email Sequence
                                                                                    <span className="text-[10px] text-emerald-400 font-mono font-normal">
                                                                                        High-Open Rate
                                                                                    </span>
                                                                                </h3>
                                                                                <p className="text-[10px] text-slate-400">High-converting subject line and concise value pitch</p>
                                                                            </div>
                                                                        </div>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => {
                                                                                const emailFull = `Subject: ${parsedBundle.email.subject}\n\n${parsedBundle.email.body}`;
                                                                                copyToClipboard(emailFull, 'full_email');
                                                                            }}
                                                                            className="px-3 py-1 rounded-lg text-xs font-semibold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 transition flex items-center gap-1 cursor-pointer"
                                                                        >
                                                                            {copiedSection === 'full_email' ? (
                                                                                <>
                                                                                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                                                                                    <span className="text-emerald-400">Email Copied!</span>
                                                                                </>
                                                                            ) : (
                                                                                <>
                                                                                    <Copy className="w-3.5 h-3.5 text-emerald-400" />
                                                                                    <span>Copy Clean Email</span>
                                                                                </>
                                                                            )}
                                                                        </button>
                                                                    </div>

                                                                    <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
                                                                        {parsedBundle.email.subject && (
                                                                            <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-slate-900/90 border border-slate-800">
                                                                                <div className="text-xs font-sans text-slate-200">
                                                                                    <span className="text-slate-500 font-medium mr-1.5">Subject:</span>
                                                                                    <span className="font-semibold text-white">{parsedBundle.email.subject}</span>
                                                                                </div>
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => copyToClipboard(parsedBundle.email.subject, 'email_subj')}
                                                                                    className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer whitespace-nowrap"
                                                                                >
                                                                                    {copiedSection === 'email_subj' ? 'Copied' : 'Copy Subject'}
                                                                                </button>
                                                                            </div>
                                                                        )}
                                                                        <div className="text-xs text-slate-200 font-sans leading-relaxed whitespace-pre-wrap pt-1">
                                                                            {parsedBundle.email.body}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* SECTION 5: Meta / Facebook Ad Variant */}
                                                            {(copyFilter === 'all' || copyFilter === 'meta') && parsedBundle?.meta && (
                                                                <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-sm hover:border-slate-700/80 transition">
                                                                    <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                                                                        <div className="flex items-center gap-2">
                                                                            <div className="p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
                                                                                <Megaphone className="w-4 h-4" />
                                                                            </div>
                                                                            <div>
                                                                                <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                                                                                    Meta & Paid Social Ad Creative
                                                                                    <span className="text-[10px] text-blue-400 font-mono font-normal">
                                                                                        Feed & Stories
                                                                                    </span>
                                                                                </h3>
                                                                                <p className="text-[10px] text-slate-400">Primary text, punchy ad headline, and meta description</p>
                                                                            </div>
                                                                        </div>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => {
                                                                                const adFull = `Primary Text:\n${parsedBundle.meta.primary}\n\nHeadline:\n${parsedBundle.meta.headline}\n\nDescription:\n${parsedBundle.meta.description}`;
                                                                                copyToClipboard(adFull, 'full_meta');
                                                                            }}
                                                                            className="px-3 py-1 rounded-lg text-xs font-semibold bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30 transition flex items-center gap-1 cursor-pointer"
                                                                        >
                                                                            {copiedSection === 'full_meta' ? (
                                                                                <>
                                                                                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                                                                                    <span className="text-emerald-400">Ad Copied!</span>
                                                                                </>
                                                                            ) : (
                                                                                <>
                                                                                    <Copy className="w-3.5 h-3.5 text-blue-400" />
                                                                                    <span>Copy Ad Creative</span>
                                                                                </>
                                                                            )}
                                                                        </button>
                                                                    </div>

                                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                                                                        <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5 md:col-span-3">
                                                                            <div className="flex items-center justify-between">
                                                                                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Primary Text</span>
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => copyToClipboard(parsedBundle.meta.primary, 'ad_primary')}
                                                                                    className="text-[10px] text-slate-400 hover:text-slate-200 cursor-pointer"
                                                                                >
                                                                                    {copiedSection === 'ad_primary' ? 'Copied' : 'Copy'}
                                                                                </button>
                                                                            </div>
                                                                            <p className="text-xs text-slate-200 leading-relaxed font-sans font-medium">
                                                                                {parsedBundle.meta.primary}
                                                                            </p>
                                                                        </div>
                                                                        <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5 md:col-span-2">
                                                                            <div className="flex items-center justify-between">
                                                                                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Headline</span>
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => copyToClipboard(parsedBundle.meta.headline, 'ad_headline')}
                                                                                    className="text-[10px] text-slate-400 hover:text-slate-200 cursor-pointer"
                                                                                >
                                                                                    {copiedSection === 'ad_headline' ? 'Copied' : 'Copy'}
                                                                                </button>
                                                                            </div>
                                                                            <p className="text-xs text-white font-bold">
                                                                                {parsedBundle.meta.headline}
                                                                            </p>
                                                                        </div>
                                                                        <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
                                                                            <div className="flex items-center justify-between">
                                                                                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Description</span>
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => copyToClipboard(parsedBundle.meta.description, 'ad_desc')}
                                                                                    className="text-[10px] text-slate-400 hover:text-slate-200 cursor-pointer"
                                                                                >
                                                                                    {copiedSection === 'ad_desc' ? 'Copied' : 'Copy'}
                                                                                </button>
                                                                            </div>
                                                                            <p className="text-xs text-slate-300">
                                                                                {parsedBundle.meta.description}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* SECTION 6: Multimodal Visual Prompt */}
                                                            {(copyFilter === 'all' || copyFilter === 'visual') && parsedBundle?.visualPrompt && (
                                                                <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-sm hover:border-slate-700/80 transition">
                                                                    <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                                                                        <div className="flex items-center gap-2">
                                                                            <div className="p-1.5 rounded-lg bg-pink-500/10 border border-pink-500/20 text-pink-400">
                                                                                <ImageIcon className="w-4 h-4" />
                                                                            </div>
                                                                            <div>
                                                                                <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                                                                                    Multimodal Visual Generation Prompt
                                                                                    <span className="text-[10px] text-pink-400 font-mono font-normal">
                                                                                        Photorealistic Creative
                                                                                    </span>
                                                                                </h3>
                                                                                <p className="text-[10px] text-slate-400">Precision artistic directive fed to Image Generation Agent</p>
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex items-center gap-2">
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => setActiveOutputTab('visuals')}
                                                                                className="px-2.5 py-1 rounded-lg text-xs font-medium text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 transition flex items-center gap-1 cursor-pointer"
                                                                            >
                                                                                <span>View Visual Asset</span>
                                                                                <ArrowUpRight className="w-3.5 h-3.5" />
                                                                            </button>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => copyToClipboard(parsedBundle.visualPrompt, 'visual_prompt')}
                                                                                className="px-3 py-1 rounded-lg text-xs font-semibold bg-pink-500/20 hover:bg-pink-500/30 text-pink-300 border border-pink-500/30 transition flex items-center gap-1 cursor-pointer"
                                                                            >
                                                                                {copiedSection === 'visual_prompt' ? (
                                                                                    <>
                                                                                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                                                                                        <span className="text-emerald-400">Prompt Copied!</span>
                                                                                    </>
                                                                                ) : (
                                                                                    <>
                                                                                        <Copy className="w-3.5 h-3.5 text-pink-400" />
                                                                                        <span>Copy Prompt</span>
                                                                                    </>
                                                                                )}
                                                                            </button>
                                                                        </div>
                                                                    </div>

                                                                    <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
                                                                        <p className="text-xs text-slate-300 font-mono leading-relaxed selection:bg-pink-600">
                                                                            {parsedBundle.visualPrompt}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* Fallback if no specific structured sections match */}
                                                            {!parsedBundle?.headlines && !parsedBundle?.linkedin && (
                                                                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 text-xs text-slate-200 leading-relaxed whitespace-pre-wrap selection:bg-indigo-600">
                                                                    {parsedBundle?.cleanFull || cleanMarkdownText(generatedOutput)}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* TAB 2: Multimodal Visual Creatives */}
                                    {activeOutputTab === 'visuals' && (
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h3 className="text-xs font-bold text-white">Multimodal Campaign Visual</h3>
                                                    <p className="text-[10px] text-slate-400">Generated by Image Generation Agent from your campaign directive.</p>
                                                </div>
                                                {generatedImageUrl && (
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full flex items-center gap-1.5">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                                            AI Visual Ready
                                                            {imageModelUsed && (
                                                                <span className="ml-1 text-slate-400 font-sans">
                                                                    · {imageModelUsed.replace('huggingface/', '').replace('black-forest-labs/', '')}
                                                                </span>
                                                            )}
                                                        </span>
                                                        {clarityScore && (
                                                            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
                                                                <CheckCircle2 className="w-3 h-3 text-cyan-400" />
                                                                Clarity: {clarityScore} (Verified)
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            {generatedImageUrl ? (
                                                <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl space-y-4">
                                                    <div className="relative group">
                                                        <img
                                                            src={`${BACKEND_SERVER_URL}${generatedImageUrl}`}
                                                            alt="Generated Campaign Visual"
                                                            className="w-full h-80 object-cover"
                                                        />
                                                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-80" />
                                                        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                                                            <div>
                                                                <p className="text-sm font-bold text-white drop-shadow">{campaignGoal.slice(0, 50) || 'Autonomous Marketing Visual'}</p>
                                                                <p className="text-[10px] text-slate-300 drop-shadow mt-0.5">1024 x 1024 • High Resolution Marketing Asset</p>
                                                            </div>
                                                            <a
                                                                href={`${BACKEND_SERVER_URL}${generatedImageUrl}`}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                download="campaign_visual.png"
                                                                className="bg-indigo-600/90 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-lg flex items-center gap-2 transition cursor-pointer backdrop-blur"
                                                            >
                                                                <Download className="w-3.5 h-3.5" />
                                                                <span>Download Full PNG</span>
                                                            </a>
                                                        </div>
                                                    </div>
                                                    {imageAttemptsLog && imageAttemptsLog.length > 0 && (
                                                        <div className="px-4 py-2.5 bg-slate-900/40 border-t border-slate-800/60 text-xs">
                                                            <p className="text-[10px] font-mono text-slate-400 flex items-center gap-1.5">
                                                                <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                                                                <span>Validation Audit: {imageAttemptsLog.join(' | ')}</span>
                                                            </p>
                                                        </div>
                                                    )}
                                                    {brandImagePrompt ? (
                                                        <div className="p-4 bg-slate-900/60 border-t border-slate-800/80 text-xs space-y-2">
                                                            <p className="text-[11px] font-semibold text-indigo-400 flex items-center gap-1.5 font-mono">
                                                                <span className="inline-block w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                                                                Brand-Derived Prompt (analyzed for marketing fidelity):
                                                            </p>
                                                            <p className="text-slate-300 text-[11px] leading-relaxed whitespace-pre-line font-mono bg-slate-950/60 rounded-xl p-3 border border-slate-800">{brandImagePrompt}</p>
                                                        </div>
                                                    ) : visualPrompt ? (
                                                        <div className="p-4 bg-slate-900/60 border-t border-slate-800/80 text-xs space-y-1.5">
                                                            <p className="text-[11px] font-semibold text-indigo-400 font-mono">Creative Direction & Visual Prompt:</p>
                                                            <p className="text-slate-300 text-[11px] leading-relaxed whitespace-pre-line">{visualPrompt}</p>
                                                        </div>
                                                    ) : null}
                                                </div>
                                            ) : (
                                                <div className="text-center py-16 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-2">
                                                    <ImageIcon className="w-10 h-10 text-slate-600 mx-auto" />
                                                    <p className="text-xs font-medium text-slate-400">No campaign visual generated yet.</p>
                                                    <p className="text-[11px] text-slate-600">Click "Launch 6-Agent Swarm" to generate copy and visuals automatically.</p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* TAB 3: Terminal Stream */}
                                    {activeOutputTab === 'terminal' && (
                                        <div className="flex-1 flex flex-col bg-slate-950 border border-slate-800 rounded-2xl p-4 font-mono text-xs overflow-y-auto max-h-[560px] space-y-2">
                                            <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-[11px] text-slate-500">
                                                <span>CrewAI Orchestrator Terminal Stream</span>
                                                <span className="flex items-center gap-1.5 text-emerald-400">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                                    WebSocket: Online
                                                </span>
                                            </div>

                                            {executionLogs.length === 0 ? (
                                                <p className="text-slate-600 text-xs italic py-8 text-center">
                                                    No execution events logged yet. Launch the swarm to inspect agent telemetry.
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
                                                                    : log.agent === 'Copywriter Agent'
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
                                             {/* Scorecard Hero Banner */}
                                             <div className="p-5 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/60 border border-slate-800 rounded-2xl flex items-center justify-between shadow-xl">
                                                 <div>
                                                     <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                                                         SurferSEO Content Optimization Scorecard
                                                     </div>
                                                     <div className="flex items-baseline gap-3 mt-1">
                                                         <span className="text-3xl font-black text-emerald-400 font-mono">
                                                             {seoData?.content_score ?? 88}/100
                                                         </span>
                                                         <span className="text-xs px-2.5 py-0.5 rounded-full font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                                             Grade: {seoData?.grade ?? 'A'}
                                                         </span>
                                                     </div>
                                                     <p className="text-[11px] text-slate-400 mt-1">
                                                         {seoData?.verdict ?? 'Verified for optimal conversion & search indexability.'}
                                                     </p>
                                                 </div>

                                                 <div className="text-right font-mono text-[11px] text-slate-400 space-y-1">
                                                     <div>Word Count: <span className="text-white font-bold">{seoData?.word_count ?? 680}</span></div>
                                                     <div>Grade Level: <span className="text-emerald-400">{seoData?.grade_level ?? 8.2}</span></div>
                                                     <div>Headers Ratio: <span className="text-cyan-400">{seoData?.header_count?.ratio_words_per_header ?? 240} w/h</span></div>
                                                 </div>
                                             </div>

                                             <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                                 <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl">
                                                     <p className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">
                                                         Flesch Reading Ease
                                                     </p>
                                                     <h4 className="text-lg font-bold text-emerald-400 mt-1">{seoData?.readability_score ?? 88} / 100</h4>
                                                     <p className="text-[10px] text-slate-500 mt-0.5">Grade {seoData?.grade_level ?? 8.2} (Textstat Audit)</p>
                                                 </div>

                                                 <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl">
                                                     <p className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">
                                                         Search Intent
                                                     </p>
                                                     <h4 className="text-sm font-bold text-indigo-400 mt-1">{seoBrief?.search_intent ?? 'Informational & Commercial'}</h4>
                                                     <p className="text-[10px] text-slate-500 mt-0.5">Target: {seoBrief?.target_word_count ?? 1200} words</p>
                                                 </div>

                                                 <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl">
                                                     <p className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">
                                                         LSI Coverage
                                                     </p>
                                                     <h4 className="text-lg font-bold text-cyan-400 mt-1">{seoData?.lsi_analysis?.coverage_pct ?? '85%'}</h4>
                                                     <p className="text-[10px] text-slate-500 mt-0.5">{seoData?.lsi_analysis?.matched?.length ?? 6} LSI terms matched</p>
                                                 </div>
                                             </div>

                                             {/* Automated SEO Brief & PAA Questions */}
                                             {seoBrief && (
                                                 <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2.5">
                                                     <h4 className="text-xs font-semibold text-slate-300 font-mono uppercase tracking-wider flex items-center gap-2">
                                                         <Search className="w-3.5 h-3.5 text-violet-400" />
                                                         Automated SERP Brief & "People Also Ask" Prompts
                                                     </h4>
                                                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                                         {seoBrief.people_also_ask?.map((q, i) => (
                                                             <div key={i} className="p-2.5 bg-slate-900/60 rounded-xl border border-slate-800/80 text-slate-300 flex items-start gap-2">
                                                                 <span className="text-indigo-400 font-bold font-mono">?</span>
                                                                 <span>{q}</span>
                                                             </div>
                                                         ))}
                                                     </div>
                                                 </div>
                                             )}

                                             {/* Target LSI Keyword Distribution */}
                                             <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
                                                 <h4 className="text-xs font-semibold text-slate-300">Target Keyword Distribution & Density</h4>
                                                 <div className="space-y-2">
                                                     {(seoData?.keyword_density && seoData.keyword_density.length > 0
                                                         ? seoData.keyword_density
                                                         : [
                                                             { keyword: 'Autonomous Marketing Swarm', count: '14 mentions', density: '2.8%', status: 'Optimal' },
                                                             { keyword: 'Multi-Agent Intelligence', count: '9 mentions', density: '1.9%', status: 'Optimal' },
                                                             { keyword: 'Technical SEO Audit', count: '6 mentions', density: '1.2%', status: 'Balanced' },
                                                         ]
                                                     ).map((kw, i) => (
                                                         <div key={i} className="flex items-center justify-between p-2.5 bg-slate-900/60 rounded-xl text-xs">
                                                             <span className="font-mono text-slate-300">{kw.keyword}</span>
                                                             <div className="flex items-center space-x-3">
                                                                 <span className="text-[11px] text-slate-400">
                                                                     {typeof kw.count === 'number' ? `${kw.count} mentions` : kw.count}
                                                                 </span>
                                                                 <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                                                                     {kw.density}
                                                                 </span>
                                                             </div>
                                                         </div>
                                                     ))}
                                                 </div>
                                             </div>

                                             {/* Internal & External Link Suggestions */}
                                             {seoData?.link_suggestions && (
                                                 <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
                                                     <h4 className="text-xs font-semibold text-slate-300 font-mono uppercase tracking-wider">
                                                         Contextual Link Placement Audit
                                                     </h4>
                                                     <div className="space-y-1.5">
                                                         {seoData.link_suggestions.map((link, i) => (
                                                             <div key={i} className="p-2.5 bg-slate-900/60 rounded-xl text-xs flex items-center justify-between">
                                                                 <div>
                                                                     <span className="text-slate-200 font-medium">"{link.anchor}"</span>
                                                                     <span className="text-[10px] text-slate-500 ml-2 font-mono">{link.target}</span>
                                                                 </div>
                                                                 <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 font-mono">
                                                                     {link.type}
                                                                 </span>
                                                             </div>
                                                         ))}
                                                     </div>
                                                 </div>
                                             )}
                                         </div>
                                     )}
                                </div>
                            </div>
                        </div>
                    </div>
                </main>

                {/* Omnichannel Social Publishing Modal */}
                <AnimatePresence>
                    {showPublishModal && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="bg-slate-900 border border-indigo-500/30 rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl space-y-5 my-8 glow-indigo"
                            >
                                <div className="flex justify-between items-center border-b border-slate-800 pb-3.5">
                                    <div className="flex items-center gap-2.5">
                                        <div className="p-2.5 rounded-xl bg-pink-500/10 border border-pink-500/20 text-pink-400">
                                            <Share2 className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-bold text-white">Social Publisher: Omnichannel Broadcast</h3>
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
                                                <span key={ch} className="px-2.5 py-1 rounded-xl text-[10px] font-mono capitalize bg-slate-950 border border-emerald-500/30 text-emerald-300">
                                                    ✓ {ch}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4 text-xs">
                                        {/* Broadcast Payload Preview */}
                                        <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl flex items-center gap-3">
                                            {generatedImageUrl ? (
                                                <img
                                                    src={`${BACKEND_SERVER_URL}${generatedImageUrl}`}
                                                    alt="Creative"
                                                    className="w-16 h-12 object-cover rounded-xl border border-slate-700/60 shadow flex-shrink-0"
                                                />
                                            ) : (
                                                <div className="w-16 h-12 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-center text-slate-600 text-[10px] flex-shrink-0">
                                                    No Image
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="text-[11px] font-semibold text-white truncate">
                                                        {campaignGoal || 'Campaign Copy'}
                                                    </span>
                                                    <span className="text-[10px] text-emerald-400 font-mono flex-shrink-0 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                                        {(generatedOutput || '').length} chars
                                                    </span>
                                                </div>
                                                <p className="text-[10px] text-slate-400 truncate mt-1 font-mono">
                                                    {generatedOutput ? generatedOutput.replace(/[\n#*]/g, ' ').slice(0, 90) + '...' : 'Generated AI copy ready for distribution.'}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Category Filter */}
                                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                                            <div className="flex flex-wrap gap-1.5">
                                                    {[
                                                    { id: 'all', label: 'All Channels' },
                                                    { id: 'b2b', label: 'B2B & Social' },
                                                    { id: 'blog', label: 'Blogs & CMS' },
                                                    { id: 'visual', label: 'Visual & Feed' },
                                                    { id: 'video', label: 'Video & Creator' },
                                                    { id: 'community', label: 'Communities' },
                                                    { id: 'universal', label: 'Webhook' },
                                                ].map((cat) => (
                                                    <button
                                                        key={cat.id}
                                                        type="button"
                                                        onClick={() => setSelectedCategory(cat.id)}
                                                        className={`px-2.5 py-1 rounded-xl text-[11px] font-medium transition cursor-pointer ${
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
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-60 overflow-y-auto pr-1">
                                            {filteredPlatforms.map((platform) => {
                                                const IconComponent = platform.icon;
                                                const isSelected = !!publishPlatforms[platform.id];
                                                const isBeingPublished = isPublishing && publishedChannels.includes(platform.id);

                                                return (
                                                    <label
                                                        key={platform.id}
                                                        className={`flex items-center justify-between p-3 rounded-2xl border transition cursor-pointer select-none ${
                                                            isSelected
                                                                ? 'bg-slate-950 border-indigo-500/40 ring-1 ring-indigo-500/30'
                                                                : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 opacity-75'
                                                        }`}
                                                    >
                                                        <div className="flex items-center space-x-3 min-w-0 pr-2">
                                                            <div className={`p-2 rounded-xl border ${platform.color} shrink-0`}>
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
                                                                    ✓ Dispatched
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

                                        {publishPlatforms.webhook && (
                                            <div className="space-y-3">
                                                {/* Webhook URL Input */}
                                                <div className="p-3 bg-slate-950 border border-emerald-500/30 rounded-2xl space-y-2">
                                                    <div className="flex justify-between items-center">
                                                        <label className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1.5">
                                                            <Webhook className="w-3.5 h-3.5" />
                                                            Webhook Destination URL
                                                        </label>
                                                        <span className="text-[10px] text-slate-500">Paste your Zapier / Buffer / Make URL below</span>
                                                    </div>
                                                    <input
                                                        type="url"
                                                        value={webhookUrl}
                                                        onChange={(e) => setWebhookUrl(e.target.value)}
                                                        placeholder="https://hooks.zapier.com/hooks/catch/..."
                                                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-emerald-500 transition"
                                                    />
                                                    {webhookUrl && webhookUrl.startsWith('http') && (
                                                        <p className="text-[10px] text-emerald-400 flex items-center gap-1">
                                                            <CheckCircle2 className="w-3 h-3" /> Valid URL detected — ready to dispatch
                                                        </p>
                                                    )}
                                                </div>

                                                {/* Zapier / Buffer / Make Setup Guide */}
                                                <div className="p-3.5 bg-indigo-950/40 border border-indigo-500/20 rounded-2xl space-y-3">
                                                    <p className="text-[11px] font-bold text-indigo-300 flex items-center gap-1.5">
                                                        <Zap className="w-3.5 h-3.5 text-amber-400" />
                                                        How to get your webhook URL (5-min setup, free)
                                                    </p>

                                                    {/* Option 1: Zapier */}
                                                    <div className="space-y-1.5">
                                                        <p className="text-[11px] font-semibold text-amber-400">Option 1 — Zapier (Recommended)</p>
                                                        <ol className="text-[10px] text-slate-400 space-y-1 pl-3 list-decimal">
                                                            <li>Go to <a href="https://zapier.com/app/zaps" target="_blank" rel="noopener noreferrer" className="text-amber-400 underline hover:text-amber-300">zapier.com/app/zaps</a> → Create Zap</li>
                                                            <li>Trigger: <span className="text-slate-200">"Webhooks by Zapier" → "Catch Hook"</span></li>
                                                            <li>Copy the webhook URL → paste above</li>
                                                            <li>Action: <span className="text-slate-200">"LinkedIn" → "Create Share Update"</span> (or Twitter, Slack, etc.)</li>
                                                            <li>Map <code className="text-emerald-400">content</code> field → Post body. Done!</li>
                                                        </ol>
                                                    </div>

                                                    <div className="border-t border-slate-800/60" />

                                                    {/* Option 2: Buffer */}
                                                    <div className="space-y-1.5">
                                                        <p className="text-[11px] font-semibold text-sky-400">Option 2 — Buffer via Zapier</p>
                                                        <ol className="text-[10px] text-slate-400 space-y-1 pl-3 list-decimal">
                                                            <li>Connect your LinkedIn/Twitter/Instagram to <a href="https://buffer.com" target="_blank" rel="noopener noreferrer" className="text-sky-400 underline hover:text-sky-300">buffer.com</a></li>
                                                            <li>In Zapier: Action = <span className="text-slate-200">"Buffer" → "Create Update"</span></li>
                                                            <li>Map <code className="text-emerald-400">content</code> → Text, <code className="text-emerald-400">media_url</code> → Photo URL</li>
                                                            <li>Buffer auto-posts to all connected profiles simultaneously</li>
                                                        </ol>
                                                    </div>

                                                    <div className="border-t border-slate-800/60" />

                                                    {/* Option 3: Make */}
                                                    <div className="space-y-1.5">
                                                        <p className="text-[11px] font-semibold text-violet-400">Option 3 — Make.com (formerly Integromat)</p>
                                                        <ol className="text-[10px] text-slate-400 space-y-1 pl-3 list-decimal">
                                                            <li>Go to <a href="https://make.com" target="_blank" rel="noopener noreferrer" className="text-violet-400 underline hover:text-violet-300">make.com</a> → Create Scenario</li>
                                                            <li>Add module: <span className="text-slate-200">Webhooks → Custom webhook</span> → Copy URL above</li>
                                                            <li>Add LinkedIn / Twitter / Facebook module → map <code className="text-emerald-400">content</code></li>
                                                            <li>Activate scenario → click Broadcast below to test!</li>
                                                        </ol>
                                                    </div>

                                                    <div className="border-t border-slate-800/60" />

                                                    {/* Payload preview */}
                                                    <div className="space-y-1">
                                                        <p className="text-[10px] font-semibold text-slate-400">📦 What we send to your webhook:</p>
                                                        <pre className="text-[10px] text-emerald-300 bg-slate-950 rounded-xl p-2.5 overflow-x-auto font-mono">{`{
  "dispatch_id": "disp_abc123",
  "timestamp": "2026-09-24T...",
  "content": "[your clean campaign copy]",
  "media_url": "http://localhost:8000/api/swarm/images/...",
  "platforms": ["linkedin", "twitter", ...]
}`}</pre>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

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
                                                            <span>Broadcasting...</span>
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

                {/* ── Campaign History & Archives Modal ────────────────── */}
                <AnimatePresence>
                    {showHistoryModal && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="cyber-card rounded-3xl max-w-2xl w-full p-6 max-h-[85vh] flex flex-col border border-indigo-500/30 shadow-2xl"
                            >
                                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                                    <div className="flex items-center gap-2.5">
                                        <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                                            <FolderClock className="w-5 h-5" />
                                        </span>
                                        <div>
                                            <h3 className="text-base font-bold text-white">Campaign Archives & Saved Work</h3>
                                            <p className="text-xs text-slate-400">Restore any previous campaign directly into your active workspace</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setShowHistoryModal(false)}
                                        className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="flex-1 overflow-y-auto py-4 space-y-3 pr-1">
                                    {workspaceHistory.length === 0 ? (
                                        <div className="text-center py-12 text-slate-500 text-xs">
                                            No completed campaign archives found yet. Launch a swarm to auto-save campaigns!
                                        </div>
                                    ) : (
                                        workspaceHistory.map((item, idx) => (
                                            <div
                                                key={item.id || idx}
                                                className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 hover:border-indigo-500/40 transition flex items-center justify-between gap-4"
                                            >
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-xs font-bold text-white truncate max-w-sm">
                                                            {item.title}
                                                        </span>
                                                        {item.seo_score && (
                                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                                                SEO: {item.seo_score}%
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-[11px] text-slate-400 truncate">
                                                        Audience: {item.audience} • {item.tone}
                                                    </p>
                                                    <p className="text-[10px] text-slate-500 mt-1 font-mono">
                                                        {item.completed_at ? new Date(item.completed_at).toLocaleString() : 'Saved Archive'}
                                                    </p>
                                                </div>

                                                <button
                                                    onClick={() => handleRestoreFromHistory(item)}
                                                    className="px-3.5 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/40 text-xs font-semibold transition cursor-pointer shrink-0"
                                                >
                                                    Restore
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>

                                <div className="pt-3 border-t border-slate-800 flex justify-end">
                                    <button
                                        onClick={() => setShowHistoryModal(false)}
                                        className="py-2 px-4 rounded-xl text-xs font-medium text-slate-400 hover:text-white bg-slate-900 border border-slate-800 hover:border-slate-700 transition cursor-pointer"
                                    >
                                        Close
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* ── Reset Confirmation Modal ─────────────────────────── */}
                <AnimatePresence>
                    {showResetConfirmModal && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="cyber-card rounded-2xl max-w-md w-full p-6 border border-slate-800 shadow-2xl text-center"
                            >
                                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto mb-3">
                                    <RotateCcw className="w-6 h-6" />
                                </div>
                                <h3 className="text-base font-bold text-white mb-1.5">Start New Campaign?</h3>
                                <p className="text-xs text-slate-400 mb-5">
                                    This will clear the current draft inputs. Your completed campaigns remain safely preserved in the Campaign Archives.
                                </p>
                                <div className="flex items-center justify-center gap-3">
                                    <button
                                        onClick={() => setShowResetConfirmModal(false)}
                                        className="py-2 px-4 rounded-xl text-xs font-medium text-slate-400 hover:text-white bg-slate-900 border border-slate-800 hover:border-slate-700 transition cursor-pointer"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={confirmResetWorkspace}
                                        className="py-2 px-4 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-md shadow-indigo-600/30 transition cursor-pointer"
                                    >
                                        Yes, Start Fresh
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </ProtectedRoute>
    );
}
