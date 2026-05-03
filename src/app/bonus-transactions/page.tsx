"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { AppShell } from "@/features/navigation/components/app-shell";
import { useAuthGuard } from "@/features/auth/use-auth-guard";
import { bonusTransactionsApi } from "@/features/bonus-transactions/api";
import { BonusTransactionJob, BonusTransactionJobDetail } from "@/features/bonus-transactions/types";
import { AuthLoadingScreen } from "@/features/common/components/AuthLoadingScreen";
import { CalendarField } from "@/features/common/components/CalendarField";
import { Button } from "@/features/common/components/ui/Button";
import { Skeleton } from "@/features/common/components/ui/Skeleton";
import { StatusBadge } from "@/features/common/components/ui/StatusBadge";
import { useToast } from "@/features/common/components/ui/Toast";
import { useJobPolling } from "@/features/common/hooks/useJobPolling";

function formatDateTime(value: string | null | undefined): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("ru-RU", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function getTodayIsoDate(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default function BonusTransactionsPage() {
  const { ready, authenticated, hasPageAccess, profile, allowedPages, logout } = useAuthGuard("bonus-transactions");
  const { addToast } = useToast();

  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [startDate, setStartDate] = useState(getTodayIsoDate);
  const [expirationDate, setExpirationDate] = useState(getTodayIsoDate);
  const [phonesText, setPhonesText] = useState("");
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [jobs, setJobs] = useState<BonusTransactionJob[]>([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [activeJob, setActiveJob] = useState<BonusTransactionJobDetail | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const detailsRef = useRef<HTMLElement | null>(null);
  const excelInputRef = useRef<HTMLInputElement | null>(null);

  const activeJobId = activeJob?.id;
  const activeJobStatus = activeJob?.status;
  const dateRangeInvalid = Boolean(startDate && expirationDate && expirationDate < startDate);

  const canSubmit = useMemo(() => {
    if (!description.trim() || !amount.trim() || !startDate || !expirationDate || dateRangeInvalid) return false;
    const numericAmount = Number(amount);
    if (!Number.isInteger(numericAmount) || numericAmount <= 0) return false;
    return Boolean(phonesText.trim() || excelFile);
  }, [amount, dateRangeInvalid, description, expirationDate, excelFile, phonesText, startDate]);

  const fetchJobs = useCallback(() => bonusTransactionsApi.listJobs(20), []);
  const fetchJobDetail = useCallback((id: number) => bonusTransactionsApi.getJob(id), []);

  const onJobsLoaded = useCallback((data: BonusTransactionJob[]) => {
    setJobs(data);
    setJobsLoading(false);
  }, []);

  const onJobDetailLoaded = useCallback((detail: BonusTransactionJobDetail) => {
    setActiveJob(detail);
  }, []);

  const onInitialLoadError = useCallback((message: string) => {
    setJobsLoading(false);
    addToast("error", message);
  }, [addToast]);

  useJobPolling({
    enabled: authenticated,
    activeJobId,
    activeJobStatus,
    fetchJobs,
    fetchJobDetail,
    onJobsLoaded,
    onJobDetailLoaded,
    onInitialLoadError,
  });

  useEffect(() => {
    if (!activeJob?.id) return;
    detailsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [activeJob?.id]);

  const openJob = async (jobId: number) => {
    try {
      const details = await bonusTransactionsApi.getJob(jobId);
      setActiveJob(details);
    } catch (err) {
      addToast("error", err instanceof Error ? err.message : "Не удалось загрузить детали задачи");
    }
  };

  const submit = async () => {
    const numericAmount = Number(amount);
    if (!Number.isInteger(numericAmount) || numericAmount <= 0) {
      setFormError("Сумма должна быть положительным целым числом");
      return;
    }
    if (dateRangeInvalid) {
      setFormError("Дата окончания не может быть раньше даты начала");
      return;
    }

    setSubmitting(true);
    setFormError(null);
    try {
      const created = await bonusTransactionsApi.createJob({
        description: description.trim(),
        amount: numericAmount,
        startDate,
        expirationDate,
        phonesText: phonesText.trim(),
        excelFile,
      });

      addToast("success", "Задача создана и отправлена в обработку");
      setPhonesText("");
      setExcelFile(null);
      if (excelInputRef.current) excelInputRef.current.value = "";
      setActiveJob(created);
      const refreshed = await bonusTransactionsApi.listJobs(20);
      setJobs(refreshed);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Не удалось создать задачу");
    } finally {
      setSubmitting(false);
    }
  };

  if (!ready || !authenticated) return <AuthLoadingScreen />;
  if (!hasPageAccess) return <AuthLoadingScreen message="У вас нет доступа к этому разделу." />;

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
        {/* Create form */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Новое начисление</h2>
          <p className="mt-1 text-sm text-slate-500">
            Укажите параметры бонуса и добавьте номера телефонов вручную или через Excel
          </p>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <label className="block md:col-span-2">
              <span className="mb-1 block text-sm font-medium text-slate-700">Причина/описание начисления</span>
              <input
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                placeholder="Например: Компенсация за сервис"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Сумма бонуса</span>
              <input
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
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
              helperText="Рекомендуется ставить срок действия 30–90 дней"
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
                <span className="max-w-[320px] truncate text-slate-600">
                  {excelFile ? excelFile.name : "Файл не выбран"}
                </span>
                {excelFile && (
                  <button
                    type="button"
                    onClick={() => {
                      setExcelFile(null);
                      if (excelInputRef.current) excelInputRef.current.value = "";
                    }}
                    className="rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-700 hover:bg-slate-100"
                  >
                    Очистить
                  </button>
                )}
              </div>
            </label>

            <label className="md:col-span-2 block">
              <span className="mb-1 block text-sm font-medium text-slate-700">
                Телефоны вручную (по одному в строке, можно через запятую)
              </span>
              <textarea
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                rows={5}
                placeholder={"77071234567\n77075554433"}
                value={phonesText}
                onChange={(e) => setPhonesText(e.target.value)}
              />
            </label>
          </div>

          {formError && (
            <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
              {formError}
            </p>
          )}

          <div className="mt-5">
            <Button disabled={!canSubmit} loading={submitting} onClick={() => void submit()}>
              Начислить бонусы
            </Button>
          </div>
        </section>

        {/* Job history */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-base font-semibold text-slate-900">История начислений</h3>

          {jobsLoading ? (
            <div className="mt-3 space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : jobs.length === 0 ? (
            <div className="mt-6 flex flex-col items-center gap-3 py-4 text-center">
              <svg className="h-12 w-12 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="text-sm font-medium text-slate-500">Начислений пока нет</p>
              <p className="text-xs text-slate-400">Создайте первое начисление выше</p>
            </div>
          ) : (
            <div className="mt-3 overflow-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                    <th className="px-3 py-2">Дата</th>
                    <th className="px-3 py-2">Причина</th>
                    <th className="px-3 py-2">Сумма</th>
                    <th className="px-3 py-2">Период</th>
                    <th className="px-3 py-2">Статус</th>
                    <th className="px-3 py-2">Успешно</th>
                    <th className="px-3 py-2">Ошибок</th>
                    <th className="px-3 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((job) => (
                    <tr key={job.id} className="border-b border-slate-100 transition hover:bg-slate-50 last:border-b-0">
                      <td className="px-3 py-2.5 text-slate-500">{formatDateTime(job.created_at)}</td>
                      <td className="max-w-[260px] px-3 py-2.5">
                        <p className="truncate font-medium text-slate-800" title={job.description}>{job.description}</p>
                      </td>
                      <td className="px-3 py-2.5 font-semibold text-slate-900">{job.amount}</td>
                      <td className="px-3 py-2.5 text-slate-500">{job.start_date} – {job.expiration_date}</td>
                      <td className="px-3 py-2.5"><StatusBadge status={job.status} /></td>
                      <td className="px-3 py-2.5 font-medium text-emerald-700">{job.cashbacks_created}</td>
                      <td className="px-3 py-2.5 font-medium text-rose-600">{job.errors_count}</td>
                      <td className="px-3 py-2.5">
                        <Button variant="secondary" size="sm" onClick={() => void openJob(job.id)}>
                          Открыть
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Active job detail */}
        {activeJob && (
          <section ref={detailsRef} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-slate-900">Начисление #{activeJob.id}</h3>
                <p className="mt-0.5 text-sm text-slate-500">Создана: {formatDateTime(activeJob.created_at)}</p>
              </div>
              <StatusBadge status={activeJob.status} />
            </div>

            <dl className="mt-4 grid gap-3 text-sm md:grid-cols-3">
              {([
                ["Причина", activeJob.description],
                ["Сумма", String(activeJob.amount)],
                ["Период", `${activeJob.start_date} – ${activeJob.expiration_date}`],
                ["Всего телефонов", String(activeJob.total_phones)],
                ["Уникальных", String(activeJob.unique_phones)],
                ["Гостей найдено", String(activeJob.guests_found)],
                ["Успешно начислено", String(activeJob.cashbacks_created)],
                ["Ошибок", String(activeJob.errors_count)],
              ] as [string, string][]).map(([key, val]) => (
                <div key={key} className="rounded-lg bg-slate-50 px-3 py-2">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">{key}</dt>
                  <dd className="mt-0.5 font-medium text-slate-800">{val}</dd>
                </div>
              ))}
            </dl>

            {activeJob.error_log && (
              <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                <p className="font-semibold">Ошибки обработки</p>
                <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap text-xs">{activeJob.error_log}</pre>
              </div>
            )}

            <div className="mt-5">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Детали по номерам</h4>
              {activeJob.results.length === 0 ? (
                <p className="mt-2 text-sm text-slate-500">Нет строк для отображения</p>
              ) : (
                <div className="mt-2 max-h-[520px] overflow-auto rounded-lg border border-slate-200">
                  <table className="min-w-full text-xs">
                    <thead className="sticky top-0 bg-slate-50">
                      <tr className="border-b border-slate-200 text-left text-slate-400">
                        <th className="px-3 py-2">Телефон</th>
                        <th className="px-3 py-2">Guest ID</th>
                        <th className="px-3 py-2">doc_guid</th>
                        <th className="px-3 py-2">base_id</th>
                        <th className="px-3 py-2">Статус</th>
                        <th className="px-3 py-2">Ошибка</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeJob.results.map((row) => (
                        <tr key={row.id} className="border-b border-slate-100 last:border-b-0">
                          <td className="px-3 py-2">{row.phone_normalized || row.phone_raw || "-"}</td>
                          <td className="px-3 py-2">{row.guest_id || "-"}</td>
                          <td className="max-w-[220px] truncate px-3 py-2" title={row.doc_guid || ""}>{row.doc_guid || "-"}</td>
                          <td className="max-w-[220px] truncate px-3 py-2" title={row.base_id || ""}>{row.base_id || "-"}</td>
                          <td className="px-3 py-2">
                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${row.success ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                              {row.success ? "Успех" : "Ошибка"}
                            </span>
                          </td>
                          <td className="max-w-[280px] truncate px-3 py-2 text-rose-600" title={row.error_message || ""}>{row.error_message || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </AppShell>
  );
}
