"use client";

import { useState } from "react";

import { ErrorBanner } from "@/features/analytics/components/error-banner";
import { FiltersBar } from "@/features/analytics/components/filters-bar";
import { RegistrationsBlock } from "@/features/analytics/components/RegistrationsBlock";
import { StatsCards } from "@/features/analytics/components/stats-cards";
import { useAuthGuard } from "@/features/auth/use-auth-guard";
import { AppShell } from "@/features/navigation/components/app-shell";
import { useAnalyticsDashboard } from "@/features/analytics/hooks";
import { AuthLoadingScreen } from "@/features/common/components/AuthLoadingScreen";

const today = new Date().toISOString().slice(0, 10);

export default function Home() {
  const { ready, authenticated, hasPageAccess, profile, allowedPages, logout } = useAuthGuard("analytics");
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [windowHours, setWindowHours] = useState<6 | 24>(24);
  const { stats, loading, error, lastUpdatedAt } = useAnalyticsDashboard(startDate, endDate, windowHours, authenticated);

  if (!ready || !authenticated) {
    return <AuthLoadingScreen />;
  }

  if (!hasPageAccess) {
    return <AuthLoadingScreen message="У вас нет доступа к разделу аналитики." />;
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
          windowHours={windowHours}
          onWindowHoursChange={setWindowHours}
          loading={loading}
          lastUpdatedAt={lastUpdatedAt}
        />

        {error ? <div className="mt-4"><ErrorBanner message={error} /></div> : null}

        <StatsCards stats={stats} loading={loading} />

        <RegistrationsBlock />
      </div>
    </AppShell>
  );
}
