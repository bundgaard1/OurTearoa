#import "lib.typ": project-report

#show: project-report.with(
  title: "OurTearoa ",
  subtitle: [INF803 - Cloud Computing Project \ Cloud Web Application Development and Deployment],
  date: "Submission Date: 16 October 2026",
  authors: (
    (
      name: "Mathias Jørgensen",
      department: [Student ID: 26344066],
      organization: [Auckland University of Technology],
      email: "cvm6264@autuni.ac.nz",
    ),
       (
      name: "Tim Schiller",
      department: [Student ID: 26347002],
      organization: [Auckland University of Technology],
      email: "zpn6423@autuni.ac.nz",
    ),
  ),
  header: [#h(1fr) OurTearoa - Cloud Web Application #h(1fr)
    #line(length: 100%, stroke: 0.5pt + gray) ],
  bibliography: bibliography("refs.bib"),
  appendix: include "appendix.typ",
)

#v(1fr)
#align(center)[
  #image("media/logo_old.jpeg", width: 150%)
]
#v(1fr)


#pagebreak()

#show <nonumber>: set heading(numbering: none)

// Callout helper block for team instruction
#let prompt(title, content) = block(
  fill: rgb("#f7fafc"),
  stroke: (left: 4pt + rgb("#3182ce")),
  inset: (x: 12pt, y: 10pt),
  radius: (right: 4pt),
  width: 100%,
  [
    #text(weight: "bold", fill: rgb("#2b6cb0"))[#title] \
    #text(size: 9.5pt, fill: rgb("#4a5568"))[#content]
  ]
)

// Placeholder image helper
#let img-placeholder(caption-text) = align(center)[
  #rect(
    width: 95%,
    height: 120pt,
    stroke: (paint: rgb("#cbd5e0"), dash: "dashed"),
    fill: rgb("#edf2f7"),
    radius: 4pt
  )[
    #align(center + horizon)[
      #text(size: 10pt, fill: rgb("#718096"), weight: "bold")[#caption-text] \
      #text(size: 8pt, fill: rgb("#a0aec0"))[(Insert screenshot image file here)]
    ]
  ]
]

// ==========================================
// PREAMBLE
// ==========================================

= Preamble <nonumber>

== Project Deliverables & Access Links <nonumber>

#table(
  columns: (1.6fr, 3.6fr),
  inset: 8pt,
  stroke: 0.5pt + rgb("#cbd5e0"),
  [ *Presentation Video* ], [ #link("Insert link here")[Presentation Video (Public URL, < 5 minutes)] ],
  [ *GitHub Repository* ], [ #link("https://github.com/bundgaard1/OurTearoa") ],
  [ *Live Web Client URL* ], [ #link("https://ourtearoa.duckdns.org") ],
  [ *Live REST API Base* ], [ #link("https://ourtearoa.duckdns.org/api") ]
)

== Member Contributions <nonumber>

#table(
  columns: (1.2fr, 1fr, 3fr),
  stroke: 0.5pt + rgb("#cbd5e0"),
  [ *Member Name* ], [ *Student ID* ], [ *Assigned Components & Cloud Tasks* ],
  [ Mathias Jorgensen ], [ 26344066 ], [ Setup AWS (S3 storage, EC2 compute, RDS PostgreSQL), Project Owner, Backend API Development (Express/Prisma), S3 asset integration ],
  [ Tim Schiller ], [ 26347002 ], [ Frontend SPA Development (Angular 22, Signals), Project Manager, JWT Auth Architecture, Nginx/Certbot TLS setup, GitHub Actions CI/CD Pipeline ]
)

#pagebreak()

// ==========================================
// 1. INTRODUCTION
// ==========================================

= Introduction

== Project Overview and Domain

OurTearoa is a cloud-native travel exploration platform engineered to streamline how users discover and experience New Zealand (Aotearoa). The platform enables visitors and travellers to browse regional destinations, explore granular location details, and submit authenticated ratings and reviews. Registered users can curate sequential, date-ordered travel itineraries across multiple destinations.

Architecturally, the application enforces a strict separation of concerns through a decoupled three-tier model. A standalone Angular single-page application functions purely as the presentation tier, consuming stateless JSON endpoints exposed by an Express 5 REST API. All communication between the frontend client and backend services is secured over TLS/HTTPS, ensuring data transit integrity while allowing the API tier to be tested, scaled, and managed independently of the client interface.

== Technology Stack

- *Client Tier:* Built with Angular 22 as a Single Page Application (SPA) @angular_framework, leveraging standalone components, reactive signals for state management, Angular Router, and Vitest for unit testing.
- *Application Tier:* Implemented using Express 5 and TypeScript running directly on Node.js 26 via `tsx`, managed in production with PM2 process persistence under systemd.
- *Data Tier:* Managed PostgreSQL 16 on AWS RDS (`ap-southeast-2`) @aws_rds, accessed via Prisma 7 ORM utilizing the `@prisma/adapter-pg` driver over verified TLS connections.

- *Infrastructure:* Compute is hosted on Amazon Elastic Compute Cloud (Amazon EC2) @aws_ec2, static assets are offloaded to Amazon Simple Storage Service (Amazon S3) @aws_s3, and relational state is delegated to Amazon Relational Database Service (Amazon RDS) for PostgreSQL @aws_rds.


- *Network:* Reverse proxy and TLS termination handled by Nginx with Let's Encrypt certificates @letsencrypt, and DNS mapped to the instance's Elastic IP via DuckDNS (`ourtearoa.duckdns.org`). DuckDNS is a free static record, so no dynamic update client is needed @duckdns.

- *Delivery and local development:* GitHub Actions tests and builds the client and deploys over rsync and SSH (see @sec-cicd); Docker Compose runs PostgreSQL 16 for local development.

// ==========================================
// 2. BACKGROUND & REQUIREMENTS ANALYSIS
// ==========================================

= Background and Requirements Analysis <sec-requirements>

Visitors planning a trip around New Zealand gather destinations, opinions and dates from many separate sources. OurTearoa puts them in one place: browse a catalogue of places, read and write reviews, keep a shortlist and turn it into a dated itinerary. Browsing is open to everyone; anything personal needs an account. For the course, the same product has to show a working three-tier cloud deployment that markers can reach and test publicly.

== Functional Requirements

#table(
  columns: (0.5fr, 1.9fr, 1.2fr),
  inset: 5.5pt,
  stroke: 0.5pt + rgb("#cbd5e0"),
  table.header([*ID*], [*Requirement*], [*Stories*]),
  [FR-1], [Public catalogue with region filter, name search and place detail (photo, map)], [US-01 to US-03],
  [FR-2], [Public reviews; signed-in users create, edit and delete their own], [US-04, US-09, US-10],
  [FR-3], [Account registration, login and account deletion], [US-05, US-06],
  [FR-4], [Personal favourites and a dated itinerary], [US-07, US-08, US-11 to US-13],
  [FR-5], [Place images stored in cloud object storage], [US-03, US-14],
  [FR-6], [A documented REST API and health endpoint usable without the client], [US-17, US-18],
)

The full user stories US-01 to US-20 with their acceptance criteria and status are listed in #link(<app-user-stories>)[Appendix B].

== Non-Functional Requirements

#table(
  columns: (0.5fr, 1fr, 2fr),
  inset: 5.5pt,
  stroke: 0.5pt + rgb("#cbd5e0"),
  table.header([*ID*], [*Quality Attribute*], [*Requirement*]),
  [NFR-1], [Availability], [Reachable at a public URL from submission until marking ends], 
  [NFR-2], [Security], [HTTPS everywhere, hashed passwords, no secrets in Git, least-privilege cloud access], 
  [NFR-3], [Usability], [Never a blank or frozen screen], 
  [NFR-4], [Maintainability], [Every merge to `main` deployed automatically and repeatably], 
  [NFR-5], [Cost], [Stay within the student free tier or credits],
  [NFR-6], [Testability], [API testable independently of the UI], 
)

