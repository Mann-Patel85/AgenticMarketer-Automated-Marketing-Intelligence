# 🚀 AgenticMarketer: Automated Marketing Intelligence Swarm

[![React](https://img.shields.io/badge/Frontend-React%2019%20%7C%20Vite-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind%20CSS%20v4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![FastAPI](https://img.shields.io/badge/Backend-Python%20FastAPI-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![CrewAI](https://img.shields.io/badge/Orchestration-CrewAI-FF6F61?logo=ai&logoColor=white)](https://www.crewai.com/)
[![Gemini](https://img.shields.io/badge/AI%20Models-Google%20Gemini%20API-4285F4?logo=google&logoColor=white)](https://ai.google.dev/)
[![ChromaDB](https://img.shields.io/badge/Vector%20Store-ChromaDB-FF4F00?logo=databricks&logoColor=white)](https://www.trychroma.com/)

**AgenticMarketer** is an enterprise-grade autonomous AI SaaS platform engineered to operate as a 24/7 digital marketing agency. Rather than relying on simple, single-prompt instructions or brittle manual workflows, AgenticMarketer coordinates a synchronized swarm of specialized AI agents—spanning document ingestion, live market research, multimodal creative copywriting, technical SEO auditing, and automated social publishing.

---

## 📑 Table of Contents

- [Core System Overview](#-core-system-overview)
- [System Architecture](#-system-architecture)
- [Multi-Agent Swarm Pipeline (CrewAI)](#-multi-agent-swarm-pipeline-crewai)
- [Tech Stack & Infrastructure](#-tech-stack--infrastructure)
- [Frontend Architecture & Workspaces](#-frontend-architecture--workspaces)
- [Role-Based Access Control (RBAC)](#-role-based-access-control-rbac)
- [Target Backend REST API Specification](#-target-backend-rest-api-specification)
- [Project Directory Structure](#-project-directory-structure)
- [Getting Started & Installation](#-getting-started--installation)
- [Environment Configuration](#-environment-configuration)
- [Roadmap](#-roadmap)

---

## 🌟 Core System Overview

Traditional marketing workflows are fragmented between research tools, copywriting assistants, designer handoffs, SEO audits, and social schedulers. **AgenticMarketer** consolidates this entire lifecycle into a unified, autonomous, grounded pipeline:

1. **Private Grounding via RAG**: Ingests internal brand voice guidelines, product battlecards, and customer case studies into a high-performance vector store (ChromaDB).
2. **Live Competitive Intelligence**: Automatically conducts live SERP research and sentiment extraction via DuckDuckGo Search API.
3. **Consensus-Driven Synthesis**: Copywriting and SEO agents negotiate readability vs. keyword density before finalizing assets.
4. **Multimodal Asset Creation**: Prompts and aligns visual assets alongside targeted copy variations.
5. **Direct Publishing Engine**: Connects via OAuth2 to automatically publish or schedule verified campaigns directly to LinkedIn and Meta/Facebook.

---

## 🏗️ System Architecture

AgenticMarketer is built as a **decoupled full-stack SaaS microservice**:

```
                                  USER BROWSER / CLIENT
                                            │
                                            ▼
                    ┌──────────────────────────────────────────────┐
                    │      React 19 SPA (Vite + Tailwind v4)       │
                    │   • Swarm Launcher Workspace (/dashboard)   │
                    │   • Grounding Vector Knowledge Base (/rag)   │
                    │   • System Stats & Collaborators (/admin)    │
                    └───────────────────────┬──────────────────────┘
                                            │ Axios (Bearer JWT / SSE)
                                            ▼
                    ┌──────────────────────────────────────────────┐
                    │          FastAPI Microservice Backend        │
                    │   • /api/auth   • /api/rag   • /api/swarm    │
                    └───────┬───────────────┬──────────────┬───────┘
                            │               │              │
         ┌──────────────────▼──┐     ┌──────▼──────┐   ┌───▼──────────────────┐
         │ ChromaDB Vector DB  │     │ Gemini API  │   │  OAuth2 Social APIs  │
         │ (Dense Embeddings)  │     │ (LLM+Vision)│   │  (LinkedIn, Meta)    │
         └─────────────────────┘     └─────────────┘   └──────────────────────┘
                                            │
                               ┌────────────▼────────────┐
                               │  CrewAI Swarm Pipeline  │
                               └─────────────────────────┘
```

---

## 🤖 Multi-Agent Swarm Pipeline (CrewAI)

When a campaign is launched from the Swarm Launcher Workspace, CrewAI executes an autonomous 5-agent sequential pipeline:

```
┌────────────────────────┐       ┌────────────────────────┐       ┌────────────────────────┐
│ 1. Ingestion Agent     │ ───▶  │ 2. Research Agent      │ ───▶  │ 3. Copywriter & Visual │
│ • pdfplumber / docx    │       │ • DuckDuckGo SERP      │       │ • Brand-Grounded Copy  │
│ • ChromaDB Embeddings  │       │ • Competitor Teardowns │       │ • Gemini Visual Prompts│
└────────────────────────┘       └────────────────────────┘       └───────────┬────────────┘
                                                                              │
                                 ┌────────────────────────┐                   │
                                 │ 5. Social Publisher    │ ◀─────────────────┘
                                 │ • OAuth2 Automation    │                   │
                                 │ • LinkedIn / Meta Post │                   ▼
                                 └────────────────────────┘       ┌────────────────────────┐
                                                                  │ 4. SEO & Analytics     │
                                                                  │ • Flesch-Kincaid Score │
                                                                  │ • LSI Keyword Density  │
                                                                  └────────────────────────┘
```

### Agent Roles & Specifications:

1. **Document Ingestion Agent**
   - **Engine**: `pdfplumber`, `python-docx`, `pytesseract` OCR, and `ChromaDB`.
   - **Function**: Extracts semantic tokens from uploaded brand assets, pitch decks, and guidelines; chunks documents into dense vector embeddings for RAG grounding.
2. **Market Research Agent**
   - **Engine**: DuckDuckGo Search API, SERP scrapers, and sentiment models.
   - **Function**: Scrapes real-time competitive moves, market trends, and high-intent buyer pain points to eliminate generic content.
3. **Copywriter & Visual Agent**
   - **Engine**: Google Gemini 1.5 / 2.0 Flash / Pro multimodal APIs.
   - **Function**: Synthesizes high-converting copy across channels (LinkedIn thought leadership, cold email sequences, ad variants) and crafts contextual visual asset prompts.
4. **SEO & Analytics Agent**
   - **Engine**: Flesch-Kincaid readability scoring engine & keyword density auditor.
   - **Function**: Validates readability level (target Grade 8 for conversion), checks search intent alignment, and ensures semantic LSI keywords are naturally distributed.
5. **Social Publisher Agent (Omnichannel)**
   - **Engine**: Universal OAuth2 & REST connectors for LinkedIn, X (Twitter), Meta (Facebook & Instagram), Meta Threads, YouTube Community, TikTok, Pinterest, Reddit, and Universal Webhooks (Zapier, Make, Buffer, Hootsuite, Discord, Telegram, Slack, Custom CMS).
   - **Function**: Manages authenticated social sessions to automatically format platform-specific character limits, adapt hashtags, and schedule or immediately broadcast approved copy and visual assets across any social network simultaneously.

---

## 💻 Tech Stack & Infrastructure

### Frontend
- **Framework**: React 19 (`react`, `react-dom`)
- **Build Tool**: Vite 8 (Ultra-fast HMR & ESM compilation)
- **Styling**: Tailwind CSS v4 (`@tailwindcss/vite`) with curated dark slate theme
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Routing**: React Router DOM v7
- **HTTP Client**: Axios (configured with Bearer JWT interceptors)

### Backend
- **Framework**: Python 3.11+ / FastAPI (Asynchronous REST API)
- **Orchestration**: CrewAI (Collaborative multi-agent framework)
- **AI Models**: Google Gemini API (Multimodal text reasoning, vision, and generation)
- **Vector Database**: ChromaDB (Embeddings persistence & cosine similarity retrieval)
- **Document Extractors**: `pdfplumber`, `python-docx`, `pytesseract`
- **Search & Metrics**: DuckDuckGo Search API, Textstat (Flesch-Kincaid scoring)
- **Publishing Integrations**: OAuth2 (LinkedIn REST API, Facebook/Instagram Graph API)

---

## 🖥️ Frontend Architecture & Workspaces

The frontend provides an intuitive, high-performance UI matching an enterprise dark-slate aesthetic:

### 1. Swarm Launcher Workspace (`/dashboard` - `Dashboard.jsx`)
- **Control Panel**:
  - Directives input textarea with character counter and one-click starter presets (*"SaaS Launch"*, *"B2B Outbound"*, *"SEO Authority"*).
  - Target audience and tone profile selector (*Authoritative*, *Conversational*, *Data-driven*, etc.).
  - Drag-and-drop Grounding File Uploader supporting `.pdf`, `.docx`, `.txt`, and `.md`.
  - Queued file list with status badges and semantic chunk metrics.
  - Interactive **Launch Multi-Agent Swarm** trigger with live executing state and progress percentage.
- **Topological Agent Grid**:
  - Live visual cards for each agent in the swarm with dynamic `'Idle'` vs `'Active'` (pulsing) badges.
- **Swarm Feed & Output Workspace**:
  - **Campaign Output**: Live streaming generated copy, hooks, outbound sequences, and meta descriptions.
  - **Terminal Logs**: Real-time WebSocket/SSE logs showing step-by-step agent interactions with timestamps.
  - **SEO & Audit Dashboard**: Readability score (88/100), search intent match (96%), and target keyword density table.
  - **Action Toolbar**: Instant one-click clipboard copy with feedback and `.md` report download.

### 2. Vector Knowledge Base (`/knowledge` - `KnowledgeBase.jsx`)
- Interactive grounding file repository.
- Upload brand assets, search indexed vector collections, and delete outdated context chunks.

### 3. Admin Console (`/admin` - `AdminPanel.jsx`)
- Real-time token usage telemetry (Gemini tokens, ChromaDB chunk count).
- Team collaborator seats and role assignments.
- Infrastructure and agent API health statuses.

---

## 🔐 Role-Based Access Control (RBAC)

AgenticMarketer implements granular role-based routing through `AuthContext.jsx` and `ProtectedRoute.jsx`:

| Role Identifier | Role Title | Dashboard | Knowledge Base | Admin Console | Swarm Launch |
| :--- | :--- | :---: | :---: | :---: | :---: |
| `leader` | AI Swarm Leader / Workspace Owner | ✅ | ✅ | ✅ | ✅ |
| `admin` | System & Infrastructure Administrator | ✅ | ✅ | ✅ | ✅ |
| `marketer` | Growth & Content Marketer | ✅ | ✅ | ❌ | ✅ |
| `backend_dev`| RAG / AI Backend Engineer | ✅ | ✅ | ❌ | ✅ |
| `frontend_dev`| UI / UX Developer | ✅ | ✅ | ❌ | ✅ |

---

## 📡 Target Backend REST API Specification

The FastAPI microservice exposes the following core endpoints:

### Authentication (`/api/auth`)
- `POST /api/auth/register`: Create user profile with workspace role.
- `POST /api/auth/login`: Authenticate credentials, return JWT access token.
- `GET /api/auth/me`: Retrieve current user profile and permission scopes.

### Vector Knowledge Base & RAG (`/api/rag`)
- `POST /api/rag/upload`: Upload `.pdf`, `.docx`, `.txt` grounding documents (`multipart/form-data`).
- `GET /api/rag/documents`: List indexed assets, embedding sizes, and chunk statistics.
- `DELETE /api/rag/documents/{id}`: Purge document and vector embeddings from ChromaDB.

### Swarm Orchestration (`/api/swarm`)
- `POST /api/swarm/launch`: Trigger CrewAI execution with campaign directives and grounding context.
- `GET /api/swarm/stream/{execution_id}`: Server-Sent Events (SSE) / WebSocket stream for live agent logs and output typing.
- `POST /api/swarm/abort`: Terminate currently running swarm pipeline.

### Social Publishing (`/api/publish`)
- `GET /api/publish/oauth/{platform}`: Initiate OAuth2 flow (LinkedIn / Meta).
- `POST /api/publish/post`: Publish or schedule approved copy and media assets to social channels.

---

## 📁 Project Directory Structure

```
AgenticMarketer-Automated-Marketing-Intelligence/
├── .venv/                         # Python virtual environment
├── frontend/                      # React SPA
│   ├── public/                    # Static assets & favicons
│   ├── src/
│   │   ├── assets/                # Visual media & icons
│   │   ├── components/
│   │   │   ├── Navbar.jsx         # Sticky navigation with active tab indicator
│   │   │   ├── ProtectedRoute.jsx # RBAC authentication route guard
│   │   │   └── Sidebar.jsx        # Modular navigation drawer
│   │   ├── context/
│   │   │   └── AuthContext.jsx    # Session state & demo auth provider
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx      # Swarm Launcher & multi-agent workspace
│   │   │   ├── KnowledgeBase.jsx  # ChromaDB grounding document manager
│   │   │   ├── AdminPanel.jsx     # Usage metrics & workspace permissions
│   │   │   ├── Login.jsx          # Secure sign-in with social auth
│   │   │   └── Register.jsx       # Workspace registration with role picker
│   │   ├── utils/
│   │   │   └── api.js             # Axios client with JWT request interceptor
│   │   ├── App.jsx                # Application router and layout tree
│   │   ├── main.jsx               # React DOM entry point
│   │   └── index.css              # Tailwind CSS v4 root directives
│   ├── index.html                 # App shell with typography and metadata
│   ├── package.json               # Frontend dependencies & scripts
│   └── vite.config.js             # Vite configuration with Tailwind plugin
├── backend/                       # Python FastAPI Microservice (Roadmap)
├── README.md                      # Complete system documentation
└── .gitignore                     # Git ignore rules
```

---

## ⚡ Getting Started & Installation

### Prerequisites
- **Node.js**: v18.0+ or v20.0+
- **Python**: 3.11+
- **Package Manager**: `npm` or `pnpm`

### 1. Frontend Setup
```bash
# Navigate to the frontend directory
cd frontend

# Install dependencies
npm install

# Start the local development server
npm run dev

# Build production bundle
npm run build
```
The frontend will start at `http://localhost:5173` (or the next available port).

### 2. Backend Setup (FastAPI Microservice)
```bash
# Activate existing virtual environment
# Windows:
.venv\Scripts\activate
# Linux/macOS:
source .venv/bin/activate

# Install requirements (once backend requirements.txt is provided)
pip install fastapi uvicorn crewai chromadb google-generativeai pdfplumber python-docx duckduckgo-search textstat
```

---

## 🔑 Environment Configuration

Create a `.env` file in the root / backend directory:

```env
# Google Gemini API
GEMINI_API_KEY=your_gemini_api_key_here

# ChromaDB Configuration
CHROMA_PERSIST_DIRECTORY=./chroma_data

# Authentication
JWT_SECRET=your_super_secret_jwt_key
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# OAuth Publishing (LinkedIn & Meta)
LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret
META_APP_ID=your_meta_app_id
META_APP_SECRET=your_meta_app_secret
```

---

## 🚀 Roadmap

- [x] **Phase 1**: Modern, interactive React 19 frontend with Tailwind CSS v4.
- [x] **Phase 2**: Complete Swarm Launcher Workspace with 4-agent topology, preset goals, and simulated streaming output.
- [x] **Phase 3**: Vector Knowledge Base interface with local file queue and RAG asset manager.
- [ ] **Phase 4**: FastAPI backend initialization with ChromaDB vector pipeline.
- [ ] **Phase 5**: CrewAI multi-agent orchestration hooking into live DuckDuckGo Search and Google Gemini APIs.
- [ ] **Phase 6**: Multimodal visual generation prompts and preview gallery.
- [ ] **Phase 7**: OAuth2 direct publishing pipeline for LinkedIn and Meta/Facebook.

---

## 📄 License

This project is licensed under the MIT License.
