import { apiClient } from "@/features/common/api-client";
import { EmployeeDiscountCheckResponse } from "@/features/employee-discount-check/types";

export const employeeDiscountCheckApi = {
  checkByPhone(phone: string): Promise<EmployeeDiscountCheckResponse> {
    return apiClient.get<EmployeeDiscountCheckResponse>("/employee-discount-check/", { phone });
  },
};
