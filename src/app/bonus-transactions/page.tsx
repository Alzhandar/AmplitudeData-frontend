"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { AppShell } from "@/features/navigation/components/app-shell";
import { useAuthGuard } from "@/features/auth/use-auth-guard";
import { bonusTransactionsApi } from "@/features/bonus-transactions/api";
import { BonusTransactionJob, BonusTransactionJobDetail } from "@/features/bonus-transactions/types";

type QuickDateOption = {
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
  "Январь",
  "Февраль",
  "Март",
  "Апрель",
  "Май",
  "Июнь",
  "Июль",
  "Август",
  "Сентябрь",
  "Октябрь",
  "Ноябрь",
  "Декабрь",
];

const RU_WEEKDAYS_SHORT = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

function parseIsoDate(value: string): Date | null {
  if (!value) {
    return null;
  }
  const [yearText, monthText, dayText] = value.split("-");
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return null;
  }
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }
  return date;
}

function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
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
  if (!date) {
    return "Выберите дату";
  }
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

function clampIsoDate(value: string, minValue?: string, maxValue?: string): string {
  if (minValue && value < minValue) {
    return minValue;
  }
  if (maxValue && value > maxValue) {
    return maxValue;
  }
  return value;
}

function CalendarField({
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
    if (!open) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
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
    if ((minValue && iso < minValue) || (maxValue && iso > maxValue)) {
      return;
    }
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

      {helperText ? <p className="mt-1 text-xs text-slate-500">{helperText}</p> : null}
      {errorText ? <p className="mt-1 text-xs text-red-600">{errorText}</p> : null}

      {open ? (
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

          {quickOptions.length > 0 ? (
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
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function statusBadge(status: BonusTransactionJob["status"]): string {
  if (status === "completed") return "bg-emerald-100 text-emerald-700";
  if (status === "failed") return "bg-red-100 text-red-700";
  if (status === "processing") return "bg-amber-100 text-amber-700";
  return "bg-slate-100 text-slate-700";
}

function statusLabel(status: BonusTransactionJob["status"]): string {
  if (status === "completed") return "Выполнено";
  if (status === "failed") return "Не выполнено";
  if (status === "processing") return "Выполняется";
  return "Ожидает";
}

function formatDateTime(value: string | null | undefined): string {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getTodayIsoDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function BonusTransactionsPage() {
  const { ready, authenticated, hasPageAccess, profile, allowedPages, logout } = useAuthGuard("bonus-transactions");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [startDate, setStartDate] = useState(getTodayIsoDate);
  const [expirationDate, setExpirationDate] = useState(getTodayIsoDate);
  const [phonesText, setPhonesText] = useState("");
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [jobs, setJobs] = useState<BonusTransactionJob[]>([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [activeJob, setActiveJob] = useState<BonusTransactionJobDetail | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const detailsRef = useRef<HTMLElement | null>(null);
  const excelInputRef = useRef<HTMLInputElement | null>(null);
  const activeJobId = activeJob?.id;
  const activeJobStatus = activeJob?.status;
  const dateRangeInvalid = Boolean(startDate && expirationDate && expirationDate < startDate);

  const canSubmit = useMemo(() => {
    if (!description.trim()) return false;
    if (!amount.trim()) return false;
    if (!startDate || !expirationDate) return false;
    if (dateRangeInvalid) return false;
    const numericAmount = Number(amount);
    if (!Number.isInteger(numericAmount) || numericAmount <= 0) return false;
    return Boolean(phonesText.trim() || excelFile);
  }, [amount, dateRangeInvalid, description, expirationDate, excelFile, phonesText, startDate]);

  const refreshJobs = useCallback(async (showLoader: boolean) => {
    if (showLoader) {
      setJobsLoading(true);
    }

    try {
      const data = await bonusTransactionsApi.listJobs(20);
      setJobs(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Не удалось загрузить задачи начисления";
      setError(message);
    } finally {
      if (showLoader) {
        setJobsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    let stopped = false;

    const refreshAll = async () => {
      if (stopped) {
        return;
      }

      await refreshJobs(false);
      if (!activeJobId || (activeJobStatus !== "pending" && activeJobStatus !== "processing")) {
        return;
      }

      try {
        const details = await bonusTransactionsApi.getJob(activeJobId);
        if (!stopped) {
          setActiveJob(details);
        }
      } catch {
        // Keep silent while polling to avoid noisy transient errors.
      }
    };

    void refreshJobs(true);
    const intervalId = window.setInterval(() => {
      void refreshAll();
    }, 8000);

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        void refreshAll();
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      stopped = true;
      document.removeEventListener("visibilitychange", handleVisibility);
      window.clearInterval(intervalId);
    };
  }, [activeJobId, activeJobStatus, refreshJobs]);

  useEffect(() => {
    if (!activeJob?.id) {
      return;
    }

    detailsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [activeJob?.id]);

  const openJob = async (jobId: number) => {
    setError(null);
    try {
      const details = await bonusTransactionsApi.getJob(jobId);
      setActiveJob(details);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Не удалось загрузить детали задачи";
      setError(message);
    }
  };

  const submit = async () => {
    const numericAmount = Number(amount);
    if (!Number.isInteger(numericAmount) || numericAmount <= 0) {
      setError("Сумма должна быть положительным целым числом");
      return;
    }

    if (dateRangeInvalid) {
      setError("Дата окончания не может быть раньше даты начала");
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const created = await bonusTransactionsApi.createJob({
        description: description.trim(),
        amount: numericAmount,
        startDate,
        expirationDate,
        phonesText: phonesText.trim(),
        excelFile,
      });

      setSuccess("Задача создана и отправлена в обработку");
      setPhonesText("");
      setExcelFile(null);
      if (excelInputRef.current) {
        excelInputRef.current.value = "";
      }
      setActiveJob(created);
      await refreshJobs(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Не удалось создать задачу";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!ready || !authenticated) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#edf1f8]">
        <p className="text-sm text-slate-600">Проверка доступа...</p>
      </main>
    );
  }

  if (!hasPageAccess) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#edf1f8] px-4">
        <p className="text-sm text-slate-600">У вас нет доступа к этому разделу.</p>
      </main>
    );
  }

  return (
    <AppShell
      title="Начисление бонусов"
      subtitle="Массовое начисление бонусов по номерам телефонов"
      fullName={profile.full_name}
      positionName={profile.position?.name || ""}
      allowedPages={allowedPages}
      onLogout={logout}
    >
      <div className="space-y-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Новое начисление</h2>
          <p className="mt-1 text-sm text-slate-500">Укажите параметры бонуса и добавьте номера телефонов вручную или через Excel</p>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <label className="block md:col-span-2">
              <span className="mb-1 block text-sm font-medium text-slate-700">Причина/описание начисления</span>
              <input
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                placeholder="Например: Компенсация за сервис"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Сумма бонуса</span>
              <input
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                type="number"
                min={1}
                step={1}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Например: 500"
              />
            </label>

            <CalendarField
              label="Дата начала действия"
              value={startDate}
              onChange={setStartDate}
              maxValue={expirationDate || undefined}
              helperText="Дата, с которой бонус станет активным"
              quickOptions={[
                { label: "Сегодня", daysFromToday: 0 },
                { label: "+1 день", daysFromToday: 1 },
              ]}
            />

            <CalendarField
              label="Дата окончания действия"
              value={expirationDate}
              onChange={setExpirationDate}
              minValue={startDate || undefined}
              helperText="Рекомендуется ставить срок действия 30-90 дней"
              errorText={dateRangeInvalid ? "Дата окончания раньше даты начала" : undefined}
              quickOptions={[
                { label: "+7 дней", daysFromToday: 7 },
                { label: "+30 дней", daysFromToday: 30 },
                { label: "+90 дней", daysFromToday: 90 },
              ]}
            />

            <label className="md:col-span-2 block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Список номеров из Excel</span>
              <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm">
                <input
                  ref={excelInputRef}
                  id="bonus-excel-file"
                  type="file"
                  accept=".xlsx,.xlsm,.xltx,.xltm"
                  className="hidden"
                  onChange={(e) => setExcelFile(e.target.files?.[0] || null)}
                />
                <label
                  htmlFor="bonus-excel-file"
                  className="cursor-pointer rounded-md border border-slate-300 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
                >
                  Выбрать Excel
                </label>
                <span className="max-w-[320px] truncate text-slate-600">{excelFile ? excelFile.name : "Файл не выбран"}</span>
                {excelFile ? (
                  <button
                    type="button"
                    onClick={() => {
                      setExcelFile(null);
                      if (excelInputRef.current) {
                        excelInputRef.current.value = "";
                      }
                    }}
                    className="rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-700 hover:bg-slate-100"
                  >
                    Очистить
                  </button>
                ) : null}
              </div>
            </label>

            <label className="md:col-span-2 block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Телефоны вручную (по одному в строке, можно через запятую)</span>
              <textarea
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                rows={5}
                placeholder={"77071234567\n77075554433"}
                value={phonesText}
                onChange={(e) => setPhonesText(e.target.value)}
              />
            </label>
          </div>

          {error ? <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
          {success ? <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</p> : null}

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              disabled={!canSubmit || submitting}
              onClick={submit}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Отправка..." : "Начислить бонусы"}
            </button>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-base font-semibold text-slate-900">История начислений</h3>
          {jobsLoading ? (
            <p className="mt-3 text-sm text-slate-500">Загрузка...</p>
          ) : jobs.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">Начислений пока нет</p>
          ) : (
            <div className="mt-3 overflow-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-slate-500">
                    <th className="px-2 py-2">Дата создания</th>
                    <th className="px-2 py-2">Причина</th>
                    <th className="px-2 py-2">Сумма</th>
                    <th className="px-2 py-2">Период</th>
                    <th className="px-2 py-2">Статус</th>
                    <th className="px-2 py-2">Успешно</th>
                    <th className="px-2 py-2">Ошибок</th>
                    <th className="px-2 py-2">Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((job) => (
                    <tr key={job.id} className="border-b border-slate-100 last:border-b-0">
                      <td className="px-2 py-2">{formatDateTime(job.created_at)}</td>
                      <td className="max-w-[360px] px-2 py-2">
                        <p className="truncate" title={job.description}>
                          {job.description}
                        </p>
                      </td>
                      <td className="px-2 py-2">{job.amount}</td>
                      <td className="px-2 py-2">
                        {job.start_date} - {job.expiration_date}
                      </td>
                      <td className="px-2 py-2">
                        <span className={`rounded px-2 py-0.5 text-xs font-medium ${statusBadge(job.status)}`}>{statusLabel(job.status)}</span>
                      </td>
                      <td className="px-2 py-2">{job.cashbacks_created}</td>
                      <td className="px-2 py-2">{job.errors_count}</td>
                      <td className="px-2 py-2">
                        <button
                          type="button"
                          onClick={() => void openJob(job.id)}
                          className="rounded border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
                        >
                          Открыть
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {activeJob ? (
          <section ref={detailsRef} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-slate-900">Начисление #{activeJob.id}</h3>
                <p className="mt-1 text-sm text-slate-500">Создана: {formatDateTime(activeJob.created_at)}</p>
              </div>
              <span className={`rounded px-2 py-1 text-xs font-medium ${statusBadge(activeJob.status)}`}>{statusLabel(activeJob.status)}</span>
            </div>

            <div className="mt-4 grid gap-3 text-sm text-slate-700 md:grid-cols-3">
              <p>
                <span className="font-medium">Причина:</span> {activeJob.description}
              </p>
              <p>
                <span className="font-medium">Сумма:</span> {activeJob.amount}
              </p>
              <p>
                <span className="font-medium">Период:</span> {activeJob.start_date} - {activeJob.expiration_date}
              </p>
              <p>
                <span className="font-medium">Всего телефонов:</span> {activeJob.total_phones}
              </p>
              <p>
                <span className="font-medium">Уникальных:</span> {activeJob.unique_phones}
              </p>
              <p>
                <span className="font-medium">Гостей найдено:</span> {activeJob.guests_found}
              </p>
              <p>
                <span className="font-medium">Успешно начислено:</span> {activeJob.cashbacks_created}
              </p>
              <p>
                <span className="font-medium">Ошибок:</span> {activeJob.errors_count}
              </p>
            </div>

            {activeJob.error_log ? (
              <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                <p className="font-medium">Ошибки обработки</p>
                <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap">{activeJob.error_log}</pre>
              </div>
            ) : null}

            <div className="mt-5">
              <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Детали по номерам</h4>
              {activeJob.results.length === 0 ? (
                <p className="mt-2 text-sm text-slate-500">Нет строк для отображения</p>
              ) : (
                <div className="mt-2 max-h-[520px] overflow-auto rounded-lg border border-slate-200">
                  <table className="min-w-full text-sm">
                    <thead className="sticky top-0 bg-slate-50">
                      <tr className="border-b border-slate-200 text-left text-slate-500">
                        <th className="px-2 py-2">Телефон</th>
                        <th className="px-2 py-2">Guest ID</th>
                        <th className="px-2 py-2">doc_guid</th>
                        <th className="px-2 py-2">base_id</th>
                        <th className="px-2 py-2">Статус</th>
                        <th className="px-2 py-2">Ошибка</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeJob.results.map((row) => (
                        <tr key={row.id} className="border-b border-slate-100 last:border-b-0">
                          <td className="px-2 py-2">{row.phone_normalized || row.phone_raw || "-"}</td>
                          <td className="px-2 py-2">{row.guest_id || "-"}</td>
                          <td className="max-w-[280px] truncate px-2 py-2" title={row.doc_guid || ""}>
                            {row.doc_guid || "-"}
                          </td>
                          <td className="max-w-[280px] truncate px-2 py-2" title={row.base_id || ""}>
                            {row.base_id || "-"}
                          </td>
                          <td className="px-2 py-2">
                            {row.success ? (
                              <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">Успех</span>
                            ) : (
                              <span className="rounded bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">Ошибка</span>
                            )}
                          </td>
                          <td className="max-w-[340px] truncate px-2 py-2" title={row.error_message || ""}>
                            {row.error_message || "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        ) : null}
      </div>
    </AppShell>
  );
}
