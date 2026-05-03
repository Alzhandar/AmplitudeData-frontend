export type BonusTransactionJobStatus = "pending" | "processing" | "completed" | "failed";

export type BonusTransactionJobResult = {
  id: number;
  phone_raw: string;
  phone_normalized: string;
  guest_id: number | null;
  doc_guid: string;
  base_id: string;
  success: boolean;
  error_message: string;
  created_at: string;
};

export type BonusTransactionJob = {
  id: number;
  description: string;
  amount: number;
  start_date: string;
  expiration_date: string;
  base_id_prefix: string;
  input_source: "manual" | "excel" | "mixed";
  status: BonusTransactionJobStatus;
  total_phones: number;
  unique_phones: number;
  guests_found: number;
  cashbacks_created: number;
  errors_count: number;
  started_at: string | null;
  finished_at: string | null;
  initiated_by_email: string;
  created_at: string;
  updated_at: string;
};

export type BonusTransactionJobDetail = BonusTransactionJob & {
  error_log: string;
  external_api_response: Record<string, unknown>;
  results: BonusTransactionJobResult[];
};

export type CreateBonusTransactionJobPayload = {
  description: string;
  amount: number;
  startDate: string;
  expirationDate: string;
  phonesText?: string;
  excelFile?: File | null;
};
