"use client";

import { useCallback, useEffect, useRef } from "react";

type JobStatus = "pending" | "processing" | "completed" | "failed";

type UseJobPollingOptions<TJob extends { id: number; status: JobStatus }, TDetail extends { id: number; status: JobStatus }> = {
  enabled: boolean;
  activeJobId: number | undefined;
  activeJobStatus: JobStatus | undefined;
  fetchJobs: () => Promise<TJob[]>;
  fetchJobDetail: (id: number) => Promise<TDetail>;
  onJobsLoaded: (jobs: TJob[]) => void;
  onJobDetailLoaded: (detail: TDetail) => void;
  onInitialLoadError: (message: string) => void;
  /** Called when background polling fails repeatedly. */
  onPollingError?: (message: string) => void;
  intervalMs?: number;
};

const MAX_CONSECUTIVE_ERRORS = 3;

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
  onPollingError,
  intervalMs = 8000,
}: UseJobPollingOptions<TJob, TDetail>) {
  const stoppedRef = useRef(false);
  const consecutiveErrorsRef = useRef(0);
  const pollingErrorNotifiedRef = useRef(false);

  const pollOnce = useCallback(async () => {
    if (stoppedRef.current) return;

    try {
      const jobs = await fetchJobs();
      if (!stoppedRef.current) {
        onJobsLoaded(jobs);
        consecutiveErrorsRef.current = 0;
        pollingErrorNotifiedRef.current = false;
      }
    } catch (err) {
      consecutiveErrorsRef.current += 1;
      if (
        consecutiveErrorsRef.current >= MAX_CONSECUTIVE_ERRORS &&
        !pollingErrorNotifiedRef.current &&
        onPollingError
      ) {
        pollingErrorNotifiedRef.current = true;
        onPollingError(
          err instanceof Error ? err.message : "Не удаётся обновить список задач. Проверьте соединение.",
        );
      }
    }

    if (!activeJobId || (activeJobStatus !== "pending" && activeJobStatus !== "processing")) return;

    try {
      const detail = await fetchJobDetail(activeJobId);
      if (!stoppedRef.current) onJobDetailLoaded(detail);
    } catch {
      // Detail refresh failure is non-critical; list error tracking handles notifications
    }
  }, [activeJobId, activeJobStatus, fetchJobDetail, fetchJobs, onJobDetailLoaded, onJobsLoaded, onPollingError]);

  useEffect(() => {
    if (!enabled) return;

    stoppedRef.current = false;
    consecutiveErrorsRef.current = 0;
    pollingErrorNotifiedRef.current = false;

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
