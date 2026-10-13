= Appendix A: AI Usage Declaration form

#table(
  columns: (1fr),
  inset: 7pt,
  stroke: 0.5pt + rgb("#cbd5e0"),
  table.cell(fill: rgb("#edf2f7"))[*Please list the tasks in your assignment where AI was used.*],
  [
    - Coding assistance for the Angular client and the Express API (for example feature components, form validation, controllers and unit tests).
    - Troubleshooting the deployment: GitHub Actions workflow, Nginx, PM2 and the S3 upload flow.
    - Drafting and restructuring technical documentation (`DESIGN.md`, setup guides) and parts of this report.
    - Wording of GitHub issues and pull request descriptions, and reviewing our own changes before merging.
  ],
  table.cell(fill: rgb("#edf2f7"))[*For each task, explain why the AI tool was used (e.g., idea generation, summarization, coding, etc.).*],
  [
    - *Coding:* to speed up routine implementation so that more time was left for the cloud architecture, which is the focus of the course.
    - *Debugging:* to interpret error messages and logs from the pipeline and the server faster.
    - *Writing and summarization:* to turn our design decisions, notes and evidence into structured text, and to check the report for consistency.
    - *Review:* as a second reviewer that points out bugs, missing edge cases and inconsistencies.
  ],
  table.cell(fill: rgb("#edf2f7"))[*Please state the AI tools used.*],
  [
    - Abacus.AI Agent (AI coding assistant in the IDE)
    - GitHub Copilot coding agent (two pull requests fixing the deploy workflow, September 2026)
  ],
  table.cell(fill: rgb("#edf2f7"))[*List the main prompts (less than 5) or queries entered into the AI tool*],
  [
    + "Implement this GitHub issue in the Angular client against the existing REST endpoints, including loading, empty and error states and unit tests."
    + "The deploy workflow fails at this step; here is the log. Find the cause and propose a fix."
    + "Review my changes for bugs and security issues before I open the pull request."
    + "Write out an outline of the content of `DESIGN.md` into the report and check it against the current code and AWS setup."
  ],
  table.cell(fill: rgb("#edf2f7"))[*Provide a summary or description of the AI-generated output. (Optional: attach output in an appendix.)*],
  [
    Code changes on feature branches (components, controllers, tests and workflow fixes), explanations of errors with proposed fixes, review findings, and draft text for documentation, issues and pull requests. The resulting code and text can be traced in the Git history and the pull requests of the repository.
  ],
  table.cell(fill: rgb("#edf2f7"))[*Please describe how the AI output was used, edited, or transformed.*],
  [
    The architecture, the choice of AWS services, the AWS configuration and all trade-offs were decided by the team; the AWS resources were set up by hand in the console. AI output was treated as a draft: code changes went through pull requests that a team member reviewed before merging, and was checked by the client test suite, the smoke test and the live health check. Documentation and report text were checked against the actual code, the AWS console and the evidence in `docs/evidence/`, and corrected, shortened or rewritten where it was wrong, too general or not our wording. Suggestions that did not fit the project were rejected. We take full responsibility for the submitted work.
  ],
)

#v(1em)

#table(
  columns: (1.2fr, 1.2fr, 0.8fr),
  inset: 7pt,
  stroke: 0.5pt + rgb("#cbd5e0"),
  [*Student name(s):*], [*Signature(s):*], [*Date:*],
  [Mathias Jørgensen (26344066)], [], [16 October 2026],
  [Tim Schiller (26347002)], [], [16 October 2026],
)

= Appendix B: User Stories and Acceptance Criteria <app-user-stories>

These are the core requirements of the system; every other design decision in this report traces back to one of the stories below.

== Visitor

#text(size: 9pt)[
  #table(
    columns: (auto, 1.6fr, 1.5fr),
    inset: 5.5pt,
    stroke: 0.5pt + rgb("#cbd5e0"),
    table.header([*ID*], [*User story*], [*Acceptance criteria*]),
    [US-01], [As a visitor, I want to browse a list of New Zealand places so that I can discover destinations without an account.], [`GET /places` is public; `/places` lists every place as a card without login. Done.],
    [US-02], [As a visitor, I want to filter and search places by region so that I can narrow down to the part of the country I care about.], [Region dropdown and name search on `/places`, backed by `?region=` (exact, case-insensitive) and `?q=` (name contains). Done.],
    [US-03], [As a visitor, I want to open a place detail page showing name, region, description, photo and map coordinates so that I can decide whether to visit.], [`/places/:id` shows name, region, type, description, the S3 photo when `imageUrl` is set and a Leaflet map when both coordinates are set. Done.],
    [US-04], [As a visitor, I want to read reviews and ratings left by other travellers so that I can judge a place from other people's experiences.], [`GET /places/:id/reviews` is public; the detail panel lists rating, comment and author name. Done.],
  )
]

