import { PresenceStats } from "../types";

type StatsCardsProps = {
  stats: PresenceStats | null;
  loading: boolean;
};

const CARDS = [
  {
    key: "unique_users_total" as const,
    label: "Уникальных пользователей",
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    key: "users_with_phone" as const,
    label: "С телефоном",
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-600",
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
      </svg>
    ),
  },
  {
    key: "in_location_users" as const,
    label: "В локации",
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    key: "not_in_location_users" as const,
    label: "Вне локации",
    iconBg: "bg-purple-100",
    iconColor: "text-purple-600",
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
];

export function StatsCards({ stats, loading }: StatsCardsProps) {
  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {CARDS.map((card) => (
        <article key={card.key} className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div>
            <p className="text-sm text-gray-500">{card.label}</p>
            <p className="mt-1 text-3xl font-extrabold text-gray-900">
              {loading ? <span className="text-gray-300">—</span> : (stats?.[card.key] ?? 0).toLocaleString("ru-RU")}
            </p>
          </div>
          <div className={`flex h-12 w-12 items-center justify-center rounded-full ${card.iconBg} ${card.iconColor}`}>
            {card.icon}
          </div>
        </article>
      ))}
    </section>
  );
}
