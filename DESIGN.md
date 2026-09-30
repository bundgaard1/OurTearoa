# OurTearoa — Design Document

## 1. Course Overview

**Course:** INFS803 Cloud Computing (2026, Semester 2)

**Project:** OurTearoa — a cloud-based web application for exploring New Zealand (Aotearoa).

**Brief:** Design, build and deploy a three-tier cloud application. The client, API and
database must each run on managed cloud services (no locally-installed database on the
server VM), the tiers must communicate only through decoupled RESTful APIs, and the
whole system must be deployed publicly and kept live for the duration of the
evaluation period.

**Live deployment:**

| | URL |
| :--- | :--- |
| Application | `https://ourtearoa.duckdns.org` |
| API base | `https://ourtearoa.duckdns.org/api` |
| Source repository | [OurTearoa](https://github.com/bundgaard1/OurTearoa) |

---

## 2. User Stories

These are the core requirements of the system. Every other design decision in this
document traces back to one of the stories below.

### 2.1 As a visitor

| ID | User story | Acceptance criteria |
| :--- | :--- | :--- |
| US-01 | As a visitor, I want to browse a list of New Zealand places so that I can discover destinations without an account. | [ ] |
| US-02 | As a visitor, I want to filter and search places by region so that I can narrow down to the part of the country I care about. | [ ] |
| US-03 | As a visitor, I want to open a place detail page showing name, region, description, photo and map coordinates so that I can decide whether to visit. | [ ] |
| US-04 | As a visitor, I want to read reviews and ratings left by other travellers so that I can judge a place from other people's experiences. | [ ] |

### 2.2 As a registered user (traveller)

| ID | User story | Acceptance criteria |
| :--- | :--- | :--- |
| US-05 | As a visitor, I want to register an account so that I can save favourites and plan an itinerary. | [ ] |
| US-06 | As a returning user, I want to log in so that I can access my saved data on any device. | [ ] |
| US-07 | As a registered user, I want to favourite a place so that I can build a shortlist. | [ ] |
| US-08 | As a registered user, I want to view and remove my favourites so that my shortlist stays current. | [ ] |
| US-09 | As a registered user, I want to write a review and star rating for a place I have visited so that I can share my experience. | [ ] |
| US-10 | As a registered user, I want to edit or delete my own review so that I can correct it later. | [ ] |
| US-11 | As a registered user, I want to add places to an itinerary with start and end dates so that I can organise a trip. | [ ] |
| US-12 | As a registered user, I want to view my itinerary ordered by date so that I can plan the sequence of my trip. | [ ] |
| US-13 | As a registered user, I want to edit or remove itinerary entries so that my plan can change as my trip does. | [ ] |

### 2.3 As a contributor

| ID | User story | Acceptance criteria |
| :--- | :--- | :--- |
| US-14 | As a contributor, I want to add a new place with its details and image so that the catalogue grows beyond the seed data. | [ ] |
| US-15 | As a contributor, I want to edit or remove a place I have added so that catalogue data stays accurate. | [ ] |
| US-16 | As a contributor, I want to upload a place image to cloud storage so that the catalogue has imagery without bloating the repository. | [ ] |

### 2.4 As an evaluator / operations user

| ID | User story | Acceptance criteria |
| :--- | :--- | :--- |
| US-17 | As an evaluator, I want a documented set of RESTful endpoints that I can call directly, so that the API can be tested independently of the UI. | [ ] |
| US-18 | As an evaluator, I want a health endpoint that reports both the API and the database connection, so that I can confirm the whole stack is live. | [ ] |
| US-19 | As a user on a slow or unreliable connection, I want clear loading and error states so that the interface never appears frozen. | [ ] |
| US-20 | As a user, I want the app served over HTTPS on a memorable domain so that it is trustworthy and easy to reach. | [ ] |

---

## 3. Architecture Design

### 3.2 Tiers

**Client tier — Angular 22 SPA**

A standalone single-page application in `client/`, built on Angular standalone
components with signals for state. It is a pure client-side app: there is no
server-side rendering, so the compiled bundle in `client/dist/client/browser/` is
the entire deployable artefact. The API base URL is baked in at compile time from
`client/src/environments/` — there is no runtime configuration and no dev-server
proxy, so changing the API host means recompiling and redeploying the client.

**Application tier — Express 5 + TypeScript on Node**

A REST API in `backend/`, written in TypeScript and run directly by `tsx` with no
build step, so the deployed source and the running code are identical. Express 5
mounts every route under `/api` and delegates to controllers; `cors()` is enabled
so the client can be served from a different origin during development. Prisma
Client is the only data-access layer — no raw SQL outside the health check.

The application tier is stateless: all session state lives in the database, which is
what allows the process to be reloaded or replaced without losing data.

**Data tier — managed PostgreSQL**

AWS RDS for PostgreSQL holds all application data. Because the database is a managed
service rather than something installed on the VM, backups, patching and failover are
handled by AWS, and the application tier holds no data of its own. The connection is
TLS-verified against the AWS global CA bundle.

### 3.3 Technology stack

| Layer | Technology |
| :--- | :--- |
| Frontend | Angular 22, TypeScript, signals, Angular Router |
| Frontend tests | Vitest |
| Backend | Express 5, TypeScript, `tsx` (run from source), Node 26 |
| Data access | Prisma 7 with `@prisma/adapter-pg` |
| Database | PostgreSQL 16 on AWS RDS (`ap-southeast-2`) |
| Object storage | AWS S3 (`@aws-sdk/client-s3`) |
| Compute | AWS EC2 `t3.micro`, Amazon Linux 2023 |
| Process manager | PM2 with systemd persistence |
| Reverse proxy / TLS | Nginx, Let's Encrypt (Certbot) |
| DNS | DuckDNS |
| CI/CD | GitHub Actions → rsync + SSH deploy |
| Local development | Docker Compose (Postgres 16) |

### 3.4 Cloud services

| Service | Purpose | Notes |
| :--- | :--- | :--- |
| EC2 `t3.micro` | Hosts Nginx and the Node API | 1 GB RAM, so a swap file is configured to keep the OOM killer away from the API process |
| RDS PostgreSQL | All application data | [region, instance class, storage, backup retention] |
| S3 bucket | Place images and other static uploads | [bucket name, region, public-read policy, CORS config] |
| DuckDNS | Public DNS for `ourtearoa.duckdns.org` | [update mechanism] |

**Access control.** The EC2 instance is reachable only on 443 (and 22 for SSH from
the team's addresses). The database is not public: RDS carries its own inbound rule
for 5432 scoped to the EC2 security group, so only the API host can open a
connection. Postgres credentials and the `DATABASE_URL` are supplied by the process
environment, never committed.

**TLS.** The RDS connection uses `sslmode=verify-full` with `global-bundle.pem`, so
the certificate is validated rather than merely encrypted.

> _Placeholder — the S3 integration is installed as a dependency but the bucket and
> upload path are not yet wired into the API. Describe the intended flow here._

### 3.5 Request lifecycle

A single place-detail page load, as an example:

1. The browser loads the SPA from Nginx over HTTPS.
2. The component queries its data, which has not been populated, and issues
   `GET /api/places/:id`.
3. Nginx terminates TLS and proxies `/api/*` to `127.0.0.1:3000`.
4. Express routes the request to the places controller.
5. The controller calls Prisma, which opens a TLS connection to RDS and runs the
   query.
6. The row is serialised to JSON and returned with `200`.
7. Any error is translated to a status code and JSON error body; a failed request
   surfaces a visible error state in the component rather than a blank screen.

### 3.6 Deployment and CI/CD

Every push to `main` triggers `.github/workflows/deploy.yaml`, which:

1. Compiles the Angular production bundle on the GitHub runner. This is done in CI
   deliberately — the `t3.micro` does not have the memory to build the client.
2. Rsyncs the compiled bundle to the Nginx web root at `/var/www/ourtearoa/`.
3. SSHes into the instance, `git pull`s the backend, installs production
   dependencies, and runs `prisma migrate deploy`.
4. Reloads the API through PM2 and restores the SELinux `httpd_sys_content_t`
   context on the web root so Nginx can read the new files.

Migrations run as `migrate deploy` — never `migrate dev` — so production schema
changes are applied, not regenerated. Secrets (the SSH key, host, user) are held in
GitHub Actions secrets and never appear in the repository.

Health verification after any deploy:

```bash
curl -i https://ourtearoa.duckdns.org/api/health
```

`200` with `{"status":"UP","database":"UP"}` confirms the API *and* its database
connection are live. A `503` with `reason: "timeout"` means the RDS security group
does not cover the instance; `reason: "unreachable"` means credentials or SSL
settings are wrong.

---

## 4. Interface Design

### 4.1 Screens

| # | Screen | Purpose | Route |
| :--- | :--- | :--- | :--- |
| 1 | Place list / catalogue | Browse and filter all places | [ ] |
| 2 | Place detail | Full place information, map, reviews | [ ] |
| 3 | Login | Authenticate an existing user | [ ] |
| 4 | Register | Create a new account | [ ] |
| 5 | Favourites | The user's saved shortlist | [ ] |
| 6 | Itinerary | Dated trip plan built from places | [ ] |
| 7 | [ ] | [ ] | [ ] |

> _Placeholder — Angular router config is currently empty; routes are to be
> assigned as screens are built._

### 4.2 Navigation and user flows

> _Placeholder — describe the primary flow (browse → detail → log in → favourite →
> plan) and the authentication guard behaviour, with a flow diagram._

### 4.3 API endpoints

All endpoints are under `/api` and speak JSON. Responses are `200`/`201` on success
and a JSON `{ "error": "..." }` body on failure.

There will be endpoints for all the accessibles resources

---

## 5. Data Design

Place


Review

Itinerary-Entry



User