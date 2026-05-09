# Frontend Error Display Improvement Plan

**Author**: Senior Frontend Developer Review  
**Date**: 2026-05-10  
**Status**: AWAITING APPROVAL

---

## 1. Current State — Problems Found

### 1.1 Ugly amber error boxes for job logs

Two places show job-level error logs in an amber/orange box:

**Coupon Dispatch** (`coupon-dispatch/page.tsx` ~L505):
```jsx
<div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
  <p className="font-semibold">Лог ошибок</p>
  <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap text-xs">{activeJob.error_log}</pre>
</div>
```

**Bonus Transactions** (`bonus-transactions/page.tsx` ~L391):
```jsx
<div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
  <p className="font-semibold">Ошибки обработки</p>
  <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap text-xs">{activeJob.error_log}</pre>
</div>
```

**Issues**:
- Amber is visually harsh and unprofessional
- `<pre>` tag dumps raw text without structure
- No way to distinguish error severity
- No count of errors shown
- Looks like a debug dump, not a user interface

### 1.2 English error messages in result tables

The `error_message` column in both result tables shows raw English strings from the backend:

| Shown to user | Should show |
|--------------|-------------|
| `Phone is empty` | `Телефон не указан` |
| `Phone must be in 11-digit format and start with 7` | `Неверный формат телефона` |
| `Duplicate phone in input` | `Дублирующийся номер` |
| `Guest not found by phone` | `Гость не найден` |
| `Assign API failed: ...` | `Ошибка сервиса рассылки` |
| `Mobile coupon API failed: ...` | `Ошибка мобильного API` |
| `Coupon was not assigned` | `Купон не был назначен` |
| `Invalid phone number: ...` | `Неверный формат телефона` |
| `Processing error` | `Ошибка обработки` |

### 1.3 Technical column headers in bonus transactions table

The result table in bonus-transactions has English/technical column names visible to operators:

| Current | Should be |
|---------|----------|
| `Guest ID` | `ID гостя` |
| `doc_guid` | `GUID документа` |
| `base_id` | `ID базы` |

### 1.4 City load error uses same amber style

```jsx
{citiesError ? (
  <p className="... border-amber-200 bg-amber-50 ... text-amber-800">
    {citiesError}
  </p>
) : null}
```

Same amber style as the job log — inconsistent with form errors (which are red).

---

## 2. Target State — What We Will Build

### 2.1 New reusable `ErrorLogPanel` component

Location: `src/features/common/components/ui/ErrorLogPanel.tsx`

This replaces all amber `<div>` + `<pre>` patterns. A clean, professional design:

```
┌─────────────────────────────────────────────────────────┐
│  ⚠  Ошибки при обработке                     2 строки  │
├─────────────────────────────────────────────────────────┤
│  ·  Строка 1: Телефон не указан                        │
│  ·  Строка 2: Неверный формат телефона (00058419)      │
└─────────────────────────────────────────────────────────┘
```

**Design spec**:
- Background: `bg-slate-50` border `border-slate-200` (neutral, professional)
- Header icon: warning triangle from Heroicons (inline SVG)
- Error count badge: `text-slate-500` on the right side of header
- Each line: small bullet `·` + error text
- No `<pre>` tag — use `<ul>/<li>` for clean semantics
- Scrollable if > 6 lines (`max-h-48 overflow-y-auto`)
- If `error_log` is a newline-separated string: split on `\n` and render per line

**Props**:
```typescript
type ErrorLogPanelProps = {
  errorLog: string;       // raw string from API (newline-separated)
  title?: string;         // defaults to "Ошибки при обработке"
};
```

### 2.2 Error code → Russian translation map

Location: `src/features/common/utils/error-messages.ts`

A centralized lookup table that maps backend error codes to Russian user messages:

```typescript
export const ERROR_MESSAGE_MAP: Record<string, string> = {
  // Phone validation
  phone_empty: "Телефон не указан",
  invalid_phone_format: "Неверный формат телефона",
  duplicate_phone: "Дублирующийся номер",

  // Guest lookup
  guest_not_found: "Гость не найден",

  // API errors
  assign_api_error: "Ошибка сервиса рассылки",
  mobile_api_error: "Ошибка мобильного API",
  coupon_not_assigned: "Купон не был назначен",

  // Bonus transactions
  processing_error: "Ошибка обработки",
};

export function translateErrorMessage(code: string): string {
  if (!code) return "—";
  return ERROR_MESSAGE_MAP[code] ?? code; // fallback: show as-is
}
```

**Usage in result table**:
```tsx
import { translateErrorMessage } from "@/features/common/utils/error-messages";

// in table cell:
<td>{translateErrorMessage(row.error_message)}</td>
```

### 2.3 Professional job error_log parsing in `ErrorLogPanel`

The `error_log` field from the backend is a newline-separated string. Each line is itself an error code or error message. The component will:

1. Split by `\n`
2. Filter empty lines
3. Translate each line through `translateErrorMessage()`
4. Render as clean list

