INFS803 Cloud Computing 2026

Name: Ourtearoa - A Cloud-Based Application for Exploring New Zealand (Aotearoa)

Exploring New Zealand (Aotearoa) application.

# Requirements

- **Three-Tier Architecture:** Implement distinct client (frontend), backend (REST API), and database/storage tiers on the cloud. The database and storage must be managed cloud services, not local installations inside the server virtual machine.
- **Decoupled RESTful APIs:** Build at least **10 RESTful endpoints** (including at least **3 `POST` methods**) connecting the client and backend. Markers must be able to test these APIs independently.
- **Cloud Deployment:** Deploy the frontend and backend to accessible public cloud hosts (e.g., AWS, Azure) and ensure both remain live and publicly accessible throughout the entire evaluation period.
- **Cloud Database & Storage:** Store application data in a dedicated cloud database (SQL or NoSQL) and store static assets/files in a cloud object storage bucket.
- **Git Collaboration:** Maintain an active Git repository with distinct, unrewritten commit histories reflecting each team member's ongoing contributions.
- **CI/CD Integration:** Set up continuous integration and deployment pipelines to automatically push code updates from your Git repository to your cloud environments.
- **Comprehensive Documentation:** Deliver a complete PDF report covering project management evidence (work logs, Trello boards, timestamps, meeting minutes), architecture diagrams, cloud setup guides, API specifications, user manuals, and prominent links to the live URLs and source repository.

# Connect to EC2

```
ssh -i <your-key.pem> ec2-user@<EC2-PUBLIC-IP>
```

# Install dependencies

This project is a monorepo containing distinct `backend/` and `client/` workspaces. Dependencies must be installed in both project subdirectories rather than the root directory.

Prerequisites:

- Node.js 26+
- Docker with Docker Compose

Run the following commands from the repository root:

```Bash
# 1. Install backend dependencies and generate the Prisma client
npm --prefix backend ci
npm --prefix backend run db:generate

# 2. Install client (Angular) dependencies
npm --prefix client ci
```

# Local Development

The project ships with a Docker Compose Postgres container so you can develop against a local database without needing access to AWS RDS.

**Prerequisites:** Docker with Docker Compose.

```bash
# 1. Start the local database (Postgres on localhost:5432)
npm run db:up

# 2. Apply existing committed migrations to the local database
npm run db:deploy

# 3. Seed sample data (Places, demo user, reviews)
npm run db:seed

# 4. Start the backend API (http://localhost:3000)
npm --prefix backend run dev
```

Useful commands:

| Command           | Description                              |
| :---------------- | :--------------------------------------- |
| `npm run db:up`   | Start the local Postgres container       |
| `npm run db:down` | Stop the local Postgres container        |
| `npm run db:logs` | Follow container logs                    |
| `npm run db:studio` | Open Prisma Studio against the local DB |
| `npm run db:migrate` | Run `prisma migrate dev`             |
| `npm run db:deploy` | Run `prisma migrate deploy` to apply migrations to the local DB |
| `npm run db:seed` | Seed sample data (Places, user, reviews) |

The local DB connection is configured in `backend/.env`
(`postgresql://ourtearoa:ourtearoa_dev@localhost:5432/ourtearoa?schema=public`).
To point at the AWS RDS database instead, swap in the RDS `DATABASE_URL`
commented out in that file.

**Demo seed user:** `demo@ourtearoa.dev`

# Building the Client

The client is a standalone Angular 22 app in `client/`. Install its dependencies
once, then use `ng` for both the dev server and the production compile.

```bash
cd client
npm ci
```

## Development server

```bash

npm start          # ng serve, http://localhost:4200
```

This serves on port 4200 and rebuilds on save. It calls the API at
`http://localhost:3000/api`, so **the backend must be running** or every request
will fail — start it with `npm --prefix backend run dev` (see above).

## Production compile

```bash
npm run build      # ng build, defaults to the production configuration
```

The compiled app is written to `client/dist/client/browser/`. That directory is
what CI rsyncs to the Nginx web root (`/var/www/ourtearoa`), so it is the only
thing that needs deploying — there is no server-side rendering or runtime
config step.

| Command        | Description                                        |
| :------------- | :------------------------------------------------- |
| `npm start`    | Dev server on :4200, rebuilds on save              |
| `npm run build` | Production compile to `client/dist/client/browser/` |
| `npm run watch` | Development build that rebuilds on save (no server) |
| `npm test`     | Run the Vitest unit tests                          |


## API URL is baked in at compile time

`client/src/environments/` holds two files and the build picks one:

| Configuration | File | `apiUrl` |
| :--- | :--- | :--- |
| `development` | `environment.development.ts` | `http://localhost:3000/api` |
| `production` | `environment.ts` | `https://ourtearoa.duckdns.org/api` |

There is no runtime configuration and no dev-server proxy — the URL is compiled
into the JavaScript bundle. So the production build has to be **recompiled and
redeployed** whenever the API host changes, and you should not expect editing
these files alone to affect an already-deployed bundle.