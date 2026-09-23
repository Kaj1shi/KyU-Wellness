# KyU Wellness — AI Mental Health Support System

An AI-powered conversational mental health support platform for **Kyambogo University** students in Uganda.

## Features

- Student auth (register, login, guest) + counselor/admin roles
- PHQ-9, GAD-7, PSS-10 assessments
- CBT-informed AI chat with hybrid distress detection
- Crisis escalation (email + in-app counselor alerts)
- Student wellness dashboard + counselor caseload tools
- Private journal, counseling appointment requests, and feedback
- Public About / Resources / Privacy / Emergency pages
- English + Luganda UI (`react-i18next`)

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React, Vite, TypeScript, Tailwind CSS, Framer Motion, React Router, i18next |
| Backend | Python, FastAPI, SQLAlchemy, Alembic |
| Database | PostgreSQL 16 (local, Render, or Supabase-compatible `DATABASE_URL`) |
| AI | OpenAI API |
| Email | SMTP (Mailhog in local dev) |
| Docs | OpenAPI / Swagger at `/docs` |

## Quick Start (local)

### Prerequisites

- Docker with Compose plugin (`docker compose`) **or** local PostgreSQL 16
- Node.js 20+
- Python 3.12+

> **Kali Linux note:** If `docker compose` is not found, install the plugin:
> `sudo apt install docker-compose-plugin`
> Ensure your user is in the `docker` group: `sudo usermod -aG docker $USER`

### 1. Environment setup

```bash
cp .env.example .env
# Default: local Ollama (Qwythos). Or set LLM_PROVIDER=openai + OPENAI_API_KEY
cp frontend/.env.example frontend/.env.local   # optional
```

### Optional: local Ollama chatbot (Qwythos)

1. Keep Ollama running (`ollama serve` / system service).
2. Confirm the model name: `ollama list`
3. In `backend/.env` (or root `.env` for Compose):

```bash
LLM_PROVIDER=ollama
OLLAMA_BASE_URL=http://127.0.0.1:11434/v1
OLLAMA_MODEL=hf.co/empero-ai/Qwythos-9B-Claude-Mythos-5-1M-GGUF:Q4_K_M
```

4. If the **API runs in Docker**, Ollama on `127.0.0.1` is not reachable from containers.
   Keep this proxy running in a separate terminal:
   ```bash
   ./scripts/ollama-docker-proxy.sh
   ```
   (or permanently set `OLLAMA_HOST=0.0.0.0:11434` on the Ollama systemd service and use port `11434`)
5. Restart the backend (`docker compose up -d backend`), then chat in the app.
   Local models can take 1–3 minutes per reply — wait for “Thinking…”.

### 2. Start infrastructure + API

```bash
docker compose up --build
```

Services:
- **API:** http://localhost:8000
- **API docs (Swagger):** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc
- **Health:** http://localhost:8000/api/health
- **Mailhog UI:** http://localhost:8025
- **PostgreSQL:** localhost:5432

### 3. Start frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend: http://localhost:5173

### Local backend (without Docker API container)

```bash
# Start only DB + Mailhog
docker compose up db mailhog -d

cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

## Environment variables

Root `.env` (see [`.env.example`](./.env.example)):

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Postgres URL (`postgres://` or `postgresql://`) |
| `JWT_SECRET_KEY` | Signing secret for access/refresh tokens |
| `FRONTEND_URL` | Public frontend origin (email links) |
| `CORS_ORIGINS` | Allowed browser origins (JSON array or comma-separated) |
| `LLM_PROVIDER` | `ollama` (local) or `openai` (cloud) |
| `OLLAMA_BASE_URL` | Ollama OpenAI-compatible URL (default `http://127.0.0.1:11434/v1`) |
| `OLLAMA_MODEL` | Model id from `ollama list` |
| `OPENAI_API_KEY` | OpenAI key when `LLM_PROVIDER=openai` |
| `OPENAI_MODEL` | Cloud model id (default `gpt-4o-mini`) |
| `SMTP_*` | Outbound email settings |
| `COUNSELOR_ALERT_EMAILS` | Comma-separated crisis alert recipients |
| `DEBUG` | `true` locally; `false` in production |

Frontend (`frontend/.env.example`):

| Variable | Purpose |
|----------|---------|
| `VITE_API_URL` | API base URL including `/api` |

## Deployment (Milestone 10)

Full steps: **[DEPLOYMENT.md](./DEPLOYMENT.md)**

Summary:

1. **Database** — Render Postgres (Blueprint) or Supabase / any managed Postgres via `DATABASE_URL`
2. **Backend** — Deploy with [`render.yaml`](./render.yaml) + [`backend/Dockerfile`](./backend/Dockerfile)
3. **Frontend** — Deploy `frontend/` to Vercel ([`frontend/vercel.json`](./frontend/vercel.json)); set `VITE_API_URL`
4. Point backend `FRONTEND_URL` + `CORS_ORIGINS` at the Vercel URL

