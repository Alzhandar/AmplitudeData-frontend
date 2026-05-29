import { apiClient } from "@/features/common/api-client";
import {
  BonusTransactionJob,
  BonusTransactionJobDetail,
  CreateBonusTransactionJobPayload,
} from "@/features/bonus-transactions/types";

export const bonusTransactionsApi = {
  listJobs(limit = 20): Promise<BonusTransactionJob[]> {
    return apiClient.get<BonusTransactionJob[]>("/bonus-transactions/jobs/", { limit });
  },

  getJob(jobId: number): Promise<BonusTransactionJobDetail> {
    return apiClient.get<BonusTransactionJobDetail>(`/bonus-transactions/jobs/${jobId}/`);
  },

  createJob(payload: CreateBonusTransactionJobPayload): Promise<BonusTransactionJobDetail> {
    const formData = new FormData();
    formData.append("description", payload.description);
    formData.append("amount", String(payload.amount));
    formData.append("start_date", payload.startDate);
    formData.append("expiration_date", payload.expirationDate);
    if (payload.phonesText) formData.append("phones_text", payload.phonesText);
    if (payload.excelFile) formData.append("excel_file", payload.excelFile);

    return apiClient.postForm<BonusTransactionJobDetail>("/bonus-transactions/jobs/", formData);
  },
};
