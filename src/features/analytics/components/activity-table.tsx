import { Skeleton } from "@/features/common/components/ui/Skeleton";
import { DailyActivityItem } from "../types";

type ActivityTableProps = {
  rows: DailyActivityItem[];
  loading: boolean;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onSelectRow: (row: DailyActivityItem) => void;
  selectedRowKey: string | null;
};

function formatKzTime(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

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

function buildRowKey(row: DailyActivityItem): string {
  return `${row.user_id || ""}-${row.device_id || ""}-${row.phone_number || ""}`;
}

function formatDeviceName(row: DailyActivityItem): string {
  const model = String(row.device_model || "").trim();
  const brand = String(row.device_brand || "").trim();
  const manufacturer = String(row.device_manufacturer || "").trim();

  if (model) return model;
  if (brand && manufacturer && brand.toLowerCase() !== manufacturer.toLowerCase()) {
    return `${brand} (${manufacturer})`;
  }
  if (brand) return brand;
  if (manufacturer) return manufacturer;
  return row.device_id || "—";
}

export function ActivityTable({
  rows,
  loading,
  currentPage,
  pageSize,
  onPageChange,
  onSelectRow,
  selectedRowKey,
}: ActivityTableProps) {
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedRows = rows.slice(startIndex, startIndex + pageSize);

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-5 py-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Мобильная активность</h2>
          <p className="mt-0.5 text-xs text-slate-400">Данные отслеживания за выбранный период.</p>
        </div>
        <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-600">
          {rows.length.toLocaleString("ru-RU")} записей
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
              <th className="px-5 py-3">Пользователь</th>
              <th className="px-5 py-3">Устройство</th>
              <th className="hidden sm:table-cell px-5 py-3">Платформа</th>
              <th className="px-5 py-3">Визиты</th>
              <th className="px-5 py-3">Последний вход (KZT)</th>
            </tr>
          </thead>
          <tbody>
            {loading && rows.length === 0 ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="border-t border-slate-100">
                  <td className="px-5 py-3"><Skeleton className="h-4 w-28" /></td>
                  <td className="px-5 py-3"><Skeleton className="h-4 w-32" /></td>
                  <td className="hidden sm:table-cell px-5 py-3"><Skeleton className="h-4 w-14" /></td>
                  <td className="px-5 py-3"><Skeleton className="h-4 w-8" /></td>
                  <td className="px-5 py-3"><Skeleton className="h-4 w-36" /></td>
                </tr>
              ))
            ) : !loading && rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-16 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <svg className="h-10 w-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6M4 20h16a2 2 0 002-2V6a2 2 0 00-2-2H4a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-sm font-medium text-slate-400">Нет данных за выбранный период</p>
                  </div>
                </td>
              </tr>
            ) : null}

            {paginatedRows.map((row) => {
              const deviceName = formatDeviceName(row);
              const rowKey = buildRowKey(row);
              const isSelected = selectedRowKey === rowKey;

              return (
                <tr
                  key={`${row.device_id}-${row.last_seen}`}
                  className={`border-t border-slate-100 transition hover:bg-slate-50 ${isSelected ? "bg-indigo-50" : ""}`}
                >
                  <td className="px-5 py-3">
                    <span className="font-medium text-slate-800">{row.phone_number || row.user_id || "—"}</span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2 text-slate-600">
                      <svg className="h-3.5 w-3.5 shrink-0 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      {deviceName}
                    </div>
                  </td>
                  <td className="hidden sm:table-cell px-5 py-3 text-slate-500">{row.platform || "—"}</td>
                  <td className="px-5 py-3 font-semibold text-indigo-600">
                    {row.visits_count.toLocaleString("ru-RU")}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                        {formatKzTime(row.last_seen)}
                      </span>
                      <button
                        type="button"
                        onClick={() => onSelectRow(row)}
                        title="История локаций"
                        className="rounded-lg p-1.5 text-slate-400 transition hover:bg-indigo-50 hover:text-indigo-600"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3">
        <p className="text-sm text-slate-400">
          Страница {currentPage} из {totalPages}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => onPageChange(currentPage - 1)}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-40"
          >
            ← Назад
          </button>
          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => onPageChange(currentPage + 1)}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-40"
          >
            Вперёд →
          </button>
        </div>
      </div>
    </section>
  );
}
