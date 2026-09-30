# AGENTS.md — OurTearoa

Briefing for AI agents working on this repo. Read fully before changing anything.

## Project

Monorepo for "OurTearoa", a tourism web app (Aotearoa/New Zealand places, reviews,
favourites, itineraries). Client is Angular; backend is an Express REST API.

- `backend/` — Express 5.2.1 + TypeScript 7, run directly via `tsx` (**no build step**).
  Prisma 7.9.1 with the `@prisma/adapter-pg` driver adapter over `pg`.
- `client/` — Angular 22, standalone components, signals. Vitest via `ng test`.
- `compose.yaml` — local PostgreSQL 16 for development only.
- `docs/` — `aws-rds-setup.md`, `cloud-ec2-setup.md`, `screenshots/`.

## Commands

```bash
npm --prefix backend run dev     # start API on :3000 (cwd-sensitive, see below)
npm --prefix backend run db:generate   # regenerate Prisma client (required after clone)
npx tsc --noEmit -p backend/tsconfig.json   # typecheck — there is NO typecheck script
cd client && npm test           # ng test, Vitest
npm run db:up                   # local Postgres only
```

There is no `build`, `lint`, or `typecheck` script. `backend` has **no test framework**;
its `npm test` is a stub that exits 1. Only `client` has real tests (4 passing).

## The health endpoint — the current DoD

**`GET /api/health` must return 200 from any network, and survive an EC2 reboot.**

It runs a real `SELECT 1` via Prisma (`backend/src/controllers/health.controller.ts`):

```json
{ "status": "UP", "timestamp": "...", "database": "UP", "latencyMs": 34.9, "reason": null }
```

**Which database it checks depends on where it runs.** On EC2 that is RDS, because
`DATABASE_URL` is supplied by the process environment (systemd/PM2) and there is no
`.env` on the box. Run locally it checks the Docker Postgres from `backend/.env`,
so a sub-millisecond `latencyMs` locally is expected and says nothing about RDS
reachability. The `timeout` vs `unreachable` split below was diagnosed by running the
health check against RDS directly — to repeat that, uncomment the RDS `DATABASE_URL`
in `backend/.env`, start from `backend/`, then re-comment it.

`503` + `"status": "DOWN"` on failure. The `reason` field is the diagnostic:

| `reason` | Meaning | Fix |
| --- | --- | --- |
| `misconfigured` | `DATABASE_URL` unset | Add to `backend/.env` |
| `timeout` | No reply within `HEALTH_DB_TIMEOUT_MS` (default 3000) | Packets dropped — security group, or *Publicly accessible* is No |
| `unreachable` | Failed fast, so the port is open | Password, SSL mode, or cert path |

`timeout` is always network; `unreachable` is always config. Preserve this
discrimination — it is what isolated the last outage.

`backend/src/db.ts` exports a **lazy** `getPrisma()`. Do not "simplify" it back to an
eager `new PrismaClient()` at module scope: the laziness is what turns a missing
`DATABASE_URL` into a 503 instead of a crash on boot.

## Environment variables — credentials must stay env-only

Read: `DATABASE_URL`, `HEALTH_DB_TIMEOUT_MS`, `PORT`. Nothing else. Never hardcode a
host, user, password, or region in source.

**`backend/.env` (gitignored, never commit):**

```
DATABASE_URL="postgresql://USER:PASSWORD@ourtearoa-db.cvmcgkcgaf7o.ap-southeast-2.rds.amazonaws.com:5432/postgres?sslmode=verify-full&sslrootcert=../global-bundle.pem&schema=public"
```

URL-encode special characters in the password (`#` → `%23`).

**`sslrootcert` is relative to the process cwd.** It must be started from `backend/`,
which is what `npm --prefix backend run dev` does. Starting from the repo root breaks TLS.

## AWS topology

- **RDS** `ourtearoa-db.cvmcgkcgaf7o.ap-southeast-2.rds.amazonaws.com:5432`, db `postgres`,
  user `postgres`. Region **ap-southeast-2 (Sydney)**. TLS via `global-bundle.pem`
  (the AWS RDS CA bundle, repo root). `sslmode=verify-full`, **not** `require` —
  `require` does not verify the certificate.
