"use client";

import { AppShell } from "@/features/navigation/components/app-shell";
import { useAuthGuard } from "@/features/auth/use-auth-guard";
import { AuthLoadingScreen } from "@/features/common/components/AuthLoadingScreen";

export default function BlacklistPage() {
  const { ready, authenticated, hasPageAccess, profile, allowedPages, logout } = useAuthGuard("blacklist");

  if (!ready || !authenticated) return <AuthLoadingScreen />;
  if (!hasPageAccess) return <AuthLoadingScreen message="У вас нет доступа к этому разделу." />;

  return (
    <AppShell
      title="Черный список"
      subtitle="Блокировка и контроль пользователей по номеру телефона"
      fullName={profile.full_name}
      positionName={profile.position?.name || ""}
      allowedPages={allowedPages}
      onLogout={logout}
    >
      <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
          <svg className="h-7 w-7 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="12" cy="12" r="8" />
            <path d="M8.5 15.5l7-7" strokeLinecap="round" />
          </svg>
        </div>
        <h2 className="text-base font-semibold text-slate-700">Раздел в разработке</h2>
        <p className="mt-1 text-sm text-slate-400">
          Функционал управления чёрным списком будет доступен после подключения серверного API.
        </p>
      </section>
    </AppShell>
  );
}
