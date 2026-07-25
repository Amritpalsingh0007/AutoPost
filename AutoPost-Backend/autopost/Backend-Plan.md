# Backend Implementation Plan — Derived from AutoPost-Frontend

**Source of truth:** `AutoPost-Frontend/src/services/api.ts` and `src/types/index.ts` (mock localStorage implementation). This document maps that exact contract onto Spring Boot entities and REST endpoints. JWT is already configured — this covers what sits behind it.

---

## 1. Entities (JPA)

### `User`
```
id: Long (PK)
email: String (unique, not null)
passwordHash: String (not null)
createdAt: Instant
```

### `TrackedRepo`
```
id: Long (PK)
user: User (@ManyToOne, not null)
repoUrl: String (not null)
projectDescription: String (@Lob / TEXT)
lastSyncedCommitSha: String (nullable)
addedAt: Instant
```
**Note:** the frontend's `TrackedRepo` type includes a `weeklyGrid: WeekStatus[]` field — **do not store this.** It must be computed at request time by aggregating this repo's `WeeklyDraft` rows into the last 12 weeks (see §4).

### `WeeklyDraft`
```
id: Long (PK)
repo: TrackedRepo (@ManyToOne, not null)
weekOf: LocalDate (not null)   // Monday of that week
content: String (@Lob / TEXT)
status: enum DraftStatus { DRAFT, EDITED, POSTED, SKIPPED }
generatedAt: Instant
commitCount: Integer (nullable)
noteCount: Integer (nullable)
```
Add a unique constraint on (`repo_id`, `weekOf`) — matches the plan.md scheduling requirement (no duplicate drafts for the same repo/week).

**Note:** `repoName` in the frontend type is denormalized for display — **do not store it on this entity.** Populate it in the response DTO by joining to `repo.repoUrl` (derive the name, e.g. last path segment) at serialization time.

### `WeeklyNote`
```
id: Long (PK)
user: User (@ManyToOne, not null)
repo: TrackedRepo (@ManyToOne, nullable)   // null = general note, not tied to a repo
weekOf: LocalDate (not null)
text: String (@Lob / TEXT)
```
Same denormalization note: `repoName` is populated in the response DTO, not stored.

---

## 2. Response DTOs (must match frontend `types/index.ts` exactly)

```java
// UserDto
{ id, email, createdAt }

// AuthResponseDto
{ user: UserDto, token: String }

// TrackedRepoDto
{ id, repoUrl, projectDescription, lastSyncedCommitSha, addedAt, weeklyGrid: List<WeekStatusDto> }

// WeekStatusDto
{ weekOf, status }   // status: "DRAFT" | "EDITED" | "POSTED" | "SKIPPED" | "NONE"

// WeeklyDraftDto
{ id, repoId, repoName, weekOf, content, status, generatedAt, commitCount, noteCount }

// WeeklyNoteDto
{ id, repoId, repoName, weekOf, text }
```

---

## 3. Endpoints

