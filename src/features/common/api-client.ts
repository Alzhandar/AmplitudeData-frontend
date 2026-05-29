import { getNetworkErrorMessage, parseApiErrorMessage } from "@/features/common/api-error";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "/api";
const TIMEOUT_MS = 45_000;

export function buildApiUrl(path: string, params?: Record<string, string | number>): string {
  if (!params) return `${API_BASE_URL}${path}`;
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    query.set(key, String(value));
  }
  return `${API_BASE_URL}${path}?${query.toString()}`;
}

/**
 * Returns a signal that aborts on timeout OR when the external signal aborts —
 * whichever comes first. Fixes the original bug where fetchWithTimeout
 * created its own controller and overwrote any externally passed signal.
 */
function withTimeout(externalSignal?: AbortSignal): AbortSignal {
  const controller = new AbortController();
  const timer = setTimeout(
    () => controller.abort(new DOMException("Request timed out", "AbortError")),
    TIMEOUT_MS,
  );

  const cleanup = () => clearTimeout(timer);
  controller.signal.addEventListener("abort", cleanup, { once: true });

  if (externalSignal) {
    if (externalSignal.aborted) {
      clearTimeout(timer);
      controller.abort(externalSignal.reason);
      return controller.signal;
    }
    externalSignal.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        controller.abort(externalSignal.reason);
      },
      { once: true },
    );
  }

  return controller.signal;
}

async function doFetch(url: string, init: RequestInit, signal?: AbortSignal): Promise<Response> {
  try {
    return await fetch(url, { ...init, cache: "no-store", signal: withTimeout(signal) });
  } catch (error) {
    throw new Error(getNetworkErrorMessage(error));
  }
}

async function parseOk<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new Error(await parseApiErrorMessage(response));
  }
  return response.json() as Promise<T>;
}

export const apiClient = {
  get<T>(path: string, params?: Record<string, string | number>, signal?: AbortSignal): Promise<T> {
    return doFetch(
      buildApiUrl(path, params),
      { method: "GET", headers: { "Content-Type": "application/json" } },
      signal,
    ).then((r) => parseOk<T>(r));
  },

  post<TBody, TResponse>(path: string, body: TBody, signal?: AbortSignal): Promise<TResponse> {
    return doFetch(
      `${API_BASE_URL}${path}`,
      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) },
      signal,
    ).then((r) => parseOk<TResponse>(r));
  },

  postForm<TResponse>(path: string, formData: FormData, signal?: AbortSignal): Promise<TResponse> {
    return doFetch(
      `${API_BASE_URL}${path}`,
      { method: "POST", body: formData },
      signal,
    ).then((r) => parseOk<TResponse>(r));
  },
};
