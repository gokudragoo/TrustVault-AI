const TOKEN_KEY = "trustvault.session";

export interface VaultSession {
  token: string;
  expiresAt: string;
}

export function getVaultSession(): VaultSession | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(TOKEN_KEY);
  if (!raw) return null;
  try {
    const session = JSON.parse(raw) as VaultSession;
    if (!session.token || new Date(session.expiresAt).getTime() <= Date.now()) {
      clearVaultSession();
      return null;
    }
    return session;
  } catch {
    clearVaultSession();
    return null;
  }
}

export function setVaultSession(session: VaultSession) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TOKEN_KEY, JSON.stringify(session));
}

export function clearVaultSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TOKEN_KEY);
}

export function authHeaders(): Record<string, string> {
  const session = getVaultSession();
  return session ? { Authorization: `Bearer ${session.token}` } : {};
}