Production-like local Docker:

```bash
docker compose -f docker-compose.prod.yml up --build -d
```

## Project Structure

```
Final_Year/
├── frontend/                 # React + Vite app
│   ├── vercel.json           # SPA rewrites for Vercel
│   └── .env.example
├── backend/                  # FastAPI app
│   ├── Dockerfile            # Production image (migrate + uvicorn)
│   ├── app/
│   │   ├── config/           # Settings, database
│   │   ├── models/           # SQLAlchemy models
│   │   ├── routes/           # API routes
│   │   ├── schemas/          # Pydantic schemas
│   │   └── services/         # Business logic
│   └── alembic/              # DB migrations
├── docker-compose.yml        # Local: Postgres + Mailhog + API (--reload)
├── docker-compose.prod.yml   # Production-style API overrides
├── render.yaml               # Render Blueprint (API + Postgres)
├── DEPLOYMENT.md             # Production deploy guide
└── .env.example
```

## API Endpoints

Interactive docs: **http://localhost:8000/docs**

### Core
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | API info |
| GET | `/api/health` | Health + DB status |
| GET | `/docs` | Swagger UI |
| GET | `/redoc` | ReDoc |

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Student registration |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/guest` | Anonymous guest session |
| POST | `/api/auth/refresh` | Refresh access token |
| POST | `/api/auth/logout` | Logout (discard tokens) |
| GET | `/api/auth/me` | Current user profile |
| POST | `/api/auth/forgot-password` | Request password reset email |
| POST | `/api/auth/reset-password` | Reset password with token |
| POST | `/api/auth/verify-email` | Verify email with token |
| GET | `/api/auth/faculties` | List KyU faculties |

### Assessments
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/assessment/questions/{type}` | Get questionnaire (phq9, gad7, stress) |
| POST | `/api/assessment/submit` | Submit responses and get scored result |
| GET | `/api/assessment/results` | Latest result per assessment type |
| GET | `/api/assessment/history` | Assessment history |
| GET | `/api/assessment/trends` | Score trends over time |
| GET | `/api/assessment/result/{id}` | Single assessment result |

### Distress + Chat
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/distress/analyze` | Hybrid rule + AI distress analysis |
| GET | `/api/chat/sessions` | List chat sessions |
| POST | `/api/chat/sessions` | Create chat session |
| GET | `/api/chat/sessions/{id}/messages` | List messages |
| POST | `/api/chat/sessions/{id}/messages` | Send message + AI reply |

### Crisis + notifications
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/escalations` | List crisis escalations (counselor/admin) |
| PATCH | `/api/escalations/{id}` | Acknowledge or resolve |
| GET | `/api/notifications` | In-app notifications |
| PATCH | `/api/notifications/{id}/read` | Mark notification read |

### Dashboards
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard` | Student wellness overview |
| POST | `/api/wellness/mood` | Log mood (1–5) |
| POST | `/api/wellness/checkin` | Daily check-in |
| GET | `/api/counselor/dashboard` | Counselor overview |
| GET | `/api/counselor/students` | Student caseload |
| GET | `/api/counselor/students/{id}` | Student detail |

### Journal / feedback / appointments
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/journal` | List / create journal entries |
| PATCH/DELETE | `/api/journal/{id}` | Update / delete own entry |
| POST | `/api/feedback` | Submit platform feedback |
| GET | `/api/feedback/mine` | Own feedback history |
| GET | `/api/feedback` | All feedback (counselor/admin) |
| POST | `/api/appointments` | Request counseling appointment |
| GET | `/api/appointments/mine` | Own appointment requests |
| GET | `/api/appointments` | Appointment queue (counselor/admin) |
| PATCH | `/api/appointments/{id}` | Update appointment status |
| POST | `/api/admin/users/set-role` | Set user role (admin only) |

### Ops helpers
```bash
# Promote a registered user to counselor/admin
cd backend && source venv/bin/activate
python ../scripts/promote_user.py --email you@example.com --role counselor

# Backup local/remote Postgres to backups/
chmod +x scripts/backup_db.sh
./scripts/backup_db.sh
```

## Milestone Checklist

- [x] **M1** — Foundation (scaffold, DB, Docker, health)
- [x] **M2** — Authentication
- [x] **M3** — Assessments
- [x] **M4** — Distress detection
- [x] **M5** — AI chatbot
- [x] **M6** — Crisis escalation
- [x] **M7** — Student dashboard
- [x] **M8** — Counselor/admin dashboard
- [x] **M9** — Static pages + i18n
- [x] **M10** — Deployment + docs

## Ethics Disclaimer

This platform provides supportive guidance and is **not** a replacement for professional mental health care. Crisis situations are escalated to human counselors and emergency resources.
# KyU-Wellness