**Example** (current raw value in `error_log`):
```
phone_empty
invalid_phone_format
```

**Rendered by ErrorLogPanel**:
```
⚠ Ошибки при обработке                        2 строки
· Телефон не указан
· Неверный формат телефона
```

---

## 3. Files to Change

### 3.1 NEW: `src/features/common/utils/error-messages.ts`
- Create translation map
- Export `translateErrorMessage()` function
- Covers all error codes from both coupon_dispatch and bonus_transactions services

### 3.2 NEW: `src/features/common/components/ui/ErrorLogPanel.tsx`
- Replace amber box pattern
- Renders error_log as structured list
- Translates each line via `translateErrorMessage()`
- Props: `errorLog: string`, `title?: string`

### 3.3 `src/app/coupon-dispatch/page.tsx`

**Change 1** — Replace amber error_log box with `<ErrorLogPanel>`:
```tsx
// Before:
{activeJob.error_log && (
  <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 ...">
    <p className="font-semibold">Лог ошибок</p>
    <pre className="...">{activeJob.error_log}</pre>
  </div>
)}

// After:
{activeJob.error_log && (
  <ErrorLogPanel errorLog={activeJob.error_log} title="Ошибки при обработке" />
)}
```

**Change 2** — Translate `error_message` in result table:
```tsx
// Before:
<td className="... text-rose-600">{row.error_message || "-"}</td>

// After:
<td className="... text-slate-600">{translateErrorMessage(row.error_message)}</td>
```

### 3.4 `src/app/bonus-transactions/page.tsx`

**Change 1** — Replace amber error_log box with `<ErrorLogPanel>`:
```tsx
// Before:
{activeJob.error_log && (
  <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 ...">
    <p className="font-semibold">Ошибки обработки</p>
    <pre className="...">{activeJob.error_log}</pre>
  </div>
)}

// After:
{activeJob.error_log && (
  <ErrorLogPanel errorLog={activeJob.error_log} title="Ошибки при обработке" />
)}
```

**Change 2** — Translate `error_message` in result table:
```tsx
// Same pattern: translateErrorMessage(row.error_message)
```

**Change 3** — Fix technical column headers:
```tsx
// Before:
<th>Guest ID</th>
<th>doc_guid</th>
<th>base_id</th>

// After:
<th>ID гостя</th>
<th>GUID документа</th>
<th>ID базы</th>
```

### 3.5 `src/app/push-dispatch/page.tsx`

**Change** — Replace amber city load error with consistent red style:
```tsx
// Before:
<p className="... border-amber-200 bg-amber-50 ... text-amber-800">

// After:
<p className="... border-red-200 bg-red-50 ... text-red-700" role="alert">
```

This makes it consistent with form errors everywhere else.

---

## 4. Visual Comparison

### Job Error Log: Before vs After

**Before**:
```
┌────────────────────────────────────────────────────────────┐
│  Лог ошибок                                                │  ← amber header
│                                                            │
│  Phone is empty                                            │  ← raw English in <pre>
│  Phone must be in 11-digit format and start with 7         │
│                                                            │
└────────────────────────────────────────────────────────────┘
   Amber #FFFBEB background, #FCD34D border — looks cheap
```

**After**:
```
┌────────────────────────────────────────────────────────────┐
│  ⚠  Ошибки при обработке                       2 строки   │  ← slate header + count
├────────────────────────────────────────────────────────────┤
│  · Телефон не указан                                       │  ← Russian, clean list
│  · Неверный формат телефона                                │
└────────────────────────────────────────────────────────────┘
   Slate #F8FAFC background, #E2E8F0 border — professional
```

### Result Table Error Column: Before vs After

**Before**:
```
Ошибка
──────────────────────────────────────────────────────
Phone is empty                                           ← rose-600 English
Phone must be in 11-digit format and start with 7        ← truncated at 280px, confusing
```

**After**:
```
Ошибка
──────────────────────────────────────────────────────
Телефон не указан                                        ← slate-600 Russian, clear
Неверный формат телефона                                 ← short and understandable
```

---

## 5. What We Are NOT Changing

- Toast notification system — already professional and correct (emerald/rose/amber/indigo)
- Form validation error boxes — red boxes already consistent and correct
- CalendarField error display — already correct Russian text
- StatusBadge component — already correct
- `api-error.ts` error parsing logic — already handles HTTP errors properly in Russian
- Login/register pages — separate concern, out of scope

---

## 6. Implementation Order

1. Create `src/features/common/utils/error-messages.ts` (10 min)
2. Create `src/features/common/components/ui/ErrorLogPanel.tsx` (20 min)
3. Update `src/app/coupon-dispatch/page.tsx` — import + use ErrorLogPanel + translateErrorMessage (15 min)
4. Update `src/app/bonus-transactions/page.tsx` — same changes + fix column headers (15 min)
5. Update `src/app/push-dispatch/page.tsx` — fix amber city error (5 min)
6. Verify build passes, test visually in browser (10 min)

**Total estimated frontend work**: ~1.5 hours
