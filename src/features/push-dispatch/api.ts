import { NotificationCityOption, SendPushPayload, SendPushResponse } from "@/features/push-dispatch/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "/api";
const REQUEST_TIMEOUT_MS = 45000;

function getAuthHeader(): Record<string, string> {
  if (typeof window === "undefined") {
    return {};
  }

  const token = window.localStorage.getItem("auth_token");
  if (!token) {
    return {};
  }

  return { Authorization: `Token ${token}` };
}

async function parseErrorMessage(response: Response): Promise<string> {
  const raw = await response.text();

  try {
    const parsed = JSON.parse(raw) as { detail?: string; non_field_errors?: string[] };
    if (parsed.detail) {
      return parsed.detail;
    }
    if (parsed.non_field_errors && parsed.non_field_errors.length > 0) {
      return parsed.non_field_errors.join(", ");
    }
  } catch {
    // no-op
  }

  return raw || `Request failed with status ${response.status}`;
}

function buildUrl(path: string, params?: Record<string, string | number>) {
  const query = new URLSearchParams();

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      query.set(key, String(value));
    }
  }

  const queryString = query.toString();
  return `${API_BASE_URL}${path}${queryString ? `?${queryString}` : ""}`;
}

async function fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("Превышено время ожидания ответа API. Попробуйте еще раз.");
    }
    throw error;
  } finally {
    window.clearTimeout(timer);
  }
}

export const pushDispatchApi = {
  async listCities(search = ""): Promise<NotificationCityOption[]> {
    const response = await fetchWithTimeout(buildUrl("/notifications/cities/", search ? { search } : undefined), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(await parseErrorMessage(response));
    }

    return (await response.json()) as NotificationCityOption[];
  },

  async sendPush(payload: SendPushPayload): Promise<SendPushResponse> {
    if (payload.target === "phones" && payload.excelFile) {
      const formData = new FormData();
      formData.append("target", payload.target);
      formData.append("title", payload.title);
      formData.append("body", payload.body);
      formData.append("title_kz", payload.titleKz || "");
      formData.append("body_kz", payload.bodyKz || "");
      formData.append("notification_type", payload.notificationType || "default");
      formData.append("excel_file", payload.excelFile);

      for (const phone of payload.phoneNumbers || []) {
        formData.append("phone_numbers", phone);
      }

      const multipartResponse = await fetchWithTimeout(`${API_BASE_URL}/notifications/push-dispatch/`, {
        method: "POST",
        headers: {
          ...getAuthHeader(),
        },
        body: formData,
        cache: "no-store",
      });

      if (!multipartResponse.ok) {
        throw new Error(await parseErrorMessage(multipartResponse));
      }

      return (await multipartResponse.json()) as SendPushResponse;
    }

    const response = await fetchWithTimeout(`${API_BASE_URL}/notifications/push-dispatch/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
      body: JSON.stringify({
        target: payload.target,
        phone_numbers: payload.phoneNumbers || [],
        city_id: payload.cityId,
        title: payload.title,
        body: payload.body,
        title_kz: payload.titleKz || "",
        body_kz: payload.bodyKz || "",
        notification_type: payload.notificationType || "default",
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(await parseErrorMessage(response));
    }

    return (await response.json()) as SendPushResponse;
  },
};
