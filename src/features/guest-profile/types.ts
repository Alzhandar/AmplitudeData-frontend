export type GuestStatusCode = "active" | "blocked";

export type OrderItem = {
  id: number | null;
  name?: string;
  product_name?: string;
  quantity: number;
  price_without_discount: number;
  discount: number;
  total_sum: number;
};

export type OrderPayment = {
  id: number | null;
  payment_type_name: string;
  amount: number;
  cashback_amount?: number | null;
};

export type Order = {
  id: number;
  park_name: string;
  fact_sum: number;
  check_type: number; // 1 = sale, -1 = return
  status: number; // 0 = cancelled, 1 = pending, 2 = issued, 3 = archived
  waiter_name: string;
  receipt_number: number | null;
  c_created: string;
  items: OrderItem[];
  payments: OrderPayment[];
};

export type CashbackRecord = {
  id: number | null;
  type: number; // 1 = accrual, -1 = deduction
  amount: number;
  transaction_date: string;
  expiration_date: string | null;
};

export type CrystalRecord = {
  id: number | null;
  type: number; // 0=gift, 1=game, 2=birthday, 3=purchase
  amount: number;
  date: string;
  description_ru: string;
};

export type MobileActivityRecord = {
  event_time: string | null;
  event_type: string;
  platform: string;
  device_id: string;
  device_model: string;
  device_brand: string;
  phone_number: string;
};

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
    results: Order[];
  };
  cashback_history: {
    count: number;
    results: CashbackRecord[];
  };
  crystal_history: {
    count: number;
    results: CrystalRecord[];
  };
  mobile_activity: {
    count: number;
    results: MobileActivityRecord[];
  };
  warnings: string[];
};
