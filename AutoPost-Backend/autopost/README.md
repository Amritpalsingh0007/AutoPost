# AutoPost — Backend

Spring Boot API for AutoPost.

## Tech stack

- Java 21, Spring Boot 4.1.0
- Spring Data JPA + PostgreSQL (hosted on [Neon](https://neon.tech))
- Spring Security + JWT (`jjwt` 0.13.0) — access + refresh token pair
- Spring WebFlux `WebClient` — used for outbound calls to the GitHub API and Gemini API
- Spring's `@Scheduled` — native weekly cron job, no external scheduler needed

## Environment variables

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `DATABASE_URL` | Yes (prod) | `jdbc:postgresql://localhost:5432/autopost` | PostgreSQL connection string (Neon connection string in production) |
| `DATABASE_USERNAME` | Yes (prod) | `postgres` | |
| `DATABASE_PASSWORD` | Yes (prod) | `password` | |
| `JWT_SECRET_KEY` | Yes (prod) | dev-only fallback, **do not use in production** | Base64-encoded, ≥256 bits. Generate with `openssl rand -base64 32` |
| `JWT_REFRESH_TOKEN_EXPIRY_DAYS` | No | `7` | Refresh token lifetime |
| `ALLOWED_ORIGINS` | Yes (prod) | `http://localhost:3000,http://localhost:5173` | Comma-separated list of allowed CORS origins — must include the deployed frontend URL |
| `GITHUB_TOKEN` | No | blank (unauthenticated, 60 req/hr) | A GitHub personal access token, server-owned, raises the API rate limit to 5,000 req/hr. Only ever used to read public repo data |
| `GOOGLE_API_KEY` | No | blank (stub text returned instead) | Gemini API key — required for real AI-generated descriptions/drafts |
| `WEEKLY_GRID_WEEKS` | No | `12` | Number of past weeks included in each repo's activity grid |

## Local setup

Requires Java 21 and a running PostgreSQL instance (local or Neon).

```bash
./mvnw spring-boot:run
```

Or set env vars inline for a quick local run against Neon:
```bash
DATABASE_URL=jdbc:postgresql://<neon-host>/autopost \
DATABASE_USERNAME=... \
DATABASE_PASSWORD=... \
JWT_SECRET_KEY=$(openssl rand -base64 32) \
GOOGLE_API_KEY=... \
./mvnw spring-boot:run
```

The app starts on `http://localhost:8080`. `spring.jpa.hibernate.ddl-auto=update` auto-creates/updates tables on startup — no manual migration step needed for this build.

## API overview

Auth (`/api/auth/*`): signup, login, refresh, logout, password update, account deletion — JWT-based, access + refresh token pair.

Everything else requires a valid `Authorization: Bearer <token>` header:
- `/api/repos` — add/list/view/delete tracked public GitHub repos, update the cached project description
- `/api/drafts` — list/view/edit weekly drafts, trigger on-demand generation
- `/api/notes` — add/list/delete free-text weekly notes (optionally tied to a repo)

Full request/response shapes are defined via `springdoc-openapi`; Swagger UI is disabled in this build (`springdoc.swagger-ui.enabled=false`) — re-enable it locally if you need to browse the spec interactively.

## AI integration (Gemini)

`GeminiService` makes two distinct calls, both via `WebClient` against the `generativelanguage.googleapis.com` REST API:
- **Project description** — generated once per repo, from the README/commit context, and cached.
- **Weekly draft** — generated from the cached project description + that week's commits + any notes.

If `GOOGLE_API_KEY` is unset, both calls return placeholder stub text instead of failing — useful for developing the rest of the app without burning API quota.

> Gemini model IDs change frequently as Google retires older generations. If you see a `404` from the Gemini call, check the currently available models for your API key (`GET /v1beta/models?key=...`) and update the model constant in `GeminiService` accordingly.

## Scheduled job

A weekly `@Scheduled` job (cron-based) runs once per tracked repo:
1. Fetches commits since the last processed commit SHA.
2. If there's no new activity and no note for the week, marks that week `SKIPPED` — no AI call, no filler draft.
3. Otherwise, generates a new draft via `GeminiService` and stores it.

This requires the backend to run as a persistent process — not a request-only serverless function — for the schedule to actually fire on its own.

## Deployment

Deployed on **Render**. Set all environment variables from the table above in Render's dashboard; `DATABASE_URL` should point at the Neon connection string. Make sure `ALLOWED_ORIGINS` includes the deployed Vercel frontend URL exactly (including `https://`), or the frontend will be blocked by CORS.
