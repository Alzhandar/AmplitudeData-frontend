export { formatDateTime, formatDate, formatIsoDate, getTodayIsoDate } from "./date";

function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.length === 11 && digits.startsWith("8")) return `7${digits.slice(1)}`;
  if (digits.length === 11 && digits.startsWith("7")) return digits;
  return "";
}

export function parsePhonesFromText(text: string): string[] {
  const rows = text.replace(/\r/g, "\n").replace(/[;,]/g, "\n").split("\n");
  const unique = new Set<string>();
  const result: string[] = [];
  for (const row of rows) {
    const trimmed = row.trim();
    if (!trimmed) continue;
    const normalized = normalizePhone(trimmed);
    if (!normalized || unique.has(normalized)) continue;
    unique.add(normalized);
    result.push(normalized);
  }
  return result;
}

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
