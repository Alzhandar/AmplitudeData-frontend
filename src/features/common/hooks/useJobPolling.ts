"use client";

import { useCallback, useEffect, useRef } from "react";

type JobStatus = "pending" | "processing" | "completed" | "failed";

type UseJobPollingOptions<TJob extends { id: number; status: JobStatus }, TDetail extends { id: number; status: JobStatus }> = {
  /** Whether initial load + polling should be active */
  enabled: boolean;
  activeJobId: number | undefined;
  activeJobStatus: JobStatus | undefined;
  /** Fetch the short job list */
  fetchJobs: () => Promise<TJob[]>;
  /** Fetch a single job detail */
  fetchJobDetail: (id: number) => Promise<TDetail>;
  onJobsLoaded: (jobs: TJob[]) => void;
  onJobDetailLoaded: (detail: TDetail) => void;
  /** Called with an error message when the initial job list load fails */
  onInitialLoadError: (message: string) => void;
  /** Interval in ms. Default: 8000 */
  intervalMs?: number;
};

/**
 * Shared polling hook used by BonusTransactions and CouponDispatch pages.
 * - Loads jobs once on mount (with loader)
 * - Polls every `intervalMs` ms when `enabled`
 * - Refreshes active job detail if it's in a transient state
 * - Stops polling when active job reaches a terminal state
 */
export function useJobPolling<
  TJob extends { id: number; status: JobStatus },
  TDetail extends { id: number; status: JobStatus },
>({
  enabled,
  activeJobId,
  activeJobStatus,
  fetchJobs,
  fetchJobDetail,
  onJobsLoaded,
  onJobDetailLoaded,
  onInitialLoadError,
  intervalMs = 8000,
}: UseJobPollingOptions<TJob, TDetail>) {
  const stoppedRef = useRef(false);

  const pollOnce = useCallback(async () => {
    if (stoppedRef.current) return;

    // Always refresh list silently
    try {
      const jobs = await fetchJobs();
      if (!stoppedRef.current) onJobsLoaded(jobs);
    } catch {
      // silent during background polling
    }

    // Refresh active job detail if still in progress
    if (!activeJobId || (activeJobStatus !== "pending" && activeJobStatus !== "processing")) return;

    try {
      const detail = await fetchJobDetail(activeJobId);
      if (!stoppedRef.current) onJobDetailLoaded(detail);
    } catch {
      // silent during background polling
    }
  }, [activeJobId, activeJobStatus, fetchJobDetail, fetchJobs, onJobDetailLoaded, onJobsLoaded]);

  useEffect(() => {
    if (!enabled) return;

    stoppedRef.current = false;

    // Initial load (we want errors visible here)
    const initialLoad = async () => {
      try {
        const jobs = await fetchJobs();
        if (!stoppedRef.current) onJobsLoaded(jobs);
      } catch (err) {
        if (!stoppedRef.current) {
          onInitialLoadError(err instanceof Error ? err.message : "Не удалось загрузить задачи");
        }
      }
    };

    void initialLoad();

    const intervalId = window.setInterval(() => void pollOnce(), intervalMs);

    const handleVisibility = () => {
      if (document.visibilityState === "visible") void pollOnce();
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      stoppedRef.current = true;
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [enabled, fetchJobs, intervalMs, onInitialLoadError, onJobsLoaded, pollOnce]);
}
