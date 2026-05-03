"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { AppShell } from "@/features/navigation/components/app-shell";
import { useAuthGuard } from "@/features/auth/use-auth-guard";
import { couponDispatchApi } from "@/features/coupon-dispatch/api";
import { CouponDispatchJob, CouponDispatchJobDetail, MarketingSaleOption } from "@/features/coupon-dispatch/types";
import { AuthLoadingScreen } from "@/features/common/components/AuthLoadingScreen";
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

function formatGuestName(row: CouponDispatchJobDetail["results"][number]): string {
  const maybeName = "guest_name" in row && typeof row.guest_name === "string" ? row.guest_name.trim() : "";
  if (maybeName) return maybeName;
  if (row.guest_id) return `Гость #${row.guest_id}`;
  return "Не найден";
}

export default function CouponDispatchPage() {
  const { ready, authenticated, hasPageAccess, profile, allowedPages, logout } = useAuthGuard("coupon-dispatch");
  const { addToast } = useToast();

  const [couponTitle, setCouponTitle] = useState("");
  const [phonesText, setPhonesText] = useState("");
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [search, setSearch] = useState("");
  const [sales, setSales] = useState<MarketingSaleOption[]>([]);
  const [salesLoading, setSalesLoading] = useState(false);
  const [selectedSale, setSelectedSale] = useState<MarketingSaleOption | null>(null);
  const [jobs, setJobs] = useState<CouponDispatchJob[]>([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [activeJob, setActiveJob] = useState<CouponDispatchJobDetail | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const detailsRef = useRef<HTMLElement | null>(null);
  const excelInputRef = useRef<HTMLInputElement | null>(null);

  const activeJobId = activeJob?.id;
  const activeJobStatus = activeJob?.status;

  const canSubmit = useMemo(
    () => Boolean(couponTitle.trim() && selectedSale && (phonesText.trim() || excelFile)),
    [couponTitle, selectedSale, phonesText, excelFile],
  );

  // Sales search with debounce + AbortController (fixes race condition)
  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      const loadSales = async () => {
        setSalesLoading(true);
        try {
          const data = await couponDispatchApi.listMarketingSales(search.trim(), controller.signal);
          if (controller.signal.aborted) return;
          setSales(data);
          setSelectedSale((current) => {
            if (!current) return current;
            return data.find((item) => item.id === current.id) ?? null;
          });
        } catch (err) {
          if (!controller.signal.aborted) {
            addToast("error", err instanceof Error ? err.message : "Не удалось загрузить маркетинговые акции");
          }
        } finally {
          if (!controller.signal.aborted) setSalesLoading(false);
        }
      };
      void loadSales();
    }, 300);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [search, addToast]);

  const fetchJobs = useCallback(() => couponDispatchApi.listJobs(20), []);
  const fetchJobDetail = useCallback((id: number) => couponDispatchApi.getJob(id), []);

  const onJobsLoaded = useCallback((data: CouponDispatchJob[]) => {
    setJobs(data);
    setJobsLoading(false);
  }, []);

  const onJobDetailLoaded = useCallback((detail: CouponDispatchJobDetail) => {
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
      const details = await couponDispatchApi.getJob(jobId);
      setActiveJob(details);
    } catch (err) {
      addToast("error", err instanceof Error ? err.message : "Не удалось загрузить детали задачи");
    }
  };

  const submit = async () => {
    if (!selectedSale) {
      setFormError("Выберите маркетинговую акцию");
      return;
    }

    setSubmitting(true);
    setFormError(null);
    try {
      const created = await couponDispatchApi.createJob({
        title: couponTitle.trim(),
        marketingSaleId: selectedSale.id,
        marketingSaleName: selectedSale.name,
        phonesText: phonesText.trim(),
        excelFile,
      });

      addToast("success", "Рассылка создана и отправлена в обработку");
      setPhonesText("");
      setExcelFile(null);
      if (excelInputRef.current) excelInputRef.current.value = "";
      setActiveJob(created);
      const refreshed = await couponDispatchApi.listJobs(20);
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
      title="Отправка купонов"
      subtitle="Массовая рассылка купонов по списку телефонов"
      fullName={profile.full_name}
      positionName={profile.position?.name || ""}
      allowedPages={allowedPages}
      onLogout={logout}
    >
      <div className="space-y-6">
        {/* Create form */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Новая рассылка купонов</h2>
          <p className="mt-1 text-sm text-slate-500">
            1) Укажите название купона в приложении &nbsp;2) Загрузите Excel или вставьте телефоны &nbsp;3) Выберите акцию и отправьте
          </p>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Название купона в приложении</span>
              <input
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                placeholder="Например: Купон 15%"
                value={couponTitle}
                onChange={(e) => setCouponTitle(e.target.value)}
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Список номеров из Excel</span>
              <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm">
                <input
                  ref={excelInputRef}
                  id="coupon-excel-file"
                  type="file"
                  accept=".xlsx,.xlsm,.xltx,.xltm"
                  className="hidden"
                  onChange={(e) => setExcelFile(e.target.files?.[0] || null)}
                />
                <label
                  htmlFor="coupon-excel-file"
                  className="cursor-pointer rounded-md border border-slate-300 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
                >
                  Выбрать Excel
                </label>
                <span className="max-w-[260px] truncate text-slate-600">
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

          {/* Sale search */}
          <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Поиск маркетинговой акции</span>
              <input
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                placeholder="Введите название акции"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>

            <div className="mt-3 max-h-56 overflow-auto rounded-lg border border-slate-200 bg-white">
              {salesLoading ? (
                <div className="space-y-1 p-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-8 w-full" />
                  ))}
                </div>
              ) : sales.length === 0 ? (
                <p className="p-3 text-sm text-slate-500">Акции не найдены</p>
              ) : (
                <ul>
                  {sales.map((sale) => {
                    const active = selectedSale?.id === sale.id;
                    return (
                      <li key={sale.id}>
                        <button
                          type="button"
                          onClick={() => setSelectedSale(sale)}
                          className={`flex w-full items-center justify-between border-b border-slate-100 px-3 py-2 text-left text-sm transition last:border-b-0 ${
                            active ? "bg-indigo-50 text-indigo-700" : "hover:bg-slate-50"
                          }`}
                        >
                          <span className="font-medium">{sale.name || `Акция #${sale.id}`}</span>
                          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                            Свободно: {sale.available_coupons}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>

          {selectedSale && (
            <p className="mt-3 text-sm text-slate-600">
              Выбрана акция:{" "}
              <span className="font-medium">{selectedSale.name || `#${selectedSale.id}`}</span>,
              доступно купонов: {selectedSale.available_coupons}
            </p>
          )}

          {formError && (
            <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
              {formError}
            </p>
          )}

          <div className="mt-5">
            <Button disabled={!canSubmit} loading={submitting} onClick={() => void submit()}>
              Отправить купоны
            </Button>
          </div>
        </section>

        {/* Job history */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-base font-semibold text-slate-900">История рассылок</h3>

          {jobsLoading ? (
            <div className="mt-3 space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : jobs.length === 0 ? (
            <div className="mt-6 flex flex-col items-center gap-3 py-4 text-center">
              <svg className="h-12 w-12 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <p className="text-sm font-medium text-slate-500">Рассылок пока нет</p>
              <p className="text-xs text-slate-400">Создайте первую рассылку выше</p>
            </div>
          ) : (
            <div className="mt-3 overflow-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                    <th className="px-3 py-2">Дата</th>
                    <th className="px-3 py-2">Купон</th>
                    <th className="px-3 py-2">Акция</th>
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
                      <td className="max-w-[200px] px-3 py-2.5">
                        <p className="truncate font-medium text-slate-800" title={job.title}>{job.title}</p>
                      </td>
                      <td className="max-w-[200px] px-3 py-2.5">
                        <p className="truncate text-slate-600" title={job.marketing_sale_name || ""}>{job.marketing_sale_name || "-"}</p>
                      </td>
                      <td className="px-3 py-2.5"><StatusBadge status={job.status} /></td>
                      <td className="px-3 py-2.5 font-medium text-emerald-700">{job.coupons_assigned}</td>
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
                <h3 className="text-base font-semibold text-slate-900">Рассылка #{activeJob.id}</h3>
                <p className="mt-0.5 text-sm text-slate-500">Создана: {formatDateTime(activeJob.created_at)}</p>
              </div>
              <StatusBadge status={activeJob.status} />
            </div>

            <dl className="mt-4 grid gap-3 text-sm md:grid-cols-3">
              {([
                ["Купон", activeJob.title],
                ["Акция", activeJob.marketing_sale_name || "-"],
                ["Всего телефонов", String(activeJob.total_phones)],
                ["Гостей найдено", String(activeJob.guests_found)],
                ["Успешно отправлено", String(activeJob.coupons_assigned)],
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
                <p className="font-semibold">Лог ошибок</p>
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
                        <th className="px-3 py-2">Имя гостя</th>
                        <th className="px-3 py-2">Купон</th>
                        <th className="px-3 py-2">Статус</th>
                        <th className="px-3 py-2">Ошибка</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeJob.results.map((row) => (
                        <tr key={row.id} className="border-b border-slate-100 last:border-b-0">
                          <td className="px-3 py-2">{row.phone_normalized || row.phone_raw || "-"}</td>
                          <td className="px-3 py-2">{formatGuestName(row)}</td>
                          <td className="px-3 py-2">{row.coupon_code || "-"}</td>
                          <td className="px-3 py-2">
                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${row.success ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                              {row.success ? "Отправлено" : "Не отправлено"}
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
