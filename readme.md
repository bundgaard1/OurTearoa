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

ssh -i <your-key.pem> ec2-user@<EC2-PUBLIC-IP>

# Local Development

The project ships with a Docker Compose Postgres so you can develop against a
local database instead of whitelisting your IP against the AWS RDS security
group.

**Prerequisites:** Docker with Docker Compose.

```bash
# 1. Start the local database (Postgres on localhost:5432)
npm run db:up

# 2. Apply the schema (creates the first migration on a fresh DB)
npm run db:migrate

# 3. Seed the sample data (Places, demo user, reviews)
npm run db:seed

# 4. Start the backend API
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
| `npm run db:seed` | Seed sample data (Places, user, reviews) |

The local DB connection is configured in `backend/.env`
(`postgresql://ourtearoa:ourtearoa_dev@localhost:5432/ourtearoa?schema=public`).
To point at the AWS RDS database instead, swap in the RDS `DATABASE_URL`
commented out in that file.

**Demo seed user:** `demo@ourtearoa.dev`