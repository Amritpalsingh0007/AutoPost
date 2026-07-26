# Frontend ↔ Backend Integration Plan

**Source of truth:** the OpenAPI spec you just shared (`http://localhost:8080` server). This document reconciles that spec against the existing mock frontend (`services/api.ts`, `types/index.ts`) and lays out exactly what changes on the frontend side, in what order.

---

## 1. Contract differences to resolve first (read before writing any code)

Comparing the OpenAPI spec to the mock frontend turned up four real mismatches. Fix these decisions before wiring anything up — otherwise you'll debug symptoms of these on top of normal integration bugs.

### 1.1 Auth response shape: `accessToken` + `refreshToken`, not `token`
The spec's `AuthResponseDto` is:
```json
{ "user": UserDto, "accessToken": "string", "refreshToken": "string" }
```
The mock frontend expects `{ user, token }`. **Decision: adapt the frontend to the backend's actual (and more complete) shape** — a two-token pattern is a real improvement over the original single-token mock design, not just a naming difference, since it enables silent session refresh (see §3). Update `types/index.ts` and every call site that destructures `token` to use `accessToken`/`refreshToken` instead.

### 1.2 `repoUrl` has a strict validation pattern
```
"pattern": "https://github\\.com/[\\w.-]+/[\\w.-]+"
```
This **rejects** a trailing slash and a `.git` suffix — both of which real users will paste. Normalize client-side before submit:
```ts
function normalizeRepoUrl(url: string): string {
  return url.trim().replace(/\.git$/, '').replace(/\/+$/, '');
}
```
Run this on the Add Repo modal's input before calling `POST /api/repos`, and validate against the same regex client-side so the error surfaces inline rather than as a raw 400 from the server.

### 1.3 Password update body is `{ currentPassword, newPassword }` — no `confirmPassword`
`confirmPassword` stays a client-only field (used only to check the two new-password inputs match before submitting) — do not send it. `newPassword` requires `minLength: 8` server-side; mirror that as client-side validation too so the error surfaces before a round trip.

### 1.4 `deleteAccount` and `logout`/`refresh` need the token, not a body param
- `DELETE /api/auth/account` takes **no request body** — the mock currently mimics this by passing `userId` manually; drop that entirely. The backend must derive the user from the JWT (confirm this is how your controller reads it — it should be, based on the earlier code review).
- `POST /api/auth/refresh` and `POST /api/auth/logout` both take `{ refreshToken }` in the body — the frontend needs to persist the refresh token (see §2) to call these at all.

---

## 2. Token storage strategy

Store both tokens from signup/login response:
```ts
localStorage.setItem('access_token', response.accessToken);
localStorage.setItem('refresh_token', response.refreshToken);
```
**Known tradeoff, worth stating plainly rather than glossing over:** `localStorage` is readable by any script on the page, so it's vulnerable to XSS token theft. For a hackathon build this is an acceptable, common tradeoff — an httpOnly cookie would be more secure but requires backend cookie-setting support that isn't in this spec. Mention this as a known limitation in your demo if asked, rather than presenting it as a solved problem.

On logout (explicit user action, or a failed refresh — see §3): clear both tokens and redirect to `/login`.

---

## 3. HTTP client setup — interceptor-based, not per-call token handling

Build one configured client (axios or a thin `fetch` wrapper) rather than repeating auth logic in every method.

```ts
import axios from 'axios';

const api = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL });

// Attach access token to every request except auth endpoints
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token && !config.url?.startsWith('/api/auth')) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// On 401, attempt one silent refresh, then retry the original request
let refreshing: Promise<string> | null = null;

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        refreshing ??= refreshAccessToken();
        const newToken = await refreshing;
        refreshing = null;
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch {
        localStorage.clear();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

async function refreshAccessToken(): Promise<string> {
  const refreshToken = localStorage.getItem('refresh_token');
  const { data } = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/auth/refresh`, { refreshToken });
  localStorage.setItem('access_token', data.accessToken);
  localStorage.setItem('refresh_token', data.refreshToken);
  return data.accessToken;
}
```
The `refreshing` guard prevents multiple simultaneous 401s (e.g. several components fetching on page load) from firing parallel refresh calls — they all await the same in-flight promise.

**Environment variable:** add `VITE_API_BASE_URL=http://localhost:8080` to a `.env` file in the frontend project (and the production URL in deployment config).

---

## 4. Endpoint-by-endpoint mapping (replace mock methods with these)

