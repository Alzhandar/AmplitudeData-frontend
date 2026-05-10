export const AUTH_TOKEN_KEY = "auth_token";
export const AUTH_IIN_KEY = "auth_iin";

export function saveAuthSession(token: string, iin: string): void {
  window.localStorage.setItem(AUTH_TOKEN_KEY, token);
  window.localStorage.setItem(AUTH_IIN_KEY, iin);
}

export function clearAuthSession(): void {
  window.localStorage.removeItem(AUTH_TOKEN_KEY);
  window.localStorage.removeItem(AUTH_IIN_KEY);
}

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(AUTH_TOKEN_KEY);
}