- **EC2** Elastic IP `54.252.56.209`, user `ec2-user`, `t3.micro`, Ubuntu, 1 GB RAM +
  2 GB swap. Nginx 1.30.4 on `:80` proxies to `127.0.0.1:3000`
  (`/etc/nginx/conf.d/ourtearoa.conf`).
- RDS is **publicly accessible** (resolves to 13.210.67.9). The laptop reached it only
  after adding `156.62.5.154/32` to its security group. Note the EC2 instance can also
  reach `:5432` — worth confirming whether that SG rule is scoped to the EC2 security
  group or is wider than it should be.

## ⚠️ The backend is NOT deployed to EC2

**This is the current blocker. The DoD cannot pass until it is fixed.**

`/home/ec2-user/ourtearoa-api/` is a hand-copied stub from 14 Sep, not this backend:

- only `index.js` (bare Express, `/health` returns the string `healthy`), `package.json`
  (express only), `package-lock.json`, `node_modules`
- no `.git`, no `src/`, no `prisma/`, no `generated/`, no `.env`, no `.pem`
- `pm2-ec2-user.service` is **enabled but failing**: `pm2 resurrect` exits 1,
  "Start request repeated too quickly", restart counter 5, failing since boot
  2026-09-28 22:09:23. The saved PM2 process list is empty.

Result: `http://54.252.56.209/api/health` returns **nginx 502 Bad Gateway**. Nothing
listens on 3000. The PM2 systemd unit is configured correctly — it has nothing to restore.

Deploying it requires, in order: get the source onto the box, `npm ci`, `db:generate`,
provide `DATABASE_URL` and `global-bundle.pem`, register a process with PM2, then
**`pm2 save`** so `resurrect` has something to restore on boot. Only after that is
reboot survival testable.

## Traps

- **`db:migrate` and `db:seed` are local-only by default.** `backend/.env` ships the Docker
  Postgres URL, and that one file drives both the Prisma CLI *and* the running API, so the
  two can never drift. The RDS URL sits commented out directly beneath it. Uncomment that
  line and `prisma/seed.ts` calls `deleteMany()` on all five tables — which **will wipe the
  cloud database**, since it is live and reachable from a whitelisted laptop. Check
  `npx prisma migrate status` (from `backend/`) names `localhost` before running any write.
- **`prisma migrate dev` writes, and creates a shadow database.** It targets whatever
  `DATABASE_URL` names. `db:deploy` (`migrate deploy`) is the non-interactive form, and is
  what CI runs on EC2 against RDS.
- **Two runtime files are gitignored but required**: `global-bundle.pem`
  (root `.gitignore` `*.pem`) and `backend/generated/prisma/` (`backend/.gitignore`
  `/generated/`). A fresh clone cannot start without both. Decide deliberately whether
  the CA bundle gets committed — it is a public trust anchor, not a secret — or whether
  a deploy step fetches it.
- **Do not paste AWS console sample code into app modules.** A recent paste of the RDS
  `pg` sample into `db.ts` called `require('aws-sdk')` (v2, not installed) at module
  scope, which would have crashed `/api/health` on import. It also hardcoded credentials
  and set `rejectUnauthorized: false`. AWS docs snippets are for scratch files, not
  `src/`.
- AWS RDS can be whitelisted per-IP; a "timeout" means the rule is missing or points at
  a different address (VPNs fool the console's "My IP"). Type the `/32` manually.

## Working agreements

- **Do not SSH to the EC2 instance.** The user manages the server directly and wants
  agents out of it. Ask for console output instead.
- **Do not start or stop the dev server.** The user runs it to watch output live.
- Run the backend locally to verify changes, not on EC2.
- No CI, no Dockerfile, no committed PM2 `ecosystem.config.js` exist yet.

## State

Clean tree on `main`. Commits: `57da665` (lazy Prisma + live health check),
`3f6d807` (docs fixes), `1e06749` (client shows `database`/`latencyMs`).
Next step is deploying the backend to EC2 and verifying reboot survival.
