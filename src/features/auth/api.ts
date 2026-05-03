import { PortalPage } from "@/features/auth/permissions";
import { getNetworkErrorMessage, parseApiErrorMessage } from "@/features/common/api-error";

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

async function request(url: string, init: RequestInit): Promise<Response> {
  try {
    return await fetch(url, init);
  } catch (error) {
    throw new Error(getNetworkErrorMessage(error));
  }
}

export const authApi = {
  async register(payload: RegisterPayload): Promise<LoginResponse> {
    const response = await request(`${API_BASE_URL}/auth/register/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(await parseApiErrorMessage(response));
    }

    return (await response.json()) as LoginResponse;
  },

  async login(payload: LoginPayload): Promise<LoginResponse> {
    const response = await request(`${API_BASE_URL}/auth/login/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(await parseApiErrorMessage(response));
    }

    return (await response.json()) as LoginResponse;
  },

  async me(): Promise<MeResponse> {
    const token = typeof window !== "undefined" ? window.localStorage.getItem("auth_token") : null;
    const response = await request(`${API_BASE_URL}/auth/me/`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Token ${token}` } : {}),
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(await parseApiErrorMessage(response));
    }

    return (await response.json()) as MeResponse;
  },

  async logout(): Promise<void> {
    const token = typeof window !== "undefined" ? window.localStorage.getItem("auth_token") : null;
    await request(`${API_BASE_URL}/auth/logout/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Token ${token}` } : {}),
      },
      cache: "no-store",
    });
  },
};