US-17 to US-20 in #link(<app-user-stories>)[Appendix B] cover evaluator access to the documented REST API, the health check, loading and error states, and HTTPS.

== Constraints

- *Assignment brief (Option B):* three tiers; client and API decoupled by REST; at least 10 REST services including at least 3 `POST`; a cloud database, not a database installed on the VM; assets in cloud object storage; public URLs for client and API; Git collaboration without history rewriting. OurTearoa exposes 25 endpoints, 8 of them `POST` (@sec-api-overview), uses RDS and S3, and keeps a linear history of merged PRs.
- *Team:* two part-time students over one semester. One AWS account, administered by Mathias Jørgensen.
- *Budget:* free tier or student credits only, which rules out load balancers, Multi-AZ databases and managed container platforms.
- *Infrastructure:* the 1 GB `t3.micro` cannot build the Angular client and must not carry image traffic. Both shaped the design: the client is built in CI (@sec-cicd) and images go straight to S3 (@sec-s3-flow).

== Assumptions

#table(
  columns: (1fr, 1fr),
  inset: 5.5pt,
  stroke: 0.5pt + rgb("#cbd5e0"),
  table.header([*Assumption*], [*Justification*]),
  [Traffic is low: the team, markers and a few test users],
  [Short outages outside marking sessions are acceptable], [No SLA; availability matters during the evaluation window], 
  [Users are mainly in New Zealand and Australia], [Product scope], 
  [Any signed-in user may edit places and add images], [Community-curated catalogue; no moderation in scope],
  [Stored personal data is minimal (name, email, password hash)], [No payments or location tracking], 
  [Place images may be public], 
)

== Cloud Opportunities

- *Managed database (RDS):* backups, patching and storage are AWS's job, not the team's.
- *Object storage with presigned uploads (S3):* durable image storage outside the VM; uploads bypass the API host completely @aws_s3_presigned.
- *Identity (IAM role):* the API gets short-lived S3 credentials from the instance role, with no access keys on disk @aws_imds.
- *Elastic CI capacity (GitHub Actions):* builds and tests run on hosted runners, so the production VM stays small @github_actions.
- *Pay as you go:* the system runs on the smallest sizes now and has a clear path to scale (@sec-scalability) when needed.

== From Business Needs to Technical Objectives

#table(
  columns: (1.3fr, 1.6fr),
  inset: 5.5pt,
  stroke: 0.5pt + rgb("#cbd5e0"),
  table.header([*Business need*], [*Technical objective*], ),
  [Anyone can explore places], [Public, read-only endpoints; auth only for writes], 
  [Travellers keep personal plans], [JWT auth; ownership enforced on every user-owned row], 
  [Trustworthy and easy to reach], [HTTPS on a named domain, HTTP redirected], 
  [Markers can assess without the UI], [Every feature reachable through REST], 
  [Rich places without overloading the VM], [Images in S3 via presigned direct upload], 
  [Always reflects the latest code], [CI/CD on every merge, tests before deploy], 
  [Stays affordable], [Free-tier-sized resources]
)

// ==========================================
// 3. PROJECT MANAGEMENT
// ==========================================

= Project Management

== Work Breakdown Structure 
The work was broken down into six work packages and tracked as GitHub issues . Each issue was implemented on a feature branch and merged through a reviewed pull request.

#figure(
  text(size: 9pt)[
    #table(
      columns: (auto, 1fr, 3fr),
      inset: 5.5pt,
      align: left,
      stroke: 0.5pt + rgb("#cbd5e0"),
      table.header([*WP*], [*Work package*], [*Tasks (GitHub issues)*]),
      [1], [Project setup], [Kick-off meeting and minutes; repository scaffolding and conventions; local hello-world slice],
      [2], [AWS infrastructure], [Provision RDS PostgreSQL; backend database round-trip; provision and configure EC2; public API URL ; HTTPS for the client; S3 bucket and IAM role; secrets, RDS security and IAM access ],
      [3], [CI/CD], [GitHub Actions deploy; production migration fixes; client tests in CI ; Prisma client regeneration and serialised deploys],
      [4], [Backend REST API], [JWT authentication; favourites, itinerary, reviews, users and places endpoints; S3 presigned image upload],
      [5], [Angular client], [Core models, design tokens, auth store and interceptor; app shell, login, register, auth guard; catalogue, detail panel, filter, map, reviews; favourites, itinerary, profile; image upload ],
      [6], [Testing, evidence and documentation], [API curl script and public smoke test; evidence pack; design document; screenshots; report ],
    )
  ],
  caption: [Work Breakdown Structure (WBS)],
)

== Schedule, Milestones & Sprint Progress

The schedule follows the issue history in GitHub (created and closed dates). The project ran from the kick-off on 6 August 2026 to the submission on 16 October 2026.

#figure(
  text(size: 9pt)[
    #table(
      columns: (auto, auto, 3fr),
      inset: 5.5pt,
      align: left,
      stroke: 0.5pt + rgb("#cbd5e0"),
      table.header([*Period*], [*Phase*], [*Milestones reached*]),
      [Start Aug 2026], [Kick-off and planning], [Start meeting and minutes; requirements and user stories; work packages 1 to 6 created as issues],
      [Aug to Sep 2026], [Cloud skeleton], [RDS round-trip and public API URL live; client served over HTTPS and CI/CD deploying on every merge],
      [Oct 2026], [Backend API], [JWT auth and all REST endpoints implemented; curl script for every endpoint; production migrations fixed],
      [Oct 2026], [Angular client and S3], [All client screens; client tests in CI; S3 bucket and IAM role; image upload working end to end ],
      [Oct 2026], [Evidence and design], [Public smoke test log and evidence pack; requirements and quality sections; final AWS values and screenshots ],
      [Oct 2026], [Report and video], [Report written; submission on 16 October 2026],
    )
  ],
  caption: [Project timeline and milestone delivery schedule],
)

Most of the feature work happened in the last two weeks, once the cloud skeleton was stable.

== Meeting Minutes & Collaboration Logs
#prompt("What to write", [
  - Document regular coordination syncs between Mathias and Tim (dates, decisions, task assignments).
])

