export type DiscountScopeResult = {
  eligible: boolean;
  remaining_discounts?: number | null;
  employee_name?: string | null;
  employee_department?: string | null;
  employee_position?: string | null;
  used_count?: number | null;
  max_discounts?: number | null;
  policy_name?: string | null;
  discount_scope?: string | null;
};

export type EmployeeDiscountCheckResponse = {
  phone: string;
  employee_found: boolean;
  restaurant: DiscountScopeResult;
  park: DiscountScopeResult;
};

export type EmployeePhoneChangeResponse = {
  employee_id: string;
  employee_name?: string;
  old_phone: string;
  new_phone: string;
};

export type EmployeeMatchedBy = "phone" | "iin" | "none";

export type EmployeeLookupResponse = {
  found: boolean;
  matched_by: EmployeeMatchedBy;
  employee_id?: string;
  employee_name?: string;
  employee_department?: string;
  employee_position?: string;
  current_phone?: string;
  iin?: string;
};
