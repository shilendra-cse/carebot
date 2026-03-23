const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
const TOKEN_KEY = "carebot_token";
const USER_KEY = "carebot_user";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  onboardingCompleted: boolean;
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveAuth(token: string, user: AuthUser) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function updateStoredUser(updates: Partial<AuthUser>) {
  const current = getUser();
  if (!current) return;
  const updated = { ...current, ...updates };
  localStorage.setItem(USER_KEY, JSON.stringify(updated));
}

export async function signUp(name: string, email: string, password: string) {
  const res = await fetch(`${API_URL}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Signup failed");

  saveAuth(data.data.token, data.data.user);
  return data.data;
}

export async function signIn(email: string, password: string) {
  const res = await fetch(`${API_URL}/auth/signin`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Signin failed");

  saveAuth(data.data.token, data.data.user);
  return data.data;
}

export function signOut() {
  clearAuth();
  window.location.href = "/signin";
}

export function isAuthenticated(): boolean {
  return !!getToken();
}
