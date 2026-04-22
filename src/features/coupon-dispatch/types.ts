export type MarketingSaleOption = {
  id: number;
  name: string;
  available_coupons: number;
};

export type CouponDispatchJobStatus = "pending" | "processing" | "completed" | "failed";

export type CouponDispatchJobResult = {
  id: number;
  phone_raw: string;
  phone_normalized: string;
  guest_id: number | null;
  coupon_id: number | null;
  coupon_code: string;
  success: boolean;
  error_message: string;
  created_at: string;
};

export type CouponDispatchJob = {
  id: number;
  title: string;
  marketing_sale_id: number;
  marketing_sale_name: string;
  input_source: "manual" | "excel" | "mixed";
  status: CouponDispatchJobStatus;
  total_phones: number;
  unique_phones: number;
  guests_found: number;
  available_coupons: number;
  coupons_assigned: number;
  errors_count: number;
  mobile_api_sent: boolean;
  mobile_api_sent_at: string | null;
  started_at: string | null;
  finished_at: string | null;
  initiated_by_email: string;
  created_at: string;
  updated_at: string;
};

export type CouponDispatchJobDetail = CouponDispatchJob & {
  error_log: string;
  mobile_api_response: Record<string, unknown>;
  results: CouponDispatchJobResult[];
};

export type CreateCouponDispatchJobPayload = {
  title: string;
  marketingSaleId: number;
  marketingSaleName?: string;
  phonesText?: string;
  excelFile?: File | null;
};
