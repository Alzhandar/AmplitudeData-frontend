"use client";

import { AppShell } from "@/features/navigation/components/app-shell";
import { useAuthGuard } from "@/features/auth/use-auth-guard";

export default function PushDispatchPage() {
  const { ready, authenticated, hasPageAccess, profile, allowedPages, logout } = useAuthGuard("push-dispatch");

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
      title="Отправка пушей"
      subtitle="Массовая отправка push-уведомлений по сегментам"
      fullName={profile.full_name}
      positionName={profile.position?.name || ""}
      allowedPages={allowedPages}
      onLogout={logout}
    >
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Push сообщение</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <input className="rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Заголовок (RU)" />
          <input className="rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Заголовок (KZ)" />
          <textarea className="rounded-lg border border-slate-300 px-3 py-2 text-sm" rows={4} placeholder="Текст (RU)" />
          <textarea className="rounded-lg border border-slate-300 px-3 py-2 text-sm" rows={4} placeholder="Текст (KZ)" />
          <button className="md:col-span-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500">Отправить push</button>
        </div>
      </section>
    </AppShell>
  );
}
