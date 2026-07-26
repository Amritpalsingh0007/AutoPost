# AutoPost — Frontend

React (Vite + TypeScript) client for AutoPost.

## Tech stack

- React 19 + Vite 8
- TypeScript
- React Router (`react-router-dom`)
- Axios (HTTP client, with interceptor-based auth + silent token refresh)
- Lucide icons

## Setup

```bash
npm install
```

Create a `.env` file (or edit the existing one):
```bash
# Local development — Vite proxy forwards /api to the backend, so leave this empty.
# When deploying, set this to the deployed backend URL (e.g. https://your-backend.onrender.com).
VITE_API_BASE_URL=
```

For local development, `vite.config.ts` proxies `/api` requests to `http://localhost:8080`, so the browser never makes a cross-origin request and no CORS setup is needed locally. When `VITE_API_BASE_URL` is set (production), requests go directly to that URL instead.

## Scripts

```bash
npm run dev       # start local dev server
npm run build     # type-check (tsc -b) then production build
npm run preview   # preview the production build locally
npm run lint      # run eslint
```

## Auth flow

- Login/signup responses return `{ user, accessToken, refreshToken }`.
- `accessToken` is attached to every request (except `/api/auth/*`) via an axios request interceptor.
- On a `401` response, a response interceptor attempts one silent refresh via `POST /api/auth/refresh`, then retries the original request. If refresh also fails, local storage is cleared and the user is redirected to `/login`.
- Both tokens are currently stored in `localStorage`. This is a known tradeoff (readable by any script on the page) accepted for this build's scope — see the root README's known limitations.

## Deployment

Deployed on **Vercel**. Set `VITE_API_BASE_URL` as a Vercel environment variable pointing at the deployed backend.
