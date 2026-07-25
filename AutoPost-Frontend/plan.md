# Weekly Learning Updates — Project Plan

**Event:** AccioBuild 2026 (AccioJob)
**Format:** Solo build, Spring Boot + React web application
**Purpose of this doc:** Full context + build instructions for an AI coding agent (Claude Code, Copilot Agent, Cursor, etc.) implementing this project. Read this entire file before writing any code.

> Note: This supersedes an earlier VS Code extension direction. That approach is not being built — this document reflects the current, final scope.

---

## 1. Problem Statement

Students/junior devs want to document their learning publicly (e.g. on LinkedIn) for visibility to recruiters and their network, but two things block them:

1. **Writing a good post is effortful and slow**, especially after a coding session.
2. **They often don't know what's actually "post-worthy"** — was this week's work substantial enough to share?

A secondary, harder constraint discovered during scoping: **any AI can turn self-reported text into a good post.** If the student has to describe what they did, that description could be handed to any chatbot with equal results — there's no differentiation in the writing/structuring step alone.

**The one thing that isn't replicable by "just ask any AI":** reading facts that already exist on disk — specifically, git commit history — rather than relying on the student to self-report. This is the actual basis for this product's value, and it must remain the core of the design, not an afterthought.

---

## 2. Competitive Landscape (why this isn't "just another LinkedIn AI writer")

The AI LinkedIn content space is saturated (Taplio, RedactAI, MagicPost, Postiv, Glad AI, and others), and all of them share the same shape: they take input the user already decided to provide (a topic, a URL, past posts to mimic) and generate LinkedIn-formatted output. None of them read a developer's actual commit history directly — they don't have standing access to code activity, only to what a user explicitly feeds them.

**This project's differentiation is entirely upstream of content generation:** automatically sourcing *what happened* from git history, not asking the student to summarize it first. The AI writing step itself is not the innovation — treat it as commoditized, and don't over-invest time there.

**Known, stated limitation:** commit diffs show *what changed in code*, not *what was conceptually hard or learned*. This tool will systematically miss non-code learning (reading, watching, planning) and the "struggle" narrative that makes posts compelling, unless the student adds optional notes. This is an accepted tradeoff, not a gap to hide — state it plainly in the demo video.

---

## 3. Scope Guardrails

- ❌ No VS Code extension. No IDE integration of any kind.
- ❌ No GitHub OAuth / private repo access. **Public repo URLs only**, pasted manually by the student.
- ❌ No LinkedIn API integration or auto-posting. Output is a draft the student copies and pastes themselves.
- ❌ No mobile app.
- ✅ A web application (Spring Boot backend + React frontend) where a student:
  1. Creates a lightweight account (needed to know which repos/notes/drafts belong to whom — see §6).
  2. Pastes public GitHub repo URL(s) they want tracked.
  3. Optionally adds free-text weekly notes for anything not visible in commits.
  4. Receives an automatically-generated weekly update per tracked repo, generated on a real recurring schedule.
  5. Reviews, edits, and copies the draft to post on LinkedIn themselves.

---

## 4. Target User

Students/junior developers who want to build a public "learning in progress" presence (for recruiters, network, portfolio) but are blocked by writing effort and uncertainty about what's worth sharing.

---

## 5. AI Integration — Two Distinct Calls (do not combine into one)

### Call A — One-time project understanding (cached, not regenerated weekly)
- **Input:** README, `package.json`/manifest file, top-level folder structure, primary language(s).
- **Output:** a short project description — what it is, what problem it solves, tech stack.
- **When it runs:** once, when a repo is first added. Only regenerate if the README or manifest changes significantly (optional refinement, not required for MVP).
- **Why separate:** keeps the weekly call focused and cheap; the project's identity barely changes week to week, so re-deriving it every time wastes tokens and risks inconsistent phrasing.

### Call B — Weekly update generation
- **Input:** cached project description (from Call A) + this week's commits/diffs for that repo + the student's optional free-text notes for that week.
- **Output:** a draft update — what was worked on this week, framed as a short LinkedIn-style post (not a changelog).
- **When it runs:** on the scheduled weekly job (see §7), once per tracked repo per student.
- **Fallback:** if there are zero commits and zero notes for a repo that week, do not generate a draft — mark that repo/week as skipped instead of forcing an empty or filler post.

Use a provider-neutral AI call structure (an API call to Anthropic/OpenAI via server-side key) — since this is a hosted web backend, not a VS Code extension, this is a standard server-side API integration, not `vscode.lm`.

---

## 6. Data Model (JPA Entities, PostgreSQL)

### `User`
```
id: Long (PK)
email: String (unique)
passwordHash: String
createdAt: Instant
```
Lightweight auth needed only to associate repos/notes/drafts with a person — not a social platform, no profile features required for MVP.

### `TrackedRepo`
```
id: Long (PK)
user: User (@ManyToOne)
repoUrl: String            // e.g. https://github.com/student/project-name
projectDescription: String // cached text from Call A, TEXT column
lastSyncedCommitSha: String
addedAt: Instant
```
`lastSyncedCommitSha` prevents re-processing commits already covered by a previous weekly update.

### `WeeklyNote`
```
id: Long (PK)
user: User (@ManyToOne)
repo: TrackedRepo (@ManyToOne, nullable)
weekOf: LocalDate
text: String (TEXT column)
```
`repo: null` allowed for general notes not tied to a specific tracked repo (e.g. non-code learning).

### `WeeklyDraft`
```
id: Long (PK)
user: User (@ManyToOne)
repo: TrackedRepo (@ManyToOne)
weekOf: LocalDate
content: String (TEXT column)
status: enum { DRAFT, EDITED, POSTED, SKIPPED }
generatedAt: Instant
```

