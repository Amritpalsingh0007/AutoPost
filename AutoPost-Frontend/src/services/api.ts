import type { User, TrackedRepo, WeeklyDraft, WeeklyNote, DraftStatus, WeekStatus } from '../types';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const getStorage = <T>(key: string, defaultValue: T): T => {
  const item = localStorage.getItem(key);
  return item ? JSON.parse(item) : defaultValue;
};

const setStorage = <T>(key: string, value: T) => {
  localStorage.setItem(key, JSON.stringify(value));
};

let currentUserId = 1;

export const api = {
  auth: {
    signup: async (email: string, _password: string):Promise<{user: User, token: string}> => {
      await delay(500);
      const users = getStorage<User[]>('mock_users', []);
      if (users.find(u => u.email === email)) {
        throw new Error('Email already in use');
      }
      const user: User = {
        id: currentUserId++,
        email,
        createdAt: new Date().toISOString()
      };
      users.push(user);
      setStorage('mock_users', users);
      return { user, token: 'mock-jwt-token' };
    },
    login: async (email: string, _password: string):Promise<{user: User, token: string}> => {
      await delay(500);
      const users = getStorage<User[]>('mock_users', []);
      const user = users.find(u => u.email === email);
      if (!user) {
        throw new Error('Invalid email or password');
      }
      return { user, token: 'mock-jwt-token' };
    },
    updatePassword: async () => {
      await delay(500);
      return true;
    },
    deleteAccount: async (_userId: number) => {
      await delay(500);
      // Clean up mock data (simplified for MVP)
      localStorage.clear();
      return true;
    }
  },
  repos: {
    list: async (): Promise<TrackedRepo[]> => {
      await delay(500);
      return getStorage<TrackedRepo[]>('mock_repos', []);
    },
    add: async (repoUrl: string): Promise<TrackedRepo> => {
      await delay(1500); // Simulate "Reading the project..."
      if (!repoUrl.includes('github.com')) {
        throw new Error('Couldn\'t find a public repo at that URL');
      }
      const repos = getStorage<TrackedRepo[]>('mock_repos', []);
      
      const newRepo: TrackedRepo = {
        id: Date.now(),
        repoUrl,
        projectDescription: "This is an AI-generated description of the project, built by summarizing the README and codebase.",
        lastSyncedCommitSha: null,
        addedAt: new Date().toISOString(),
        weeklyGrid: generateMockGrid()
      };
      repos.push(newRepo);
      setStorage('mock_repos', repos);
      
      // Auto-generate a draft for demo purposes if none exists
      await api.drafts.generate(newRepo.id);
      
      return newRepo;
    },
    get: async (id: number): Promise<TrackedRepo> => {
      await delay(300);
      const repos = getStorage<TrackedRepo[]>('mock_repos', []);
      const repo = repos.find(r => r.id === id);
      if (!repo) throw new Error('Repo not found');
      return repo;
    },
    updateDescription: async (id: number, description: string): Promise<void> => {
      await delay(500);
      const repos = getStorage<TrackedRepo[]>('mock_repos', []);
      const idx = repos.findIndex(r => r.id === id);
      if (idx !== -1) {
        repos[idx].projectDescription = description;
        setStorage('mock_repos', repos);
      }
    },
    remove: async (id: number): Promise<void> => {
      await delay(500);
      const repos = getStorage<TrackedRepo[]>('mock_repos', []);
      setStorage('mock_repos', repos.filter(r => r.id !== id));
      
      const drafts = getStorage<WeeklyDraft[]>('mock_drafts', []);
      setStorage('mock_drafts', drafts.filter(d => d.repoId !== id));
    }
  },
  drafts: {
    list: async (): Promise<WeeklyDraft[]> => {
      await delay(500);
      return getStorage<WeeklyDraft[]>('mock_drafts', []);
    },
    getForRepo: async (repoId: number): Promise<WeeklyDraft[]> => {
      await delay(400);
      const drafts = getStorage<WeeklyDraft[]>('mock_drafts', []);
      return drafts.filter(d => d.repoId === repoId).sort((a,b) => b.weekOf.localeCompare(a.weekOf));
    },
    generate: async (repoId: number): Promise<WeeklyDraft> => {
      await delay(2000); // Simulate API generation time
      
      const repos = getStorage<TrackedRepo[]>('mock_repos', []);
      const repo = repos.find(r => r.id === repoId);
      if (!repo) throw new Error('Repo not found');
      
      const drafts = getStorage<WeeklyDraft[]>('mock_drafts', []);
      
      const repoName = repo.repoUrl.split('/').pop() || 'Unknown Repo';
      
      // Generate Monday of current week
      const d = new Date();
      const day = d.getDay(), diff = d.getDate() - day + (day == 0 ? -6:1);
      const monday = new Date(d.setDate(diff));
      const weekOfStr = monday.toISOString().split('T')[0];
      
      const newDraft: WeeklyDraft = {
        id: Date.now(),
        repoId,
        repoName,
        weekOf: weekOfStr,
        content: `This week in ${repoName}, I shipped several core features. We overhauled the backend structure to prepare for the v2 launch and cleaned up some legacy tech debt in the frontend.\n\nThe most challenging part was migrating the authentication flow without dropping active sessions, but reading through the updated docs helped tremendously.\n\n#buildinpublic #learning`,
        status: 'DRAFT',
        generatedAt: new Date().toISOString(),
        commitCount: Math.floor(Math.random() * 10) + 1,
        noteCount: 0
      };
      
      drafts.push(newDraft);
      setStorage('mock_drafts', drafts);
      return newDraft;
    },
    get: async (id: number): Promise<WeeklyDraft> => {
      await delay(300);
      const drafts = getStorage<WeeklyDraft[]>('mock_drafts', []);
      const draft = drafts.find(d => d.id === id);
      if (!draft) throw new Error('Draft not found');
      return draft;
    },
    update: async (id: number, updates: Partial<WeeklyDraft>): Promise<void> => {
      await delay(300);
      const drafts = getStorage<WeeklyDraft[]>('mock_drafts', []);
      const idx = drafts.findIndex(d => d.id === id);
      if (idx !== -1) {
        drafts[idx] = { ...drafts[idx], ...updates };
        setStorage('mock_drafts', drafts);
      }
    }
  },
  notes: {
    list: async (): Promise<WeeklyNote[]> => {
      await delay(300);
      return getStorage<WeeklyNote[]>('mock_notes', []);
    },
    create: async (note: Omit<WeeklyNote, 'id'>): Promise<WeeklyNote> => {
      await delay(400);
      const notes = getStorage<WeeklyNote[]>('mock_notes', []);
      const newNote = { ...note, id: Date.now() };
      notes.unshift(newNote);
      setStorage('mock_notes', notes);
      return newNote;
    },
    remove: async (id: number): Promise<void> => {
      await delay(300);
      const notes = getStorage<WeeklyNote[]>('mock_notes', []);
      setStorage('mock_notes', notes.filter(n => n.id !== id));
    }
  }
};

// Helper to generate a random 12-week grid for demo aesthetics
function generateMockGrid(): WeekStatus[] {
  const statuses: DraftStatus[] = ['DRAFT', 'EDITED', 'POSTED', 'SKIPPED'];
  const grid: WeekStatus[] = [];
  const today = new Date();
  
  for (let i = 11; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - (i * 7));
    const day = d.getDay(), diff = d.getDate() - day + (day == 0 ? -6:1);
    const monday = new Date(d.setDate(diff));
    
    grid.push({
      weekOf: monday.toISOString().split('T')[0],
      status: Math.random() > 0.3 ? statuses[Math.floor(Math.random() * statuses.length)] : 'SKIPPED'
    });
  }
  return grid;
}
