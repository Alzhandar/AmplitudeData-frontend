import { DailyActivityItem } from "../types";

type UserHistoryPanelProps = {
  selectedRow: DailyActivityItem | null;
  historyRows: DailyActivityItem[];
  loading: boolean;
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

  return `${day} ${month} at ${hour}:${minute}`;
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
    if (!lastKept) {
      compacted.push(timeValue);
      continue;
    }

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
  onClose,
  onLoadHistory,
}: UserHistoryPanelProps) {
  if (!selectedRow) return null;

  const compactedVisitTimes = compactTimesByInterval(selectedRow.visit_times, HISTORY_MIN_INTERVAL_MINUTES);
  const displayName = getDisplayName(selectedRow);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer */}
      <aside className="fixed right-0 top-0 z-50 flex h-full w-full max-w-sm flex-col bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-gray-900">История локаций</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Subtitle */}
        <div className="border-b border-gray-100 px-5 py-3">
          <p className="text-sm text-gray-500">
            Компактные передвижения: <span className="font-semibold text-gray-900">{displayName}</span>.
          </p>
          <span className="mt-1.5 inline-block rounded-md bg-gray-100 px-2.5 py-1 text-xs text-gray-500">
            Записи с интервалом {HISTORY_MIN_INTERVAL_MINUTES}+ мин
          </span>
        </div>

        {/* Timeline – today's visits */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {compactedVisitTimes.length > 0 && (
            <div className="relative">
              {/* Central line */}
              <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-gray-200" />

              <div className="space-y-6">
                {compactedVisitTimes.map((time, index) => {
                  const isRight = index % 2 === 0;
                  return (
                    <div key={time} className="relative flex items-center">
                      {/* Card left or right */}
                      {isRight ? (
                        <>
                          <div className="w-[calc(50%-20px)]" />
                          {/* Dot */}
                          <div className="z-10 mx-2 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 shadow-sm ring-4 ring-blue-100" />
                          <div className="w-[calc(50%-20px)] rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {formatTimelineTime(time)}
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="w-[calc(50%-20px)] rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {formatTimelineTime(time)}
                            </div>
                          </div>
                          {/* Dot */}
                          <div className="z-10 mx-2 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-gray-400 shadow-sm ring-4 ring-gray-100" />
                          <div className="w-[calc(50%-20px)]" />
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {compactedVisitTimes.length === 0 && (
            <p className="text-center text-sm text-gray-400 py-8">Нет событий за эту дату</p>
          )}

          {/* 7-day history */}
          <div className="mt-6">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">История за 7 дней</p>
              <button
                type="button"
                onClick={onLoadHistory}
                className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 transition"
              >
                Загрузить
              </button>
            </div>

            {loading && <p className="mt-3 text-sm text-gray-400">Загрузка...</p>}
            {!loading && historyRows.length === 0 && (
              <p className="mt-3 text-sm text-gray-400">Нажмите «Загрузить» для получения данных</p>
            )}

            <ul className="mt-3 space-y-2">
              {historyRows.map((row) => (
                <li
                  key={`${row.date}-${row.device_id}-${row.last_seen}`}
                  className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-gray-700">{row.date}</p>
                    <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-600">
                      {row.visits_count} visits
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-gray-400">Last: {formatTimelineTime(row.last_seen)}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </aside>
    </>
  );
}

