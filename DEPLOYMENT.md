# Deployment Guide — KyU Wellness

This document covers production deployment for Milestone 10.

Recommended split:

| Layer | Platform | Config |
|-------|----------|--------|
| Frontend | [Vercel](https://vercel.com) | `frontend/vercel.json` |
| Backend API | [Render](https://render.com) | `render.yaml` + `backend/Dockerfile` |
| Database | Render Postgres **or** [Supabase](https://supabase.com) | `DATABASE_URL` |

OpenAPI docs remain available at `/docs` and `/redoc` on the API host.

---

## 1. Database

### Option A — Render Postgres (via Blueprint)

1. Push this repo to GitHub.
2. In Render: **New → Blueprint** → select the repo (`render.yaml`).
3. Render creates `kyu-wellness-db` and wires `DATABASE_URL` into the API.

### Option B — Supabase (or any managed Postgres)

1. Create a project and copy the connection string.
2. Use either form:
   - `postgresql://USER:PASSWORD@HOST:5432/postgres`
   - `postgres://...` (auto-normalized by the API)
3. Set `DATABASE_URL` on the Render web service (or other host).
4. Migrations run automatically on container start (`alembic upgrade head`).

---

## 2. Backend (Render)

Config file: [`render.yaml`](./render.yaml)

### Manual setup (if not using Blueprint)

1. **New → Web Service**
2. Root: repo; Docker; Dockerfile path `backend/Dockerfile`; context `backend`
3. Health check path: `/api/health`
4. Set environment variables (see below)

### Required environment variables

| Variable | Example | Notes |
|----------|---------|-------|
| `DATABASE_URL` | `postgresql://...` | From Render DB or Supabase |
| `JWT_SECRET_KEY` | long random string | Never reuse the dev secret |
| `FRONTEND_URL` | `https://your-app.vercel.app` | Used in email links |
| `CORS_ORIGINS` | `https://your-app.vercel.app` | JSON array or comma-separated |
| `OPENAI_API_KEY` | `sk-...` | Required for chat / AI distress |
| `OPENAI_MODEL` | `gpt-4o-mini` | Optional |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASSWORD` | provider values | Real SMTP in production |
| `SMTP_FROM_EMAIL` | `noreply@yourdomain.com` | |
| `COUNSELOR_ALERT_EMAILS` | `a@x.com,b@y.com` | Crisis alert recipients |
| `DEBUG` | `false` | |

After deploy, verify:

```bash
curl https://YOUR-API.onrender.com/api/health
# open https://YOUR-API.onrender.com/docs
```

---

## 3. Frontend (Vercel)

Config file: [`frontend/vercel.json`](./frontend/vercel.json)

1. Import the GitHub repo in Vercel.
2. Set **Root Directory** to `frontend`.
3. Framework preset: Vite (build `npm run build`, output `dist`).
4. Add environment variable:

| Variable | Value |
|----------|-------|
| `VITE_API_URL` | `https://YOUR-API.onrender.com/api` |

5. Deploy. Copy the Vercel URL into backend `FRONTEND_URL` and `CORS_ORIGINS`, then redeploy the API.

---

## 4. Production Docker (self-hosted)

Local production-like stack (image build, no bind mounts, no `--reload`):

```bash
cp .env.example .env
# edit JWT_SECRET_KEY, OPENAI_API_KEY, FRONTEND_URL, CORS_ORIGINS

docker compose -f docker-compose.prod.yml up --build -d
```

---

## 5. Post-deploy checklist

- [ ] `/api/health` returns `ok` and database connected
- [ ] `/docs` loads Swagger UI
- [ ] Frontend can register / login (CORS OK)
- [ ] Chat works with a valid `OPENAI_API_KEY`
- [ ] Password-reset / verify-email links point at the Vercel URL
- [ ] Crisis email alerts reach counselor inboxes (real SMTP configured)
- [ ] Promote a counselor (preferred):

```bash
cd backend && source venv/bin/activate
python ../scripts/promote_user.py --email you@example.com --role counselor
# or admin:
python ../scripts/promote_user.py --email you@example.com --role admin
```

Optional SQL:

```sql
UPDATE users SET role = 'counselor' WHERE email = 'you@example.com';
```

Optional env seed (creates counselor on API startup if missing):

```bash
SEED_COUNSELOR_EMAIL=counselor@kyu.ac.ug
SEED_COUNSELOR_PASSWORD=change-me
```

---

## 6. Database backups

```bash
chmod +x scripts/backup_db.sh
./scripts/backup_db.sh
# writes backups/mental_health_db_<timestamp>.sql
# Copy that file to external/cloud storage.
# Restore: psql "$DATABASE_URL" -f backups/mental_health_db_....sql
```

---

## 7. Security notes

- Rotate `JWT_SECRET_KEY` for production; never commit `.env`
- Keep `DEBUG=false` in production
- Restrict `CORS_ORIGINS` to your real frontend domains only
- Prefer managed Postgres SSL connection strings when offered by the provider
