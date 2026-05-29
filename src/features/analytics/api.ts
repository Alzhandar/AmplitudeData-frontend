import { apiClient, buildApiUrl } from "@/features/common/api-client";
import { DailyActivityItem, MobileRegistrationsStats, PresenceStats } from "./types";

export type VisitSearchByPhonesRequest = {
  start_date: string;
  end_date: string;
  phones: string[];
};

export const analyticsApi = {
  getDailyActivity(date: string, signal?: AbortSignal): Promise<DailyActivityItem[]> {
    return apiClient.get<DailyActivityItem[]>(
      "/amplitude/today-mobile-activity/",
      { date },
      signal,
    );
  },

  getPresenceStats(startDate: string, endDate: string, windowHours: number, signal?: AbortSignal): Promise<PresenceStats> {
    return apiClient.get<PresenceStats>(
      "/amplitude/location-presence-stats/",
      { start_date: startDate, end_date: endDate, window_hours: windowHours },
      signal,
    );
  },

  visitSearchByPhones(payload: VisitSearchByPhonesRequest, signal?: AbortSignal): Promise<DailyActivityItem[]> {
    return apiClient.post<VisitSearchByPhonesRequest, DailyActivityItem[]>(
      "/amplitude/visit-search-by-date-phones/",
      payload,
      signal,
    );
  },

  getMobileRegistrationsStats(startDate: string, endDate: string, signal?: AbortSignal): Promise<MobileRegistrationsStats> {
    const year = new Date(startDate).getFullYear();
    return apiClient.get<MobileRegistrationsStats>(
      "/amplitude/mobile-registrations-stats/",
      { year, start_date: startDate, end_date: endDate },
      signal,
    );
  },

};
