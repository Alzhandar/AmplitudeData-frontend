"use client";

import { useMemo, useState } from "react";

import { Skeleton } from "@/features/common/components/ui/Skeleton";
import { useMobileRegistrationsComparison } from "../hooks";

type Preset = "7d" | "30d" | "90d";

const PRESETS: { value: Preset; label: string }[] = [
  { value: "7d", label: "7 дней" },
  { value: "30d", label: "30 дней" },
  { value: "90d", label: "90 дней" },
];

function computeDates(preset: Preset): { startDate: string; endDate: string } {
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const year = today.getFullYear();

  const days = preset === "7d" ? 7 : preset === "30d" ? 30 : 90;
  const start = new Date(today);
  start.setDate(start.getDate() - (days - 1));

  const janFirst = new Date(year, 0, 1);
  const clampedStart = start < janFirst ? janFirst : start;

  return { startDate: clampedStart.toISOString().slice(0, 10), endDate: todayStr };
}

function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
}

type DeltaBadgeProps = { delta: number; deltaPercent: number | null };

function DeltaBadge({ delta, deltaPercent }: DeltaBadgeProps) {
  const isPositive = delta > 0;
  const isNeutral = delta === 0;

  return (
    <span
      className={[
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold",
        isNeutral
          ? "bg-gray-100 text-gray-500"
          : isPositive
          ? "bg-emerald-100 text-emerald-700"
          : "bg-red-100 text-red-600",
      ].join(" ")}
    >
      {isPositive ? "↑" : isNeutral ? "=" : "↓"}{" "}
      {isPositive ? "+" : ""}
      {delta.toLocaleString("ru-RU")}
      {deltaPercent !== null && (
        <span className="opacity-75">
          ({isPositive ? "+" : ""}
          {deltaPercent.toFixed(1)}%)
        </span>
      )}
    </span>
  );
}

export function RegistrationsBlock() {
  const [preset, setPreset] = useState<Preset>("30d");
  const { startDate, endDate } = useMemo(() => computeDates(preset), [preset]);
  const { current, previous, delta, deltaPercent, avgPerDay, canCompare, loading, error } =
    useMobileRegistrationsComparison(startDate, endDate);

  const periodLabel =
    startDate === endDate
      ? formatShortDate(startDate)
      : `${formatShortDate(startDate)} — ${formatShortDate(endDate)}`;

  const prevPeriodLabel =
    previous
      ? `${formatShortDate(previous.date_from)} — ${formatShortDate(previous.date_to)}`
      : null;

  return (
    <article className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-5 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.8}
                d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
              />
            </svg>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-800">Регистрации в приложении</h2>
            {!loading && !error && (
              <p className="text-xs text-gray-400">{periodLabel}</p>
            )}
          </div>
        </div>

        {/* Presets */}
        <div className="flex overflow-hidden rounded-lg border border-gray-200 text-xs">
          {PRESETS.map((p, i) => (
            <button
              key={p.value}
              onClick={() => setPreset(p.value)}
              className={[
                "px-3 py-1.5 font-medium transition-colors",
                i > 0 ? "border-l border-gray-200" : "",
                preset === p.value
                  ? "bg-indigo-600 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50",
              ].join(" ")}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      {error ? (
        <div className="px-5 py-5 text-sm text-red-500">{error}</div>
      ) : (
        <div className="grid gap-px bg-gray-100 sm:grid-cols-3">
          {/* Metric 1: New registrations */}
          <div className="bg-white px-5 py-5">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
              Новых пользователей
            </p>
            {loading ? (
              <>
                <Skeleton className="mt-2 h-10 w-32" />
                <Skeleton className="mt-3 h-5 w-40" />
              </>
            ) : (
              <>
                <p className="mt-1 text-4xl font-extrabold tracking-tight text-gray-900">
                  {(current?.registrations ?? 0).toLocaleString("ru-RU")}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {canCompare && delta !== null ? (
                    <>
                      <DeltaBadge delta={delta} deltaPercent={deltaPercent} />
                      {prevPeriodLabel && (
                        <span className="text-xs text-gray-400">vs {prevPeriodLabel}</span>
                      )}
                    </>
                  ) : (
                    <span className="text-xs text-gray-400">нет данных для сравнения</span>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Metric 2: Avg per day */}
          <div className="bg-white px-5 py-5">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
              В среднем в день
            </p>
            {loading ? (
              <>
                <Skeleton className="mt-2 h-10 w-24" />
                <Skeleton className="mt-3 h-4 w-28" />
              </>
            ) : (
              <>
                <p className="mt-1 text-4xl font-extrabold tracking-tight text-gray-900">
                  {avgPerDay !== null ? avgPerDay.toLocaleString("ru-RU") : "—"}
                </p>
                <p className="mt-2 text-xs text-gray-400">за выбранный период</p>
              </>
            )}
          </div>

          {/* Metric 3: Total */}
          <div className="bg-white px-5 py-5">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
              Всего в базе
            </p>
            {loading ? (
              <>
                <Skeleton className="mt-2 h-10 w-28" />
                <Skeleton className="mt-3 h-4 w-20" />
              </>
            ) : (
              <>
                <p className="mt-1 text-4xl font-extrabold tracking-tight text-gray-700">
                  {(current?.total_users ?? 0).toLocaleString("ru-RU")}
                </p>
                <p className="mt-2 text-xs text-gray-400">накопительно на конец периода</p>
              </>
            )}
          </div>
        </div>
      )}
    </article>
  );
}