All endpoints except signup/login require the JWT and must scope results to the authenticated user — **the mock implementation has no ownership checks at all (it's single-browser localStorage), so this is the main thing to add that the mock doesn't show you.** Every repo/draft/note query must filter by the requesting user's ID, and every mutation must verify the resource belongs to them (403/404 otherwise).

### Auth
| Method | Path | Body | Response | Notes |
|---|---|---|---|---|
| POST | `/api/auth/signup` | `{ email, password }` | `AuthResponseDto` | 409 if email exists (frontend expects an error it displays as "Email already in use") |
| POST | `/api/auth/login` | `{ email, password }` | `AuthResponseDto` | 401 on bad credentials ("Invalid email or password") |
| PUT | `/api/auth/password` | `{ currentPassword, newPassword }` | 200 | Settings page collects `currentPassword`/`newPassword`/`confirmPassword` but the mock's `updatePassword()` currently takes no args — **wire the real request body from these fields**, verify `currentPassword` against the stored hash before updating |
| DELETE | `/api/auth/account` | — | 204 | Get user from JWT, not from a path/body param (mock passes `userId` in the body — that's a mock-only shortcut, don't carry it into the real endpoint). Cascade-delete the user's repos, drafts, and notes |

### Repos
| Method | Path | Body | Response | Notes |
|---|---|---|---|---|
| GET | `/api/repos` | — | `List<TrackedRepoDto>` | Scoped to current user |
| POST | `/api/repos` | `{ repoUrl }` | `TrackedRepoDto` | Triggers Call A (project description generation). 400 if URL isn't a valid public GitHub repo. **Decision needed:** the mock also auto-generates a first draft immediately on add (`api.drafts.generate(newRepo.id)` inside `repos.add`) — this is convenient for demos but conflicts with the "drafts only generate via the Saturday cron" design in plan.md. Confirm with the product owner whether real repo-add should also eagerly generate a first draft (good for demo/first impression) or wait for the schedule (matches the stated architecture) before implementing |
| GET | `/api/repos/{id}` | — | `TrackedRepoDto` | 404 if not found or not owned by user |
| PUT | `/api/repos/{id}/description` | `{ description }` | 200 | Manual correction of the cached project description |
| DELETE | `/api/repos/{id}` | — | 204 | Cascade-delete this repo's drafts (mock does this explicitly — replicate via `@OneToMany(cascade = ...)` or an explicit delete query) |

### Drafts
| Method | Path | Body | Response | Notes |
|---|---|---|---|---|
| GET | `/api/drafts` | — | `List<WeeklyDraftDto>` | All drafts across all of the current user's repos (used by Dashboard + History) |
| GET | `/api/drafts/repo/{repoId}` | — | `List<WeeklyDraftDto>` | Sorted by `weekOf` descending (matches mock's `.sort((a,b) => b.weekOf.localeCompare(a.weekOf))`) |
| GET | `/api/drafts/{id}` | — | `WeeklyDraftDto` | |
| PUT | `/api/drafts/{id}` | `{ content?, status? }` | 200 | Partial update — used both for inline content edits (sets `status: EDITED`, debounced from the textarea) and for "Mark as posted" (`status: POSTED`) |
| POST | `/api/drafts/generate/{repoId}` | — | `WeeklyDraftDto` | Manual "Generate now" / "Regenerate" trigger — runs Call B on demand, same logic the Saturday cron job calls |

### Notes
| Method | Path | Body | Response | Notes |
|---|---|---|---|---|
| GET | `/api/notes` | — | `List<WeeklyNoteDto>` | All of current user's notes |
| POST | `/api/notes` | `{ repoId?, weekOf, text }` | `WeeklyNoteDto` | `repoId` omitted/null → general note |
| DELETE | `/api/notes/{id}` | — | 204 | |

---

## 4. Computing `weeklyGrid` (important — not a stored field)

Every `TrackedRepoDto` needs a `weeklyGrid: List<WeekStatusDto>` covering the last 12 weeks (matches the mock's `generateMockGrid()` and the frontend's `WeeklyGrid` component). Build this by:

1. For the repo, fetch all `WeeklyDraft` rows.
2. For each of the last 12 Mondays (going back from the current week), look up whether a draft exists for that `weekOf`.
3. If a draft exists → use its `status`. If none exists → use `"NONE"` (not `"SKIPPED"` — `SKIPPED` should only be set when the scheduled job explicitly ran and found no activity; `NONE` covers weeks before the repo was even tracked, or weeks not yet processed).

This is a read-time aggregation, not a persisted list — keep it that way so drafts remain the single source of truth and the grid can never drift out of sync with actual draft records.

---

## 5. What the mock doesn't show you (gaps to fill in real implementation)

- **Ownership/authorization checks** — as noted in §3, the mock has zero access control since it's per-browser localStorage. Every endpoint needs the authenticated user's ID from the JWT and must filter/verify against it.
- **Real password hashing** — mock stores no password at all. Use BCrypt (Spring Security default) for `passwordHash`.
- **Call A / Call B actually calling an AI + GitHub API** — the mock returns hardcoded placeholder text (`"This is an AI-generated description..."` and a fixed sample post). These need real implementations per plan.md §5 (project description generation, weekly synthesis from commits + notes).
- **The repo-add-triggers-first-draft behavior** — flagged in §3, needs an explicit decision before building since it affects whether "no draft until Saturday" is actually true.