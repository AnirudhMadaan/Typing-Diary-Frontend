import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { DiaryEntry, User, AdminOverview, AdminUserMetric, BroadcastEmailPayload } from '../types/diary';
import { typewriterAudio } from '../utils/audio';

declare global {
  interface Window {
    TYPING_DIARY_API_URL?: string;
  }
}

const API_BASE = (window.TYPING_DIARY_API_URL || '').replace(/\/+$/, '');
export const diaryAssetUrl = (path: string) => `${API_BASE}${path}`;
const emptyUser: User = {
  id: '',
  username: '',
  displayName: '',
  avatar: '',
  bio: '',
  email: '',
  authProvider: 'custom',
  joinedDate: '',
  defaultPrivacy: 'private',
  friendIds: [],
  friendRequestsSent: [],
  friendRequestsReceived: [],
  perFriendSettings: {},
  isAdmin: false,
  adminRank: null,
  termsAccepted: true,
  emailOptIn: true,
  settings: {
    soundEnabled: true,
    soundType: 'mechanical',
    paperTheme: 'parchment',
    defaultAnonymous: false,
    allowFriendRequests: true,
    showStatsByDefault: false,
  },
};

type RegistrationInput = {
  username: string;
  displayName: string;
  bio: string;
  email: string;
  password: string;
  verificationCode?: string;
  termsAccepted?: boolean;
  emailOptIn?: boolean;
};

interface DiaryContextType {
  currentUser: User;
  isAuthenticated: boolean;
  isLoading: boolean;
  users: User[];
  entries: DiaryEntry[];
  error: string;
  clearError: () => void;
  refresh: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  sendVerificationCode: (email: string, name?: string) => Promise<{ success: boolean; message: string; realEmail: boolean; devCode?: string }>;
  register: (input: RegistrationInput) => Promise<void>;
  loginWithGoogle: () => void;
  logout: () => Promise<void>;
  updateUserProfile: (updates: Partial<User>) => Promise<void>;
  updateUserSettings: (settings: Partial<User['settings']>) => Promise<void>;
  saveAppearance: (page: NonNullable<User['settings']['page']>, global: NonNullable<User['settings']['global']>) => Promise<void>;
  setPaperTheme: (theme: User['settings']['paperTheme']) => Promise<void>;
  createEntry: (entry: Partial<DiaryEntry> & { seconds?: number; photoUploads?: string[] }) => Promise<DiaryEntry>;
  updateEntry: (entryId: string, updates: Partial<DiaryEntry>) => Promise<void>;
  deleteEntry: (entryId: string) => Promise<void>;
  toggleReaction: (entryId: string, type: string) => Promise<void>;
  addComment: (entryId: string, text: string, isAnonymous?: boolean) => Promise<void>;
  sendFriendRequest: (userId: string) => Promise<void>;
  acceptFriendRequest: (userId: string) => Promise<void>;
  declineFriendRequest: (userId: string) => Promise<void>;
  removeFriend: (userId: string) => Promise<void>;
  toggleFriendDiaryAccess: (userId: string, allowed: boolean) => Promise<void>;
  searchUsers: (query: string) => Promise<User[]>;
  canUserViewEntry: (entry: DiaryEntry, viewerId?: string) => boolean;
  exportDiary: (format: 'markdown' | 'json') => void;
  deleteAccount: () => Promise<void>;
  // Admin Privileged Operations
  getAdminOverview: () => Promise<AdminOverview>;
  getAdminUsers: () => Promise<AdminUserMetric[]>;
  sendBroadcastEmail: (payload: BroadcastEmailPayload) => Promise<{ success: boolean; message: string; total: number; sent: number; failed: number; devMode?: boolean }>;
  getAdminPublicEntries: () => Promise<DiaryEntry[]>;
  adminDeleteEntry: (entryId: string) => Promise<void>;
  getSystemAnnouncement: () => Promise<{ text: string; type: string } | null>;
  setSystemAnnouncement: (text: string, type?: string, active?: boolean) => Promise<void>;
}

const DiaryContext = createContext<DiaryContextType | undefined>(undefined);

async function api<T = any>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...init.headers,
    },
  });
  if (response.status === 204) return undefined as T;
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || `Request failed (${response.status}).`);
  return result as T;
}

