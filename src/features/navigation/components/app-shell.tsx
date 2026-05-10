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
    label: "Аналитика",
    items: [
      {
        page: "analytics",
        href: "/",
        label: "Аналитика",
        // eslint-disable-next-line @next/next/no-img-element
        icon: (active) => (
          <img
            src="/icon-analytics.svg"
            alt=""
            className={`h-5 w-5 object-contain transition-all ${active ? "" : "grayscale opacity-50 group-hover:opacity-75 group-hover:grayscale-0"}`}
          />
        ),
      },
      {
        page: "guest-profile",
        href: "/guest-profile",
        label: "Профиль гостя",
        icon: (active) => (
          <svg className={`h-4 w-4 ${iconClass(active)}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="12" cy="8" r="3" />
            <path d="M5 19c0-3.5 3.2-5 7-5s7 1.5 7 5" strokeLinecap="round" />
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
        // eslint-disable-next-line @next/next/no-img-element
        icon: (active) => (
          <img
            src="/icon-cashback.svg"
            alt=""
            className={`h-5 w-5 object-contain transition-all ${active ? "" : "grayscale opacity-50 group-hover:opacity-75 group-hover:grayscale-0"}`}
          />
        ),
      },
      {
        page: "coupon-dispatch",
        href: "/coupon-dispatch",
        label: "Отправка купонов",
        // eslint-disable-next-line @next/next/no-img-element
        icon: (active) => (
          <img
            src="/icon-coupon.svg"
            alt=""
            className={`h-5 w-5 object-contain transition-all ${active ? "" : "grayscale opacity-50 group-hover:opacity-75 group-hover:grayscale-0"}`}
          />
        ),
      },
      {
        page: "push-dispatch",
        href: "/push-dispatch",
        label: "Отправка пушей",
        // eslint-disable-next-line @next/next/no-img-element
        icon: (active) => (
          <img
            src="/icon-notification.svg"
            alt=""
            className={`h-5 w-5 object-contain transition-all ${active ? "" : "grayscale opacity-50 group-hover:opacity-75 group-hover:grayscale-0"}`}
          />
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
        {/* ── Desktop Sidebar ─────────────────────────────────────────── */}
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

          {/* Sidebar footer — user */}
          <div className="border-t border-slate-100 px-4 py-3">
            <p className="truncate text-sm font-medium text-slate-800">{fullName || "Сотрудник"}</p>
            <p className="truncate text-xs text-slate-400">{positionName || "Должность не указана"}</p>
            <button
              type="button"
              onClick={onLogout}
              className="mt-2 w-full rounded-md border border-slate-200 bg-white py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
            >
              Выйти
            </button>
          </div>
        </aside>

        {/* ── Main content ─────────────────────────────────────────────── */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Mobile top bar */}
          <header className="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4 lg:hidden">
            <Image src="/logo-new.svg" alt="Avatariya" width={100} height={26} priority />
            <div className="flex items-center gap-2">
              <p className="max-w-[140px] truncate text-sm font-medium text-slate-700">{fullName || "Сотрудник"}</p>
              <button
                type="button"
                onClick={onLogout}
                aria-label="Выйти"
                className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 16l4-4m0 0l-4-4m4 4H7" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </header>

          {/* Desktop page header */}
          <header className="hidden border-b border-slate-200 bg-white px-6 py-4 lg:block lg:px-8">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
                {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
              </div>
            </div>
          </header>

          {/* Mobile page title */}
          <div className="border-b border-slate-100 bg-white px-4 py-3 lg:hidden">
            <h1 className="text-base font-semibold text-slate-900">{title}</h1>
          </div>

          {/* Content — extra bottom padding on mobile for bottom nav */}
          <main className="flex-1 px-4 pb-24 pt-4 sm:px-6 sm:pt-6 lg:pb-8 lg:px-8">{children}</main>
        </div>
      </div>

      {/* ── Mobile bottom navigation bar ─────────────────────────────── */}
      <nav
        aria-label="Навигация"
        className="fixed bottom-0 left-0 right-0 z-50 flex border-t border-slate-200 bg-white pb-safe lg:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {visibleNavItems.slice(0, 5).map((item) => {
          const active = item.href === "/" ? pathname === item.href : pathname.startsWith(item.href);
          const shortLabel = item.label.length > 10 ? item.label.split(" ")[0] : item.label;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors ${
                active ? "text-indigo-600" : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <span className={`flex h-6 w-6 items-center justify-center rounded-md transition-colors ${active ? "bg-indigo-50" : ""}`}>
                {item.icon(active)}
              </span>
              <span className="leading-tight">{shortLabel}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
