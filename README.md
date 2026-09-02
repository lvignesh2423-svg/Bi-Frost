# Bi-Frost — AI Skill Gap Analyzer

> **Where Your Career Lives.** Upload your resume, pick a target role, and get an AI-powered gap analysis with a personalized learning roadmap.

Bi-Frost is a full-stack monolith — **React (Vite) + FastAPI** — that extracts skills from your resume, compares them to any job description, and generates a prioritized learning path, visual roadmap, resume rewrite, and an AI career mentor chat.

Inspired by **metamask.io** — bento grid, scroll progress, glassmorphism, canvas particles, and Framer Motion transitions.

---

## ✨ Features

- **Resume Intelligence** — Upload PDF/DOCX or paste text → LLM extracts skills, experience, education
- **Skill Gap Analysis** — Readiness score, matched vs missing skills, estimated hours & weeks to hire-ready
- **Learning Path & Roadmap** — Prioritized, visual step-by-step plan per gap
- **Resume Rewriter** — 3 optimized, job-targeted rewrite variations
- **AI Mentor Chat** — Context-aware career coach (remembers your analysis)
- **Progress Tracking** — Mark skills complete, readiness score updates live
- **Auth & History** — JWT auth, per-user analysis history, latest-analysis resume
- **Downloadable Resume** — Print-ready HTML with newly-learned skills highlighted

## 🧱 Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 18, Vite 5, Tailwind CSS 3, Framer Motion, Lucide |
| Backend | FastAPI, SQLAlchemy, Pydantic, Uvicorn |
| AI | OpenAI-compatible API (Groq / OpenRouter) — `openai/gpt-oss-20b` |
| DB | SQLite locally · PostgreSQL on Railway (via `DATABASE_URL`) |
| Auth | `python-jose` (JWT) + `bcrypt` |
| Deploy | Single Dockerfile (multi-stage) — Frontend built then served by FastAPI |

## 📁 Project Structure

```
skill-gap-analyzer/
├── backend/
│   ├── main.py                 # FastAPI app + all /api/* routes + static serving
│   ├── config.py               # Env (LLM, DATABASE_URL, FRONTEND_DIR)
│   ├── models/
│   │   ├── database.py         # SQLAlchemy engine, init_db, get_db
│   │   ├── user.py             # User, UserAnalysis models
│   │   └── schemas.py          # Pydantic request/response schemas
│   └── services/
│       ├── llm_client.py       # OpenAI-compatible chat_completion wrappers
│       ├── skill_extractor.py
│       ├── job_matcher.py      # analyze_skill_gaps, learning_path, roadmap
│       ├── resume_parser.py    # PyMuPDF text extraction
│       ├── resume_rewriter.py
│       └── auth.py             # JWT + password hashing
├── frontend/
│   ├── src/
│   │   ├── components/         # Hero, Navbar, Footer, AnalysisPanel, SkillCard, etc.
│   │   ├── pages/              # LoginPage, RegisterPage
│   │   ├── App.jsx             # Routing, auth, scroll progress, section reveals
│   │   └── index.css           # Design tokens (mm-green/blue/purple), bento styles
│   ├── index.html
│   └── vite.config.js
├── Dockerfile                  # Stage 1: npm build · Stage 2: Python + serve
├── docker-compose.yml
└── start.bat / start-production.bat
```

> The backend serves the built frontend from `frontend/dist` — **one service handles both** API and UI.

## 🚀 Quick Start (Local)

**Prerequisites:** Python 3.11+, Node 18+, Groq or OpenRouter API key.

```bash
# 1. Clone
git clone https://github.com/lvignesh2423-svg/Bi-Frost.git
cd Bi-Frost   # or skill-gap-analyzer

# 2. Backend
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux
pip install -r backend/requirements.txt

# 3. Env — create .env in project root
# .env
OPENROUTER_API_KEY=your_groq_or_openrouter_key
OPENROUTER_BASE_URL=https://api.groq.com/openai/v1
LLM_MODEL=openai/gpt-oss-20b
JWT_SECRET=any_long_random_string

# 4. Frontend
cd frontend && npm install && npm run build && cd ..

# 5. Run (from project root)
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8001
# → http://localhost:8001  (also /api/health)
```