const asUser = (user: any): User => ({
  ...emptyUser,
  ...user,
  displayName: user?.displayName || user?.name || '',
  joinedDate: user?.joinedDate || user?.createdAt || '',
  friendIds: user?.friendIds || [],
  friendRequestsSent: user?.friendRequestsSent || [],
  friendRequestsReceived: user?.friendRequestsReceived || [],
  perFriendSettings: user?.perFriendSettings || {},
  isAdmin: Boolean(user?.isAdmin),
  adminRank: user?.adminRank || null,
  termsAccepted: user?.termsAccepted !== false,
  emailOptIn: user?.emailOptIn !== false,
  settings: { ...emptyUser.settings, ...(user?.settings && typeof user.settings === 'object' ? user.settings : {}) },
});

export const DiaryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const currentUserRef = useRef<User | null>(null);
  currentUserRef.current = currentUser;
  // Normalize the user so older/malformed API records cannot crash the UI.
  // Memoised: a new object on every render made every consumer re-render.
  const displayedUser = useMemo(() => asUser(currentUser || emptyUser), [currentUser]);

  const applyEntry = useCallback((entry: DiaryEntry) => {
    setEntries((previous) => {
      const index = previous.findIndex((item) => item.id === entry.id);
      if (index < 0) return [entry, ...previous];
      const next = [...previous];
      next[index] = entry;
      return next;
    });
  }, []);

  const refresh = useCallback(async () => {
    const [me, directory, journal] = await Promise.all([
      api<{ user: any }>('/api/auth/me'),
      api<{ users: any[]; currentUser: any }>('/api/users'),
      api<{ entries: DiaryEntry[] }>('/api/entries'),
    ]);
    const signedIn = asUser(me?.user);
    setCurrentUser(signedIn);
    setUsers((directory.users || []).map(asUser));
    setEntries(journal.entries || []);
    typewriterAudio.setSoundProfile(signedIn.settings?.soundEnabled ? (signedIn.settings?.soundType || 'mechanical') : 'mute');
  }, []);

  useEffect(() => {
    let active = true;
    api<{ user: any }>('/api/auth/me')
      .then(async ({ user }) => {
        if (!active) return;
        setCurrentUser(asUser(user));
        const [directory, journal] = await Promise.all([
          api<{ users: any[] }>('/api/users'),
          api<{ entries: DiaryEntry[] }>('/api/entries'),
        ]);
        if (!active) return;
        setUsers((directory.users || []).map(asUser));
        setEntries(journal.entries || []);
        typewriterAudio.setSoundProfile(user.settings?.soundEnabled === false ? 'mute' : (user.settings?.soundType || 'mechanical'));
      })
      .catch((reason) => {
        if (active && !String(reason?.message || '').toLowerCase().includes('signed in')) setError(String(reason?.message || 'Could not reach the diary service.'));
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => { active = false; };
  }, []);

  // Cheap refreshers: friend actions only need the directory and the entries
  // list, not a full session + directory + entries reload.
  const refreshDirectory = useCallback(async () => {
    const directory = await api<{ users: any[] }>('/api/users');
    setUsers((directory.users || []).map(asUser));
  }, []);

  const refreshEntries = useCallback(async () => {
    const journal = await api<{ entries: DiaryEntry[] }>('/api/entries');
    setEntries(journal.entries || []);
  }, []);

  // Merge only the social fields of an account, so a slow response can never
  // overwrite newer profile or appearance settings.
  const applySocialState = useCallback((incoming: any): boolean => {
    const previous = currentUserRef.current;
    if (!incoming || !previous) return false;
    const next = asUser(incoming);
    const sameList = (a: string[] = [], b: string[] = []) => a.length === b.length && a.every((id, index) => id === b[index]);
    const friendsChanged = !sameList(previous.friendIds, next.friendIds);
    const unchanged = !friendsChanged
      && sameList(previous.friendRequestsSent, next.friendRequestsSent)
      && sameList(previous.friendRequestsReceived, next.friendRequestsReceived)
      && JSON.stringify(previous.perFriendSettings || {}) === JSON.stringify(next.perFriendSettings || {});
    if (!unchanged) {
      setCurrentUser((user) => user ? {
        ...user,
        friendIds: next.friendIds,
        friendRequestsSent: next.friendRequestsSent,
        friendRequestsReceived: next.friendRequestsReceived,
        perFriendSettings: next.perFriendSettings,
      } : user);
    }
    return friendsChanged;
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    let stopped = false;
    const pingAndRefreshPresence = () => {
      if (document.visibilityState === 'hidden') return;
      Promise.all([
        api<{ user?: any }>('/api/presence', { method: 'POST' }),
        api<{ users: any[] }>('/api/users'),
      ])
        .then(([presence, directory]) => {
          if (stopped) return;
          setUsers((directory.users || []).map(asUser));
          // Picks up requests that arrived from other people while this tab was open.
          if (applySocialState(presence?.user)) void refreshEntries().catch(() => undefined);
        })
        .catch(() => undefined);
    };
    pingAndRefreshPresence();
    const interval = window.setInterval(pingAndRefreshPresence, 30_000);
    document.addEventListener('visibilitychange', pingAndRefreshPresence);
    return () => {
      stopped = true;
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', pingAndRefreshPresence);
    };
  }, [currentUser?.id, applySocialState, refreshEntries]);

  const withError = useCallback(async <T,>(operation: () => Promise<T>): Promise<T> => {
    try {
      setError('');
      return await operation();
    } catch (reason: any) {
      const message = reason?.message || 'That action could not be completed.';
      setError(message);
      throw reason;
    }
  }, []);

  const login = useCallback((email: string, password: string) => withError(async () => {
    const result = await api<{ user: any }>('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
    setCurrentUser(asUser(result.user));
    await refresh();
  }), [refresh, withError]);

  const sendVerificationCode = useCallback((email: string, name?: string) => withError(async () => {
    return api<{ success: boolean; message: string; realEmail: boolean; devCode?: string }>(
      '/api/auth/send-verification-code',
      {
        method: 'POST',
        body: JSON.stringify({ email, name }),
      }
    );
  }), [withError]);

  const register = useCallback((input: RegistrationInput) => withError(async () => {
    const result = await api<{ user: any }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: input.displayName,
        username: input.username,
        bio: input.bio,
        email: input.email,
        password: input.password,
        verificationCode: input.verificationCode,
        termsAccepted: input.termsAccepted ?? true,
        emailOptIn: input.emailOptIn ?? true,
      }),
    });
    setCurrentUser(asUser(result.user));
    await refresh();
  }), [refresh, withError]);

  const loginWithGoogle = useCallback(() => {
    window.location.assign(`${API_BASE}/api/auth/google/start`);
  }, []);

  const logout = useCallback(() => withError(async () => {
    await api('/api/auth/logout', { method: 'POST' });
    setCurrentUser(null);
    setUsers([]);
    setEntries([]);
  }), [withError]);

  const updateUserProfile = useCallback((updates: Partial<User>) => withError(async () => {
    const payload = {
      name: updates.displayName ?? currentUser?.displayName,
      username: updates.username ?? currentUser?.username,
      bio: updates.bio ?? currentUser?.bio,
      avatar: updates.avatar ?? currentUser?.avatar,
      defaultPrivacy: updates.defaultPrivacy ?? currentUser?.defaultPrivacy,
      settings: updates.settings ?? currentUser?.settings,
    };
    const result = await api<{ user: any }>('/api/profile', { method: 'PATCH', body: JSON.stringify(payload) });
    setCurrentUser(asUser(result.user));
  }), [currentUser, withError]);

  const updateUserSettings = useCallback((settings: Partial<User['settings']>) => withError(async () => {
    if (!currentUser) return;
    const next = { ...currentUser.settings, ...settings };
    const result = await api<{ user: any }>('/api/profile', {
      method: 'PATCH',
      body: JSON.stringify({ settings: next }),
    });
    setCurrentUser(asUser(result.user));
    typewriterAudio.setSoundProfile(next.soundEnabled ? next.soundType : 'mute');
  }), [currentUser, withError]);

  const setPaperTheme = useCallback((paperTheme: User['settings']['paperTheme']) => (
    updateUserSettings({ paperTheme })
  ), [updateUserSettings]);

  const saveAppearance = useCallback((page: NonNullable<User['settings']['page']>, global: NonNullable<User['settings']['global']>) => withError(async () => {
    const result = await api<{ settings: User['settings'] }>('/api/settings', {
      method: 'PUT',
      body: JSON.stringify({ page, global }),
    });
    setCurrentUser((user) => user ? { ...user, settings: { ...user.settings, ...result.settings } } : user);
  }), [withError]);

  const createEntry = useCallback((entry: Partial<DiaryEntry> & { seconds?: number; photoUploads?: string[] }) => withError(async () => {
    const result = await api<{ entry: DiaryEntry }>('/api/entries', {
      method: 'POST',
      body: JSON.stringify(entry),
    });
    applyEntry(result.entry);
    return result.entry;
  }), [applyEntry, withError]);

  const updateEntry = useCallback((entryId: string, updates: Partial<DiaryEntry>) => withError(async () => {
    const result = await api<{ entry: DiaryEntry }>(`/api/entries/${encodeURIComponent(entryId)}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
    applyEntry(result.entry);
  }), [applyEntry, withError]);

  const deleteEntry = useCallback((entryId: string) => withError(async () => {
    await api(`/api/entries/${encodeURIComponent(entryId)}`, { method: 'DELETE' });
    setEntries((previous) => previous.filter((entry) => entry.id !== entryId));
  }), [withError]);

  const toggleReaction = useCallback((entryId: string, type: string) => withError(async () => {
    const result = await api<{ entry: DiaryEntry }>(`/api/entries/${encodeURIComponent(entryId)}/reactions`, {
      method: 'POST',
      body: JSON.stringify({ type }),
    });
    applyEntry(result.entry);
  }), [applyEntry, withError]);

  const addComment = useCallback((entryId: string, text: string, isAnonymous = false) => withError(async () => {
    const result = await api<{ entry: DiaryEntry }>(`/api/entries/${encodeURIComponent(entryId)}/comments`, {
      method: 'POST',
      body: JSON.stringify({ text, isAnonymous }),
    });
    applyEntry(result.entry);
  }), [applyEntry, withError]);

  // The server answers every friend action with the updated account, so the
  // UI updates from that single response instead of reloading everything.
  const mutateFriend = useCallback((url: string, method: string, body?: object, { reloadEntries = false } = {}) => withError(async () => {
    const result = await api<{ user?: any } | undefined>(url, { method, ...(body ? { body: JSON.stringify(body) } : {}) });
    if (result?.user) {
      applySocialState(result.user);
    } else {
      await refresh();
      return;
    }
    // Directory / entries only need a background refresh; never block the button on them.
    void refreshDirectory().catch(() => undefined);
    if (reloadEntries) void refreshEntries().catch(() => undefined);
  }), [applySocialState, refresh, refreshDirectory, refreshEntries, withError]);

  const sendFriendRequest = useCallback(async (userId: string) => {
    // Optimistic: show "Request Sent" immediately, roll back if the server refuses.
    const previous = currentUser;
    setCurrentUser((user) => user && !user.friendRequestsSent.includes(userId)
      ? { ...user, friendRequestsSent: [...user.friendRequestsSent, userId] }
      : user);
    try {
      await mutateFriend('/api/friends/requests', 'POST', { userId }, { reloadEntries: true });
    } catch (reason) {
      setCurrentUser((user) => user && previous
        ? { ...user, friendRequestsSent: previous.friendRequestsSent, friendIds: previous.friendIds }
        : user);
      throw reason;
    }
  }, [currentUser, mutateFriend]);
  const acceptFriendRequest = useCallback((userId: string) => mutateFriend(`/api/friends/requests/${encodeURIComponent(userId)}/accept`, 'POST', undefined, { reloadEntries: true }), [mutateFriend]);
  const declineFriendRequest = useCallback((userId: string) => mutateFriend(`/api/friends/requests/${encodeURIComponent(userId)}`, 'DELETE'), [mutateFriend]);
  const removeFriend = useCallback((userId: string) => mutateFriend(`/api/friends/${encodeURIComponent(userId)}`, 'DELETE', undefined, { reloadEntries: true }), [mutateFriend]);
  const toggleFriendDiaryAccess = useCallback((userId: string, allowed: boolean) => (
    mutateFriend(`/api/friends/${encodeURIComponent(userId)}/settings`, 'PATCH', { canViewFriendOnlyPosts: allowed })
  ), [mutateFriend]);

  const searchUsers = useCallback(async (query: string) => {
    const result = await api<{ users: any[] }>(`/api/users?q=${encodeURIComponent(query)}`);
    return (result.users || []).map(asUser);
  }, []);

  const canUserViewEntry = useCallback((entry: DiaryEntry, viewerId = currentUser?.id || '') => {
    if (entry.authorId === viewerId || entry.visibility === 'public') return true;
    if (entry.visibility === 'private') return false;
    const viewer = viewerId === currentUser?.id ? currentUser : users.find((user) => user.id === viewerId);
    return Boolean(
      typeof entry.authorId === 'string' &&
      viewer?.friendIds.includes(entry.authorId) &&
      (entry.visibility !== 'custom_friends' || entry.allowedFriendIds.includes(viewerId)),
    );
  }, [currentUser, users]);

  const exportDiary = useCallback((format: 'markdown' | 'json') => {
    const ownEntries = entries.filter((entry) => entry.authorId === currentUser?.id);
    const content = format === 'json'
      ? JSON.stringify(ownEntries, null, 2)
      : ownEntries.map((entry) => `# ${entry.title}\n\n${entry.content}\n\n---\n${new Date(entry.createdAt).toLocaleString()}\nPrivacy: ${entry.visibility}\n`).join('\n');
    const blob = new Blob([content], { type: format === 'json' ? 'application/json' : 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `typing-diary-${new Date().toISOString().slice(0, 10)}.${format === 'json' ? 'json' : 'md'}`;
    anchor.click();
    URL.revokeObjectURL(url);
  }, [currentUser?.id, entries]);

  const deleteAccount = useCallback(() => withError(async () => {
    await api('/api/auth/me', { method: 'DELETE' });
    setCurrentUser(null);
    setUsers([]);
    setEntries([]);
  }), [withError]);

  // Admin Privileged Operations
  const getAdminOverview = useCallback(async (): Promise<AdminOverview> => {
    return api<AdminOverview>('/api/admin/overview');
  }, []);

  const getAdminUsers = useCallback(async (): Promise<AdminUserMetric[]> => {
    const data = await api<{ users: AdminUserMetric[] }>('/api/admin/users');
    return data.users || [];
  }, []);

  const sendBroadcastEmail = useCallback(async (payload: BroadcastEmailPayload) => {
    return api<{ success: boolean; message: string; total: number; sent: number; failed: number; devMode?: boolean }>(
      '/api/admin/broadcast-email',
      { method: 'POST', body: JSON.stringify(payload) }
    );
  }, []);

  const getAdminPublicEntries = useCallback(async (): Promise<DiaryEntry[]> => {
    const data = await api<{ entries: DiaryEntry[] }>('/api/admin/public-entries');
    return data.entries || [];
  }, []);

  const adminDeleteEntry = useCallback(async (entryId: string) => {
    await api(`/api/admin/entries/${encodeURIComponent(entryId)}`, { method: 'DELETE' });
    setEntries((prev) => prev.filter((e) => e.id !== entryId));
  }, []);

  const getSystemAnnouncement = useCallback(async () => {
    const data = await api<{ announcement: { text: string; type: string } | null }>('/api/announcement');
    return data.announcement || null;
  }, []);

  const setSystemAnnouncement = useCallback(async (text: string, type = 'info', active = true) => {
    await api('/api/admin/announcement', {
      method: 'POST',
      body: JSON.stringify({ text, type, active }),
    });
  }, []);

  const value = useMemo<DiaryContextType>(() => ({
    currentUser: displayedUser,
    isAuthenticated: currentUser !== null,
    isLoading,
    users,
    entries,
    error,
    clearError: () => setError(''),
    refresh,
    login,
    sendVerificationCode,
    register,
    loginWithGoogle,
    logout,
    updateUserProfile,
    updateUserSettings,
    saveAppearance,
    setPaperTheme,
    createEntry,
    updateEntry,
    deleteEntry,
    toggleReaction,
    addComment,
    sendFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
    removeFriend,
    toggleFriendDiaryAccess,
    searchUsers,
    canUserViewEntry,
    exportDiary,
    deleteAccount,
    getAdminOverview,
    getAdminUsers,
    sendBroadcastEmail,
    getAdminPublicEntries,
    adminDeleteEntry,
    getSystemAnnouncement,
    setSystemAnnouncement,
  }), [
    displayedUser, currentUser, isLoading, users, entries, error, refresh, login, sendVerificationCode, register, loginWithGoogle, logout,
    updateUserProfile, updateUserSettings, saveAppearance, setPaperTheme, createEntry, updateEntry, deleteEntry, toggleReaction, addComment,
    sendFriendRequest, acceptFriendRequest, declineFriendRequest, removeFriend, toggleFriendDiaryAccess, searchUsers,
    canUserViewEntry, exportDiary, deleteAccount,
    getAdminOverview, getAdminUsers, sendBroadcastEmail, getAdminPublicEntries, adminDeleteEntry, getSystemAnnouncement, setSystemAnnouncement,
  ]);

  return <DiaryContext.Provider value={value}>{children}</DiaryContext.Provider>;
};

export const useDiary = (): DiaryContextType => {
  const context = useContext(DiaryContext);
  if (!context) throw new Error('useDiary must be used within a DiaryProvider');
  return context;
};
