import { useEffect, useState } from "react";

import { analyticsApi } from "./api";
import { DailyActivityItem, MobileRegistrationsStats, PresenceStats } from "./types";

type DashboardState = {
  activity: DailyActivityItem[];
  stats: PresenceStats | null;
  loading: boolean;
  error: string | null;
  lastUpdatedAt: string | null;
};

const initialState: DashboardState = {
  activity: [],
  stats: null,
  loading: false,
  error: null,
  lastUpdatedAt: null,
};

export function useAnalyticsDashboard(startDate: string, endDate: string, windowHours: number, enabled: boolean = true) {
  const [state, setState] = useState<DashboardState>(initialState);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const controller = new AbortController();

    const load = async () => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const [activity, stats] = await Promise.all([
          analyticsApi.getDailyActivity(startDate, controller.signal),
          analyticsApi.getPresenceStats(startDate, endDate, windowHours, controller.signal),
        ]);

        setState({
          activity,
          stats,
          loading: false,
          error: null,
          lastUpdatedAt: new Date().toISOString(),
        });
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        const message = error instanceof Error ? error.message : "Не удалось загрузить данные";

        setState((prev) => ({
          ...prev,
          loading: false,
          error: message,
        }));
      }
    };

    void load();

    return () => {
      controller.abort();
    };
  }, [startDate, endDate, windowHours, enabled]);

  return state;
}

type RegistrationsState = {
  data: MobileRegistrationsStats | null;
  loading: boolean;
  error: string | null;
};

const initialRegistrationsState: RegistrationsState = {
  data: null,
  loading: false,
  error: null,
};

export function useMobileRegistrationsStats(
  startDate: string,
  endDate: string,
  enabled: boolean = true,
) {
  const [state, setState] = useState<RegistrationsState>(initialRegistrationsState);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const controller = new AbortController();

    const load = async () => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const data = await analyticsApi.getMobileRegistrationsStats(
          startDate,
          endDate,
          controller.signal,
        );
        setState({ data, loading: false, error: null });
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }
        const message = error instanceof Error ? error.message : "Не удалось загрузить данные";
        setState((prev) => ({ ...prev, loading: false, error: message }));
      }
    };

    void load();

    return () => {
      controller.abort();
    };
  }, [startDate, endDate, enabled]);

  return state;
}
