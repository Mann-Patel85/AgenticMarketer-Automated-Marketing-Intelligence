# 🚀 AgenticMarketer: Automated Marketing Intelligence Swarm

[![Next.js](https://img.shields.io/badge/Frontend-Next.js%2016%20%7C%20React%2019-black?logo=next.js&logoColor=white)](https://nextjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind%20CSS%20v4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![FastAPI](https://img.shields.io/badge/Backend-Python%20FastAPI-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Groq LPU](https://img.shields.io/badge/LLM%20Engine-Groq%20Cloud%20LPUs-F55036?logo=fastapi&logoColor=white)](https://groq.com/)
[![Cloudflare AI](https://img.shields.io/badge/Image%20Diffusion-Cloudflare%20FLUX.1-F38020?logo=cloudflare&logoColor=white)](https://developers.cloudflare.com/workers-ai/)
[![Vector Store](https://img.shields.io/badge/Vector%20Store-TF--IDF%20%26%20Cosine%20RAG-FF4F00?logo=databricks&logoColor=white)](https://github.com/Mann-Patel85/AgenticMarketer-Automated-Marketing-Intelligence)

**AgenticMarketer** is an enterprise-grade autonomous AI marketing intelligence SaaS platform engineered to operate as a 24/7 digital marketing agency. Rather than relying on simple, single-prompt instructions or brittle manual workflows, AgenticMarketer coordinates a synchronized **6-agent swarm**—spanning document RAG grounding, live market research, high-throughput Groq LPU copywriting, Cloudflare FLUX.1 edge visual diffusion, technical SEO auditing, and omnichannel social publishing.

---

## 📑 Table of Contents

- [Core System Overview](#-core-system-overview)
- [System Architecture](#-system-architecture)
- [6-Agent Swarm Topology Pipeline](#-6-agent-swarm-topology-pipeline)
- [Tech Stack & Infrastructure](#-tech-stack--infrastructure)
- [Frontend Architecture & Workspaces](#-frontend-architecture--workspaces)
- [Role-Based Access Control (RBAC)](#-role-based-access-control-rbac)
- [Backend REST API Specification](#-backend-rest-api-specification)
- [Project Directory Structure](#-project-directory-structure)
- [Getting Started & Installation](#-getting-started--installation)
- [Environment Configuration](#-environment-configuration)
- [System Capabilities & Roadmap](#-system-capabilities--roadmap)
- [License](#-license)

---

## 🌟 Core System Overview

Traditional marketing workflows are fragmented across separate research tools, copywriting assistants, designer handoffs, SEO auditors, and social schedulers. **AgenticMarketer** consolidates this entire lifecycle into a unified, autonomous, grounded pipeline:

1. **Private Grounding via RAG**: Ingests internal brand playbooks, product battlecards, and guidelines (`.pdf`, `.docx`, `.txt`) into a high-performance vector retrieval store with stop-word penalty optimization and file-scoped semantic search.
2. **Live Competitive Intelligence**: Automatically conducts live SERP research and competitor gap extraction via the DuckDuckGo Search API.
3. **High-Throughput Copywriting**: Groq LPUs (`openai/gpt-oss-120b`) synthesize multi-channel bundles (High-converting Hooks, LinkedIn posts, Reddit discussions, Blog articles, Cold Emails, and Meta Ad variants).
4. **Multimodal Visual Synthesis**: Cloudflare Workers AI renders photorealistic 1024×1024 marketing banners via `@cf/black-forest-labs/flux-1-schnell` with automated image clarity validation scores and full PNG export.
5. **SEO & Readability Auditing**: Evaluates Flesch-Kincaid readability index (Grade 8 target), keyword density, and search intent alignment.
6. **Omnichannel Publishing Engine**: Schedules and broadcasts verified campaigns across LinkedIn, X (Twitter), Meta (Facebook & Instagram), Threads, Reddit, YouTube, TikTok, Pinterest, and Universal Webhooks.

---

## 🏗️ System Architecture

AgenticMarketer is built as a **decoupled full-stack SaaS architecture**:

```
                                  USER BROWSER / CLIENT
                                            │
                                            ▼
                    ┌──────────────────────────────────────────────┐
                    │     Next.js 16 (App Router) + React 19       │
                    │   • Swarm Launcher Workspace (/dashboard)   │
                    │   • Vector Knowledge Base & Search (/knowledge) │
                    │   • System Telemetry & Admin (/admin)        │
                    └───────────────────────┬──────────────────────┘
                                            │ Axios (Bearer JWT / SSE Stream)
                                            ▼
                    ┌──────────────────────────────────────────────┐
                    │          FastAPI Microservice Backend        │
                    │   • /api/auth   • /api/rag   • /api/swarm    │
                    │   • /api/publish                             │
                    └───────┬───────────────┬──────────────┬───────┘
                            │               │              │
         ┌──────────────────▼──┐     ┌──────▼──────┐   ┌───▼──────────────────┐
         │ TF-IDF Vector Store │     │   Groq LPU  │   │ Cloudflare Workers AI│
         │ (Cosine Similarity) │     │ (gpt-oss)   │   │ (FLUX.1 Diffusion)   │
         └─────────────────────┘     └─────────────┘   └──────────────────────┘
                                            │
                               ┌────────────▼────────────┐
                               │ 6-Agent Swarm Pipeline  │
                               └─────────────────────────┘
```

---

## 🤖 6-Agent Swarm Topology Pipeline

When a campaign is launched from the Swarm Workspace, the system executes an autonomous 6-agent sequential pipeline:

```
┌────────────────────────┐       ┌────────────────────────┐       ┌────────────────────────┐
│ 1. Ingestion Agent     │ ───▶  │ 2. Research Agent      │ ───▶  │ 3. Copywriter Agent    │
│ • pdfplumber / docx    │       │ • DuckDuckGo SERP      │       │ • Groq LPU Copy Engine │
│ • Vector Store Chunks  │       │ • Competitor Teardowns │       │ • Multi-Channel Copy   │
└────────────────────────┘       └────────────────────────┘       └───────────┬────────────┘
                                                                              │
┌────────────────────────┐       ┌────────────────────────┐                   │
│ 6. Social Publisher    │ ◀───  │ 5. SEO & Analytics     │ ◀─────────────────┤
│ • Omnichannel Sched    │       │ • Flesch-Kincaid Grade │                   │
│ • Multi-Network Post   │       │ • Keyword Density      │                   ▼
└────────────────────────┘       └────────────────────────┘       ┌────────────────────────┐
                                                                  │ 4. Image Gen Agent     │
                                                                  │ • Cloudflare FLUX.1    │
                                                                  │ • 1024x1024 PNG Banner │
                                                                  └────────────────────────┘
```

### Agent Roles & Specifications:

1. **Document Ingestion Agent**
   - **Engine**: `pypdf`, `pdfplumber`, `python-docx`, TF-IDF Cosine Vector Store.
   - **Function**: Tokenizes brand guidelines, pitch decks, and battlecards; indexes semantic chunks with stop-word penalty scoring for hallucination-free RAG grounding.
2. **Market Research Agent**
   - **Engine**: DuckDuckGo Search API & live SERP scrapers.
   - **Function**: Scrapes real-time competitive positioning, market trends, and high-intent buyer friction points to ground campaign messaging.
3. **Copywriter Agent**
   - **Engine**: Groq Cloud LPUs (`openai/gpt-oss-120b` & `openai/gpt-oss-20b`).
   - **Function**: Synthesizes high-converting copy across channels: Viral Hooks, LinkedIn articles, Reddit threads, Blog editorials, Cold Email sequences, and Meta Ad copy.
4. **Image Generation Agent**
   - **Engine**: Cloudflare Workers AI (`@cf/black-forest-labs/flux-1-schnell`) with Eden AI / HuggingFace fallback.
   - **Function**: Expands campaign directives into photorealistic prompts, executes edge diffusion, computes OpenCV clarity validation scores, and delivers 1024×1024 PNG creative banners.
5. **SEO & Analytics Agent**
   - **Engine**: Flesch-Kincaid scoring engine & semantic keyword density auditor.
   - **Function**: Validates readability level (target Grade 8 for conversions), checks search intent alignment, and ensures organic LSI keyword distribution.
6. **Social Publisher Agent (Omnichannel)**
   - **Engine**: Universal connectors for LinkedIn, X (Twitter), Meta (Facebook & Instagram), Threads, YouTube Community, TikTok, Pinterest, Reddit, and Universal Webhooks (Zapier, Make, Slack, Discord).
   - **Function**: Formats platform-specific character limits, adapts hashtag taxonomy, and schedules or broadcasts approved copy and visual assets across multiple channels simultaneously.

---

## 💻 Tech Stack & Infrastructure

### Frontend
- **Framework**: Next.js 16 (App Router with Turbopack)
- **Library**: React 19 (`react: ^19.2.8`, `react-dom: ^19.2.8`)
- **Styling**: Tailwind CSS v4 (`@tailwindcss/postcss`) with custom cyber-card dark theme
- **Animations**: Framer Motion (`framer-motion: ^13.2.0`)
- **Icons**: Lucide React
- **HTTP Client**: Axios with Bearer JWT interceptors & Server-Sent Events (SSE)

### Backend
- **Framework**: Python 3.11+ / FastAPI (Asynchronous REST API)
- **Server**: Uvicorn with ASGI live reload
- **LLM Engine**: Groq Cloud LPUs (`openai/gpt-oss-120b`, `openai/gpt-oss-20b`)
- **Image Diffusion**: Cloudflare Workers AI (`@cf/black-forest-labs/flux-1-schnell`)
- **Vector Retrieval**: Custom in-memory & JSON persistent TF-IDF vector engine with cosine similarity & stop-word penalty filtering
- **Document Extractors**: `pypdf`, `python-docx`, `beautifulsoup4`
- **Search & Metrics**: DuckDuckGo Search API, `textstat` (Flesch-Kincaid readability scoring)
- **Security**: Passlib (Bcrypt), Python-Jose (JWT authentication)

---

## 🖥️ Frontend Architecture & Workspaces

### 1. Swarm Launcher Workspace (`/dashboard`)
- **Campaign Control Panel**:
  - Directives input textarea with starter presets (*"SaaS Launch"*, *"B2B Outbound"*, *"SEO Authority"*).
  - Target audience, tone selector, and Multimodal Brief / Brand Playbook selector.
  - Interactive **Launch Swarm** trigger with active execution state and telemetry.
- **Topological Agent Grid**:
  - Live interactive cards for each of the 6 agents showing `'Idle'`, pulsing `'Thinking...'`, or `'✓ Complete'`.
- **Dual Copy Workspace**:
  - **Clean Studio Mode**: Formatted channel tabs (Hooks, LinkedIn, Reddit, Blog, Email, Meta Ads) with one-click clipboard copy and toast notifications.
  - **Raw Markdown Mode**: Complete unparsed markdown output with download actions.
- **Multimodal Visual Studio**:
  - Photorealistic 1024×1024 creative preview with gradient glassmorphism overlay.
  - Model telemetry badge (`FLUX.1 Schnell (Edge)`), Clarity Validation score, and **Download Full PNG** action.
- **Omnichannel Publisher Drawer**:
  - Platform selector (LinkedIn, X, Meta, YouTube, TikTok, Pinterest, Reddit, Webhooks) with live character counter limits and instant broadcasting.
- **Live Terminal Logs**:
  - Real-time Server-Sent Events (SSE) stream capturing agent reasoning steps and timestamps.

### 2. Vector Knowledge Base (`/knowledge`)
- **Grounding Document Uploader**: Drag-and-drop `.pdf`, `.docx`, and `.txt` files with automated chunking and tokenization.
- **Indexed Assets Catalog**: File inventory showing chunk counts, size, and one-click deletion.
- **Live Semantic Vector Search Tester**:
  - Single-file scoping filter to query specific uploaded brand guides.
  - Stop-word penalty filtering preventing false-positive query pollution.
  - Cosine similarity ranking with highlighted matched semantic terms.

### 3. Admin & Telemetry Console (`/admin`)
- Real-time token usage telemetry and chunk distribution.
- Swarm infrastructure health and agent API status matrix.
- Team collaborator seats and role assignment management.

---

## 🔐 Role-Based Access Control (RBAC)

AgenticMarketer implements granular role-based routing through `AuthContext.jsx`:

| Role Identifier | Role Title | Dashboard | Knowledge Base | Admin Console | Swarm Launch |
| :--- | :--- | :---: | :---: | :---: | :---: |
| `leader` | AI Swarm Leader / Workspace Owner | ✅ | ✅ | ✅ | ✅ |
| `admin` | System & Infrastructure Administrator | ✅ | ✅ | ✅ | ✅ |
| `marketer` | Growth & Content Marketer | ✅ | ✅ | ❌ | ✅ |
| `backend_dev`| RAG / AI Backend Engineer | ✅ | ✅ | ❌ | ✅ |
| `frontend_dev`| UI / UX Developer | ✅ | ✅ | ❌ | ✅ |

---

## 📡 Backend REST API Specification

The FastAPI backend exposes the following REST endpoints:

### Authentication (`/api/auth`)
- `POST /api/auth/register`: Create user account with workspace role.
- `POST /api/auth/login`: Authenticate credentials, return JWT access token.
- `GET /api/auth/me`: Retrieve current user profile and permission scopes.

### Vector Knowledge Base & RAG (`/api/rag`)
- `POST /api/rag/upload`: Upload `.pdf`, `.docx`, `.txt` grounding documents (`multipart/form-data`).
- `GET /api/rag/documents`: List indexed brand assets, file sizes, and chunk statistics.
- `DELETE /api/rag/documents/{id}`: Delete document and associated vector chunks.
- `POST /api/rag/search`: Query semantic vector store with optional file scoping and stop-word filtering.

### Swarm Orchestration (`/api/swarm`)
- `POST /api/swarm/launch`: Execute 6-agent swarm pipeline with campaign directive and selected brand context.
- `GET /api/swarm/stream/{execution_id}`: Server-Sent Events (SSE) stream for live agent logs and output typing.
- `POST /api/swarm/abort`: Cancel running pipeline execution.

### Social Publishing (`/api/publish`)
- `POST /api/publish/post`: Publish or schedule approved copy and visual assets across selected social channels.
- `GET /api/publish/history`: Retrieve past omnichannel broadcast logs.

---

## 📁 Project Directory Structure

```
AgenticMarketer-Automated-Marketing-Intelligence/
├── .venv/                              # Python virtual environment
├── Backend/                            # FastAPI Microservice Backend
│   ├── app/
│   │   ├── agents/
│   │   │   └── swarm_pipeline.py       # 6-Agent Swarm Orchestration & Execution
│   │   ├── core/
│   │   │   ├── config.py               # Pydantic Settings & Environment Loading
│   │   │   └── security.py             # JWT & Password Hash Utilities
│   │   ├── rag/
│   │   │   └── vector_store.py         # TF-IDF Cosine Vector Retrieval Engine
│   │   ├── routers/
│   │   │   ├── auth.py                 # Authentication & Role Routes
│   │   │   ├── rag.py                  # Knowledge Base & Vector Search Endpoints
│   │   │   ├── swarm.py                # Swarm Launch & SSE Stream Endpoints
│   │   │   └── publish.py              # Social Publishing & History Endpoints
│   │   └── main.py                     # FastAPI Application Entrypoint & CORS Setup
│   ├── data/
│   │   ├── uploads/                    # Grounding Files & Generated Campaign Images
│   │   ├── rag_chunks.json             # Indexed Vector Chunks
│   │   ├── rag_metadata.json           # File Metadata Registry
│   │   └── workspaces.json             # Workspace State History
│   └── requirements.txt                # Python Backend Dependencies
├── frontend/                           # Next.js 16 Web Application
│   ├── app/
│   │   ├── admin/
│   │   │   └── page.jsx                # Telemetry & Admin Console View
│   │   ├── dashboard/
│   │   │   └── page.jsx                # Swarm Launcher, Visual Studio & Publisher
│   │   ├── knowledge/
│   │   │   └── page.jsx                # Vector Knowledge Base & Search Tester
│   │   ├── login/
│   │   │   └── page.jsx                # Login View with Role Selection
│   │   ├── register/
│   │   │   └── page.jsx                # Registration View
│   │   ├── layout.jsx                  # Root Layout, Theme & AuthProvider
│   │   ├── page.jsx                    # Landing / Workspace Redirect
│   │   └── globals.css                 # Tailwind CSS v4 Directives & Design Tokens
│   ├── context/
│   │   └── AuthContext.jsx             # User Session & JWT State Provider
│   ├── utils/
│   │   └── api.js                      # Axios Client with Bearer Interceptor
│   ├── package.json                    # Frontend Dependencies & Scripts
│   └── next.config.mjs                 # Next.js Configuration
├── LICENSE                             # MIT License
└── README.md                           # System Documentation
```

---

## ⚡ Getting Started & Installation

### Prerequisites
- **Node.js**: v18.0+ or v20.0+
- **Python**: 3.11+
- **Package Manager**: `npm`

### 1. Clone the Repository
```bash
git clone https://github.com/Mann-Patel85/AgenticMarketer-Automated-Marketing-Intelligence.git
cd AgenticMarketer-Automated-Marketing-Intelligence
```

### 2. Backend Setup (FastAPI)
```bash
# Create and activate virtual environment
python -m venv .venv

# Windows:
.\.venv\Scripts\activate
# Linux/macOS:
source .venv/bin/activate

# Install backend dependencies
pip install -r backend/requirements.txt
```

### 3. Frontend Setup (Next.js)
```bash
# Navigate to the frontend directory
cd frontend

# Install dependencies
npm install

# Return to root
cd ..
```

### 4. Running the Application Locally

Start both servers in separate terminal sessions:

**Terminal 1 — Backend (FastAPI on Port 8000):**
```bash
python -m uvicorn backend.app.main:app --reload --port 8000
```

**Terminal 2 — Frontend (Next.js on Port 3000):**
```bash
cd frontend
npm run dev
```

Open `http://localhost:3000` in your web browser.

---

## 🔑 Environment Configuration

Create a `.env` file in the root project directory:

```env
# Groq Cloud LPU AI (Primary High-Speed Text Engine)
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=openai/gpt-oss-120b
GROQ_FAST_MODEL=openai/gpt-oss-20b

# Cloudflare Workers AI (Primary Image Generation - FLUX.1 schnell)
CLOUDFLARE_ACCOUNT_ID=your_cloudflare_account_id_here
CLOUDFLARE_API_TOKEN=your_cloudflare_api_token_here
CLOUDFLARE_IMAGE_MODEL=@cf/black-forest-labs/flux-1-schnell

# Authentication & Security
JWT_SECRET=your_secure_random_256_bit_secret_token
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Eden AI (Optional Image Generation Fallback)
EDEN_AI_API_KEY=
```

---

## 🚀 System Capabilities & Roadmap

- [x] **Next.js 16 + React 19 Frontend**: Enterprise cyber-card dashboard styled with Tailwind CSS v4 and Framer Motion.
- [x] **6-Agent Swarm Pipeline**: Orchestrates Ingestion, Research, Copywriter, Image Generation, SEO, and Publisher agents.
- [x] **Groq LPU Acceleration**: High-throughput copy synthesis delivering multi-channel bundles in seconds.
- [x] **Cloudflare FLUX.1 Edge Diffusion**: Photorealistic 1024×1024 visuals with OpenCV clarity validation scores.
- [x] **RAG Vector Knowledge Base**: TF-IDF cosine retrieval with stop-word penalty filtering and single-file scoped search.
- [x] **Clean Studio & Markdown Views**: Formatted channel assets (Hooks, LinkedIn, Reddit, Blog, Email, Ads) with one-click copy.
- [x] **Omnichannel Publishing Engine**: Live broadcasting integration across LinkedIn, X, Meta, YouTube, TikTok, Reddit, and Webhooks.
- [ ] **Multi-Brand Workspace Partitioning**: Isolated vector collections and brand voice configurations per enterprise client.
- [ ] **Direct Social OAuth2 Live Tokens**: Native one-click OAuth authorization flows for client social profiles.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
