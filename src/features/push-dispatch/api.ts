import { apiClient } from "@/features/common/api-client";
import { NotificationCityOption, SendPushPayload, SendPushResponse } from "@/features/push-dispatch/types";

export const pushDispatchApi = {
  listCities(search = "", signal?: AbortSignal): Promise<NotificationCityOption[]> {
    return apiClient.get<NotificationCityOption[]>(
      "/notifications/cities/",
      search ? { search } : undefined,
      signal,
    );
  },

  sendPush(payload: SendPushPayload): Promise<SendPushResponse> {
    if (payload.target === "phones" && payload.excelFile) {
      const formData = new FormData();
      formData.append("target", payload.target);
      formData.append("title", payload.title);
      formData.append("body", payload.body);
      formData.append("title_kz", payload.titleKz || "");
      formData.append("body_kz", payload.bodyKz || "");
      formData.append("notification_type", payload.notificationType || "default");
      formData.append("excel_file", payload.excelFile);
      for (const phone of payload.phoneNumbers || []) {
        formData.append("phone_numbers", phone);
      }
      return apiClient.postForm<SendPushResponse>("/notifications/push-dispatch/", formData);
    }

    return apiClient.post<object, SendPushResponse>("/notifications/push-dispatch/", {
      target: payload.target,
      phone_numbers: payload.phoneNumbers || [],
      city_id: payload.cityId,
      title: payload.title,
      body: payload.body,
      title_kz: payload.titleKz || "",
      body_kz: payload.bodyKz || "",
      notification_type: payload.notificationType || "default",
    });
  },
};