== Registered User (Traveller)

#text(size: 9pt)[
  #table(
    columns: (auto, 1.6fr, 1.5fr),
    inset: 5.5pt,
    stroke: 0.5pt + rgb("#cbd5e0"),
    table.header([*ID*], [*User story*], [*Acceptance criteria*]),
    [US-05], [As a visitor, I want to register an account so that I can save favourites and plan an itinerary.], [`POST /auth/register` with email, name (max 100) and password (min 8); `409` on a duplicate email; the user is signed in afterwards. Done.],
    [US-06], [As a returning user, I want to log in so that I can access my saved data on any device.], [`POST /auth/login` returns a JWT valid for 7 days; wrong credentials give `401`; data is server-side, so it is the same on any device. Done.],
    [US-07], [As a registered user, I want to favourite a place so that I can build a shortlist.], [Heart toggle on the detail panel and on every card; `POST /favorites`, `409` on a duplicate. Done.],
    [US-08], [As a registered user, I want to view and remove my favourites so that my shortlist stays current.], [`/favorites` lists saved places with remove (`DELETE /favorites/:id`). Done.],
    [US-09], [As a registered user, I want to write a review and star rating for a place I have visited so that I can share my experience.], [Review form with a 1-5 rating and optional comment (`POST /reviews`, `400` outside 1-5). Done.],
    [US-10], [As a registered user, I want to edit or delete my own review so that I can correct it later.], [Edit and delete are offered only on the user's own reviews; the API answers `404` for anyone else's. Done.],
    [US-11], [As a registered user, I want to add places to an itinerary with start and end dates so that I can organise a trip.], ["Plan a visit" on the detail panel with start date, end date and note; `400` if the end is before the start. Done.],
    [US-12], [As a registered user, I want to view my itinerary ordered by date so that I can plan the sequence of my trip.], [`/itinerary` lists entries ordered by start date (`GET /itinerary`, indexed on user and start date). Done.],
    [US-13], [As a registered user, I want to edit or remove itinerary entries so that my plan can change as my trip does.], [Edit and remove on `/itinerary` (`PUT`/`DELETE /itinerary/:id`, own entries only). Done.],
  )
]

== Contributor 

#text(size: 9pt)[
  #table(
    columns: (auto, 1.6fr, 1.5fr),
    inset: 5.5pt,
    stroke: 0.5pt + rgb("#cbd5e0"),
    table.header([*ID*], [*User story*], [*Acceptance criteria*]),
    [US-14], [As a contributor, I want to add a new place with its details and image so that the catalogue grows beyond the seed data.], [API only: `POST /places` and the S3 image upload exist; no "add place" screen. Partial.],
    [US-15], [As a contributor, I want to edit or remove a place I have added so that catalogue data stays accurate.], [API only: `PUT`/`DELETE /places/:id` exist, but places have no owner field, so any signed-in user can change any place. Partial.],
  )
]


== Evaluator / Operations

#text(size: 9pt)[
  #table(
    columns: (auto, 1.6fr, 1.5fr),
    inset: 5.5pt,
    stroke: 0.5pt + rgb("#cbd5e0"),
    table.header([*ID*], [*User story*], [*Acceptance criteria*]),
    [US-17], [As an evaluator, I want a documented set of RESTful endpoints that I can call directly, so that the API can be tested independently of the UI.], [All endpoints listed in the API section of this report; `scripts/api-smoke-test.sh` calls them without the UI (45 checks). Done.],
    [US-18], [As an evaluator, I want a health endpoint that reports both the API and the database connection, so that I can confirm the whole stack is live.], [`GET /api/health` runs `SELECT 1` on RDS and returns `200` with `{"status":"UP","database":"UP"}` and `latencyMs`, or `503` with a `reason`. Done.],
    [US-19], [As a user on a slow or unreliable connection, I want clear loading and error states so that the interface never appears frozen.], [Every data screen has loading, empty and error states, with a retry button on errors. Done.],
    [US-20], [As a user, I want the app served over HTTPS on a memorable domain so that it is trustworthy and easy to reach.], [`https://ourtearoa.duckdns.org` with a Let's Encrypt certificate; HTTP answers `301` to HTTPS. Done.],
  )
]
