"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { CalendarField } from "@/features/common/components/CalendarField";
import { Skeleton } from "@/features/common/components/ui/Skeleton";
import { useMobileRegistrationsStats } from "../hooks";

type Preset = "7d" | "30d" | "90d" | "ytd";
type Mode = "preset" | "custom";

const PRESETS: { value: Preset; label: string }[] = [
  { value: "7d", label: "7 дней" },
  { value: "30d", label: "30 дней" },
  { value: "90d", label: "90 дней" },
  { value: "ytd", label: "С нач. года" },
];

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

function getYearStart() {
  return `${new Date().getFullYear()}-01-01`;
}

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

  const janFirst = new Date(year, 0, 1);
  const clampedStart = start < janFirst ? janFirst : start;

  return { startDate: clampedStart.toISOString().slice(0, 10), endDate: todayStr };
}

function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
}

export function RegistrationsBlock() {
  const [mode, setMode] = useState<Mode>("preset");
  const [preset, setPreset] = useState<Preset>("30d");

  const [pickerOpen, setPickerOpen] = useState(false);
  const [draftStart, setDraftStart] = useState(getYearStart);
  const [draftEnd, setDraftEnd] = useState(getToday);
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [customError, setCustomError] = useState<string | null>(null);

  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!pickerOpen) return;
    function onDown(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setPickerOpen(false);
        setCustomError(null);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [pickerOpen]);

  const activeDates = useMemo(() => {
    if (mode === "custom" && customStart && customEnd) {
      return { startDate: customStart, endDate: customEnd };
    }
    return computeDates(preset);
  }, [mode, preset, customStart, customEnd]);

  const { data, loading, error } = useMobileRegistrationsStats(
    activeDates.startDate,
    activeDates.endDate,
  );

  const growthPercent =
    data && data.total_users > 0
      ? (data.registrations / data.total_users) * 100
      : null;

  const daysInPeriod = useMemo(() => {
    const ms = new Date(activeDates.endDate).getTime() - new Date(activeDates.startDate).getTime();
    return Math.max(1, Math.round(ms / 86400000) + 1);
  }, [activeDates.startDate, activeDates.endDate]);

  const avgPerDay = data ? Math.round(data.registrations / daysInPeriod) : null;

  const periodLabel =
    activeDates.startDate === activeDates.endDate
      ? formatShortDate(activeDates.startDate)
      : `${formatShortDate(activeDates.startDate)} — ${formatShortDate(activeDates.endDate)}`;

  function handlePresetClick(value: Preset) {
    setPreset(value);
    setMode("preset");
    setPickerOpen(false);
    setCustomError(null);
  }

  function handleApplyCustom() {
    setCustomError(null);
    if (!draftStart || !draftEnd) {
      setCustomError("Выберите обе даты");
      return;
    }
    if (draftStart > draftEnd) {
      setCustomError("Начало не может быть позже конца");
      return;
    }
    if (new Date(draftStart).getFullYear() !== new Date(draftEnd).getFullYear()) {
      setCustomError("Обе даты должны быть в одном году");
      return;
    }
    setCustomStart(draftStart);
    setCustomEnd(draftEnd);
    setMode("custom");
    setPickerOpen(false);
  }

  function resetCustom() {
    setMode("preset");
    setCustomStart("");
    setCustomEnd("");
    setPickerOpen(false);
    setCustomError(null);
  }

  const isCustomActive = mode === "custom";
  const today = getToday();
  const yearStart = getYearStart();

  return (
    <article className="rounded-2xl border border-gray-200 bg-white shadow-sm">

      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-4 border-b border-gray-100 bg-gray-50/60 px-5 py-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h2 className="truncate text-sm font-semibold text-gray-700">
            Новые регистрации в приложении
          </h2>
        </div>

        {/* Controls */}
        <div className="relative flex shrink-0 items-center gap-1.5" ref={pickerRef}>
          {PRESETS.map((p) => (
            <button
              key={p.value}
              onClick={() => handlePresetClick(p.value)}
              className={[
                "rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
                !isCustomActive && preset === p.value
                  ? "border-indigo-600 bg-indigo-600 text-white"
                  : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50",
              ].join(" ")}
            >
              {p.label}
            </button>
          ))}

          <button
            onClick={() => setPickerOpen((v) => !v)}
            title="Произвольный период"
            className={[
              "flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors",
              isCustomActive
                ? "border-indigo-400 bg-indigo-50 text-indigo-700"
                : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50",
            ].join(" ")}
          >
            <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {isCustomActive
              ? `${formatShortDate(customStart)} — ${formatShortDate(customEnd)}`
              : "Период"}
            {isCustomActive && (
              <span
                role="button"
                aria-label="Сбросить"
                onClick={(e) => { e.stopPropagation(); resetCustom(); }}
                className="ml-0.5 text-indigo-400 hover:text-indigo-700"
              >
                ×
              </span>
            )}
          </button>

          {pickerOpen && (
            <div className="absolute right-0 top-full z-30 mt-2 w-72 rounded-xl border border-gray-200 bg-white p-4 shadow-xl">
              <p className="mb-3 text-xs font-semibold text-gray-600">Произвольный период</p>
              <div className="space-y-3">
                <CalendarField
                  label="Начало"
                  value={draftStart}
                  onChange={(v) => { setDraftStart(v); setCustomError(null); }}
                  minValue={yearStart}
                  maxValue={draftEnd || today}
                />
                <CalendarField
                  label="Конец"
                  value={draftEnd}
                  onChange={(v) => { setDraftEnd(v); setCustomError(null); }}
                  minValue={draftStart || yearStart}
                  maxValue={today}
                />
              </div>
              {customError && (
                <p className="mt-2 text-xs text-red-500">{customError}</p>
              )}
              <button
                onClick={handleApplyCustom}
                className="mt-3 w-full rounded-lg bg-indigo-600 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-indigo-700 active:bg-indigo-800"
              >
                Применить
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Body: metrics ── */}
      <div className="flex items-stretch divide-x divide-gray-100 px-0 py-0">

        {/* Новых за период */}
        <div className="flex flex-col justify-center px-6 py-5">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Новых за период</p>
          {loading ? (
            <>
              <Skeleton className="mt-1 h-10 w-28" />
              <Skeleton className="mt-1 h-3.5 w-24" />
            </>
          ) : error ? (
            <p className="mt-1 text-sm text-red-500">{error}</p>
          ) : (
            <>
              <div className="mt-1 flex items-baseline gap-2.5">
                <span className="text-4xl font-extrabold tracking-tight text-gray-900">
                  {(data?.registrations ?? 0).toLocaleString("ru-RU")}
                </span>
                {growthPercent !== null && (
                  <span className={[
                    "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold",
                    growthPercent > 0 ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" : "bg-gray-100 text-gray-500",
                  ].join(" ")}>
                    {growthPercent > 0 ? "↑" : ""}{growthPercent.toFixed(1)}% прироста
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-gray-400">{periodLabel}</p>
            </>
          )}
        </div>

        {/* Всего в базе */}
        <div className="flex flex-col justify-center px-6 py-5">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Всего в базе</p>
          {loading ? (
            <>
              <Skeleton className="mt-1 h-10 w-24" />
              <Skeleton className="mt-1 h-3.5 w-20" />
            </>
          ) : !error ? (
            <>
              <p className="mt-1 text-4xl font-extrabold tracking-tight text-gray-700">
                {(data?.total_users ?? 0).toLocaleString("ru-RU")}
              </p>
              <p className="mt-1 text-xs text-gray-400">накопительно</p>
            </>
          ) : null}
        </div>

      </div>

    </article>
  );
}
