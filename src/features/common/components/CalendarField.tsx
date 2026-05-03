"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export type QuickDateOption = {
  label: string;
  daysFromToday: number;
};

type CalendarFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  minValue?: string;
  maxValue?: string;
  quickOptions?: QuickDateOption[];
  helperText?: string;
  errorText?: string;
};

const RU_MONTHS = [
  "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
  "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь",
];

const RU_WEEKDAYS_SHORT = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

function parseIsoDate(value: string): Date | null {
  if (!value) return null;
  const [yearText, monthText, dayText] = value.split("-");
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return null;
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  return date;
}

function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

function monthStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, months: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

function formatDateLabel(value: string): string {
  const date = parseIsoDate(value);
  if (!date) return "Выберите дату";
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

function clampIsoDate(value: string, minValue?: string, maxValue?: string): string {
  if (minValue && value < minValue) return minValue;
  if (maxValue && value > maxValue) return maxValue;
  return value;
}

function getTodayIsoDate(): string {
  const now = new Date();
  return toIsoDate(now);
}

export function CalendarField({
  label,
  value,
  onChange,
  minValue,
  maxValue,
  quickOptions = [],
  helperText,
  errorText,
}: CalendarFieldProps) {
  const [open, setOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState<Date>(() => {
    const parsed = parseIsoDate(value);
    return monthStart(parsed || new Date());
  });
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  const toggleCalendar = () => {
    setOpen((prev) => {
      const next = !prev;
      if (next) {
        const parsed = parseIsoDate(value);
        setVisibleMonth(monthStart(parsed || new Date()));
      }
      return next;
    });
  };

  const monthTitle = `${RU_MONTHS[visibleMonth.getMonth()]} ${visibleMonth.getFullYear()}`;
  const todayIso = getTodayIsoDate();

  const calendarDays = useMemo(() => {
    const start = monthStart(visibleMonth);
    const weekdayShift = (start.getDay() + 6) % 7;
    const gridStart = addDays(start, -weekdayShift);
    return Array.from({ length: 42 }, (_, idx) => {
      const current = addDays(gridStart, idx);
      const iso = toIsoDate(current);
      const inCurrentMonth = current.getMonth() === visibleMonth.getMonth();
      const disabled = Boolean((minValue && iso < minValue) || (maxValue && iso > maxValue));
      return {
        iso,
        day: current.getDate(),
        inCurrentMonth,
        isToday: iso === todayIso,
        isSelected: iso === value,
        disabled,
      };
    });
  }, [maxValue, minValue, todayIso, value, visibleMonth]);

  const selectDate = (iso: string) => {
    if ((minValue && iso < minValue) || (maxValue && iso > maxValue)) return;
    onChange(iso);
    setOpen(false);
  };

  const applyQuickDate = (daysFromToday: number) => {
    const nextIso = toIsoDate(addDays(new Date(), daysFromToday));
    onChange(clampIsoDate(nextIso, minValue, maxValue));
    setOpen(false);
  };

  return (
    <div ref={rootRef} className="relative block">
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={toggleCalendar}
        className={`flex w-full items-center justify-between rounded-lg border bg-white px-3 py-2 text-left text-sm transition ${
          errorText
            ? "border-red-300 focus-visible:outline-red-400"
            : "border-slate-300 hover:border-slate-400 focus-visible:outline-indigo-400"
        }`}
      >
        <span className={value ? "text-slate-900" : "text-slate-500"}>{formatDateLabel(value)}</span>
        <svg className="h-4 w-4 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect x="3.5" y="5" width="17" height="15" rx="2" />
          <path d="M7.5 3.5v3M16.5 3.5v3M3.5 9.5h17" strokeLinecap="round" />
        </svg>
      </button>

      {helperText && <p className="mt-1 text-xs text-slate-500">{helperText}</p>}
      {errorText && <p className="mt-1 text-xs text-red-600">{errorText}</p>}

      {open && (
        <div className="absolute left-0 z-30 mt-2 w-full min-w-[300px] rounded-xl border border-slate-200 bg-white p-3 shadow-xl md:w-[340px]">
          <div className="mb-3 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setVisibleMonth((prev) => addMonths(prev, -1))}
              className="rounded-md border border-slate-200 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Назад
            </button>
            <p className="text-sm font-semibold text-slate-900">{monthTitle}</p>
            <button
              type="button"
              onClick={() => setVisibleMonth((prev) => addMonths(prev, 1))}
              className="rounded-md border border-slate-200 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Вперед
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 pb-1">
            {RU_WEEKDAYS_SHORT.map((dayName) => (
              <span key={dayName} className="py-1 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                {dayName}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((cell) => (
              <button
                key={cell.iso}
                type="button"
                disabled={cell.disabled}
                onClick={() => selectDate(cell.iso)}
                className={`rounded-md py-1.5 text-sm transition ${
                  cell.isSelected
                    ? "bg-indigo-600 font-semibold text-white"
                    : cell.inCurrentMonth
                      ? "text-slate-800 hover:bg-indigo-50"
                      : "text-slate-400 hover:bg-slate-100"
                } ${cell.isToday && !cell.isSelected ? "ring-1 ring-indigo-300" : ""} ${
                  cell.disabled ? "cursor-not-allowed opacity-35 hover:bg-transparent" : ""
                }`}
              >
                {cell.day}
              </button>
            ))}
          </div>

          {quickOptions.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
              {quickOptions.map((option) => (
                <button
                  key={option.label}
                  type="button"
                  onClick={() => applyQuickDate(option.daysFromToday)}
                  className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
