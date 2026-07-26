/**
 * Real HTTP client for the AutoPost backend.
 *
 * Design decisions:
 *  - One axios instance with a request interceptor that attaches the access
 *    token as a Bearer header.
 *  - A response interceptor that catches 401s, silently refreshes the access
 *    token via POST /api/auth/refresh, then retries the original request once.
 *  - A `refreshing` guard so that multiple concurrent 401s (e.g. several
 *    components fetching on page load) all await the same single refresh call
 *    rather than firing parallel refresh requests.
 *  - On any failed refresh the user is logged out and redirected to /login.
 *
 * Token storage:
 *  - access_token  → localStorage  (attached to every non-auth request)
 *  - refresh_token → localStorage  (used only by the interceptor + explicit logout)
 *  Known tradeoff: localStorage is readable by any script on the page (XSS risk).
 *  An httpOnly cookie would be more secure, but that requires backend cookie support
 *  not present in the current spec. Flag this as a known limitation for production.
 */

import axios from 'axios';
import type {
  AuthResponse,
  TrackedRepo,
  WeeklyDraft,
  WeeklyNote,
} from '../types';

// ---------------------------------------------------------------------------
// Axios instance
// ---------------------------------------------------------------------------

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

const client = axios.create({ baseURL: BASE_URL });

// ---------------------------------------------------------------------------
// Request interceptor — attach access token
// ---------------------------------------------------------------------------

// Endpoints that must NOT receive an access token — they either don't need
// one (signup/login) or must not forward an expired token (refresh).
const NO_AUTH_URLS = ['/api/auth/signup', '/api/auth/login', '/api/auth/refresh'];

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  const url = config.url ?? '';
  // Attach the Bearer token to every request except the three public auth
  // endpoints above. logout, updatePassword, and deleteAccount are protected
  // and do need the token.
  if (token && !NO_AUTH_URLS.some((u) => url.startsWith(u))) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ---------------------------------------------------------------------------
// Response interceptor — silent token refresh on 401
// ---------------------------------------------------------------------------

// Single in-flight refresh promise shared across concurrent 401s.
let refreshing: Promise<string> | null = null;

client.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config as typeof error.config & { _retry?: boolean };

    // Spring Security returns 403 when a JWT is expired (token is parsed but
    // rejected as invalid), and 401 when no token is present at all. We treat
    // both the same way: attempt a silent refresh, then retry the request.
    const status = error.response?.status;
    if ((status === 401 || status === 403) && !original._retry) {
      original._retry = true;
      try {
        // Reuse an in-flight refresh instead of firing multiple calls.
        refreshing ??= refreshAccessToken();
        const newToken = await refreshing;
        refreshing = null;
        original.headers.Authorization = `Bearer ${newToken}`;
        return client(original);
      } catch {
        // Refresh failed (token expired or revoked) — wipe all auth state
        // so AuthContext doesn't rehydrate a stale user on next page load,
        // then redirect to login.
        refreshing = null;
        clearTokens();
        localStorage.removeItem('auth_user');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

// ---------------------------------------------------------------------------
// Token helpers
// ---------------------------------------------------------------------------

export function saveTokens(accessToken: string, refreshToken: string): void {
  localStorage.setItem('access_token', accessToken);
  localStorage.setItem('refresh_token', refreshToken);
}

export function clearTokens(): void {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
}

async function refreshAccessToken(): Promise<string> {
  const refreshToken = localStorage.getItem('refresh_token');
  // Use raw axios (not the intercepted client) to avoid triggering another 401 loop.
  const { data } = await axios.post<AuthResponse>(
    `${BASE_URL}/api/auth/refresh`,
    { refreshToken }
  );
  saveTokens(data.accessToken, data.refreshToken);
  return data.accessToken;
}

// ---------------------------------------------------------------------------
// Error normalisation
// ---------------------------------------------------------------------------

/**
 * Extracts a human-readable message from an API error response.
 * The backend returns Spring's ProblemDetail format:
 *   { type, title, status, detail }
 * Fall back to the axios message if the response isn't structured.
 */
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail as string | undefined;
    const message = error.response?.data?.message as string | undefined;
    return detail ?? message ?? error.message;
  }
  if (error instanceof Error) return error.message;
  return 'An unexpected error occurred.';
}

// ---------------------------------------------------------------------------
// URL helpers
// ---------------------------------------------------------------------------

