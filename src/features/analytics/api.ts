import { DailyActivityItem, PresenceStats } from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "/api";

type ErrorPayload = {
  detail?: string;
  start_date?: string;
  end_date?: string;
  date?: string;
  window_hours?: string;
};

export type VisitSearchByPhonesRequest = {
  start_date: string;
  end_date: string;
  phones: string[];
};

function buildUrl(path: string, params?: Record<string, string | number>) {
  const query = new URLSearchParams();
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      query.set(key, String(value));
    }
  }

  const serialized = query.toString();
  return `${API_BASE_URL}${path}${serialized ? `?${serialized}` : ""}`;
}

async function parseErrorMessage(response: Response): Promise<string> {
  const raw = await response.text();

  try {
    const parsed = JSON.parse(raw) as ErrorPayload;
    if (parsed.detail) {
      return parsed.detail;
    }
    if (parsed.start_date) {
      return parsed.start_date;
    }
    if (parsed.end_date) {
      return parsed.end_date;
    }
    if (parsed.date) {
      return parsed.date;
    }
    if (parsed.window_hours) {
      return parsed.window_hours;
    }
  } catch {
    if (!raw.trim().startsWith("<!DOCTYPE html")) {
      return raw;
    }
  }

  return `Request failed with status ${response.status}`;
}

async function getJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
    signal,
  });

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }

  return (await response.json()) as T;
}

async function postJson<TBody, TResponse>(
  url: string,
  body: TBody,
  signal?: AbortSignal,
): Promise<TResponse> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
    signal,
  });

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }

  return (await response.json()) as TResponse;
}

export const analyticsApi = {
  getDailyActivity(date: string, signal?: AbortSignal): Promise<DailyActivityItem[]> {
    return getJson<DailyActivityItem[]>(
      buildUrl("/amplitude/today-mobile-activity/", { date }),
      signal,
    );
  },

  getPresenceStats(startDate: string, endDate: string, windowHours: number, signal?: AbortSignal): Promise<PresenceStats> {
    return getJson<PresenceStats>(
      buildUrl("/amplitude/location-presence-stats/", {
        start_date: startDate,
        end_date: endDate,
        window_hours: windowHours,
      }),
      signal,
    );
  },

  /**
   * Поиск визитов по диапазону дат и списку телефонов.
   * POST /api/v1/visit-search-by-date-phones/
   */
  visitSearchByPhones(
    payload: VisitSearchByPhonesRequest,
    signal?: AbortSignal,
  ): Promise<DailyActivityItem[]> {
    return postJson<VisitSearchByPhonesRequest, DailyActivityItem[]>(
      `${API_BASE_URL}/amplitude/visit-search-by-date-phones/`,
      payload,
      signal,
    );
  },
};