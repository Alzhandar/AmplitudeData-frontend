"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { AppShell } from "@/features/navigation/components/app-shell";
import { useAuthGuard } from "@/features/auth/use-auth-guard";
import { couponDispatchApi } from "@/features/coupon-dispatch/api";
import { CouponDispatchJob, CouponDispatchJobDetail, MarketingSaleOption } from "@/features/coupon-dispatch/types";

function statusBadge(status: CouponDispatchJob["status"]): string {
  if (status === "completed") return "bg-emerald-100 text-emerald-700";
  if (status === "failed") return "bg-red-100 text-red-700";
  if (status === "processing") return "bg-amber-100 text-amber-700";
  return "bg-slate-100 text-slate-700";
}

function statusLabel(status: CouponDispatchJob["status"]): string {
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

function formatGuestName(row: CouponDispatchJobDetail["results"][number]): string {
  const maybeName = "guest_name" in row && typeof row.guest_name === "string" ? row.guest_name.trim() : "";
  if (maybeName) {
    return maybeName;
  }
  if (row.guest_id) {
    return `Гость #${row.guest_id}`;
  }
  return "Не найден";
}

export default function CouponDispatchPage() {
  const { ready, authenticated, hasPageAccess, profile, allowedPages, logout } = useAuthGuard("coupon-dispatch");
  const [couponTitle, setCouponTitle] = useState("");
  const [phonesText, setPhonesText] = useState("");
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [search, setSearch] = useState("");
  const [sales, setSales] = useState<MarketingSaleOption[]>([]);
  const [salesLoading, setSalesLoading] = useState(false);
  const [selectedSale, setSelectedSale] = useState<MarketingSaleOption | null>(null);
  const [jobs, setJobs] = useState<CouponDispatchJob[]>([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [activeJob, setActiveJob] = useState<CouponDispatchJobDetail | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const detailsRef = useRef<HTMLElement | null>(null);
  const excelInputRef = useRef<HTMLInputElement | null>(null);
  const activeJobId = activeJob?.id;
  const activeJobStatus = activeJob?.status;

  const canSubmit = useMemo(() => {
    return Boolean(couponTitle.trim() && selectedSale && (phonesText.trim() || excelFile));
  }, [couponTitle, selectedSale, phonesText, excelFile]);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      const loadSales = async () => {
        setSalesLoading(true);
        try {
          const data = await couponDispatchApi.listMarketingSales(search.trim());
          if (controller.signal.aborted) return;
          setSales(data);
          setSelectedSale((current) => {
            if (!current) return current;
            return data.find((item) => item.id === current.id) || null;
          });
        } catch (err) {
          if (!controller.signal.aborted) {
            const message = err instanceof Error ? err.message : "Не удалось загрузить маркетинговые акции";
            setError(message);
          }
        } finally {
          if (!controller.signal.aborted) {
            setSalesLoading(false);
          }
        }
      };

      void loadSales();
    }, 300);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [search]);

  const refreshJobs = useCallback(async (showLoader: boolean) => {
    if (showLoader) {
      setJobsLoading(true);
    }

    try {
      const data = await couponDispatchApi.listJobs(20);
      setJobs(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Не удалось загрузить задачи рассылки";
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
        const details = await couponDispatchApi.getJob(activeJobId);
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
      const details = await couponDispatchApi.getJob(jobId);
      setActiveJob(details);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Не удалось загрузить детали задачи";
      setError(message);
    }
  };

  const submit = async () => {
    if (!selectedSale) {
      setError("Выберите маркетинговую акцию");
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const created = await couponDispatchApi.createJob({
        title: couponTitle.trim(),
        marketingSaleId: selectedSale.id,
        marketingSaleName: selectedSale.name,
        phonesText: phonesText.trim(),
        excelFile,
      });

      setSuccess("Рассылка создана и отправлена в обработку");
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
      title="Отправка купонов"
      subtitle="Массовая рассылка купонов по списку телефонов"
      fullName={profile.full_name}
      positionName={profile.position?.name || ""}
      allowedPages={allowedPages}
      onLogout={logout}
    >
      <div className="space-y-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Новая рассылка купонов</h2>
          <p className="mt-1 text-sm text-slate-500">1) Укажите название купона в приложении 2) Загрузите Excel или вставьте телефоны 3) Выберите акцию и отправьте</p>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Название купона в приложении</span>
              <input
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
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
                <span className="max-w-[260px] truncate text-slate-600">{excelFile ? excelFile.name : "Файл не выбран"}</span>
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

          <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Поиск маркетинговой акции</span>
              <input
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                placeholder="Введите название акции"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>

            <div className="mt-3 max-h-56 overflow-auto rounded-lg border border-slate-200 bg-white">
              {salesLoading ? (
                <p className="p-3 text-sm text-slate-500">Загрузка акций...</p>
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
                          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600">Свободно: {sale.available_coupons}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>

          {selectedSale ? (
            <p className="mt-3 text-sm text-slate-600">
              Выбрана акция: <span className="font-medium">{selectedSale.name || `#${selectedSale.id}`}</span>, доступно купонов: {selectedSale.available_coupons}
            </p>
          ) : null}

          {error ? <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
          {success ? <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</p> : null}

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              disabled={!canSubmit || submitting}
              onClick={submit}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Отправка..." : "Отправить купоны"}
            </button>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-base font-semibold text-slate-900">История рассылок</h3>
          {jobsLoading ? (
            <p className="mt-3 text-sm text-slate-500">Загрузка...</p>
          ) : jobs.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">История пока пустая</p>
          ) : (
            <div className="mt-3 overflow-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-slate-500">
                    <th className="px-2 py-2">Дата выгрузки</th>
                    <th className="px-2 py-2">Купон в приложении</th>
                    <th className="px-2 py-2">Маркетинговая акция</th>
                    <th className="px-2 py-2">Статус</th>
                    <th className="px-2 py-2">Успешно отправлено</th>
                    <th className="px-2 py-2">Не отправлено</th>
                    <th className="px-2 py-2">Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((job) => (
                    <tr key={job.id} className="border-b border-slate-100 last:border-b-0">
                      <td className="px-2 py-2">{formatDateTime(job.created_at)}</td>
                      <td className="px-2 py-2">{job.title}</td>
                      <td className="px-2 py-2">{job.marketing_sale_name || "-"}</td>
                      <td className="px-2 py-2">
                        <span className={`rounded px-2 py-0.5 text-xs font-medium ${statusBadge(job.status)}`}>{statusLabel(job.status)}</span>
                      </td>
                      <td className="px-2 py-2">{job.coupons_assigned}</td>
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
            <h3 className="text-base font-semibold text-slate-900">Детали рассылки</h3>
            <div className="mt-3 grid gap-3 text-sm text-slate-700 sm:grid-cols-2 lg:grid-cols-3">
              <p>Дата выгрузки: <span className="font-medium">{formatDateTime(activeJob.created_at)}</span></p>
              <p>Маркетинговая акция: <span className="font-medium">{activeJob.marketing_sale_name || "-"}</span></p>
              <p>Купон в приложении: <span className="font-medium">{activeJob.title}</span></p>
              <p>Всего номеров: <span className="font-medium">{activeJob.total_phones}</span></p>
              <p>Найдено гостей: <span className="font-medium">{activeJob.guests_found}</span></p>
              <p>Успешно отправлено: <span className="font-medium">{activeJob.coupons_assigned}</span></p>
              <p>Не отправлено: <span className="font-medium">{activeJob.errors_count}</span></p>
              <p>Статус рассылки: <span className="font-medium">{statusLabel(activeJob.status)}</span></p>
            </div>

            {activeJob.error_log ? (
              <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                <p className="font-semibold">Лог ошибок</p>
                <pre className="mt-1 whitespace-pre-wrap text-xs">{activeJob.error_log}</pre>
              </div>
            ) : null}

            <div className="mt-4 max-h-72 overflow-auto rounded-lg border border-slate-200">
              <table className="min-w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-left text-slate-500">
                    <th className="px-2 py-2">Телефон</th>
                    <th className="px-2 py-2">Имя гостя</th>
                    <th className="px-2 py-2">Купон</th>
                    <th className="px-2 py-2">Статус отправки</th>
                    <th className="px-2 py-2">Причина неотправки</th>
                  </tr>
                </thead>
                <tbody>
                  {activeJob.results.map((row) => (
                    <tr key={row.id} className="border-b border-slate-100 last:border-b-0">
                      <td className="px-2 py-2">{row.phone_normalized || row.phone_raw || "-"}</td>
                      <td className="px-2 py-2">{formatGuestName(row)}</td>
                      <td className="px-2 py-2">{row.coupon_code || "-"}</td>
                      <td className="px-2 py-2">
                        <span className={`rounded px-2 py-0.5 ${row.success ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                          {row.success ? "Отправлено" : "Не отправлено"}
                        </span>
                      </td>
                      <td className="px-2 py-2 text-red-700">{row.error_message || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}
      </div>
    </AppShell>
  );
}
