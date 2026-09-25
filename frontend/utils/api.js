import axios from 'axios';

// Direct connection to FastAPI backend server on port 8000 to prevent Next.js dev proxy socket timeout
export const BACKEND_SERVER_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
export const API_BASE_URL = `${BACKEND_SERVER_URL}/api`;

const API = axios.create({
    baseURL: API_BASE_URL,
    timeout: 600000, // 10 minutes safety ceiling for autonomous multi-agent pipeline
});

API.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
});

// ── System & Stats ───────────────────────────────────────────────
export const fetchHealth = async () => {
    try {
        const res = await API.get('/health');
        return res.data;
    } catch (err) {
        console.warn('Backend /health unreachable:', err?.message || err);
        return { status: 'offline', error: err?.message };
    }
};

export const fetchStats = async () => {
    try {
        const res = await API.get('/stats');
        return res.data;
    } catch (err) {
        console.warn('Backend /stats unreachable:', err?.message || err);
        return { total_campaigns: 0, active_agents: 0, status: 'offline' };
    }
};

// ── RAG Knowledge Base ───────────────────────────────────────────
export const fetchDocuments = async () => {
    try {
        const res = await API.get('/rag/documents');
        return res.data || [];
    } catch (err) {
        console.warn('Backend /rag/documents unreachable:', err?.message || err);
        return [];
    }
};

export const uploadDocument = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await API.post('/rag/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
};

export const deleteDocument = async (filename) => {
    const res = await API.delete(`/rag/documents/${encodeURIComponent(filename)}`);
    return res.data;
};

export const queryKnowledgeBase = async (query, topK = 4) => {
    try {
        const res = await API.post('/rag/query', { query, top_k: topK });
        return res.data;
    } catch (err) {
        console.warn('Backend /rag/query unreachable:', err?.message || err);
        return { results: [], answer: 'Could not connect to vector store. Ensure backend is running.' };
    }
};

// ── Swarm Orchestration ──────────────────────────────────────────
export const runSwarmSync = async (directives) => {
    const res = await API.post('/swarm/run-sync', directives);
    return res.data;
};

// ── Omnichannel Publishing ───────────────────────────────────────
export const broadcastCampaign = async (payload) => {
    const res = await API.post('/publish/broadcast', payload);
    return res.data;
};

export const fetchPublishHistory = async () => {
    try {
        const res = await API.get('/publish/history');
        return res.data || [];
    } catch (err) {
        console.warn('Backend /publish/history unreachable:', err?.message || err);
        return [];
    }
};

// ── Collaborators & Users ────────────────────────────────────────
export const fetchCollaborators = async () => {
    try {
        const res = await API.get('/auth/users');
        return res.data || [];
    } catch (err) {
        console.warn('Backend /auth/users unreachable:', err?.message || err);
        return [];
    }
};

export const fetchUsers = fetchCollaborators;

// ── Workspace State Persistence ──────────────────────────────────
export const fetchUserWorkspace = async (email) => {
    try {
        const params = email ? { email } : {};
        const res = await API.get('/workspace', { params });
        return res.data;
    } catch (err) {
        console.warn('Backend /workspace unreachable:', err?.message || err);
        return null;
    }
};

export const saveUserWorkspace = async (workspaceData) => {
    const res = await API.post('/workspace', workspaceData);
    return res.data;
};

export const resetUserWorkspace = async (email) => {
    const params = email ? { email } : {};
    const res = await API.post('/workspace/reset', null, { params });
    return res.data;
};

export const fetchWorkspaceHistory = async (email) => {
    try {
        const params = email ? { email } : {};
        const res = await API.get('/workspace/history', { params });
        return res.data || [];
    } catch (err) {
        console.warn('Backend /workspace/history unreachable:', err?.message || err);
        return [];
    }
};

export default API;
