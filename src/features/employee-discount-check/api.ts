import { apiClient } from "@/features/common/api-client";
import {
  EmployeeDiscountCheckResponse,
  EmployeeLookupResponse,
  EmployeePhoneChangeResponse,
} from "@/features/employee-discount-check/types";

export const employeeDiscountCheckApi = {
  checkByPhone(phone: string): Promise<EmployeeDiscountCheckResponse> {
    return apiClient.get<EmployeeDiscountCheckResponse>("/employee-discount-check/", { phone });
  },

  lookup(identifier: string): Promise<EmployeeLookupResponse> {
    return apiClient.get<EmployeeLookupResponse>("/employee-discount-check/lookup/", { identifier });
  },

  changePhone(identifier: string, newPhone: string): Promise<EmployeePhoneChangeResponse> {
    return apiClient.post<{ identifier: string; new_phone: string }, EmployeePhoneChangeResponse>(
      "/employee-discount-check/change-phone/",
      { identifier, new_phone: newPhone },
    );
  },
};
