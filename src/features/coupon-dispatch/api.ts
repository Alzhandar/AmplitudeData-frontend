import {
  CouponDispatchJob,
  CouponDispatchJobDetail,
  CreateCouponDispatchJobPayload,
  MarketingSaleOption,
} from "@/features/coupon-dispatch/types";
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

export const couponDispatchApi = {
  async listMarketingSales(search: string, signal?: AbortSignal): Promise<MarketingSaleOption[]> {
    const response = await fetchWithTimeout(
      buildUrl("/coupon-dispatch/marketing-sales/", search ? { search } : undefined),
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
        cache: "no-store",
        signal,
      },
    );

    if (!response.ok) {
      throw new Error(await parseErrorMessage(response));
    }

    return (await response.json()) as MarketingSaleOption[];
  },

  async listJobs(limit = 20): Promise<CouponDispatchJob[]> {
    const response = await fetchWithTimeout(buildUrl("/coupon-dispatch/jobs/", { limit }), {
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

    return (await response.json()) as CouponDispatchJob[];
  },

  async getJob(jobId: number): Promise<CouponDispatchJobDetail> {
    const response = await fetchWithTimeout(`${API_BASE_URL}/coupon-dispatch/jobs/${jobId}/`, {
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

    return (await response.json()) as CouponDispatchJobDetail;
  },

  async createJob(payload: CreateCouponDispatchJobPayload): Promise<CouponDispatchJobDetail> {
    const formData = new FormData();
    formData.append("title", payload.title);
    formData.append("marketing_sale_id", String(payload.marketingSaleId));
    if (payload.marketingSaleName) {
      formData.append("marketing_sale_name", payload.marketingSaleName);
    }
    if (payload.phonesText) {
      formData.append("phones_text", payload.phonesText);
    }
    if (payload.excelFile) {
      formData.append("excel_file", payload.excelFile);
    }

    const response = await fetchWithTimeout(`${API_BASE_URL}/coupon-dispatch/jobs/`, {
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

    return (await response.json()) as CouponDispatchJobDetail;
  },
};