| Frontend `api.*` method | Method + Path | Request body | Notes |
|---|---|---|---|
| `auth.signup` | `POST /api/auth/signup` | `{ email, password }` | `firstName`/`lastName` optional per spec — omit unless you add fields for them |
| `auth.login` | `POST /api/auth/login` | `{ email, password }` | |
| `auth.refresh` | `POST /api/auth/refresh` | `{ refreshToken }` | Called automatically by the interceptor, not directly by UI code |
| `auth.logout` | `POST /api/auth/logout` | `{ refreshToken }` | Call this before clearing local storage on explicit logout, so the backend can revoke it |
| `auth.updatePassword` | `PUT /api/auth/password` | `{ currentPassword, newPassword }` | |
| `auth.deleteAccount` | `DELETE /api/auth/account` | — | No body — auth comes from the Bearer token |
| `repos.getAll` | `GET /api/repos` | — | |
| `repos.add` | `POST /api/repos` | `{ repoUrl }` | Normalize URL first, per §1.2 |
| `repos.getById` | `GET /api/repos/{id}` | — | |
| `repos.updateDescription` | `PUT /api/repos/{id}/description` | `{ description }` | |
| `repos.delete` | `DELETE /api/repos/{id}` | — | |
| `drafts.getAll` | `GET /api/drafts` | — | |
| `drafts.getForRepo` | `GET /api/drafts/repo/{repoId}` | — | |
| `drafts.getById` | `GET /api/drafts/{id}` | — | |
| `drafts.update` | `PUT /api/drafts/{id}` | `{ content?, status? }` | |
| `drafts.generate` | `POST /api/drafts/generate/{repoId}` | — | |
| `notes.getAll` | `GET /api/notes` | — | |
| `notes.add` | `POST /api/notes` | `{ repoId?, weekOf, text }` | `text` and `weekOf` required per spec |
| `notes.delete` | `DELETE /api/notes/{id}` | — | |

---

## 5. Error response shape — update error handling to read `ProblemDetail`

Your `GlobalExceptionHandler` returns Spring's `ProblemDetail` format, not a plain `{ message }`:
```json
{ "type": "about:blank", "title": "Bad Request", "status": 400, "detail": "email: must not be blank" }
```
Update wherever the frontend currently displays API errors to read `error.response.data.detail` (the human-readable message), not `error.response.data.message` — this is a different shape than a typical hand-rolled error response and easy to miss.

---

## 6. CORS — required now, not optional

This was flagged as a latent issue earlier and it's no longer latent — you're about to make real cross-origin requests from the Vite dev server to Spring Boot. Two options, pick one for local dev:

**Option A — Vite proxy (simplest for local dev, no backend changes):**
```ts
// vite.config.ts
export default defineConfig({
  server: {
    proxy: { '/api': 'http://localhost:8080' }
  }
});
```
With this, the frontend calls `/api/...` (relative), Vite forwards it server-side, and the browser never sees a cross-origin request at all — no CORS config needed for local dev. Set `VITE_API_BASE_URL=''` (empty) when using this approach.

**Option B — real CORS config on the backend** (needed regardless, once you deploy frontend and backend to different hosts):
```java
@Bean
public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration config = new CorsConfiguration();
    config.setAllowedOrigins(List.of("http://localhost:5173", "https://your-deployed-frontend.com"));
    config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
    config.setAllowedHeaders(List.of("Authorization", "Content-Type"));
    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", config);
    return source;
}
```
and wire it into `SecurityConfig`: `.cors(cors -> cors.configurationSource(corsConfigurationSource()))`.

**Do Option A for local dev now, and Option B before you deploy** — you'll need B regardless once frontend and backend are on separate hosts.

---

## 7. Build order

1. Add CORS handling (Option A, Vite proxy) so nothing blocks you locally while you build the rest.
2. Update `types/index.ts`: `AuthResponseDto` → `accessToken`/`refreshToken`; update anything referencing the old `token` field.
3. Replace the mock `services/api.ts` with the real axios client + interceptors from §3.
4. Wire up each method per the table in §4, one resource at a time (auth first, then repos, then drafts, then notes) — test each in isolation before moving to the next.
5. Update error display logic to read `.detail` per §5.
6. Add `repoUrl` normalization + inline validation per §1.2.
7. Update `AuthContext.tsx` to store/read both tokens, and wire `logout()` to call `POST /api/auth/logout` before clearing storage.
8. Full manual pass: signup → login → add repo → generate draft (manual trigger) → edit draft → mark posted → add note → delete repo → delete account. Confirm each against the actual running backend, not just against this plan.
9. Before deployment: switch to Option B (real CORS config) and set `VITE_API_BASE_URL` to the deployed backend URL.