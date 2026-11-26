# 🚀 AgenticMarketer: Automated Marketing Intelligence Swarm

[![Next.js](https://img.shields.io/badge/Frontend-Next.js%2016%20%7C%20React%2019-black?logo=next.js&logoColor=white)](https://nextjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind%20CSS%20v4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![FastAPI](https://img.shields.io/badge/Backend-Python%20FastAPI-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Groq LPU](https://img.shields.io/badge/LLM%20Engine-Groq%20Cloud%20LPUs-F55036)](https://groq.com/)
[![Cloudflare AI](https://img.shields.io/badge/Image%20Diffusion-Cloudflare%20FLUX.1-F38020?logo=cloudflare&logoColor=white)](https://developers.cloudflare.com/workers-ai/)
[![PostgreSQL](https://img.shields.io/badge/Database-Neon%20PostgreSQL-4169E1?logo=postgresql&logoColor=white)](https://neon.tech/)

**AgenticMarketer** is an AI marketing platform that runs a coordinated **6-agent swarm**: it grounds campaigns in your own brand documents, gathers live market context, writes multi-channel copy with Groq LPUs, generates visuals with Cloudflare FLUX.1, audits SEO and readability, and publishes to the channels you choose.

**Live app:** https://agentic-marketer-automated-marketin.vercel.app

---

## 📑 Table of Contents

- [Core System Overview](#-core-system-overview)
- [System Architecture](#-system-architecture)
- [6-Agent Swarm Pipeline](#-6-agent-swarm-pipeline)
- [Tech Stack](#-tech-stack)
- [Frontend Pages](#-frontend-pages)
- [Security & Data Privacy](#-security--data-privacy)
- [Roles & Access Control](#-roles--access-control)
- [Backend REST API](#-backend-rest-api)
- [Project Directory Structure](#-project-directory-structure)
- [Getting Started](#-getting-started)
- [Environment Configuration](#-environment-configuration)
- [Deployment (Vercel + Render + Neon)](#-deployment-vercel--render--neon)
- [Capabilities & Roadmap](#-capabilities--roadmap)
- [License](#-license)

---

## 🌟 Core System Overview

Marketing work is usually split across research tools, copywriting assistants, designers, SEO auditors and social schedulers. **AgenticMarketer** brings that lifecycle into one grounded pipeline:

1. **Private brand grounding (RAG):** each user uploads brand playbooks, battlecards and guidelines (`.pdf`, `.docx`, `.txt`, `.md`, and images) into their **own private knowledge base**, searched with TF-IDF cosine retrieval and stop-word penalty scoring.
2. **Live market context:** pulls recent headlines from Google News RSS and background facts from Wikipedia to inform messaging.
3. **High-throughput copywriting:** Groq LPUs (`openai/gpt-oss-120b`, with `openai/gpt-oss-20b` as the fast model) write multi-channel bundles: hooks, LinkedIn posts, X threads, Reddit discussions, blog articles, cold emails and Meta ad variants.
4. **Visual generation:** Cloudflare Workers AI renders 1024×1024 banners with `@cf/black-forest-labs/flux-1-schnell`, with automatic fallbacks and an image clarity score.
5. **SEO & readability auditing:** Flesch-Kincaid readability (Grade 8 target), keyword density and search-intent checks, plus a live technical site auditor.
6. **Omnichannel publishing:** broadcasts approved campaigns to LinkedIn, X, Facebook, Instagram, Threads, Reddit, Medium, Dev.to, WordPress, Discord, Slack and custom webhooks, with a saved audit history.

---

## 🏗️ System Architecture

AgenticMarketer is a decoupled full-stack application:

```
                                  USER BROWSER / CLIENT
                                            │
                                            ▼
                    ┌──────────────────────────────────────────────┐
                    │   Next.js 16 (App Router) + React 19 — Vercel│
                    │   • Swarm Launcher        (/dashboard)       │
                    │   • Private Knowledge Base (/knowledge)      │
                    │   • Admin Console          (/admin)          │
                    │   • Terms & Privacy        (/terms, /privacy)│
                    └───────────────────────┬──────────────────────┘
                                            │ Axios + Bearer JWT
                                            ▼
                    ┌──────────────────────────────────────────────┐
                    │        FastAPI Backend — Render              │
                    │  /api/auth  /api/admin  /api/rag  /api/swarm │
                    │  /api/publish  /api/workspace  /api/seo      │
                    └───────┬──────────────┬───────────────┬───────┘
                            │              │               │
         ┌──────────────────▼──┐   ┌───────▼──────┐   ┌────▼─────────────────┐
         │  Neon PostgreSQL    │   │  Groq LPU    │   │ Cloudflare Workers AI│
         │ users · workspaces  │   │ (gpt-oss)    │   │ (FLUX.1 + vision)    │
         │ KB docs & chunks    │   └──────────────┘   └──────────────────────┘
         │ campaigns · publish │
         └─────────────────────┘
```

---

## 🤖 6-Agent Swarm Pipeline

When you launch a campaign, the agents run in sequence:

```
┌────────────────────────┐       ┌────────────────────────┐       ┌────────────────────────┐
│ 1. Ingestion Agent     │ ───▶  │ 2. Research Agent      │ ───▶  │ 3. Copywriter Agent    │
│ • Your private KB      │       │ • Google News RSS      │       │ • Groq LPU Copy Engine │
│ • Brand disambiguation │       │ • Wikipedia context    │       │ • Multi-Channel Copy   │
└────────────────────────┘       └────────────────────────┘       └───────────┬────────────┘
                                                                              │
┌────────────────────────┐       ┌────────────────────────┐                   │
│ 6. Social Publisher    │ ◀───  │ 5. SEO & Analytics     │ ◀─────────────────┤
│ • Omnichannel manifest │       │ • Flesch-Kincaid Grade │                   │
│ • Platform formatting  │       │ • Keyword Density      │                   ▼
└────────────────────────┘       └────────────────────────┘       ┌────────────────────────┐
                                                                  │ 4. Image Gen Agent     │
                                                                  │ • Cloudflare FLUX.1    │
                                                                  │ • 1024×1024 PNG Banner │
                                                                  └────────────────────────┘
```

### Agent roles

1. **Document Ingestion Agent**
   - **Engine:** `pypdf`, `python-docx`, Cloudflare vision model for images, TF-IDF cosine retrieval.
   - **Function:** retrieves the most relevant passages from **the signed-in user's own documents** only. It can auto-detect the matching brand playbook, use one you select, or run with no grounding.
2. **Market Research Agent**
   - **Engine:** Google News RSS and the Wikipedia API.
   - **Function:** collects recent headlines and background context about the campaign topic to ground messaging.
3. **Copywriter Agent**
   - **Engine:** Groq Cloud LPUs (`openai/gpt-oss-120b`, `openai/gpt-oss-20b`), with xAI Grok as an optional fallback.
   - **Function:** writes channel-ready copy: hooks, LinkedIn, X, Reddit, blog, cold email and Meta ads.
4. **Image Generation Agent**
   - **Engine:** Cloudflare Workers AI (`@cf/black-forest-labs/flux-1-schnell`). Falls back to Eden AI, then Pollinations, then a stock photo.
   - **Function:** turns the campaign into a photorealistic prompt, renders the banner, and scores image sharpness with Pillow.
5. **SEO & Analytics Agent**
   - **Engine:** `textstat` Flesch-Kincaid scoring and a keyword density auditor.
   - **Function:** checks readability (Grade 8 target), search-intent alignment and keyword distribution.
6. **Social Publisher Agent**
   - **Engine:** connectors for LinkedIn, X, Facebook, Instagram, Threads, Reddit, Medium, Dev.to, WordPress, Discord, Slack and universal webhooks (Zapier, Make, Buffer).
   - **Function:** adapts copy to each platform's limits and prepares or sends the broadcast. Channels without API credentials run in sandbox mode and return simulated receipts.

---

## 💻 Tech Stack

### Frontend
- **Framework:** Next.js 16 (App Router, Turbopack)
- **Library:** React 19
- **Styling:** Tailwind CSS v4 with a custom dark "cyber-card" theme
- **Animation & icons:** Framer Motion, Lucide React
- **Markdown:** `react-markdown`, `remark-gfm`, `rehype-raw`
- **HTTP:** Axios with a Bearer-token interceptor
- **Hosting:** Vercel

### Backend
- **Framework:** Python / FastAPI, served by Uvicorn
- **Database:** PostgreSQL (Neon) via SQLAlchemy; falls back to local SQLite when `DATABASE_URL` is not set
- **LLM:** Groq Cloud (`openai/gpt-oss-120b`, `openai/gpt-oss-20b`); optional xAI Grok
- **Images:** Cloudflare Workers AI FLUX.1, with Eden AI and Pollinations fallbacks
- **Retrieval:** custom TF-IDF cosine engine (scikit-learn) with stop-word penalties, stored in the database and cached in memory
- **Documents:** `pypdf`, `python-docx`, Pillow, `beautifulsoup4`
- **Metrics:** `textstat`
- **Auth & security:** `bcrypt` password hashing, `python-jose` JWTs, Google OAuth 2.0
- **Email:** SMTP or Resend
- **Hosting:** Render

---

## 🖥️ Frontend Pages

### 1. Swarm Launcher (`/dashboard`)
- **Campaign console:** goal input with presets (*SaaS Launch*, *B2B Outbound*, *SEO Authority*), audience and tone, brand-playbook selector, multimodal brief upload, and target channels.
- **Agent grid:** live cards for all 6 agents showing *Ready*, *Thinking…* or *Complete*. On phones it becomes a swipeable row.
- **Output workspace:** stays in view while you scroll on desktop.
  - **Clean Studio view:** per-channel tabs with one-click copy.
  - **Raw Markdown view:** full output with download.
  - **Visual Studio:** generated banner, model used, clarity score and PNG download.
  - **Terminal:** step-by-step agent logs for the run.
  - **SEO & Audit:** readability and keyword metrics.
- **Omnichannel Broadcast:** choose platforms, schedule or send, and view receipts.
- **Technical Site Auditor:** crawls a public URL and grades titles, meta descriptions, headings, images, social cards, security headers and links.
- **Auto-save:** the workspace and campaign archives are saved to your account.

### 2. Private Knowledge Base (`/knowledge`)
- **Upload:** drag-and-drop `.pdf`, `.docx`, `.txt`, `.md`, `.png`, `.jpg`, `.webp`. Files are chunked and indexed, then the uploaded file is discarded (the extracted text is kept in the database).
- **Your documents only:** each user sees, searches and deletes only their own documents.
- **Semantic search tester:** query your knowledge base, optionally scoped to one file, and see ranked passages and an AI-synthesized answer.

### 3. Admin Console (`/admin`)
- System health, AI provider status, document and seat counts.
- Invite operators (emails a temporary password), change roles, and revoke seats, within a **10-seat** workspace limit.

### 4. Account pages
- **Sign in / Register** with email and password or **Sign in with Google**.
- **Password reset:** "Forgot password?" emails a single-use link (valid 1 hour) that opens a *Set New Password* form.
- **Legal:** `/terms` and `/privacy`, linked from the sign-in and register pages.

---

## 🔐 Security & Data Privacy

- **Authentication on every API:** all knowledge base, swarm, publishing, workspace, SEO and stats endpoints require a valid JWT. Only `/ping`, `/api/health`, sign-in/registration and campaign images are public.
- **Fresh account checks:** every request re-checks the account in the database, so deleted users lose access and role changes apply immediately.
- **Per-user data isolation:**
  - **Workspaces** belong to the signed-in user; client-supplied emails are ignored.
  - **Knowledge bases are private**, and swarm grounding only reads the signed-in user's documents.
  - **Publish history** shows your own dispatches (admins see the whole workspace).
- **Google OAuth hardening:** after sign-in, users are only redirected to allow-listed frontend origins.
- **SSRF protection:** the site auditor and custom webhooks refuse private, loopback and cloud-metadata addresses, and re-check every redirect.
- **Password reset tokens** are single-use, expire after 1 hour, and cannot be used as login tokens.
- **No analytics or tracking.** The browser stores only the login token.
- **Generic error responses:** clients never see stack traces; details go to the server log.

---

## 👥 Roles & Access Control

| Role | Who | Dashboard & Knowledge Base | Admin Console | Manage admins |
| :--- | :--- | :---: | :---: | :---: |
| **Super Admin** | Emails listed in `ADMIN_EMAIL` / `ADMIN_EMAILS` | ✅ | ✅ | ✅ |
| `admin` | Promoted by a Super Admin | ✅ | ✅ | ❌ |
| `marketer` | Growth & content marketers | ✅ | ❌ | ❌ |
| `user` | Default for self-registered accounts | ✅ | ❌ | ❌ |
| `backend_dev` | AI / backend engineers | ✅ | ❌ | ❌ |
| `frontend_dev` | UI / UX developers | ✅ | ❌ | ❌ |

- Super Admins can't be demoted or deleted, and they're the only ones who can grant or revoke the `admin` role, so a mistaken promotion can always be undone.
- Nobody can change their own role or delete their own account.
- The workspace is capped at **10 seats**.

---

## 📡 Backend REST API

Interactive docs are available at `/docs` (Swagger) and `/redoc` on the backend. 🔒 = requires a Bearer token.

### System
- `GET|HEAD /ping`, `/api/ping`: lightweight keep-alive probe (no database access).
- `GET /api/health`: service health and AI provider configuration.
- 🔒 `GET /api/stats`: document, chunk, campaign and seat counts.
- `GET /api/swarm/images/{filename}`: serves generated campaign images.

### Authentication (`/api/auth`)
- `POST /register`, `POST /login`: create an account or sign in; returns a JWT.
- `POST /forgot-password`: emails a password reset link.
- `POST /reset-password`: sets a new password using the emailed token.
- `GET /google/login`, `GET /google/callback`: Google OAuth 2.0 sign-in.
- 🔒 `GET /me`: current user profile.
- 🔒 `GET /users`: list workspace members (admins only).

### Admin (`/api/admin`), admins only
- 🔒 `GET /users`, `POST /users/invite`, `PATCH /users/{id}/role`, `DELETE /users/{id}`
- 🔒 `GET /system`, `GET /logs`

### Knowledge Base (`/api/rag`), scoped to the signed-in user
- 🔒 `POST /upload`: upload and index a document (`multipart/form-data`).
- 🔒 `GET /documents`: list your documents.
- 🔒 `DELETE /documents/{id}`: delete one of your documents and its chunks.
- 🔒 `POST /query`: semantic search with an AI-synthesized answer.
- 🔒 `POST /analyze-brief`: extract a campaign brief from a document or image (not stored).

### Swarm (`/api/swarm`)
- 🔒 `POST /run-sync`: run the full pipeline and return the campaign bundle (used by the web app).
- 🔒 `POST /launch` + `GET /stream/{run_id}`: start a run and stream progress as Server-Sent Events.
- 🔒 `POST /abort/{run_id}`: stop a running pipeline.

### Publishing (`/api/publish`)
- 🔒 `GET /platforms`: supported channels.
- 🔒 `POST /broadcast`: publish or schedule to selected channels.
- 🔒 `GET /history`: dispatch history (your own; admins see all).

### Workspace (`/api/workspace`)
- 🔒 `GET /`, `POST /`: load or save your current campaign draft.
- 🔒 `POST /reset`: clear the draft (keeps history).
- 🔒 `GET /history`: your campaign archive.

### SEO (`/api/seo`)
- 🔒 `POST /audit`: technical SEO audit of a public URL.

---

## 📁 Project Directory Structure

```
AgenticMarketer-Automated-Marketing-Intelligence/
├── .github/workflows/
│   └── keep-alive.yml                  # Pings the Render backend every 10 min
├── backend/                            # FastAPI backend
│   ├── app/
│   │   ├── agents/
│   │   │   └── swarm_pipeline.py       # 6-agent swarm orchestration
│   │   ├── core/
│   │   │   ├── config.py               # Settings & environment loading
│   │   │   ├── security.py             # Password hashing, JWT, auth dependencies
│   │   │   └── net_safety.py           # SSRF-safe outbound requests
│   │   ├── rag/
│   │   │   └── vector_store.py         # Per-user TF-IDF retrieval engine
│   │   ├── routers/
│   │   │   ├── auth.py                 # Sign-in, Google OAuth, password reset
│   │   │   ├── admin.py                # Users, roles, seats
│   │   │   ├── rag.py                  # Knowledge base endpoints
│   │   │   ├── swarm.py                # Swarm run / stream / abort
│   │   │   ├── publish.py              # Omnichannel publishing & history
│   │   │   ├── workspace.py            # Draft & archive persistence
│   │   │   └── seo_auditor.py          # Technical site auditor
│   │   ├── services/
│   │   │   ├── email.py                # SMTP / Resend emails
│   │   │   └── rag_prompts.py          # RAG answer sanitizing
│   │   ├── database.py                 # SQLAlchemy models, init & migrations
│   │   └── main.py                     # FastAPI app, CORS, system routes
│   ├── data/uploads/images/            # Generated campaign images (runtime)
│   ├── .env.example                    # Backend environment template
│   └── requirements.txt                # Python dependencies
├── frontend/                           # Next.js 16 web app
│   ├── app/
│   │   ├── dashboard/page.jsx          # Swarm Launcher, Visual Studio, Publisher
│   │   ├── knowledge/page.jsx          # Private knowledge base & search tester
│   │   ├── admin/page.jsx              # Admin console
│   │   ├── login/page.jsx              # Sign in + password reset
│   │   ├── register/page.jsx           # Registration
│   │   ├── terms/page.jsx              # Terms of Service
│   │   ├── privacy/page.jsx            # Privacy Policy
│   │   ├── auth/ …                     # Google OAuth callback handling
│   │   ├── layout.jsx                  # Root layout & AuthProvider
│   │   └── globals.css                 # Tailwind v4 theme
│   ├── components/                     # Navbar, ProtectedRoute, RAGAnswer, LegalPage
│   ├── context/AuthContext.jsx         # Session state
│   ├── utils/api.js                    # Axios client
│   └── package.json
├── run.py                              # Backend entrypoint (used by Render)
├── requirements.txt                    # Points to backend/requirements.txt
├── LICENSE
└── README.md
```

---

## ⚡ Getting Started

### Prerequisites
- **Node.js** 20+
- **Python** 3.11+
- **npm**

### 1. Clone the repository
```bash
git clone https://github.com/Mann-Patel85/AgenticMarketer-Automated-Marketing-Intelligence.git
cd AgenticMarketer-Automated-Marketing-Intelligence
```

### 2. Backend setup
```bash
python -m venv .venv

# Windows:
.\.venv\Scripts\activate
# Linux/macOS:
source .venv/bin/activate

pip install -r requirements.txt
```

Copy `backend/.env.example` to `.env` in the project root and fill in your values (see [Environment Configuration](#-environment-configuration)). Without `DATABASE_URL`, the backend uses a local SQLite database automatically.

### 3. Frontend setup
```bash
cd frontend
npm install
cd ..
```

### 4. Run locally

**Terminal 1: backend (port 8000)**
```bash
python run.py
```

**Terminal 2: frontend (port 3000)**
```bash
cd frontend
npm run dev
```

Open http://localhost:3000. The admin account from `ADMIN_EMAIL` / `ADMIN_PASSWORD` is created on first start.

---

## 🔑 Environment Configuration

### Backend (`.env` in the project root, or Render environment variables)

See [`backend/.env.example`](backend/.env.example) for the full template.

| Variable | Required | Purpose |
| :--- | :---: | :--- |
| `JWT_SECRET` | ✅ | Signs login tokens. **If unset, every restart logs all users out.** Generate with `python -c "import secrets; print(secrets.token_hex(32))"` |
| `DATABASE_URL` | ✅ (prod) | PostgreSQL connection string (e.g. Neon). Omit locally to use SQLite. |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME` | ✅ | Primary Super Admin. The password is only applied when the account is first created. |
| `ADMIN_EMAILS` | | Extra Super Admins (comma-separated). |
| `ADMIN_PASSWORD_RESET_ON_BOOT` | | Set `true` for one deploy to force `ADMIN_PASSWORD` back onto the account. |
| `FRONTEND_PROD_URL` | ✅ (prod) | Your frontend URL, used for CORS, OAuth and email links. |
| `FRONTEND_ALLOWED_ORIGINS` | | Extra frontend origins allowed as Google sign-in redirect targets. |
| `BACKEND_PROD_URL` | | Public backend URL, used to build the OAuth callback. |
| `GROQ_API_KEY` | ✅ | Copywriting and RAG answers. `GROQ_MODEL` / `GROQ_FAST_MODEL` override the models. |
| `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN` | ✅ | FLUX.1 image generation and image analysis. |
| `EDEN_AI_API_KEY`, `GROK_API_KEY` / `XAI_API_KEY` | | Optional image and text fallbacks. |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | | Enable Sign in with Google. `GOOGLE_REDIRECT_URI` optionally overrides the callback URL. |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `EMAILS_FROM_EMAIL` or `RESEND_API_KEY` | | Welcome, invite and password reset emails. Without them, emails are only logged. |
| `LINKEDIN_*`, `TWITTER_*`, `META_*`, `INSTAGRAM_ACCOUNT_ID`, `THREADS_*`, `REDDIT_*`, `DISCORD_WEBHOOK_URL`, `SLACK_WEBHOOK_URL`, … | | Live publishing credentials. Channels without them run in sandbox mode. |

### Frontend (Vercel environment variables)

| Variable | Purpose |
| :--- | :--- |
| `NEXT_PUBLIC_API_URL` | Backend URL, e.g. `https://<your-service>.onrender.com` |
| `NEXT_PUBLIC_CONTACT_EMAIL` | Contact address shown on the Terms and Privacy pages |

---

## ☁️ Deployment (Vercel + Render + Neon)

1. **Database:** create a Neon PostgreSQL database and copy its connection string into `DATABASE_URL`. Tables are created and migrated automatically on startup.
2. **Backend (Render):** create a Web Service from this repo with the start command `python run.py`, and add the backend environment variables above.
3. **Frontend (Vercel):** import the `frontend/` directory, and set `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_CONTACT_EMAIL`.
4. **Google sign-in:** in Google Cloud Console, add `https://<backend>/api/auth/google/callback` (or your `GOOGLE_REDIRECT_URI`) as an authorized redirect URI. On the OAuth consent screen, add `https://<frontend>/privacy` and `https://<frontend>/terms`.

### Keeping the Render backend awake (free tier)

Render's free tier spins the backend down after 15 minutes of inactivity, and the next request then waits 50s–2min for a cold start. To avoid that:

1. **Ping endpoint:** `GET` or `HEAD` `https://<your-service>.onrender.com/ping` returns `{"status":"ok"}` without touching the database.
2. **Uptime monitor (primary):** create a free HTTP(s) monitor on [UptimeRobot](https://uptimerobot.com) or [cron-job.org](https://cron-job.org) pointing at `/ping` every 5–10 minutes.
3. **GitHub Actions (backup):** [`.github/workflows/keep-alive.yml`](.github/workflows/keep-alive.yml) pings every 10 minutes. Add a repository secret `RENDER_BACKEND_URL` to enable it. GitHub may delay scheduled runs and disables them after 60 days without repository activity.
4. **Frontend warm-up:** the web app sends a `/ping` on load, so a sleeping backend starts booting before the user does anything.

> Render gives 750 free instance hours per month per workspace. One always-on service uses about 744 hours, so keep only **one** free web service awake per account.

---

## 🚀 Capabilities & Roadmap

- [x] **6-agent swarm pipeline:** ingestion, research, copywriting, image generation, SEO and publishing.
- [x] **Groq LPU copywriting** with multi-channel bundles.
- [x] **Cloudflare FLUX.1 visuals** with fallbacks and clarity scoring.
- [x] **Private per-user knowledge bases** with TF-IDF retrieval and single-file scoped search.
- [x] **Omnichannel publishing** with database-backed audit history.
- [x] **Email + Google sign-in**, password reset, and an admin console with a 10-seat limit.
- [x] **Security hardening:** authenticated APIs, per-user isolation, SSRF protection, OAuth redirect allow-listing.
- [x] **Responsive UI** for desktop, tablet and phone, plus Terms and Privacy pages.
- [ ] **Account self-service:** change password and delete account from the app.
- [ ] **Usage metering:** track Groq token usage per user.
- [ ] **Direct social OAuth:** one-click connection of each user's own social profiles.
- [ ] **Multi-brand workspaces:** separate brand voices and knowledge bases per client.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
