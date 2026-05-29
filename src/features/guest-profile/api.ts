import { apiClient } from "@/features/common/api-client";
import { GuestProfileResponse } from "@/features/guest-profile/types";

export const guestProfileApi = {
  getByPhone(phone: string): Promise<GuestProfileResponse> {
    return apiClient.get<GuestProfileResponse>("/guest-profile/by-phone/", { phone });
  },
};