// ==========================================
// 4. WORKLOG & COLLABORATION EVIDENCE
// ==========================================
= Worklog and Collaboration Evidence

== Project Management Evidence (Trello / Kanban)
#prompt("What to write & Screenshots", [
  - Provide URL to your online board.
  - Insert snapshots of task cards showing issue tracking, checklist completion, and timestamps.
])

#figure(
  image("media/screenshots/kanban.png", width: 100%),
  caption: [Kanban board of the GitHub project],
)

#figure(
  image("media/screenshots/issues-closed.png", width: 100%),
  caption: [Closed GitHub issues; the pull request icon marks issues closed by a linked pull request],
)

#figure(
  image("media/screenshots/issue-87.png", width: 85%),
  caption: [Example issue (\#87, S3 bucket) with task checklist, project status and linked pull requests],
)

== Git Repository Contributions
#prompt("What to write & Screenshots", [
  - Provide evidence of commits from both Mathias and Tim showing balanced contributions across frontend, backend, and cloud config.
  - Show GitHub Insights commit distribution and confirm no commit history rewriting was performed.
])

#figure(
  image("media/screenshots/contributions.png", width: 100%),
  caption: [GitHub contributor graph],
)

#pagebreak()

// ==========================================
// 5. HIGH-LEVEL AND DETAILED DESIGN
// ==========================================

= High-Level and Detailed Design

== Three-Tier Architecture

The requirements this architecture answers are in @sec-requirements; its security, availability, scalability and cost trade-offs are evaluated in @sec-quality.

*Client tier - Angular 22 SPA*

A standalone single-page application in `client/`, built on Angular standalone components with signals for state. It is a pure client-side app: there is no server-side rendering, so the compiled bundle in `client/dist/client/browser/` is the entire deployable artefact. The API base URL is baked in at compile time from `client/src/environments/` - there is no runtime configuration and no dev-server proxy, so changing the API host means recompiling and redeploying the client.

*Application tier - Express 5 + TypeScript on Node*

A REST API in `backend/`, written in TypeScript and run directly by `tsx` with no build step, so the deployed source and the running code are identical. Express 5 mounts every route under `/api` and delegates to controllers; `cors()` is enabled so the client can be served from a different origin during development. Prisma Client is the only data-access layer - no raw SQL outside the health check.

The application tier is stateless: all session state lives in the database, which is what allows the process to be reloaded or replaced without losing data.

*Data tier - managed PostgreSQL*

AWS RDS for PostgreSQL holds all application data. Because the database is a managed service rather than something installed on the VM, backups, patching and failover are handled by AWS, and the application tier holds no data of its own. The connection is TLS-verified against the AWS global CA bundle.

#figure(
  image("diagrams/aws.png", width: 80%),
  caption: [High-Level Three-Tier Cloud Architecture Diagram (EC2, Nginx, RDS, S3)]
)

== Request Lifecycle

A single place-detail page load, as an example:

+ The browser loads the SPA from Nginx over HTTPS.
+ The component queries its data, which has not been populated, and issues `GET /api/places/:id`.
+ Nginx terminates TLS and proxies `/api/*` to `127.0.0.1:3000`.
+ Express routes the request to the places controller.
+ The controller calls Prisma, which opens a TLS connection to RDS and runs the query.
+ The row is serialised to JSON and returned with `200`.
+ Any error is translated to a status code and JSON error body; a failed request surfaces a visible error state in the component rather than a blank screen.

#figure(
  image("diagrams/stepbystep.png", width: 80%),
  caption: [Request lifecycle of a place-detail page load]
)

== Interface Design <sec-interface>

The frontend is deliberately minimal: plain standalone components, a single global stylesheet with CSS variables and no UI component library. The focus of the project is the cloud architecture, so the client only needs to exercise every API feature with clear loading, empty and error states (US-19).

#table(
  columns: (auto, 1.1fr, 1.6fr, 1.1fr, 0.8fr),
  inset: 5.5pt,
  stroke: 0.5pt + rgb("#cbd5e0"),
  table.header([\#], [*Screen*], [*Purpose*], [*Route*], [*Access*]),
  [1], [Place list / catalogue], [Browse, search by name and filter by region], [`/places` (`/` redirects here)], [public],
  [2], [Place detail], [Photo, description, map, favourite toggle, "Plan a visit" form, photo upload and reviews], [`/places/:id` (child of `/places`)], [public; actions need login],
  [3], [Login], [Authenticate an existing user], [`/login?returnUrl=...`], [public],
  [4], [Register], [Create a new account], [`/register`], [public],
  [5], [Favourites], [The user's saved shortlist, with remove], [`/favorites`], [auth guard],
  [6], [Itinerary], [Dated trip plan sorted by start date, with edit and remove], [`/itinerary`], [auth guard],
  [7], [Profile], [Name, email, member since, account deletion], [`/profile`], [auth guard],
  [8], [Not found], [Fallback for unknown URLs], [`**`], [public],
)

*Master/detail.* `/places/:id` is a child route of `/places`, so the catalogue stays rendered and the detail panel opens beside it at half the window width. On screens of 768 px or less the panel covers the full screen. Closing the panel navigates back to `/places`. Because the panel is a route, a place link can be shared or bookmarked.

*Wireframes.* The screens were sketched as low-fidelity wireframes in the planning phase, each mapped to its user stories and the endpoints it calls.

#figure(
  grid(
    columns: 3,
    gutter: 8pt,
    image("media/wireframes/wireframe-1-place-list.png", width: 100%),
    image("media/wireframes/wireframe-2-place-detail.png", width: 100%),
    image("media/wireframes/wireframe-7-add-place.png", width: 100%),
  ),
  caption: [Wireframes from the planning phase: place list with map, place detail, add place],
)

#figure(
  grid(
    columns: 2,
    gutter: 8pt,
    image("media/wireframes/wireframe-5-favourites.png", width: 100%),
    image("media/wireframes/wireframe-6-itinerary.png", width: 100%),
  ),
  caption: [Wireframes from the planning phase: favourites and itinerary],
)

The implementation kept the screens, the navigation and the endpoint mapping, but changed three things. The map moved from the place list into the detail panel, and the detail opens as a side panel next to the list instead of a separate page. The add-place screen was not built. Image upload moved to the detail panel, and the planned presigned PUT through a separate `/uploads` endpoint became a presigned POST, so that S3 enforces the size limit (@sec-s3-flow).

=== Navigation and User Flows

The header is always visible. Visitors see *Places*, *Login* and *Register*; signed-in users see *Places*, *Favourites*, *Itinerary*, their name (links to *Profile*) and *Logout*.

*Primary flow:* browse, open a place, log in, save it as a favourite, plan a visit. The flow runs catalogue → detail panel → login with `returnUrl` → favourites / itinerary, and both the favourites list and the itinerary link back to the detail panel.

