export type DraftStatus = 'DRAFT' | 'EDITED' | 'POSTED' | 'SKIPPED';

export interface User {
  id: number;
  email: string;
  createdAt: string;
}

/**
 * Shape returned by POST /api/auth/signup and POST /api/auth/login.
 * The backend issues both an access token (short-lived) and a refresh token
 * (long-lived) — the frontend stores both and uses the refresh token to
 * silently renew the access token when it expires.
 */
export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface TrackedRepo {
  id: number;
  repoUrl: string;
  projectDescription: string;
  lastSyncedCommitSha: string | null;
  addedAt: string;
  weeklyGrid: WeekStatus[];  // last N weeks for grid display
}

export interface WeekStatus {
  weekOf: string;         // ISO date string (Monday of that week)
  status: DraftStatus | 'NONE';
}

export interface WeeklyDraft {
  id: number;
  repoId: number;
  repoName: string;       // denormalized for display convenience
  weekOf: string;
  content: string;
  status: DraftStatus;
  generatedAt: string;
  commitCount?: number;
  noteCount?: number;
}

export interface WeeklyNote {
  id: number;
  repoId: number | null;
  repoName: string | null;
  weekOf: string;
  text: string;
}
