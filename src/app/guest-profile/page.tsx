"use client";

import { useState } from "react";

import { useAuthGuard } from "@/features/auth/use-auth-guard";
import { AppShell } from "@/features/navigation/components/app-shell";
import { AuthLoadingScreen } from "@/features/common/components/AuthLoadingScreen";
import { Button } from "@/features/common/components/ui/Button";
import { Modal } from "@/features/common/components/ui/Modal";
import { Skeleton, SkeletonText } from "@/features/common/components/ui/Skeleton";
import { useToast } from "@/features/common/components/ui/Toast";
import { translateErrorMessage } from "@/features/common/utils/error-messages";
import { guestProfileApi } from "@/features/guest-profile/api";
import { GuestStatusBadge } from "@/features/guest-profile/components/GuestStatusBadge";
import { GuestProfileResponse } from "@/features/guest-profile/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDateTime(value: unknown): string {
  if (typeof value !== "string" || !value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat("ru-RU", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function formatDate(value: unknown): string {
  if (typeof value !== "string" || !value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat("ru-RU", { dateStyle: "medium" }).format(date);
}

function formatMoney(n: unknown): string {
  const num = Number(n);
  if (Number.isNaN(num)) return "—";
  return new Intl.NumberFormat("ru-RU").format(num) + " ₸";
}

function formatNumber(n: unknown): string {
  const num = Number(n);
  if (Number.isNaN(num)) return "—";
  return new Intl.NumberFormat("ru-RU").format(num);
}

function toRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function cashbackTypeLabel(type: unknown): string {
  if (Number(type) === 1) return "Начисление";
  if (Number(type) === -1) return "Списание";
  return "—";
}

function crystalTypeLabel(type: unknown): string {
  const map: Record<number, string> = { 0: "Подарок", 1: "Игра", 2: "День рождения", 3: "Покупка" };
  return map[Number(type)] ?? "—";
}

const warningLabels: Record<string, string> = {
  guest_details_unavailable: "Не удалось загрузить детальные данные гостя.",
  purchase_history_unavailable: "Не удалось загрузить историю покупок.",
  cashback_summary_unavailable: "Не удалось загрузить баланс Бонусов.",
  crystal_summary_unavailable: "Не удалось загрузить баланс Кристаллов.",
  cashback_history_unavailable: "Не удалось загрузить историю Бонусов.",
  crystal_history_unavailable: "Не удалось загрузить историю Кристаллов.",
  mobile_activity_unavailable: "Не удалось загрузить мобильную активность.",
};

const WARNING_TABS: Record<string, string> = {
  purchase_history_unavailable: "purchases",
  cashback_summary_unavailable: "cashback",
  cashback_history_unavailable: "cashback",
  crystal_summary_unavailable: "crystals",
  crystal_history_unavailable: "crystals",
  mobile_activity_unavailable: "mobile",
};

type Tab = "overview" | "purchases" | "cashback" | "crystals" | "mobile";

const TABS: { id: Tab; label: string; countKey?: keyof GuestProfileResponse }[] = [
  { id: "overview", label: "Обзор" },
  { id: "purchases", label: "История покупок", countKey: "purchase_history" },
  { id: "cashback", label: "Бонусы", countKey: "cashback_history" },
  { id: "crystals", label: "Кристаллы", countKey: "crystal_history" },
  { id: "mobile", label: "Мобильная активность", countKey: "mobile_activity" },
];

// ─── Shared primitives ────────────────────────────────────────────────────────

function EmptyState({ text }: { text: string }) {
  return <p className="py-8 text-center text-sm text-slate-400">{text}</p>;
}

function ShowingCount({ shown, total }: { shown: number; total: number }) {
  if (total === 0 || shown >= total) return null;
  return (
    <p className="border-t border-slate-100 py-2 text-center text-xs text-slate-400">
      Показано {formatNumber(shown)} из {formatNumber(total)}
    </p>
  );
}

function WarningBanner({
  warnings,
  tab,
  dismissed,
  onDismiss,
}: {
  warnings: string[];
  tab: Tab;
  dismissed: Set<string>;
  onDismiss: (w: string) => void;
}) {
  const visible = warnings.filter(
    (w) => !dismissed.has(w) && (tab === "overview" ? !WARNING_TABS[w] : WARNING_TABS[w] === tab),
  );
  if (visible.length === 0) return null;
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
      <p className="font-medium">Данные получены частично:</p>
      <ul className="mt-1 space-y-1">
        {visible.map((w) => (
          <li key={w} className="flex items-start justify-between gap-2">
            <span>• {warningLabels[w] ?? w}</span>
            <button
              type="button"
              onClick={() => onDismiss(w)}
              className="mt-0.5 shrink-0 rounded text-amber-600 hover:text-amber-900"
              aria-label="Закрыть"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── Tabs bar ─────────────────────────────────────────────────────────────────

function TabBar({
  active,
  onSelect,
  result,
}: {
  active: Tab;
  onSelect: (t: Tab) => void;
  result: GuestProfileResponse;
}) {
  function countFor(t: (typeof TABS)[number]): number | null {
    if (!t.countKey) return null;
    const block = result[t.countKey];
    if (block && typeof block === "object" && "count" in block) return (block as { count: number }).count;
    return null;
  }

  return (
    <div className="flex gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
      {TABS.map((t) => {
        const count = countFor(t);
        const isActive = active === t.id;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onSelect(t.id)}
            className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              isActive
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            {t.label}
            {count !== null && (
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none ${
                  isActive ? "bg-white/25 text-white" : "bg-slate-100 text-slate-500"
                }`}
              >
                {formatNumber(count)}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ─── Purchase detail modal ────────────────────────────────────────────────────

function PurchaseDetailModal({
  open,
  onClose,
  order,
}: {
  open: boolean;
  onClose: () => void;
  order: Record<string, unknown> | null;
}) {
  if (!order) return null;
  const items = Array.isArray(order.items) ? (order.items as Record<string, unknown>[]) : [];
  const payments = Array.isArray(order.payments) ? (order.payments as Record<string, unknown>[]) : [];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Заказ #${String(order.id ?? "—")} · ${formatDateTime(order.c_created)}`}
      size="lg"
      footer={
        <Button variant="secondary" size="sm" onClick={onClose}>
          Закрыть
        </Button>
      }
    >
      <div className="space-y-5 text-sm">
        <dl className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {(
            [
              ["Парк", String(order.park_name ?? "—")],
              ["Сумма", formatMoney(order.fact_sum)],
              ["Тип чека", Number(order.check_type) === 1 ? "Продажа" : Number(order.check_type) === -1 ? "Возврат" : "—"],
              ["Статус", (["Отменён", "Отложен", "Выдан", "Архивный"] as const)[Number(order.status)] ?? "—"],
              ["Официант", String(order.waiter_name || "—")],
              ["Чек №", String(order.receipt_number ?? "—")],
            ] as [string, string][]
          ).map(([label, value]) => (
            <div key={label} className="rounded-lg bg-slate-50 px-3 py-2">
              <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</dt>
              <dd className="mt-0.5 font-medium text-slate-800">{value}</dd>
            </div>
          ))}
        </dl>

        <div>
          <p className="mb-2 text-sm font-semibold text-slate-700">Товары ({items.length})</p>
          {items.length === 0 ? (
            <EmptyState text="Позиции не найдены" />
          ) : (
            <div className="overflow-auto rounded-lg border border-slate-200">
              <table className="min-w-full text-xs">
                <thead className="bg-slate-50">
                  <tr className="text-left text-[10px] uppercase tracking-wide text-slate-400">
                    <th className="px-3 py-2">Название</th>
                    <th className="px-3 py-2 text-right">Кол-во</th>
                    <th className="px-3 py-2 text-right">Цена</th>
                    <th className="px-3 py-2 text-right">Скидка</th>
                    <th className="px-3 py-2 text-right">Итог</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it, i) => (
                    <tr key={String(it.id ?? i)} className="border-t border-slate-100">
                      <td className="px-3 py-2">{String(it.name || it.product_name || "—")}</td>
                      <td className="px-3 py-2 text-right">{String(it.quantity ?? "—")}</td>
                      <td className="px-3 py-2 text-right">{formatMoney(it.price_without_discount)}</td>
                      <td className="px-3 py-2 text-right">{formatMoney(it.discount)}</td>
                      <td className="px-3 py-2 text-right font-medium">{formatMoney(it.total_sum)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold text-slate-700">Оплаты ({payments.length})</p>
          {payments.length === 0 ? (
            <EmptyState text="Оплаты не найдены" />
          ) : (
            <div className="overflow-auto rounded-lg border border-slate-200">
              <table className="min-w-full text-xs">
                <thead className="bg-slate-50">
                  <tr className="text-left text-[10px] uppercase tracking-wide text-slate-400">
                    <th className="px-3 py-2">Тип оплаты</th>
                    <th className="px-3 py-2 text-right">Сумма</th>
                    <th className="px-3 py-2 text-right">Cashback</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p, i) => (
                    <tr key={String(p.id ?? i)} className="border-t border-slate-100">
                      <td className="px-3 py-2">{String(p.payment_type_name || "—")}</td>
                      <td className="px-3 py-2 text-right font-medium">{formatMoney(p.amount)}</td>
                      <td className="px-3 py-2 text-right">{p.cashback_amount ? formatMoney(p.cashback_amount) : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

// ─── Tab panels ───────────────────────────────────────────────────────────────

function OverviewTab({
  result,
  warnings,
  dismissed,
  onDismiss,
}: {
  result: GuestProfileResponse;
  warnings: string[];
  dismissed: Set<string>;
  onDismiss: (w: string) => void;
}) {
  const cb = result.balances.cashback;
  const cr = result.balances.crystals;
  return (
    <div className="space-y-4">
      <WarningBanner warnings={warnings} tab="overview" dismissed={dismissed} onDismiss={onDismiss} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50">
              <img src="/icon-cashback.svg" alt="Бонусы" className="h-5 w-5" />
            </span>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Бонусы</p>
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">{formatMoney(cb.sum)}</p>
          {cb.burn_date && (
            <p className="mt-1 text-xs text-slate-500">
              Сгорает {formatDate(cb.burn_date)}: {formatMoney(cb.burn_sum)}
            </p>
          )}
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
              <img src="/icon-crystal.svg" alt="Кристаллы" className="h-5 w-5" />
            </span>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Кристаллы</p>
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">{formatNumber(cr.total_crystals)}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Покупок</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{formatNumber(result.purchase_history.count)}</p>
        </div>
      </div>
    </div>
  );
}

function PurchasesTab({
  result,
  warnings,
  dismissed,
  onDismiss,
}: {
  result: GuestProfileResponse;
  warnings: string[];
  dismissed: Set<string>;
  onDismiss: (w: string) => void;
}) {
  const [selectedOrder, setSelectedOrder] = useState<Record<string, unknown> | null>(null);
  const { results, count } = result.purchase_history;

  return (
    <div className="space-y-3">
      <WarningBanner warnings={warnings} tab="purchases" dismissed={dismissed} onDismiss={onDismiss} />
      {results.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <EmptyState text="Покупок за выбранный период не найдено" />
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-auto">
            <table className="min-w-full text-sm">
              <thead className="border-b border-slate-100 bg-slate-50">
                <tr className="text-left text-[11px] uppercase tracking-wide text-slate-400">
                  <th className="px-4 py-3">Дата</th>
                  <th className="px-4 py-3">Парк</th>
                  <th className="px-4 py-3">Тип</th>
                  <th className="px-4 py-3 text-right">Сумма</th>
                  <th className="px-4 py-3 text-right">Позиций</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {results.map((item, idx) => {
                  const row = toRecord(item);
                  const items = Array.isArray(row.items) ? row.items : [];
                  const isReturn = Number(row.check_type) === -1;
                  const rowKey = `p-${String(row.id ?? idx)}-${idx}`;
                  return (
                    <tr key={rowKey} className="border-t border-slate-100 hover:bg-slate-50/50">
                      <td className="px-4 py-3 text-slate-700">{formatDateTime(row.c_created)}</td>
                      <td className="px-4 py-3 text-slate-700">{String(row.park_name || "—")}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            isReturn ? "bg-rose-50 text-rose-700" : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {isReturn ? "Возврат" : "Продажа"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-slate-900">{formatMoney(row.fact_sum)}</td>
                      <td className="px-4 py-3 text-right text-slate-500">{items.length}</td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => setSelectedOrder(row)}
                          className="rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 transition-colors hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
                        >
                          Детали
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <ShowingCount shown={results.length} total={count} />
        </div>
      )}
      <PurchaseDetailModal open={!!selectedOrder} onClose={() => setSelectedOrder(null)} order={selectedOrder} />
    </div>
  );
}

function CashbackTab({
  result,
  warnings,
  dismissed,
  onDismiss,
}: {
  result: GuestProfileResponse;
  warnings: string[];
  dismissed: Set<string>;
  onDismiss: (w: string) => void;
}) {
  const cb = result.balances.cashback;
  const { results, count } = result.cashback_history;

  return (
    <div className="space-y-4">
      <WarningBanner warnings={warnings} tab="cashback" dismissed={dismissed} onDismiss={onDismiss} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Текущий баланс</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{formatMoney(cb.sum)}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Дата сгорания</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">{formatDate(cb.burn_date)}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Сумма сгорания</p>
          <p className="mt-1 text-lg font-semibold text-rose-600">{formatMoney(cb.burn_sum)}</p>
        </div>
      </div>
      {results.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <EmptyState text="История операций не найдена" />
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-auto">
            <table className="min-w-full text-sm">
              <thead className="border-b border-slate-100 bg-slate-50">
                <tr className="text-left text-[11px] uppercase tracking-wide text-slate-400">
                  <th className="px-4 py-3">Дата</th>
                  <th className="px-4 py-3">Тип</th>
                  <th className="px-4 py-3 text-right">Сумма</th>
                  <th className="px-4 py-3">Сгорает</th>
                </tr>
              </thead>
              <tbody>
                {results.map((item, idx) => {
                  const row = toRecord(item);
                  const isAccrual = Number(row.type) === 1;
                  const rowKey = `cb-${String(row.id ?? idx)}-${idx}`;
                  return (
                    <tr key={rowKey} className="border-t border-slate-100 hover:bg-slate-50/50">
                      <td className="px-4 py-3 text-slate-700">{formatDateTime(row.transaction_date)}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            isAccrual ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                          }`}
                        >
                          {cashbackTypeLabel(row.type)}
                        </span>
                      </td>
                      <td
                        className={`px-4 py-3 text-right font-medium ${
                          isAccrual ? "text-emerald-700" : "text-rose-700"
                        }`}
                      >
                        {isAccrual ? "+" : ""}
                        {formatMoney(row.amount)}
                      </td>
                      <td className="px-4 py-3 text-slate-500">{formatDate(row.expiration_date)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <ShowingCount shown={results.length} total={count} />
        </div>
      )}
    </div>
  );
}

function CrystalsTab({
  result,
  warnings,
  dismissed,
  onDismiss,
}: {
  result: GuestProfileResponse;
  warnings: string[];
  dismissed: Set<string>;
  onDismiss: (w: string) => void;
}) {
  const cr = result.balances.crystals;
  const { results, count } = result.crystal_history;

  return (
    <div className="space-y-4">
      <WarningBanner warnings={warnings} tab="crystals" dismissed={dismissed} onDismiss={onDismiss} />
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
              <img src="/icon-crystal.svg" alt="Кристаллы" className="h-6 w-6" />
            </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Текущий баланс</p>
            <p className="text-2xl font-bold text-slate-900">{formatNumber(cr.total_crystals)}</p>
          </div>
        </div>
      </div>
      {results.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <EmptyState text="История операций не найдена" />
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-auto">
            <table className="min-w-full text-sm">
              <thead className="border-b border-slate-100 bg-slate-50">
                <tr className="text-left text-[11px] uppercase tracking-wide text-slate-400">
                  <th className="px-4 py-3">Дата</th>
                  <th className="px-4 py-3">Тип</th>
                  <th className="px-4 py-3 text-right">Сумма</th>
                  <th className="px-4 py-3">Описание</th>
                </tr>
              </thead>
              <tbody>
                {results.map((item, idx) => {
                  const row = toRecord(item);
                  const isPositive = Number(row.amount) >= 0;
                  const rowKey = `cr-${String(row.id ?? idx)}-${idx}`;
                  return (
                    <tr key={rowKey} className="border-t border-slate-100 hover:bg-slate-50/50">
                      <td className="px-4 py-3 text-slate-700">{formatDate(row.date)}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                          {crystalTypeLabel(row.type)}
                        </span>
                      </td>
                      <td
                        className={`px-4 py-3 text-right font-medium ${
                          isPositive ? "text-emerald-700" : "text-rose-700"
                        }`}
                      >
                        {isPositive ? "+" : ""}
                        {formatNumber(row.amount)}
                      </td>
                      <td className="px-4 py-3 text-slate-500">{String(row.description_ru || "—")}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <ShowingCount shown={results.length} total={count} />
        </div>
      )}
    </div>
  );
}

function MobileTab({
  result,
  warnings,
  dismissed,
  onDismiss,
}: {
  result: GuestProfileResponse;
  warnings: string[];
  dismissed: Set<string>;
  onDismiss: (w: string) => void;
}) {
  const { results, count } = result.mobile_activity;

  return (
    <div className="space-y-3">
      <WarningBanner warnings={warnings} tab="mobile" dismissed={dismissed} onDismiss={onDismiss} />
      {results.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <EmptyState text="Событий мобильного приложения не найдено" />
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-auto">
            <table className="min-w-full text-sm">
              <thead className="border-b border-slate-100 bg-slate-50">
                <tr className="text-left text-[11px] uppercase tracking-wide text-slate-400">
                  <th className="px-4 py-3">Время</th>
                  <th className="px-4 py-3">Событие</th>
                  <th className="px-4 py-3">Платформа</th>
                  <th className="px-4 py-3">Устройство</th>
                </tr>
              </thead>
              <tbody>
                {results.map((row, idx) => {
                  const deviceLabel =
                    [row.device_brand, row.device_model].filter(Boolean).join(" ") || row.device_id || "—";
                  const rowKey = `mob-${row.event_time ?? "x"}-${row.event_type}-${row.device_id}-${idx}`;
                  return (
                    <tr key={rowKey} className="border-t border-slate-100 hover:bg-slate-50/50">
                      <td className="px-4 py-3 text-slate-700">{formatDateTime(row.event_time)}</td>
                      <td className="px-4 py-3 text-slate-700">{row.event_type || "—"}</td>
                      <td className="px-4 py-3">
                        {row.platform ? (
                          <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                            {row.platform}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-500">{deviceLabel}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <ShowingCount shown={results.length} total={count} />
        </div>
      )}
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function ResultSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="mt-3 h-7 w-32" />
            <Skeleton className="mt-2 h-3 w-24" />
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <SkeletonText lines={7} />
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function GuestProfilePage() {
  const { ready, authenticated, hasPageAccess, profile, allowedPages, logout } = useAuthGuard("guest-profile");
  const { addToast } = useToast();

  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GuestProfileResponse | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const submit = async () => {
    if (!phone.trim()) {
      setError("Укажите номер телефона");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    setActiveTab("overview");
    setDismissed(new Set());
    try {
      const data = await guestProfileApi.getByPhone(phone.trim());
      setResult(data);
      addToast("success", `Гость найден: #${data.guest.id}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Не удалось получить информацию о госте";
      setError(translateErrorMessage(message));
    } finally {
      setLoading(false);
    }
  };

  const dismissWarning = (w: string) => setDismissed((prev) => new Set([...prev, w]));

  if (!ready || !authenticated) return <AuthLoadingScreen />;
  if (!hasPageAccess) return <AuthLoadingScreen message="У вас нет доступа к этому разделу." />;

  return (
    <AppShell
      title="Профиль гостя"
      subtitle="Статус, балансы, история покупок и мобильная активность по номеру телефона"
      fullName={profile.full_name}
      positionName={profile.position?.name || ""}
      allowedPages={allowedPages}
      onLogout={logout}
    >
      <div className="space-y-5">
        {/* Search */}
        <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">Поиск по номеру телефона</h2>
          <p className="mt-0.5 text-sm text-slate-500">Формат: +7, 8 или 7 + 10 цифр</p>
          <div className="mt-3 flex gap-3">
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void submit();
              }}
              placeholder="Например: 77071234567"
              className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
            />
            <Button loading={loading} onClick={() => void submit()}>
              Найти
            </Button>
          </div>
          {error && (
            <p className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
              {error}
            </p>
          )}
        </section>

        {loading && <ResultSkeleton />}

        {result && !loading && (
          <>
            {/* Guest header */}
            <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-semibold text-slate-900">
                      {result.guest.name || "Имя не указано"}
                    </h3>
                    <GuestStatusBadge
                      isBlocked={result.guest.status.is_blocked}
                      label={result.guest.status.label}
                    />
                  </div>
                  <p className="mt-0.5 text-sm text-slate-500">
                    #{result.guest.id} · {result.phone}
                  </p>
                </div>
              </div>
            </section>

            <TabBar active={activeTab} onSelect={setActiveTab} result={result} />

            {activeTab === "overview" && (
              <OverviewTab result={result} warnings={result.warnings} dismissed={dismissed} onDismiss={dismissWarning} />
            )}
            {activeTab === "purchases" && (
              <PurchasesTab result={result} warnings={result.warnings} dismissed={dismissed} onDismiss={dismissWarning} />
            )}
            {activeTab === "cashback" && (
              <CashbackTab result={result} warnings={result.warnings} dismissed={dismissed} onDismiss={dismissWarning} />
            )}
            {activeTab === "crystals" && (
              <CrystalsTab result={result} warnings={result.warnings} dismissed={dismissed} onDismiss={dismissWarning} />
            )}
            {activeTab === "mobile" && (
              <MobileTab result={result} warnings={result.warnings} dismissed={dismissed} onDismiss={dismissWarning} />
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