+ A visitor opens `/places`, searches by name or filters by region, and selects a card. The detail panel opens at `/places/:id`.
+ Reading is public. The favourite toggle, "Plan a visit", the review form and the photo upload are shown only to signed-in users. In place of "Plan a visit" and the review form, visitors see a "Log in" link that carries `returnUrl=/places/:id`.
+ After login the user returns to that place via `returnUrl`. Registration always continues to `/places`.
+ "Save" adds the place to favourites in place, without leaving the panel. The same toggle is on every catalogue card.
+ "Plan a visit" creates an itinerary entry with start date, end date and an optional note. `/itinerary` lists the entries by start date.

*Auth guard and session handling.*

- Login stores the JWT (valid 7 days) and the user in `localStorage`; an HTTP interceptor adds `Authorization: Bearer <token>` to requests to the API base URL only, so the token is never sent to S3 or other hosts.
- `/favorites`, `/itinerary` and `/profile` use `authGuard`. A visitor opening one of them is redirected to `/login?returnUrl=<requested URL>` and lands there after logging in.
- If the API answers `401` (expired or invalid token) on a protected call, the interceptor clears the session and redirects to `/login` with the current URL as `returnUrl`.
- Logout and account deletion clear the session and return to `/places`.

== Database Model & Relational Schema <sec-db>

The schema lives in `backend/prisma/schema.prisma` and is applied with Prisma migrations (`backend/prisma/migrations/`): `migrate dev` locally, `migrate deploy` in the deployment workflow. All primary keys are UUID strings generated by Prisma.

#figure(
  image("diagrams/erd.png", width: 80%),
  caption: [Entity-Relationship Diagram (ERD) of PostgreSQL Database Schema],
)

=== Design Notes

- *Indexes.* Every foreign key is indexed, and `Place.name` and `Place.region` are indexed for search and filter.
- *Cascades.* Deleting a user (`DELETE /users/me`) removes their reviews, favourites and itinerary entries; deleting a place removes everything that references it. No orphan rows are possible.
- *Ownership.* Every user-owned row carries `userId`, and the API filters by the token's user. Another user's row answers `404`, not `403`, so IDs cannot be probed.
- *Images outside the database.* Only the URL is stored; the bytes are in S3 (@sec-s3-flow). Replaced images are not yet deleted from the bucket.
- *Seed data.* `backend/prisma/seed.ts` loads the demo places, a demo user (with a hashed password) and sample reviews, favourites and an itinerary entry.

== Object Storage Architecture (AWS S3) <sec-s3-flow>

*Image uploads (S3).* Image bytes never pass through the 1 GB EC2 instance. The client uploads straight to S3 with a presigned POST, and the API only signs and records:

+ `POST /api/places/:id/image-upload-url` with `{contentType}` (JPEG, PNG or WebP). The API generates the object key itself, `public/places/<placeId>/<uuid>.<ext>`, so a client filename is never used, and returns `url`, `fields`, `key` and the final `imageUrl`.
+ The browser sends a multipart POST of `fields` plus the file to `url`, with no `Authorization` header. The signed policy only allows that exact key, that content type and 1 byte to 5 MB (`content-length-range`). It expires after 5 minutes.
+ `POST /api/places/:id/image` with `{ key }`. The API checks that the key belongs to that place and that the object exists (`HeadObject`), then saves `Place.imageUrl = S3_PUBLIC_BASE_URL + "/" + key`.
+ `GET /api/places` and `/api/places/:id` return `imageUrl`, and the browser loads the image directly from S3.

Configuration: `S3_BUCKET_NAME`, `S3_PUBLIC_BASE_URL` and `AWS_REGION`. If the bucket settings are missing, both endpoints return `503`. If S3 itself fails, they return `502`. Credentials come from the default AWS provider chain: the instance role on EC2, a profile or env credentials locally.

Trade-offs: a presigned POST was chosen over a presigned PUT because S3 enforces the size limit, not just the client. Public read on `public/*` keeps image URLs simple and cacheable but means every uploaded image is world-readable. Replaced images are not deleted from S3 yet. Like `PUT /places/:id`, any signed-in user may set a place image. `HeadObject` on a missing key returns `403` instead of `404` unless the role has `s3:ListBucket`, so the confirm step then answers `502` instead of `400`.

// ==========================================
// 6. DETAILS ON CLOUD IMPLEMENTATION
// ==========================================

= Cloud Implementation / Setup Evidence

== Compute Provisioning & System Hardening (AWS EC2)

#table(
  columns: (auto, 1fr, 3fr),
  inset: 5.5pt,
  stroke: 0.5pt + rgb("#cbd5e0"),
  table.header([*Service*], [*Purpose*], [*Notes*]),
  [EC2 `t3.micro`], [Hosts Nginx and the Node API], [1 GB RAM, so a swap file is configured to keep the Out-Of-Memory (OOM) killer away from the API process],
  [DuckDNS], [Public DNS for `ourtearoa.duckdns.org`], [Free; the record points to the Elastic IP `54.252.56.209`, which stays the same across stop and start, so no dynamic update client is needed. Route 53 was not used because it is a paid service],
)

The EC2 instance serves 443, and 80 only to redirect to HTTPS. SSH on 22 is used for administration and by the deploy workflow. Nginx terminates TLS with a Let's Encrypt certificate (Certbot) @letsencrypt, serves the SPA from `/var/www/ourtearoa`, and proxies `/api/*` to `127.0.0.1:3000`. PM2 runs the API with systemd persistence.

#figure(
  image("media/screenshots/2-01-ec2-running.png", width: 100%),
  caption: [EC2 instance in the AWS console, taken during the initial setup (before the Elastic IP and the IAM role were attached)],
)

#figure(
  image("media/screenshots/2-04-swap-memory.png", width: 80%),
  caption: [Swap file on the EC2 instance (`free -h`)],
)

#figure(
  image("media/screenshots/9-certificate_deployed.png", width: 90%),
  caption: [Let's Encrypt certificate issued and deployed to Nginx by Certbot],
)

#figure(
  image("media/screenshots/reboot-evidence.png", width: 85%),
  caption: [After an instance reboot: Nginx active, the API back online under PM2, and the public health check returning `200`],
)

== Managed Cloud Database Setup (AWS RDS PostgreSQL)

#table(
  columns: (auto, 1fr, 3fr),
  inset: 5.5pt,
  stroke: 0.5pt + rgb("#cbd5e0"),
  table.header([*Service*], [*Purpose*], [*Notes*]),
  [RDS PostgreSQL], [All application data], [`db.t4g.micro` in `ap-southeast-2a` (Sydney), PostgreSQL 16, TLS with `global-bundle.pem`; Single-AZ, storage encryption enabled, automated backups with 1-day retention; 20 GiB allocated storage],
)

RDS carries its own inbound rule for 5432 for the EC2 security group. For development, `docs/aws-rds-setup.md` also allows individual developer `/32` addresses, which needs the instance to be publicly accessible. Removing that access is tracked in issue \#15 (see @sec-security). Postgres credentials and the `DATABASE_URL` are supplied by the process environment, never committed.

The RDS connection uses `sslmode=verify-full` with `global-bundle.pem`, so the certificate is validated rather than merely encrypted.

