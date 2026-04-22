"use client";

import { useEffect, useMemo, useState } from "react";

import { ActivityTable } from "@/features/analytics/components/activity-table";
import { ErrorBanner } from "@/features/analytics/components/error-banner";
import { FiltersBar } from "@/features/analytics/components/filters-bar";
import { StatsCards } from "@/features/analytics/components/stats-cards";
import { UserHistoryPanel } from "@/features/analytics/components/user-history-panel";
import { analyticsApi } from "@/features/analytics/api";
import { useAuthGuard } from "@/features/auth/use-auth-guard";
import { AppShell } from "@/features/navigation/components/app-shell";
import { useAnalyticsDashboard } from "@/features/analytics/hooks";
import { DailyActivityItem } from "@/features/analytics/types";

const today = new Date().toISOString().slice(0, 10);

export default function Home() {
  const { ready, authenticated, hasPageAccess, profile, allowedPages, logout } = useAuthGuard("analytics");
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [search, setSearch] = useState("");
  const [windowHours, setWindowHours] = useState<6 | 24>(24);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRow, setSelectedRow] = useState<DailyActivityItem | null>(null);
  const [historyRows, setHistoryRows] = useState<DailyActivityItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const { activity, stats, loading, error, lastUpdatedAt } = useAnalyticsDashboard(startDate, endDate, windowHours, authenticated);

  const filteredRows = useMemo(() => {
    const normalizedQuery = search.trim().toLowerCase();
    if (!normalizedQuery) {
      return activity;
    }

    return activity.filter((row) => {
      const phone = String(row.phone_number || "").toLowerCase();
      const userId = String(row.user_id || "").toLowerCase();
      const deviceId = String(row.device_id || "").toLowerCase();
      return phone.includes(normalizedQuery) || userId.includes(normalizedQuery) || deviceId.includes(normalizedQuery);
    });
  }, [activity, search]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, startDate, endDate]);

  const selectedRowKey = useMemo(() => {
    if (!selectedRow) {
      return null;
    }

    return `${selectedRow.user_id || ""}-${selectedRow.device_id || ""}-${selectedRow.phone_number || ""}`;
  }, [selectedRow]);

  const loadUserHistory = async () => {
    if (!selectedRow) return;

    const selectedDate = new Date(endDate);
    if (Number.isNaN(selectedDate.getTime())) return;

    // Диапазон: 6 дней назад от endDate → endDate
    const historyEnd = endDate;
    const startDateObj = new Date(selectedDate);
    startDateObj.setDate(selectedDate.getDate() - 6);
    const historyStart = startDateObj.toISOString().slice(0, 10);

    setHistoryLoading(true);
    try {
      if (selectedRow.phone_number) {
        // Используем новый endpoint с диапазоном дат
        const results = await analyticsApi.visitSearchByPhones({
          start_date: historyStart,
          end_date: historyEnd,
          phones: [selectedRow.phone_number],
        });
        setHistoryRows(results);
      } else {
        // Fallback: 7 параллельных запросов по дням, фильтр по user_id / device_id
        const requests: Promise<DailyActivityItem[]>[] = [];
        for (let offset = 0; offset < 7; offset += 1) {
          const historyDate = new Date(selectedDate);
          historyDate.setDate(selectedDate.getDate() - offset);
          requests.push(analyticsApi.getDailyActivity(historyDate.toISOString().slice(0, 10)));
        }
        const allDays = await Promise.all(requests);
        const matched = allDays.flat().filter((row) => {
          const sameUser = selectedRow.user_id && row.user_id && selectedRow.user_id === row.user_id;
          const sameDevice = selectedRow.device_id && row.device_id && selectedRow.device_id === row.device_id;
          return Boolean(sameUser || sameDevice);
        });
        setHistoryRows(matched);
      }
    } finally {
      setHistoryLoading(false);
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
        <p className="text-sm text-slate-600">У вас нет доступа к разделу аналитики.</p>
      </main>
    );
  }

  return (
    <AppShell
      title="Панель аналитики"
      subtitle="Мониторинг активности и присутствия пользователей в мобильном приложении"
      fullName={profile.full_name}
      positionName={profile.position?.name || ""}
      allowedPages={allowedPages}
      onLogout={logout}
    >
      <div className="space-y-6">
        <FiltersBar
          startDate={startDate}
          endDate={endDate}
          onRangeChange={(s, e) => { setStartDate(s); setEndDate(e); }}
          search={search}
          onSearchChange={setSearch}
          windowHours={windowHours}
          onWindowHoursChange={setWindowHours}
          loading={loading}
          lastUpdatedAt={lastUpdatedAt}
        />

        {error ? <div className="mt-4"><ErrorBanner message={error} /></div> : null}

        <div>
          <StatsCards stats={stats} loading={loading} />
        </div>

        <div>
          <ActivityTable
            rows={filteredRows}
            loading={loading}
            currentPage={currentPage}
            pageSize={12}
            onPageChange={setCurrentPage}
            onSelectRow={(row) => {
              setSelectedRow(row);
              setHistoryRows([]);
            }}
            selectedRowKey={selectedRowKey}
          />
        </div>
      </div>

      <UserHistoryPanel
        selectedRow={selectedRow}
        historyRows={historyRows}
        loading={historyLoading}
        onClose={() => {
          setSelectedRow(null);
          setHistoryRows([]);
        }}
        onLoadHistory={loadUserHistory}
      />
    </AppShell>
  );
}
