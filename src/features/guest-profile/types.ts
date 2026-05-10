export type GuestStatusCode = "active" | "blocked";

export type GuestProfileResponse = {
  phone: string;
  guest: {
    id: number;
    name: string;
    status: {
      code: GuestStatusCode;
      label: string;
      black_list: number;
      is_blocked: boolean;
    };
  };
  balances: {
    cashback: {
      sum: number;
      burn_date: string | null;
      burn_sum: number;
    };
    crystals: {
      total_crystals: number;
    };
  };
  purchase_history: {
    count: number;
    results: Array<Record<string, unknown>>;
  };
  cashback_history: {
    count: number;
    results: Array<Record<string, unknown>>;
  };
  crystal_history: {
    count: number;
    results: Array<Record<string, unknown>>;
  };
  mobile_activity: {
    count: number;
    results: Array<{
      event_time: string | null;
      event_type: string;
      platform: string;
      device_id: string;
      device_model: string;
      device_brand: string;
      phone_number: string;
    }>;
  };
  warnings: string[];
};