#figure(
  image("media/screenshots/1-03-rds-running.png", width: 100%),
  caption: [RDS instance `ourtearoa-db` in the AWS console],
)

#figure(
  image("media/screenshots/3-rds-ec2-security.png", width: 100%),
  caption: [Security groups connecting the EC2 instance and RDS],
)

== Cloud Object Storage Provisioning (AWS S3)

#table(
  columns: (auto, 1fr, 3fr),
  inset: 5.5pt,
  stroke: 0.5pt + rgb("#cbd5e0"),
  table.header([*Service*], [*Purpose*], [*Notes*]),
  [S3 bucket], [Place images], [`ourtearoa-storage` in `ap-southeast-2`; public read only on `public/*`; CORS for the frontend origin; EC2 accesses it through the IAM role `ourtearoa-ec2-s3-role` (no static keys), set up in issue \#87; end-to-end upload working since issue \#106, and live `imageUrl` values point to this bucket],
)

The upload flow is described in @sec-s3-flow.


== CI/CD Pipeline & Automated Deployment <sec-cicd>

The workflow runs on pushes to `main` that change files under `backend/` or `client/` and triggers `.github/workflows/deploy.yaml`, which:

+ Compiles the Angular production bundle on the GitHub runner. This is done in CI deliberately - the `t3.micro` does not have the memory to build the client.
+ Rsyncs the compiled bundle to the Nginx web root at `/var/www/ourtearoa/`.
+ SSHes into the instance, `git pull`s the backend, installs production dependencies, regenerates the Prisma client (`backend/generated` is not committed), and runs `prisma migrate deploy`. Both use `npx --no`, so the locked Prisma version is used and is never silently downloaded.
+ Reloads the API through PM2 and restores the SELinux `httpd_sys_content_t` context on the web root so Nginx can read the new files.

A `concurrency` group makes deploys run one at a time, because two overlapping runs on the same instance delete each other's `node_modules` during `npm ci`.

Migrations run as `migrate deploy` - never `migrate dev` - so production schema changes are applied, not regenerated. Secrets (the SSH key, host, user) are held in GitHub Actions secrets and never appear in the repository.

Health verification after any deploy:

```bash
curl -i https://ourtearoa.duckdns.org/api/health
```

`200` with `{"status":"UP","database":"UP"}` confirms the API and its database connection are live. A `503` with `reason: "timeout"` means the RDS security group does not cover the instance; `reason: "unreachable"` means credentials or SSL settings are wrong.

#figure(
  image("media/screenshots/ci-cd evidence.png", width: 100%),
  caption: [GitHub Actions workflow run showing the automated deployment steps],
)

#figure(
  image("media/screenshots/actions-runs.png", width: 100%),
  caption: [GitHub Actions: CI/CD deployment runs, one per merge to `main`],
)

#figure(
  image("media/screenshots/actions-client-tests.png", width: 100%),
  caption: [Deploy run: client unit tests (136 tests in 23 files passed) and production build before deployment],
)

#figure(
  image("media/screenshots/actions-deploy-frontend.png", width: 100%),
  caption: [Deploy run: compiled client copied to the Nginx web root with rsync],
)

#figure(
  image("media/screenshots/actions-deploy-backend.png", width: 100%),
  caption: [Deploy run: Prisma client generated, `prisma migrate deploy` ("No pending migrations to apply") and the API restarted under PM2],
)

#pagebreak()

// ==========================================
// 7. CLOUD ENGINEERING QUALITY
// ==========================================

= Cloud Engineering Quality <sec-quality>

This section evaluates the deployed system against the quality attributes in @sec-requirements and states the trade-offs made. Console values were confirmed by Mathias Jørgensen in issue \#109; the few left in square brackets are still open.

== Security <sec-security>