/**
 * Normalises a GitHub repo URL before sending it to the backend.
 * The spec pattern rejects a trailing slash and a .git suffix.
 */
export function normalizeRepoUrl(url: string): string {
  return url.trim().replace(/\.git$/, '').replace(/\/+$/, '');
}

/** Client-side pattern that mirrors the backend's repoUrl validation. */
const REPO_URL_PATTERN = /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+$/;

export function validateRepoUrl(url: string): string | null {
  if (!REPO_URL_PATTERN.test(url)) {
    return 'Enter a valid GitHub repo URL (e.g. https://github.com/username/repo-name)';
  }
  return null;
}

// ---------------------------------------------------------------------------
// API surface
// ---------------------------------------------------------------------------

export const api = {
  // ---- Auth ----------------------------------------------------------------
  auth: {
    signup: async (email: string, password: string): Promise<AuthResponse> => {
      const { data } = await client.post<AuthResponse>('/api/auth/signup', { email, password });
      return data;
    },

    login: async (email: string, password: string): Promise<AuthResponse> => {
      const { data } = await client.post<AuthResponse>('/api/auth/login', { email, password });
      return data;
    },

    /** Called automatically by the response interceptor — not used directly by UI code. */
    refresh: async (refreshToken: string): Promise<AuthResponse> => {
      const { data } = await client.post<AuthResponse>('/api/auth/refresh', { refreshToken });
      return data;
    },

    /**
     * Revokes the refresh token server-side, then the caller should clear
     * local storage and redirect. The interceptor skip is intentional here —
     * if the access token has already expired we still want to hit this endpoint
     * with the refresh token to revoke it, so we pass it explicitly in the body.
     */
    logout: async (refreshToken: string): Promise<void> => {
      await client.post('/api/auth/logout', { refreshToken });
    },

    updatePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
      await client.put('/api/auth/password', { currentPassword, newPassword });
    },

    /** No request body — the backend derives the user from the Bearer token. */
    deleteAccount: async (): Promise<void> => {
      await client.delete('/api/auth/account');
    },
  },

  // ---- Repos ---------------------------------------------------------------
  repos: {
    list: async (): Promise<TrackedRepo[]> => {
      const { data } = await client.get<TrackedRepo[]>('/api/repos');
      return data;
    },

    add: async (repoUrl: string): Promise<TrackedRepo> => {
      const { data } = await client.post<TrackedRepo>('/api/repos', { repoUrl });
      return data;
    },

    get: async (id: number): Promise<TrackedRepo> => {
      const { data } = await client.get<TrackedRepo>(`/api/repos/${id}`);
      return data;
    },

    updateDescription: async (id: number, description: string): Promise<void> => {
      await client.put(`/api/repos/${id}/description`, { description });
    },

    remove: async (id: number): Promise<void> => {
      await client.delete(`/api/repos/${id}`);
    },
  },

  // ---- Drafts --------------------------------------------------------------
  drafts: {
    list: async (): Promise<WeeklyDraft[]> => {
      const { data } = await client.get<WeeklyDraft[]>('/api/drafts');
      return data;
    },

    getForRepo: async (repoId: number): Promise<WeeklyDraft[]> => {
      const { data } = await client.get<WeeklyDraft[]>(`/api/drafts/repo/${repoId}`);
      return data;
    },

    get: async (id: number): Promise<WeeklyDraft> => {
      const { data } = await client.get<WeeklyDraft>(`/api/drafts/${id}`);
      return data;
    },

    update: async (id: number, updates: { content?: string; status?: string }): Promise<void> => {
      await client.put(`/api/drafts/${id}`, updates);
    },

    generate: async (repoId: number): Promise<WeeklyDraft> => {
      const { data } = await client.post<WeeklyDraft>(`/api/drafts/generate/${repoId}`);
      return data;
    },
  },

  // ---- Notes ---------------------------------------------------------------
  notes: {
    list: async (): Promise<WeeklyNote[]> => {
      const { data } = await client.get<WeeklyNote[]>('/api/notes');
      return data;
    },

    create: async (note: { repoId?: number | null; weekOf: string; text: string }): Promise<WeeklyNote> => {
      const { data } = await client.post<WeeklyNote>('/api/notes', note);
      return data;
    },

    remove: async (id: number): Promise<void> => {
      await client.delete(`/api/notes/${id}`);
    },
  },
};
