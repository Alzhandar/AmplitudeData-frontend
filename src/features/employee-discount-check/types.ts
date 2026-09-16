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
