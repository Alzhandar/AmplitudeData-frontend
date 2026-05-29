import { apiClient } from "@/features/common/api-client";
import {
  CouponDispatchJob,
  CouponDispatchJobDetail,
  CreateCouponDispatchJobPayload,
  MarketingSaleOption,
} from "@/features/coupon-dispatch/types";

export const couponDispatchApi = {
  listMarketingSales(search: string, signal?: AbortSignal): Promise<MarketingSaleOption[]> {
    return apiClient.get<MarketingSaleOption[]>(
      "/coupon-dispatch/marketing-sales/",
      search ? { search } : undefined,
      signal,
    );
  },

  listJobs(limit = 20): Promise<CouponDispatchJob[]> {
    return apiClient.get<CouponDispatchJob[]>("/coupon-dispatch/jobs/", { limit });
  },

  getJob(jobId: number): Promise<CouponDispatchJobDetail> {
    return apiClient.get<CouponDispatchJobDetail>(`/coupon-dispatch/jobs/${jobId}/`);
  },

  createJob(payload: CreateCouponDispatchJobPayload): Promise<CouponDispatchJobDetail> {
    const formData = new FormData();
    formData.append("dispatch_mode", payload.dispatchMode);
    formData.append("title", payload.title);
    formData.append("valid_until", payload.validUntil);
    if (payload.marketingSaleId) formData.append("marketing_sale_id", String(payload.marketingSaleId));
    if (payload.phonesText) formData.append("phones_text", payload.phonesText);
    if (payload.excelFile) formData.append("excel_file", payload.excelFile);

    return apiClient.postForm<CouponDispatchJobDetail>("/coupon-dispatch/jobs/", formData);
  },
};
