"use client";

import { useState } from "react";

import { ErrorBanner } from "@/features/analytics/components/error-banner";
import { FiltersBar } from "@/features/analytics/components/filters-bar";
import { RegistrationsBlock } from "@/features/analytics/components/RegistrationsBlock";
import { StatsCards } from "@/features/analytics/components/stats-cards";
import { ActivityTable } from "@/features/analytics/components/activity-table";
import { UserHistoryPanel } from "@/features/analytics/components/user-history-panel";
import { useAuthGuard } from "@/features/auth/use-auth-guard";
import { AppShell } from "@/features/navigation/components/app-shell";
import { useAnalyticsDashboard } from "@/features/analytics/hooks";
import { AuthLoadingScreen } from "@/features/common/components/AuthLoadingScreen";
import { DailyActivityItem } from "@/features/analytics/types";
import { analyticsApi } from "@/features/analytics/api";
import { getTodayIsoDate } from "@/features/common/utils/date";
import { getNetworkErrorMessage } from "@/features/common/api-error";

const PAGE_SIZE = 25;

export default function Home() {
  const { ready, authenticated, hasPageAccess, profile, allowedPages, logout } = useAuthGuard("analytics");

  // Compute today inside component so the date updates if the page stays open past midnight
  const [startDate, setStartDate] = useState(getTodayIsoDate);
  const [endDate, setEndDate] = useState(getTodayIsoDate);
  const [windowHours, setWindowHours] = useState<6 | 24>(24);

  const { activity, stats, loading, error, lastUpdatedAt } = useAnalyticsDashboard(
    startDate,
    endDate,
    windowHours,
    authenticated,
  );

  // Activity table pagination & selection
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRow, setSelectedRow] = useState<DailyActivityItem | null>(null);
  const [historyRows, setHistoryRows] = useState<DailyActivityItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  function buildRowKey(row: DailyActivityItem): string {
    return `${row.user_id || ""}-${row.device_id || ""}-${row.phone_number || ""}`;
  }

  function handleSelectRow(row: DailyActivityItem) {
    setSelectedRow(row);
    setHistoryRows([]);
    setHistoryError(null);
    // Auto-load history immediately so user doesn't need to click "Загрузить"
    if (row.phone_number) {
      void (async () => {
        setHistoryLoading(true);
        try {
          const today = getTodayIsoDate();
          const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
          const rows = await analyticsApi.visitSearchByPhones({
            start_date: sevenDaysAgo,
            end_date: today,
            phones: [row.phone_number as string],
          });
          setHistoryRows(rows);
        } catch (err) {
          setHistoryError(err instanceof Error ? err.message : getNetworkErrorMessage(err));
        } finally {
          setHistoryLoading(false);
        }
      })();
    }
  }

  async function handleLoadHistory() {
    if (!selectedRow?.phone_number) return;
    setHistoryLoading(true);
    setHistoryError(null);
    try {
      const today = getTodayIsoDate();
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      const rows = await analyticsApi.visitSearchByPhones({
        start_date: sevenDaysAgo,
        end_date: today,
        phones: [selectedRow.phone_number],
      });
      setHistoryRows(rows);
    } catch (err) {
      setHistoryError(err instanceof Error ? err.message : getNetworkErrorMessage(err));
    } finally {
      setHistoryLoading(false);
    }
  }

  if (!ready || !authenticated) return <AuthLoadingScreen />;
  if (!hasPageAccess) return <AuthLoadingScreen message="У вас нет доступа к разделу аналитики." />;

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
          onRangeChange={(s, e) => { setStartDate(s); setEndDate(e); setCurrentPage(1); }}
          windowHours={windowHours}
          onWindowHoursChange={setWindowHours}
          loading={loading}
          lastUpdatedAt={lastUpdatedAt}
        />

        {error ? <div className="mt-4"><ErrorBanner message={error} /></div> : null}

        <StatsCards stats={stats} loading={loading} />

        <ActivityTable
          rows={activity}
          loading={loading}
          currentPage={currentPage}
          pageSize={PAGE_SIZE}
          onPageChange={setCurrentPage}
          onSelectRow={handleSelectRow}
          selectedRowKey={selectedRow ? buildRowKey(selectedRow) : null}
        />

        <RegistrationsBlock />
      </div>

      <UserHistoryPanel
        selectedRow={selectedRow}
        historyRows={historyRows}
        loading={historyLoading}
        error={historyError}
        onClose={() => setSelectedRow(null)}
        onLoadHistory={() => void handleLoadHistory()}
      />
    </AppShell>
  );
}
