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

// ---------------------------------------------------------------------------
// useMobileRegistrationsComparison
// ---------------------------------------------------------------------------

type ComparisonState = {
  current: MobileRegistrationsStats | null;
  previous: MobileRegistrationsStats | null;
  delta: number | null;
  deltaPercent: number | null;
  avgPerDay: number | null;
  canCompare: boolean;
  loading: boolean;
  error: string | null;
};

function computePreviousPeriod(
  startDate: string,
  endDate: string,
): { prevStart: string; prevEnd: string } | null {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const days = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  const prevEnd = new Date(start);
  prevEnd.setDate(prevEnd.getDate() - 1);

  const prevStart = new Date(prevEnd);
  prevStart.setDate(prevStart.getDate() - (days - 1));

  // Backend requires both dates within same calendar year
  const year = end.getFullYear();
  const janFirst = new Date(year, 0, 1);

  if (prevEnd < janFirst) {
    return null; // entire previous period is in another year
  }

  const clampedPrevStart = prevStart < janFirst ? janFirst : prevStart;

  return {
    prevStart: clampedPrevStart.toISOString().slice(0, 10),
    prevEnd: prevEnd.toISOString().slice(0, 10),
  };
}

export function useMobileRegistrationsComparison(
  startDate: string,
  endDate: string,
  enabled: boolean = true,
) {
  const [state, setState] = useState<ComparisonState>({
    current: null,
    previous: null,
    delta: null,
    deltaPercent: null,
    avgPerDay: null,
    canCompare: false,
    loading: false,
    error: null,
  });

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const prevPeriod = computePreviousPeriod(startDate, endDate);
    const canCompare = prevPeriod !== null;
    const controller = new AbortController();

    const load = async () => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        type MaybeStats = MobileRegistrationsStats | null;
        const [current, previous]: [MobileRegistrationsStats, MaybeStats] = await Promise.all([
          analyticsApi.getMobileRegistrationsStats(startDate, endDate, controller.signal),
          canCompare && prevPeriod
            ? analyticsApi.getMobileRegistrationsStats(prevPeriod.prevStart, prevPeriod.prevEnd, controller.signal)
            : Promise.resolve(null),
        ]);

        const start = new Date(startDate);
        const end = new Date(endDate);
        const days = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        const avgPerDay = days > 0 ? Math.round(current.registrations / days) : null;

        const delta = previous !== null ? current.registrations - previous.registrations : null;
        const deltaPercent =
          previous !== null && previous.registrations > 0
            ? ((current.registrations - previous.registrations) / previous.registrations) * 100
            : null;

        setState({
          current,
          previous,
          delta,
          deltaPercent,
          avgPerDay,
          canCompare,
          loading: false,
          error: null,
        });
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
