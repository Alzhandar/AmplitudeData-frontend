import { Skeleton } from "@/features/common/components/ui/Skeleton";
import { DailyActivityItem } from "../types";

type UserHistoryPanelProps = {
  selectedRow: DailyActivityItem | null;
  historyRows: DailyActivityItem[];
  loading: boolean;
  error: string | null;
  onClose: () => void;
  onLoadHistory: () => void;
};

const HISTORY_MIN_INTERVAL_MINUTES = 20;

function formatTimelineTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Almaty",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const day = parts.find((p) => p.type === "day")?.value ?? "";
  const month = parts.find((p) => p.type === "month")?.value ?? "";
  const hour = parts.find((p) => p.type === "hour")?.value ?? "";
  const minute = parts.find((p) => p.type === "minute")?.value ?? "";

  return `${day} ${month} в ${hour}:${minute}`;
}

function compactTimesByInterval(times: string[], minIntervalMinutes: number): string[] {
  if (times.length <= 1) return times;

  const sorted = [...times].sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
  const minIntervalMs = minIntervalMinutes * 60 * 1000;
  const compacted: string[] = [];

  for (const timeValue of sorted) {
    const parsed = new Date(timeValue).getTime();
    if (Number.isNaN(parsed)) continue;

    const lastKept = compacted[compacted.length - 1];
    if (!lastKept) { compacted.push(timeValue); continue; }

    const lastParsed = new Date(lastKept).getTime();
    if (Number.isNaN(lastParsed) || parsed - lastParsed >= minIntervalMs) {
      compacted.push(timeValue);
    }
  }

  return compacted;
}

function getDisplayName(row: DailyActivityItem): string {
  return row.phone_number || row.user_id || row.device_id || "Unknown";
}

export function UserHistoryPanel({
  selectedRow,
  historyRows,
  loading,
  error,
  onClose,
  onLoadHistory,
}: UserHistoryPanelProps) {
  if (!selectedRow) return null;

  const compactedVisitTimes = compactTimesByInterval(selectedRow.visit_times, HISTORY_MIN_INTERVAL_MINUTES);
  const displayName = getDisplayName(selectedRow);

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      {/* Drawer */}
      <aside className="fixed inset-0 z-50 flex flex-col bg-white shadow-2xl sm:inset-auto sm:right-0 sm:top-0 sm:h-full sm:w-full sm:max-w-sm">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-slate-900">История локаций</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Subtitle */}
        <div className="border-b border-slate-100 px-5 py-3">
          <p className="text-sm text-slate-500">
            Компактные передвижения: <span className="font-semibold text-slate-900">{displayName}</span>.
          </p>
          <span className="mt-1.5 inline-block rounded-md bg-slate-100 px-2.5 py-1 text-xs text-slate-500">
            Записи с интервалом {HISTORY_MIN_INTERVAL_MINUTES}+ мин
          </span>
        </div>

        {/* Timeline – today's visits */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {compactedVisitTimes.length > 0 && (
            <div className="relative pl-6">
              <div className="absolute left-2 top-0 h-full w-px bg-slate-200" />
              <div className="space-y-4">
                {compactedVisitTimes.map((time, index) => (
                  <div key={time} className="relative flex items-start gap-3">
                    <div className={`absolute -left-6 z-10 mt-1 h-4 w-4 rounded-full shadow-sm ring-4 ${index % 2 === 0 ? "bg-indigo-600 ring-indigo-100" : "bg-slate-400 ring-slate-100"}`} />
                    <div className="w-full rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                      <div className="flex items-center gap-1 text-xs text-slate-500">
                        <svg className="h-3 w-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {formatTimelineTime(time)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {compactedVisitTimes.length === 0 && (
            <p className="py-8 text-center text-sm text-slate-400">Нет событий за эту дату</p>
          )}

          {/* 7-day history */}
          <div className="mt-6">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">История за 7 дней</p>
              <button
                type="button"
                onClick={onLoadHistory}
                className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-indigo-700"
              >
                Загрузить
              </button>
            </div>

            {loading && (
              <div className="mt-3 space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-3.5 w-20" />
                      <Skeleton className="h-5 w-14 rounded-full" />
                    </div>
                    <Skeleton className="mt-2 h-3 w-32" />
                  </div>
                ))}
              </div>
            )}
            {!loading && error && (
              <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
            )}
            {!loading && !error && historyRows.length === 0 && (
              <p className="mt-3 text-sm text-slate-400">Нажмите «Загрузить» для получения данных</p>
            )}

            <ul className="mt-3 space-y-2">
              {historyRows.map((row) => (
                <li
                  key={`${row.date}-${row.device_id}-${row.last_seen}`}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-slate-700">{row.date}</p>
                    <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-600">
                      {row.visits_count} визитов
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">Последний: {formatTimelineTime(row.last_seen)}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </aside>
    </>
  );
}