Or use the helpers on Windows:

```bash
start.bat            # dev: backend + Vite (5173)
start-production.bat # build + serve on 8001
```

## 🔑 Environment Variables

| Variable | Required | Default | Notes |
|---|---|---|---|
| `OPENROUTER_API_KEY` | Yes | — | Groq or OpenRouter key |
| `OPENROUTER_BASE_URL` | No | `https://openrouter.ai/api/v1` | Use `https://api.groq.com/openai/v1` for Groq |
| `LLM_MODEL` | No | `meta-llama/llama-3.1-70b-instruct` | e.g. `openai/gpt-oss-20b` |
| `DATABASE_URL` | No | `sqlite:///./skill_gap_analyzer.db` | Railway Postgres sets this automatically |
| `JWT_SECRET` | No | dev fallback | Set a strong random value in production |
| `PORT` | No | `8001` | Railway injects this — app honors it |
| `FRONTEND_DIR` | No | `frontend/dist` | Overridden to `/app/frontend/dist` in Docker |

## 🔌 API

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | No | Create account → JWT |
| POST | `/api/auth/login` | No | Login → JWT |
| GET | `/api/auth/me` | Yes | Current user |
| GET | `/api/health` | No | Health check |
| POST | `/api/upload-resume` | No | Parse PDF/DOCX → extracted skills |
| POST | `/api/analyze` | Optional | Full gap analysis + learning path + roadmap |
| POST | `/api/rewrite-resume` | No | 3 job-optimized rewrites |
| POST | `/api/mentor-chat` | No | AI mentor (with analysis context) |
| POST | `/api/generate-resume` | No | Generate printable HTML resume |
| POST | `/api/download-resume` | No | HTML download |
| POST/GET | `/api/progress/{session_id}` | Yes | Update/fetch learning progress |
| GET | `/api/history` | Optional | List analyses (user-scoped if authed) |
| GET | `/api/history/{session_id}` | No | Single analysis detail |
| GET | `/api/latest-analysis` | Yes | Resume last analysis for logged-in user |

Auth: `Authorization: Bearer <token>`

## ☁️ Deploy to Railway

The repo is **Railway-ready** — one service, one Dockerfile.

1. **Push** all changes: `git add . && git commit -m "deploy" && git push`
2. Railway → **New Project → Deploy from GitHub repo** → pick `Bi-Frost`
3. Railway auto-detects `Dockerfile` and builds (no extra config)
4. **Variables** → add `OPENROUTER_API_KEY`, `OPENROUTER_BASE_URL`, `LLM_MODEL`, `JWT_SECRET`
5. *(Recommended)* **+ New → Database → PostgreSQL** → Railway links it and sets `DATABASE_URL`. Without it, SQLite works but data resets on each deploy.
6. No port config needed — the app reads `$PORT` (falls back to `8001`).

**Where is the live link?**
Railway Dashboard → your service → **Settings → Networking → Public Networking → Generate Domain** (or **Deployments → app → View Logs / Domains**). It looks like `https://bi-frost-production.up.railway.app`. Click **Generate Domain** if you don't see one.

**Crashing / CrashLoop?** Check **Deployments → View Logs**:
- `ModuleNotFoundError: No module named 'backend'` → ensure latest commit is pushed (import fixes are in `3b1d818`+)
- `No module named 'psycopg2'` → ensure `backend/requirements.txt` includes `psycopg2-binary`
- `OPENROUTER_API_KEY missing` / `503 AI service unavailable` → set the Variables above and redeploy
- Healthcheck failing → `GET /api/health` must return 200 (app binds `$PORT` correctly)

## 🛠️ Development Notes

- Design system: `mm-green #baf24a`, `mm-blue #89b0ff`, `mm-purple #d075ff`, `mm-orange #f8893a` on `#080812`
- Start command locally **must** be from project root: `python -m uvicorn backend.main:app --port 8001` (not `cd backend`)
- `FRONTEND_DIR` resolves to `frontend/dist` — run `npm run build` before production serve

## 📄 License

MIT
