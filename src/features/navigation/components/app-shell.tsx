"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { PortalPage } from "@/features/auth/permissions";

type AppShellProps = {
  title: string;
  subtitle: string;
  fullName: string;
  positionName: string;
  allowedPages: PortalPage[];
  onLogout: () => Promise<void>;
  children: React.ReactNode;
};

type NavItem = {
  page: PortalPage;
  href: string;
  label: string;
  icon: (active: boolean) => React.ReactNode;
};

function iconClass(active: boolean): string {
  return active ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600";
}

const NAV_GROUPS: { label?: string; items: NavItem[] }[] = [
  {
    items: [
      {
        page: "analytics",
        href: "/",
        label: "Аналитика",
        icon: (active) => (
          <svg className={`h-4 w-4 ${iconClass(active)}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M4 19h16" strokeLinecap="round" />
            <path d="M7 16v-4" strokeLinecap="round" />
            <path d="M12 16V7" strokeLinecap="round" />
            <path d="M17 16v-6" strokeLinecap="round" />
          </svg>
        ),
      },
    ],
  },
  {
    label: "Инструменты",
    items: [
      {
        page: "bonus-transactions",
        href: "/bonus-transactions",
        label: "Начисление бонусов",
        icon: (active) => (
          <svg className={`h-4 w-4 ${iconClass(active)}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="12" cy="12" r="7" />
            <path d="M9.5 10.5h5a1.5 1.5 0 0 1 0 3h-5a1.5 1.5 0 0 0 0 3h5" strokeLinecap="round" />
          </svg>
        ),
      },
      {
        page: "coupon-dispatch",
        href: "/coupon-dispatch",
        label: "Отправка купонов",
        icon: (active) => (
          <svg className={`h-4 w-4 ${iconClass(active)}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M3 10.5a2.5 2.5 0 0 0 2.5-2.5h13A2.5 2.5 0 0 0 21 10.5v3A2.5 2.5 0 0 0 18.5 16h-13A2.5 2.5 0 0 0 3 13.5z" />
            <path d="M12 8v8" strokeDasharray="2 2" />
          </svg>
        ),
      },
      {
        page: "push-dispatch",
        href: "/push-dispatch",
        label: "Отправка пушей",
        icon: (active) => (
          <svg className={`h-4 w-4 ${iconClass(active)}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M12 4a4 4 0 0 0-4 4v3.2c0 .7-.28 1.38-.78 1.88L6 14.5h12l-1.22-1.42A2.65 2.65 0 0 1 16 11.2V8a4 4 0 0 0-4-4z" />
            <path d="M10 17a2 2 0 1 0 4 0" strokeLinecap="round" />
          </svg>
        ),
      },
    ],
  },
  {
    label: "Управление",
    items: [
      {
        page: "blacklist",
        href: "/blacklist",
        label: "Черный список",
        icon: (active) => (
          <svg className={`h-4 w-4 ${iconClass(active)}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="12" cy="12" r="8" />
            <path d="M8.5 15.5l7-7" strokeLinecap="round" />
          </svg>
        ),
      },
    ],
  },
];

const ALL_NAV_ITEMS = NAV_GROUPS.flatMap((g) => g.items);

export function AppShell({ title, subtitle, fullName, positionName, allowedPages, onLogout, children }: AppShellProps) {
  const pathname = usePathname();
  const visibleGroups = NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => allowedPages.includes(item.page)),
  })).filter((group) => group.items.length > 0);
  const visibleNavItems = ALL_NAV_ITEMS.filter((item) => allowedPages.includes(item.page));

  return (
    <div className="min-h-screen bg-gray-50 text-slate-900">
      <div className="flex min-h-screen w-full">
        {/* Sidebar */}
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-slate-200 bg-white lg:flex">
          {/* Logo */}
          <div className="flex h-16 items-center border-b border-slate-100 px-5">
            <Image src="/logo-new.svg" alt="Avatariya" width={120} height={32} priority />
          </div>

          {/* Nav groups */}
          <nav className="flex-1 overflow-y-auto px-3 py-4">
            {visibleGroups.map((group, gi) => (
              <div key={gi} className={gi > 0 ? "mt-3 border-t border-slate-100 pt-3" : ""}>
                {group.label && (
                  <p className="mb-1.5 mt-1 px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                    {group.label}
                  </p>
                )}
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const active = item.href === "/" ? pathname === item.href : pathname.startsWith(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`group flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors ${
                          active
                            ? "bg-indigo-50 font-medium text-indigo-700"
                            : "font-normal text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                        }`}
                      >
                        {item.icon(active)}
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          {/* Mobile nav strip */}
          <div className="border-b border-slate-200 bg-white px-4 py-2 lg:hidden">
            <div className="flex gap-1 overflow-auto">
              {visibleNavItems.map((item) => {
                const active = item.href === "/" ? pathname === item.href : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                      active ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {item.icon(active)}
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Page header */}
          <header className="border-b border-slate-200 bg-white px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
                {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
              </div>
              <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                <div className="text-right">
                  <p className="max-w-[220px] truncate text-sm font-medium text-slate-800">{fullName || "Сотрудник"}</p>
                  <p className="max-w-[220px] truncate text-xs text-slate-500">{positionName || "Должность не указана"}</p>
                </div>
                <button
                  type="button"
                  onClick={onLogout}
                  className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
                >
                  Выйти
                </button>
              </div>
            </div>
          </header>

          <main className="flex-1 px-4 pb-8 pt-6 sm:px-6 lg:px-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
