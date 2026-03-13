const STORAGE_TOKEN_KEY = 'ksef_token';
const STORAGE_USER_KEY = 'ksef_user';
const STORAGE_LEVEL_KEY = 'ksef-level';

export type StoredUser = {
  _id: string;
  fullName: string;
  email: string;
  username?: string;
  phone?: string;
  role: 'admin' | 'judge' | 'patron';
  schoolId?: string;
  mustChangePassword?: boolean;
};

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(STORAGE_TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (typeof window === 'undefined') return;
  if (token) {
    localStorage.setItem(STORAGE_TOKEN_KEY, token);
  } else {
    localStorage.removeItem(STORAGE_TOKEN_KEY);
  }
}

export function getStoredUser(): StoredUser | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(STORAGE_USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredUser;
  } catch {
    return null;
  }
}

export function setStoredUser(user: StoredUser | null) {
  if (typeof window === 'undefined') return;
  if (user) {
    localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(STORAGE_USER_KEY);
  }
}

export function clearAuth() {
  setToken(null);
  setStoredUser(null);
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_LEVEL_KEY);
  }
}
