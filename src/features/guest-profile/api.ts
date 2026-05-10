import { getNetworkErrorMessage, parseApiErrorMessage } from "@/features/common/api-error";
import { GuestProfileResponse } from "@/features/guest-profile/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "/api";

function getAuthHeader(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const token = window.localStorage.getItem("auth_token");
  return token ? { Authorization: `Token ${token}` } : {};
}

function buildUrl(path: string, params: Record<string, string | number>): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    query.set(key, String(value));
  }
  return `${API_BASE_URL}${path}?${query.toString()}`;
}

async function request(url: string): Promise<Response> {
  try {
    return await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
      cache: "no-store",
    });
  } catch (error) {
    throw new Error(getNetworkErrorMessage(error));
  }
}

export const guestProfileApi = {
  async getByPhone(phone: string): Promise<GuestProfileResponse> {
    const response = await request(buildUrl("/guest-profile/by-phone/", { phone }));
    if (!response.ok) {
      throw new Error(await parseApiErrorMessage(response));
    }

    return (await response.json()) as GuestProfileResponse;
  },
};
