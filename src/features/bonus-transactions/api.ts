import {
  BonusTransactionJob,
  BonusTransactionJobDetail,
  CreateBonusTransactionJobPayload,
} from "@/features/bonus-transactions/types";
import { getNetworkErrorMessage, parseApiErrorMessage } from "@/features/common/api-error";

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
  return parseApiErrorMessage(response);
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
    throw new Error(getNetworkErrorMessage(error));
  } finally {
    window.clearTimeout(timer);
  }
}

export const bonusTransactionsApi = {
  async listJobs(limit = 20): Promise<BonusTransactionJob[]> {
    const response = await fetchWithTimeout(buildUrl("/bonus-transactions/jobs/", { limit }), {
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

    return (await response.json()) as BonusTransactionJob[];
  },

  async getJob(jobId: number): Promise<BonusTransactionJobDetail> {
    const response = await fetchWithTimeout(`${API_BASE_URL}/bonus-transactions/jobs/${jobId}/`, {
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

    return (await response.json()) as BonusTransactionJobDetail;
  },

  async createJob(payload: CreateBonusTransactionJobPayload): Promise<BonusTransactionJobDetail> {
    const formData = new FormData();
    formData.append("description", payload.description);
    formData.append("amount", String(payload.amount));
    formData.append("start_date", payload.startDate);
    formData.append("expiration_date", payload.expirationDate);
    if (payload.phonesText) {
      formData.append("phones_text", payload.phonesText);
    }
    if (payload.excelFile) {
      formData.append("excel_file", payload.excelFile);
    }

    const response = await fetchWithTimeout(`${API_BASE_URL}/bonus-transactions/jobs/`, {
      method: "POST",
      headers: {
        ...getAuthHeader(),
      },
      body: formData,
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(await parseErrorMessage(response));
    }

    return (await response.json()) as BonusTransactionJobDetail;
  },
};
