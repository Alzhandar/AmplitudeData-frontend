export { formatDateTime, formatDate, formatIsoDate, getTodayIsoDate } from "./date";

export function formatMoney(value: number | null | undefined): string {
  const num = Number(value);
  if (Number.isNaN(num)) return "—";
  return new Intl.NumberFormat("ru-RU").format(num) + " ₸";
}

export function formatNumber(value: number | null | undefined): string {
  const num = Number(value);
  if (Number.isNaN(num)) return "—";
  return new Intl.NumberFormat("ru-RU").format(num);
}
