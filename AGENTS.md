# AGENTS.md — OurTearoa

Briefing for AI agents working on this repo. Read fully before making changes.


## 1. Project Overview

Monorepo for "OurTearoa", a New Zealand tourism web app.

* **`client/`**: Angular 22 (standalone components, signals). Tests run via Vitest (`npm test`). Requires **Node 26**.
* **`backend/`**: Express 5 + TypeScript run directly via `tsx` (no build step). Uses Prisma 7 with `@prisma/adapter-pg`.
* **`compose.yaml`**: Local PostgreSQL container for local development only.


## 2. Common Commands

```bash
# Backend
npm --prefix backend run dev          # Start local API on :3000
npm --prefix backend run db:generate  # Regenerate Prisma Client (after schema changes)
npx tsc --noEmit -p backend/tsconfig.json  # Backend typecheck

# Client
cd client && npm test                # Run Angular Vitest suite
npm --prefix client run build        # Build production client bundle

# Local DB
npm run db:up                        # Start local Postgres container

```

## 3. Architecture & Infrastructure

* **EC2 Server**: AWS EC2 `t3.micro` running **Amazon Linux 2023** (SELinux `Enforcing`) at `54.252.56.209`.
* **Domain & TLS**: `ourtearoa.duckdns.org` secured with Let's Encrypt / Certbot on port 443 (port 80 redirects to 443).
* **Nginx Reverse Proxy**:
* Serves Angular production build from `/var/www/ourtearoa` (SELinux context: `httpd_sys_content_t`).
* Proxies `/api/*` to `127.0.0.1:3000`.

* **Process Manager**: PM2 runs the Node.js backend locally on port 3000 with systemd persistence across reboots.
* **Database**: AWS RDS PostgreSQL in `ap-southeast-2` (Sydney), connecting via TLS using `global-bundle.pem`.



## 4. CI/CD & Deployment

Automated via GitHub Actions (`.github/workflows/deploy.yml`):

* Triggers on every push/merge to `main`.
* Compiles the Angular production bundle in GitHub Actions (Node 26) to avoid memory limits on the EC2 instance.
* Rsyncs static files to `/var/www/ourtearoa/`.
* Pulls backend updates, runs `prisma migrate deploy`, and reloads PM2 automatically over SSH.


## 5. Critical Rules & Guardrails

1. **Health Check Contract**: `GET /api/health` must return `200 OK` with `{"status": "UP", "database": "UP"}`.
2. **Environment Variables**:
* Never commit `backend/.env` or any AWS/database credentials.
* `sslrootcert` in `DATABASE_URL` is relative to the working directory (`backend/`).


3. **Database Migrations**:
* `prisma migrate dev` is for **local development only**.
* Production migrations run via `prisma migrate deploy` in the deployment workflow.