#text(size: 9pt)[
  #table(
    columns: (0.9fr, 1.6fr, 1.5fr),
    inset: 5.5pt,
    stroke: 0.5pt + rgb("#cbd5e0"),
    table.header([*Layer*], [*Current controls*], [*Known gaps and next steps*]),
    [Network], [EC2 security group opens 443, 80 (redirect only) and 22; RDS allows 5432 from the EC2 security group], [Developer `/32` rules require RDS "Publicly accessible = Yes"; remove them and use an SSH tunnel or bastion (issue \#15). SSH could be limited to known addresses or replaced by SSM Session Manager],
    [Data in transit], [HTTPS with Let's Encrypt, HTTP redirected with `301`; RDS over TLS with `sslmode=verify-full`; S3 over HTTPS], [Add HSTS in Nginx],
    [Data at rest], [Passwords stored as bcrypt hashes (cost 10); images in S3], [RDS storage encryption is enabled; S3 encrypts new objects by default (SSE-S3)],
    [Identity and access], [EC2 uses the IAM role `ourtearoa-ec2-s3-role` for S3, so no access keys exist on the server; presigned POST limits key, type, size and lifetime], [Scope the role to the bucket and the needed actions only; give each team member their own IAM user with MFA (issue \#17)],
    [Application], [JWT (7 days) for every write; ownership checked on every user-owned row (`404` for others); input validated in controllers; Prisma parameterises all queries], [CORS is open to any origin; no rate limiting on login or upload; no security headers (helmet); the token is in `localStorage`, which is exposed to XSS. Any signed-in user may edit places (US-15 partial)],
    [Secrets], [`.env` and keys are gitignored; deploy credentials are GitHub Actions secrets; only `.env.example` and the public RDS CA bundle are committed], [Repository and history audit open (issue \#10); AWS Secrets Manager or SSM Parameter Store would replace the `.env` on the instance],
    [Operating system], [Amazon Linux 2023 with SELinux enforcing; Nginx is the only public process, the API listens on `127.0.0.1:3000`], [Regular `dnf upgrade` is manual],
  )
]

The controls above cover the risks of a small public catalogue with minimal personal data. Rate limiting, a WAF and a private-subnet database were left out to stay within time and the free tier, and are listed in @sec-tradeoffs.

== Availability and Reliability <sec-availability>

*Current design.* A single EC2 instance in one Availability Zone serves the client and the API. Reliability comes from restarting rather than redundancy:

- PM2 restarts the API if it crashes, and its systemd unit starts PM2 again after a reboot. Nginx is a systemd service as well.
- The swap file protects the API from the OOM killer on 1 GB RAM.
- RDS is a managed service; AWS replaces failed hardware and applies patches in the maintenance window. The instance is a Single-AZ `db.t4g.micro` in `ap-southeast-2a` (Multi-AZ is off).
- `GET /api/health` checks the database with a timeout (`HEALTH_DB_TIMEOUT_MS`, default 3000 ms) and returns `503` with a `reason`, so a failure can be told apart from a network or credential problem (@sec-cicd).
- Deploys are serialised and tests run first. PM2 restarts the process, so a deploy causes a downtime of a few seconds.

*Expected availability (estimate).* The instance, its AZ and the database are each single points of failure. AWS offers 99.5% for a single EC2 instance and 99.5% for a Single-AZ RDS instance; together that is roughly 99% per month, or up to about 7 hours of possible downtime. That is acceptable under the assumption in @sec-requirements that short outages outside marking sessions do not matter.

*Path to high availability.*

+ CloudWatch alarm or an external uptime check on `/api/health`, and EC2 auto-recovery on a failed status check. Low cost, first step.
+ An Application Load Balancer and an Auto Scaling Group across two AZs, with an AMI or launch template replacing the manual setup. This requires moving TLS from Certbot to ACM on the load balancer and the domain to Route 53.
+ RDS Multi-AZ for automatic database failover (typically one to two minutes).

== Backup and Disaster Recovery <sec-backup>

#text(size: 9pt)[
  #table(
    columns: (auto, 1fr, 1.5fr, 1.3fr),
    inset: 5.5pt,
    stroke: 0.5pt + rgb("#cbd5e0"),
    table.header([*Component*], [*Where the state lives*], [*Backup*], [*Recovery*]),
    [Application data], [RDS], [Automated daily snapshots and point-in-time restore, retention 1 day; manual snapshot before risky migrations], [Restore to a new instance and update `DATABASE_URL`],
    [Schema], [Git (`backend/prisma/migrations/`)], [Every migration is versioned], [`prisma migrate deploy`],
    [Images], [S3], [99.99% designed durability @aws_s3, stored across several AZs], [Versioning is disabled; enabling it would protect against accidental deletes and overwrites],
    [Code and client], [GitHub], [Every merged PR], [The deploy workflow rebuilds and redeploys],
    [EC2 instance], [None (stateless)], [Setup documented in `docs/cloud-ec2-setup.md`], [Launch a new instance, follow the guide, move the Elastic IP to it, so DNS and the deploy host secret stay unchanged],
  )
]

*Targets:* 
- RPO: about 5 minutes for the database, the interval of RDS transaction log backups; zero for code. 
- RTO: about 1 hour to rebuild the EC2 instance by hand and 30 to 60 minutes for an RDS point-in-time restore. Everything runs in `ap-southeast-2`, so a region-wide outage is not covered; cross-region snapshot copies and S3 replication would be the next step if that mattered. A restore has not been rehearsed yet.

With a retention of 1 day, point-in-time restore only reaches back 24 hours: a bad migration or deletion noticed later cannot be undone. Raising the retention to 7 days is the cheapest improvement here, since backup storage up to the database size is free.

Risk: `backend/prisma/seed.ts` deletes all rows before seeding and must never be run against RDS.

== Scalability and Elasticity <sec-scalability>

*What scales well already.*

- The API is stateless: sessions are JWTs, not server memory, so more instances can be added behind a load balancer without sticky sessions.
- Image bytes go straight between the browser and S3, which scales on its own; the API only signs and records.
- The client is static files, ready to move to S3 and CloudFront @aws_cloudfront.
- GitHub Actions provides build capacity on demand, so the production instance does not need to be sized for builds.

*Current limits.* One `t3.micro` (2 vCPU burstable, 1 GB RAM) with no automatic scaling. Burstable CPU credits can run out under sustained load. Scaling today means manual vertical scaling: stop the instance and change the instance type, with downtime. RDS can be resized the same way.

*Scale-out path.*

#table(
  columns: (1fr, 1.6fr),
  inset: 5.5pt,
  stroke: 0.5pt + rgb("#cbd5e0"),
  table.header([*Load grows in*], [*Response*]),
  [Static client and images], [CloudFront in front of S3 and the SPA; caches at the edge and removes static traffic from the EC2 instance],
  [API requests], [ALB and Auto Scaling Group with a target-tracking policy on CPU or request count],
  [Database connections], [Limit the Prisma pool per instance, or add RDS Proxy],
  [Database reads], [Larger instance class, then a read replica for the public catalogue],
)

*Trade-off.* Elasticity was not built because the expected load (assumptions in @sec-requirements) does not need it and an ALB alone would cost more than the rest of the system together (@sec-cost). The stateless design keeps the option open.

== Performance <sec-performance>

- *Region.* Everything runs in `ap-southeast-2` (Sydney), close to the expected users in New Zealand and Australia, and the API and database are in the same region.
- *Queries.* Region filter and name search are done in the database (`mode: insensitive`), not in the client. Foreign keys used for lookups are indexed (`placeId` on reviews and favourites), and itineraries use the composite index (`userId`, `startDate`) that matches their sort order (@sec-db).
- *Images.* Loaded directly from S3, not through Nginx or Node; the 5 MB limit keeps uploads bounded.
- *Client.* Production build from CI, served as static files by Nginx; the client loads data on demand per page.
- *Observability.* The health endpoint reports `latencyMs` for the database check.

Not yet done: no CDN or HTTP caching headers, no pagination on `GET /places` (fine for the current catalogue size), no load test. Name search with `contains` cannot use a normal index; a trigram index would be needed for a large catalogue.

== Cost Optimisation <sec-cost>

*Monthly estimate* (on-demand prices for `ap-southeast-2`, 730 hours, taken from public AWS price lists in October 2026; estimates, not billing data):

#text(size: 9pt)[
  #table(
    columns: (1fr, 1fr, 1.6fr),
    inset: 5.5pt,
    stroke: 0.5pt + rgb("#cbd5e0"),
    table.header([*Item*], [*Estimate (USD/month)*], [*Note*]),
    [EC2 `t3.micro`], [about 9.93], [`$0.0136` per hour],
    [EBS root volume], [about 2], [20 GB gp3 at about `$0.10` per GB-month],
    [RDS PostgreSQL], [about 11.68], [`db.t4g.micro` Single-AZ at `$0.016` per hour],
    [RDS storage], [about 2.80], [20 GiB at roughly `$0.14` per GB-month (estimate); backup storage up to the database size is free],
    [Elastic IP], [about 3.65], [`$0.005` per hour; AWS charges every public IPv4 address, including an attached Elastic IP],
    [S3], [under 0.10], [A few MB of images and low request volume],
    [Data transfer], [close to 0], [Low traffic],
    [DuckDNS, Let's Encrypt], [0], [Free services],
    [GitHub Actions], [0], [Free for public repositories],
    [*Total*], [*about 30*], [*Before free tier or credits*],
  )
]

The account is on the AWS free tier. th

*Decisions taken for cost.*

- Smallest instance sizes; the client build moved to CI so the instance can stay at 1 GB.
- No ALB, NAT gateway, Multi-AZ database or CloudFront; each would add a fixed monthly cost larger than the current need.
- Images in S3 rather than larger EBS volumes or database rows.
- Free DNS and certificates.

*Recommended.* An AWS Budgets alert at a small threshold (for example \$10), deleting replaced images or adding an S3 lifecycle rule, and stopping or deleting all resources after marking ends.

== Trade-off Summary and Future Improvements <sec-tradeoffs>

#text(size: 9pt)[
  #table(
    columns: (1.5fr, 1.2fr, 1.6fr),
    inset: 5.5pt,
    stroke: 0.5pt + rgb("#cbd5e0"),
    table.header([*Decision*], [*Benefit*], [*Cost or risk accepted*]),
    [Single EC2 instance, no load balancer], [Cheapest, simple to operate], [Single point of failure, no automatic scaling (@sec-availability, @sec-scalability)],
    [Managed RDS instead of Postgres on the VM], [Backups, patching, required by the brief], [Higher cost than self-hosting],
    [Public RDS endpoint for development], [Developers can run migrations and inspect data directly], [Larger attack surface until issue \#15 is done],
    [Client built in CI], [Production VM stays small], [Deploy depends on GitHub Actions],
    [Presigned POST direct to S3], [No image traffic on the VM, size enforced by S3], [Images are public; replaced files stay in the bucket],
    [JWT in `localStorage`], [Simple, stateless, works across tabs], [Exposed to XSS; no server-side logout],
    [Let's Encrypt and DuckDNS], [Free HTTPS on a named domain], [Depends on free external services],
    [PM2 restart on deploy], [Simple and reliable], [A few seconds of downtime per deploy],
  )
]

*Future improvements, in priority order.*

+ Close issues \#15 and \#17: private RDS access, least-privilege IAM users with MFA.
+ Monitoring: CloudWatch alarms on the health endpoint, CPU and RDS storage, plus an AWS Budgets alert.
+ Application hardening: restricted CORS origin, helmet, rate limiting on login and upload, HSTS.
+ Run the tests on every pull request, not only before deploy.
+ RDS backup retention from 1 to 7 days, S3 versioning, deleting replaced images, and a rehearsed RDS restore.
+ CloudFront for the client and images.
+ ALB with an Auto Scaling Group across two AZs and RDS Multi-AZ, when traffic or availability needs justify the cost.

#pagebreak()

// ==========================================
// 8. USER MANUAL
// ==========================================

= User Manual

== Accessing the Application

Open `https://ourtearoa.duckdns.org` in a current desktop or mobile browser (for example Chrome, Firefox, Safari or Edge). No installation is needed. The site is served over HTTPS only; a request to `http://` is redirected to `https://`. The address bar shows a valid Let's Encrypt certificate .

Browsing places and reading reviews works without an account. Saving favourites, planning visits, writing reviews and uploading photos require a free account (Step 2). On screens of 768 px or less the place detail covers the full screen.

If a page cannot load its data, it shows an error message with a *Retry* button instead of a blank screen. Whether the backend is up can be checked directly at `https://ourtearoa.duckdns.org/api/health`, which returns `{"status":"UP","database":"UP"}`.

== End-User Workflow Walkthrough

*Step 1: Browse and filter places.* The start page `/places` lists every place as a card. Type in _Search_ to filter by name, or choose a _Region_ (default _All regions_). _Clear filters_ resets both. Select a card to open the detail panel next to the list. It shows the photo, region, type, description, a map (OpenStreetMap) when coordinates are known, and the reviews. _Close_ returns to the list. The panel has its own URL (`/places/:id`), so a place can be bookmarked or shared.

#figure(
  image("media/UI/ui-1-places-filter.png", width: 85%),
  caption: [Place catalogue filtered by region (West Coast)],
)

