"use client";

import { useMemo, useState } from "react";

import { Skeleton } from "@/features/common/components/ui/Skeleton";
import { useMobileRegistrationsStats } from "../hooks";

type Preset = "7d" | "30d" | "90d" | "ytd";

const PRESETS: { value: Preset; label: string }[] = [
  { value: "7d", label: "7 дней" },
  { value: "30d", label: "30 дней" },
  { value: "90d", label: "90 дней" },
  { value: "ytd", label: "С нач. года" },
];

function computeDates(preset: Preset): { startDate: string; endDate: string } {
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const year = today.getFullYear();

  if (preset === "ytd") {
    return { startDate: `${year}-01-01`, endDate: todayStr };
  }

  const days = preset === "7d" ? 7 : preset === "30d" ? 30 : 90;
  const start = new Date(today);
  start.setDate(start.getDate() - (days - 1));

  // Backend requires both dates within the same year
  const janFirst = new Date(year, 0, 1);
  const clampedStart = start < janFirst ? janFirst : start;

  return { startDate: clampedStart.toISOString().slice(0, 10), endDate: todayStr };
}

function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
}

export function RegistrationsBlock() {
  const [preset, setPreset] = useState<Preset>("30d");
  const { startDate, endDate } = useMemo(() => computeDates(preset), [preset]);
  const { data, loading, error } = useMobileRegistrationsStats(startDate, endDate);

  const growthPercent =
    data && data.total_users > 0
      ? (data.registrations / data.total_users) * 100
      : null;

  const periodLabel =
    startDate === endDate
      ? formatShortDate(startDate)
      : `${formatShortDate(startDate)} — ${formatShortDate(endDate)}`;

  return (
    <article className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-5 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h2 className="text-sm font-semibold text-gray-800">Новые регистрации в приложении</h2>
        </div>

        {/* Period presets */}
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
      <div className="flex flex-wrap items-center gap-x-10 gap-y-6 px-5 py-5">
        {/* Primary metric */}
        <div className="flex-1 min-w-[180px]">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
            Новых пользователей
          </p>
          {loading ? (
            <>
              <Skeleton className="mt-2 h-12 w-36" />
              <Skeleton className="mt-2 h-4 w-24" />
            </>
          ) : error ? (
            <p className="mt-2 text-sm text-red-500">{error}</p>
          ) : (
            <>
              <div className="mt-1 flex flex-wrap items-baseline gap-2.5">
                <span className="text-5xl font-extrabold tracking-tight text-gray-900">
                  {(data?.registrations ?? 0).toLocaleString("ru-RU")}
                </span>
                {growthPercent !== null && (
                  <span className={[
                    "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold",
                    growthPercent > 0
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-gray-100 text-gray-500",
                  ].join(" ")}>
                    {growthPercent > 0 ? "↑ " : ""}
                    {growthPercent.toFixed(2)}% прироста базы
                  </span>
                )}
              </div>
              <p className="mt-1.5 text-xs text-gray-400">{periodLabel}</p>
            </>
          )}
        </div>

        {/* Divider */}
        <div className="hidden h-16 w-px shrink-0 bg-gray-100 sm:block" />

        {/* Secondary metric */}
        <div className="min-w-[140px]">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
            Всего в базе
          </p>
          {loading ? (
            <>
              <Skeleton className="mt-2 h-8 w-28" />
              <Skeleton className="mt-2 h-4 w-20" />
            </>
          ) : !error ? (
            <>
              <p className="mt-1 text-2xl font-bold text-gray-700">
                {(data?.total_users ?? 0).toLocaleString("ru-RU")}
              </p>
              <p className="mt-1.5 text-xs text-gray-400">накопительно</p>
            </>
          ) : null}
        </div>
      </div>
    </article>
  );
}
