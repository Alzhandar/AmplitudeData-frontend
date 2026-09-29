export { formatDateTime, formatDate, formatIsoDate, getTodayIsoDate } from "./date";

// Kazakhstan mobile-number prefixes for a bare 10-digit number missing its country code.
const KZ_MOBILE_PREFIXES = ["70", "71", "72", "73", "74", "75", "76", "77"];

/**
 * Normalize a phone number to digits-only with country code, or "" if unrecognized.
 * Supports Kazakhstan (+7) and Uzbekistan (+998, Tashkent park). Mirrors the backend's
 * utils/phone_utils.py — keep both in sync when adding a new country/park.
 */
export function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";

  let value = digits;
  if (value.length === 11 && value.startsWith("8")) value = `7${value.slice(1)}`;

  if (value.length === 11 && value.startsWith("7")) return value;
  if (value.length === 10 && KZ_MOBILE_PREFIXES.some((prefix) => value.startsWith(prefix))) return `7${value}`;

  if (value.length === 12 && value.startsWith("998")) return value;
  if (value.length === 9 && value.startsWith("9")) return `998${value}`;

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