#figure(
  image("media/UI/ui-2-place-detail.png", width: 85%),
  caption: [Place detail panel opened next to the catalogue],
)

#figure(
  grid(
    columns: 2,
    gutter: 8pt,
    image("media/UI/ui-3-place-detail-map-plan.png", width: 100%),
    image("media/UI/ui-4-place-detail-reviews.png", width: 100%),
  ),
  caption: [Detail panel continued: map and "Plan a visit" form (left), reviews and review form (right)],
)

*Step 2: Create an account and log in.* Select _Register_ in the header, enter name, email and a password of at least 8 characters, and select _Create account_. You are signed in straight away. Returning users select _Login_. If you choose _Log in_ from a place's detail panel, you return to that place afterwards. A session lasts 7 days; after that, the next action asks you to log in again. _Logout_ in the header ends the session.

*Step 3: Save favourites.* On any card or detail panel, select _♡ Save_. The button changes to _♥ Saved_; selecting it again removes the favourite. _Favourites_ in the header lists all saved places, each with _Remove_ and a link back to its detail panel.

#figure(
  image("media/UI/ui-6-favourites.png", width: 85%),
  caption: [Favourites page],
)

*Step 4: Plan a visit.* In the _Plan a visit_ section of the detail panel, choose a start date and an end date (the end date must not be before the start date), add an optional note, and select _Add to itinerary_. _Itinerary_ in the header lists all entries ordered by start date. Each entry can be changed with _Edit_ (_Save changes_) or deleted with _Remove_.

#figure(
  image("media/UI/ui-5-itinerary.png", width: 85%),
  caption: [Itinerary ordered by start date],
)

*Step 5: Rate and review a place.* In the _Reviews_ section of the detail panel, select 1 to 5 stars, write an optional comment and select _Post review_. Your own reviews show _Edit_ and _Delete_; other users' reviews cannot be changed.

*Step 6: Add a photo.* Signed-in users can select _Upload a photo_ in the detail panel and choose a JPEG, PNG or WebP file of up to 5 MB. The image is uploaded directly to cloud storage (S3) and replaces the current photo.

*Step 7: Manage the account.* Select your name in the header to open _Profile_, which shows name, email and _Member since_. _Delete account_ asks for confirmation and then permanently removes the account together with its reviews, favourites and itinerary entries.

#figure(
  image("media/UI/ui-7-profile.png", width: 85%),
  caption: [Profile page with account deletion],
)


// ==========================================
// 9. RESTFUL API LIST
// ==========================================

= RESTful API List

== API Overview & Evaluation Details <sec-api-overview>

All endpoints are under `/api` and speak JSON. Responses are `200`/`201` on success and a JSON `{ "error": "..." }` body on failure. Base URL: `https://ourtearoa.duckdns.org/api` (local: `http://localhost:3000/api`). "Auth" means an `Authorization: Bearer <JWT>` header from `POST /auth/login` or `POST /auth/register`. Another user's resource returns `404`, not `403`. `GET /api/health` returns `{"status":"UP","database":"UP"}`. `scripts/api-smoke-test.sh [BASE_URL]` exercises them without the client. There are 25 endpoints, 8 of them `POST`.

== Endpoints Specification Table

