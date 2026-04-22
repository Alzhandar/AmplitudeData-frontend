"use client";

import { AppShell } from "@/features/navigation/components/app-shell";
import { useAuthGuard } from "@/features/auth/use-auth-guard";

export default function BlacklistPage() {
  const { ready, authenticated, hasPageAccess, profile, allowedPages, logout } = useAuthGuard("blacklist");

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
      title="Черный список"
      subtitle="Блокировка и контроль пользователей по номеру телефона"
      fullName={profile.full_name}
      positionName={profile.position?.name || ""}
      allowedPages={allowedPages}
      onLogout={logout}
    >
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Добавить в черный список</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-[1fr_1fr_auto]">
          <input className="rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Телефон" />
          <input className="rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Причина" />
          <button className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500">Добавить</button>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Текущий список</h3>
        <p className="mt-4 text-sm text-slate-500">Здесь будет таблица заблокированных пользователей после подключения backend endpoint.</p>
      </section>
    </AppShell>
  );
}
