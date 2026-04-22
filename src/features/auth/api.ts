import { PortalPage } from "@/features/auth/permissions";

export type AuthUser = {
  id: number;
  email: string;
  full_name: string;
  position: {
    guid: string;
    name: string;
  };
};

export type LoginResponse = {
  token: string;
  user: AuthUser;
  iin: string;
  allowed_pages: PortalPage[];
};

export type MeResponse = {
  user: AuthUser;
  iin: string;
  allowed_pages: PortalPage[];
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type RegisterPayload = {
  email: string;
  password: string;
  iin: string;
};

const API_BASE_URL = "/api";

async function parseErrorMessage(response: Response): Promise<string> {
  const raw = await response.text();
  try {
    const parsed = JSON.parse(raw) as { detail?: string };
    if (parsed.detail) {
      return parsed.detail;
    }
  } catch {
    // no-op
  }
  return raw || `Request failed with status ${response.status}`;
}

export const authApi = {
  async register(payload: RegisterPayload): Promise<LoginResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/register/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(await parseErrorMessage(response));
    }

    return (await response.json()) as LoginResponse;
  },

  async login(payload: LoginPayload): Promise<LoginResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/login/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(await parseErrorMessage(response));
    }

    return (await response.json()) as LoginResponse;
  },

  async me(): Promise<MeResponse> {
    const token = typeof window !== "undefined" ? window.localStorage.getItem("auth_token") : null;
    const response = await fetch(`${API_BASE_URL}/auth/me/`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Token ${token}` } : {}),
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(await parseErrorMessage(response));
    }

    return (await response.json()) as MeResponse;
  },

  async logout(): Promise<void> {
    const token = typeof window !== "undefined" ? window.localStorage.getItem("auth_token") : null;
    await fetch(`${API_BASE_URL}/auth/logout/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Token ${token}` } : {}),
      },
      cache: "no-store",
    });
  },
};
