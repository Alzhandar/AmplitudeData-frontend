// Token is stored as an httpOnly cookie set by the Next.js API route — never in localStorage.
// Only non-sensitive session data (IIN) is kept in localStorage.

export const AUTH_IIN_KEY = "auth_iin";

export function saveAuthSession(iin: string): void {
  window.localStorage.setItem(AUTH_IIN_KEY, iin);
}

export function clearAuthSession(): void {
  window.localStorage.removeItem(AUTH_IIN_KEY);
}

export function getStoredIin(): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(AUTH_IIN_KEY) ?? "";
}