#text(size: 9pt)[
  #table(
    columns: (1fr, 1.2fr, 0.7fr, 0.8fr, 3.5fr),
    inset: 5.5pt,
    stroke: 0.5pt + rgb("#cbd5e0"),
    table.header([*Method*], [*Path*], [*Auth*], [*Status*], [*Notes*]),
    [*GET*], [`/health`], [No], [200], [API and database status],
    [*POST*], [`/auth/register`], [No], [201], [`email`, `name`, `password` (min 8); 409 if email exists],
    [*POST*], [`/auth/login`], [No], [200], [returns `token` and `user`; 401 on bad credentials],
    [*GET*], [`/users/me`], [Bearer], [200], [own profile including email],
    [*GET*], [`/users/:id`], [Bearer], [200], [`id`, `name`, `createdAt` only],
    [*DELETE*], [`/users/me`], [Bearer], [204], [deletes own account and, via cascade, its reviews, favorites and itinerary],
    [*GET*], [`/favorites`], [Bearer], [200], [own favorites with place],
    [*POST*], [`/favorites`], [Bearer], [201], [`placeId`; 409 if already a favorite],
    [*DELETE*], [`/favorites/:id`], [Bearer], [204], [own favorites only],
    [*GET*], [`/itinerary`], [Bearer], [200], [own entries ordered by start date],
    [*POST*], [`/itinerary`], [Bearer], [201], [`placeId`, `startDate`, `endDate`, `note?`; 400 if end before start],
    [*PUT*], [`/itinerary/:id`], [Bearer], [200], [partial update],
    [*DELETE*], [`/itinerary/:id`], [Bearer], [204], [own entries only],
    [*GET*], [`/places/:id/reviews`], [No], [200], [reviews with author name],
    [*GET*], [`/reviews/:id`], [No], [200], [],
    [*POST*], [`/reviews`], [Bearer], [201], [`placeId`, `rating` (1-5), `comment?`],
    [*PUT*], [`/reviews/:id`], [Bearer], [200], [own reviews only],
    [*DELETE*], [`/reviews/:id`], [Bearer], [204], [own reviews only],
    [*GET*], [`/places`], [No], [200], [optional `region` (exact, case-insensitive) and `q` (name contains, case-insensitive); sorted by name],
    [*GET*], [`/places/:id`], [No], [200], [404 if unknown],
    [*POST*], [`/places`], [Bearer], [201], [`name` (max 200), `region` (max 100), `description?`, `latitude?` (-90..90), `longitude?` (-180..180), `type?`],
    [*PUT*], [`/places/:id`], [Bearer], [200], [partial update with the same validation],
    [*DELETE*], [`/places/:id`], [Bearer], [204], [cascades to its reviews, favourites and itinerary entries],
    [*POST*], [`/places/:id/image-upload-url`], [Bearer], [201], [`contentType` (jpeg/png/webp); presigned S3 POST, `key`, `imageUrl`; 503 if S3 is not configured],
    [*POST*], [`/places/:id/image`], [Bearer], [200], [`key` from the upload step; checks the object exists and saves `imageUrl`],
  )
]

== Postman & Smoke Test Verification Evidence
#prompt("What to write & Screenshots", [
  - Show terminal output executing `scripts/api-smoke-test.sh https://ourtearoa.duckdns.org/api`.
  - Include Postman screenshots showing request headers, live cloud URL, payload, and JSON responses for key POST and GET endpoints.
])

#figure(
  image("media/screenshots/2-06-api-connection.png", width: 100%),
  caption: [`GET /api/health` on the public URL returning `"status":"UP"` and `"database":"UP"`],
)

#img-placeholder("Figure 8.2: Postman Test - POST /auth/register and POST /auth/login issuing JWT")

#img-placeholder("Figure 8.3: Postman Test - POST /itinerary with JSON payload (201 Created)")

#img-placeholder("Figure 8.4: Automated Smoke Test Script Output (api-smoke-test.sh)")

#pagebreak()

// ==========================================
// 10. SUMMARY & REFLECTION
// ==========================================

= Summary

OurTearoa is a working three-tier cloud application: an Angular client, an Express REST API on EC2, and managed PostgreSQL on RDS, with images in S3. It is publicly reachable over HTTPS and redeployed automatically on every merge to `main`.

== Evaluation Against Brief

#table(
  columns: (1.3fr, 2fr),
  inset: 5.5pt,
  stroke: 0.5pt + rgb("#cbd5e0"),
  table.header([*Option B requirement*], [*How OurTearoa meets it*]),
  [Three tiers], [Angular SPA (client), Express 5 API (application), RDS PostgreSQL (data) (@sec-quality)],
  [Client and API decoupled by REST], [The client only talks to `/api` over JSON; the API is usable without the client (@sec-api-overview)],
  [At least 10 REST services, at least 3 `POST`], [25 endpoints, 8 of them `POST`],
  [Cloud database, not installed on the VM], [AWS RDS for PostgreSQL 16 over verified TLS (@sec-db)],
  [Assets in cloud object storage], [Place images in S3 via presigned direct upload (@sec-s3-flow)],
  [Public URLs for client and API], [`https://ourtearoa.duckdns.org` and `https://ourtearoa.duckdns.org/api`],
  [Git collaboration without history rewriting], [Feature branches, reviewed pull requests linked to issues, no force-push],
)

All functional requirements are met except the contributor stories US-14 and US-15, which exist in the API but have no screen and no ownership model (#link(<app-user-stories>)[Appendix B]). Beyond the brief, the deployment is automated with tests before every deploy, and the system is evaluated for security, availability, backup, scalability, performance and cost in @sec-quality.

== Critical Engineering Reflections & Lessons Learned

/ Working within 1 GB of memory:
The `t3.micro` was chosen for cost, and that choice shaped more of the design than expected. Building the Angular client needs more memory than the instance has, so the production build was moved to GitHub Actions and only the compiled files are copied to the server. A swap file protects the running API from the OOM killer. The same reasoning led to uploading images directly from the browser to S3 instead of through the API. The lesson: on a small instance, keep build work and bulk data off the server and give it only the job of serving requests.

/ Deployment needs to be repeatable, not just automated:
Several problems appeared only in the pipeline: wrong secret interpolation in the deploy step, the backend deployed from the wrong directory, two overlapping runs deleting each other's `node_modules`, and SELinux blocking Nginx from reading newly copied files. Each fix (a `concurrency` group, restoring the SELinux context, pinned Prisma via `npx --no`, `migrate deploy` only) made the deploy more predictable. Running the client tests before every deploy turned the pipeline from a copy step into a quality gate.

/ Security is layered, and some layers are still open.:
TLS is used on every hop: Let's Encrypt at Nginx, `sslmode=verify-full` with the AWS CA bundle to RDS, and HTTPS to S3. The EC2 instance uses an IAM role, so no AWS keys exist on the server, and the API checks ownership on every user-owned row. A distinct `503` reason in the health check (`timeout` versus `unreachable`) made it quick to tell a security group problem from a credential problem. What we would do differently: make RDS private from the start and give each team member their own IAM user, instead of opening developer IP addresses and sharing one administrator.

/ Teamwork:
Splitting work into GitHub issues and small pull requests with review kept both members informed and the history readable. The bottleneck was AWS console access, held by one member; documenting the setup in `docs/` reduced but did not remove that dependency.

/ Production enhancements: 
For real traffic, the next steps are those in @sec-tradeoffs: monitoring and a budget alert first, then serving the client and images through CloudFront, and finally an Application Load Balancer with an Auto Scaling Group across two Availability Zones and RDS Multi-AZ. Because the API is stateless and all data lives in RDS and S3, these steps need little or no change to the application code. A cache such as ElastiCache (Redis) for the public place catalogue could be added if database reads become the bottleneck.
