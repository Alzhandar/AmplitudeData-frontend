export const PORTAL_PAGE_KEYS = [
  "analytics",
  "bonus-transactions",
  "coupon-dispatch",
  "push-dispatch",
  "blacklist",
] as const;

export type PortalPage = (typeof PORTAL_PAGE_KEYS)[number];

export const PAGE_TO_PATH: Record<PortalPage, string> = {
  analytics: "/",
  "bonus-transactions": "/bonus-transactions",
  "coupon-dispatch": "/coupon-dispatch",
  "push-dispatch": "/push-dispatch",
  blacklist: "/blacklist",
};

export function firstAllowedPath(allowedPages: PortalPage[]): string | null {
  for (const page of PORTAL_PAGE_KEYS) {
    if (allowedPages.includes(page)) {
      return PAGE_TO_PATH[page];
    }
  }
  return null;
}