Add a composite unique constraint on (`repo_id`, `weekOf`) so the scheduled job can't accidentally create duplicate drafts for the same repo/week if it runs more than once.

---

## 7. Scheduling — Real Weekly Job

- Implement using Spring's `@Scheduled` annotation with a cron expression targeting Saturday (e.g. `@Scheduled(cron = "0 0 9 * * SAT")` for 9am Saturday) on a persistent, always-running Spring Boot instance — **do not deploy the backend as a serverless/on-request-only function**, since the job must fire on its own without anyone visiting the site. A standard host (Render, Railway, Fly.io, or any VPS) that keeps the JVM process running is required for `@Scheduled` to work at all.
- Job responsibilities, run once per week per `TrackedRepo`:
  1. Fetch commits since `lastSyncedCommitSha` via the GitHub REST API.
  2. If zero commits and no `WeeklyNote` exists for that repo/week → mark `WeeklyDraft.status = "skipped"`, no AI call.
  3. Otherwise → run Call B, save result as a new `WeeklyDraft` with `status: "draft"`.
  4. Update `lastSyncedCommitSha` to the latest commit processed.

### GitHub API rate limits (important)
Since repos are public and unauthenticated, requests are rate-limited per IP (60/hour). **Use a server-side GitHub Personal Access Token owned by the app itself** (not tied to any student's account) for all GitHub API calls — this raises the limit substantially (5,000/hour) and requires no OAuth flow from students, consistent with the "paste a public URL" decision. This token only ever reads public data.

---

## 8. Feature Scope

### Must-have
1. Account creation/login (email + password is sufficient — no need for social login).
2. Add/remove tracked public repo by URL.
3. Call A: one-time project description generation on repo add.
4. Weekly scheduled job (Call B) generating drafts automatically.
5. Dashboard: list of drafts by week/repo, with edit + copy-to-clipboard.
6. Optional free-text weekly notes input.
7. Skip logic for weeks with no activity (no empty/filler drafts).

### Should-have
8. History view — past weeks' drafts, marked posted/skipped.
9. Manual "Generate now" override per repo (useful for demoing without waiting a week).

### Nice-to-have
10. Editing the cached project description manually if the AI got it wrong.
11. Simple activity indicator (e.g. commit count sparkline) per tracked repo.

### Explicitly out of scope
- LinkedIn auto-posting via API.
- Private repo support / GitHub OAuth.
- Multi-platform publishing (X, Medium, etc.) — LinkedIn-style output only for this build.

---

## 9. Tech Stack

- **Frontend:** React
- **Backend:** Java + Spring Boot
- **Database:** PostgreSQL via Spring Data JPA
  - This data is **not** true time-series (no high-frequency metrics). It's one row per repo per week — a normal relational shape (`User` → `TrackedRepo` → `WeeklyDraft`/`WeeklyNote`, joined by a `week_of` date column). A dedicated time-series DB (TimescaleDB/InfluxDB) would be unnecessary overhead for this volume and pattern. Standard Postgres tables with a date column are sufficient.
- **Scheduling:** Spring's built-in `@Scheduled` annotation with a cron expression (e.g. `@Scheduled(cron = "0 0 9 * * SAT")` for Saturday) — no external job scheduler needed, this is native to Spring Boot.
- **GitHub data:** GitHub REST API via Spring's `RestClient`/`WebClient`, using a server-owned Personal Access Token (PAT).
- **AI:** Server-side API calls to an LLM provider (e.g. Anthropic API) via `WebClient` — a standard HTTP call from the backend, not `vscode.lm` (that API is VS Code-specific and does not apply to this architecture).

---

## 10. AccioBuild Submission Requirements

- [ ] Public GitHub repository, clean commit history
- [ ] Live deployment — deployed, working URL (e.g. Vercel for frontend + Render/Railway for backend, or a single full-stack host)
- [ ] 3–5 minute demo video covering:
  - The problem (writing friction + not knowing what's post-worthy) and why self-report alone isn't defensible as a differentiator
  - Core walkthrough: add a repo → show the one-time project description → trigger/show a weekly draft → edit → copy
  - Tech stack used
  - AI tools used and how (two distinct calls — project understanding vs weekly synthesis)
  - Explicit acknowledgment of the competitive landscape and why this isn't "just another LinkedIn AI writer" (see §2)
- [ ] Final project must match the originally registered idea

---

## 11. Build Order Summary (for the agent)

1. Scaffold Spring Boot project (Spring Web, Spring Data JPA, PostgreSQL driver, Spring Security for auth) + separate React client.
2. Build auth (signup/login — Spring Security with a simple email+password + JWT or session).
3. Build JPA entities from §6 and repositories.
4. Build "add tracked repo by URL" endpoint + Call A (project description generation) on add.
5. Build GitHub commit-fetching service (server-owned PAT, `RestClient`/`WebClient`, track `lastSyncedCommitSha`).
6. Build Call B (weekly synthesis) as a standalone service method, callable both by the scheduled job and a manual "Generate now" endpoint.
7. Wire up `@Scheduled` cron job (Saturday) calling the Call B service for every `TrackedRepo`.
8. Build weekly notes endpoint (tied to user + optional repo).
9. Build dashboard (React): list drafts, edit, copy-to-clipboard, mark posted.
10. Build skip logic for inactive weeks (no commits + no notes → status SKIPPED, no AI call).
11. Deploy (React frontend + Spring Boot backend on a persistent host + PostgreSQL instance), verify the scheduled job actually fires on the live deployment.
12. Record demo video per §10 checklist.
