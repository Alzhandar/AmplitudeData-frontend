# Frontend Architecture & Design Handoff

Этот документ описывает, как построен текущий frontend и как безопасно внедрять новый дизайн (в том числе дизайн, сгенерированный через ИИ).

## 1. Текущий стек

- Next.js 16 (App Router)
- React + TypeScript
- TailwindCSS
- API вызовы через внутренний proxy `/api/*` (чтобы не ловить CORS)

## 2. Структура проекта

```text
src/
  app/
    page.tsx
    layout.tsx
    globals.css
    api/
      amplitude/
        today-mobile-activity/route.ts
        location-presence-stats/route.ts
        _lib/proxy.ts
  features/
    analytics/
      api.ts
      hooks.ts
      types.ts
      components/
        top-navbar.tsx
        filters-bar.tsx
        stats-cards.tsx
        activity-table.tsx
        user-history-panel.tsx
        error-banner.tsx
```

## 3. Где какая логика

### `src/app/page.tsx`
Главная orchestration-страница:
- хранит UI state (`date`, `search`, `windowHours`, пагинация, выбранный пользователь);
- запускает загрузку данных через `useAnalyticsDashboard`;
- собирает страницу из компонентов.

### `src/features/analytics/api.ts`
Единый API-клиент:
- `getDailyActivity(date)`
- `getPresenceStats(date, windowHours)`
- парсинг ошибок и общий `getJson`.

### `src/features/analytics/hooks.ts`
Хук `useAnalyticsDashboard`:
- грузит activity + stats параллельно;
- отдает `loading`, `error`, `lastUpdatedAt`;
- использует `AbortController`.

### `src/features/analytics/components/*`
UI-компоненты:
- `top-navbar.tsx` — верхняя панель и логотип;
- `filters-bar.tsx` — дата/поиск/окно/время;
- `stats-cards.tsx` — KPI карточки;
- `activity-table.tsx` — таблица (KZT время, модель устройства, пагинация, выбор строки);
- `user-history-panel.tsx` — история входов выбранного пользователя (с уплотнением записей по 20 минут);
- `error-banner.tsx` — ошибка загрузки.

## 4. API контракт, который использует frontend

- `GET /api/amplitude/today-mobile-activity/?date=YYYY-MM-DD`
- `GET /api/amplitude/location-presence-stats/?date=YYYY-MM-DD&window_hours=24`

Frontend ходит на `/api/amplitude/*` (локально), а дальше Next.js proxy перенаправляет в backend.

## 5. Текущие UX-правила

- Время `Last Seen` показывается в KZT (`Asia/Almaty`).
- В колонке Device приоритет — `device_model` (точная модель), затем fallback на бренд/производителя.
- История пользователя в панели уплотняется: показываются только точки с шагом не меньше 20 минут.

## 6. Как внедрять новый дизайн (через ИИ) безопасно

### Что можно менять без риска
- Tailwind классы в `components/*`;
- композицию блоков в `page.tsx`;
- `globals.css` (фон, типографика, theme-переменные).

### Что не ломать
- Типы в `types.ts`;
- имена и сигнатуры API в `api.ts`;
- ключевые пропсы между компонентами (`rows`, `loading`, `onSelectRow`, etc.);
- proxy-роуты в `src/app/api/*`.

### Рекомендуемый процесс
1. Сначала меняйте только визуальные классы (без изменения логики).
2. Затем меняйте layout (если нужно).
3. После каждого этапа запуск:
   - `npm run lint`
   - `npm run build`
4. Проверка ручных сценариев:
   - выбор даты;
   - смена 24/6 часов;
   - поиск;
   - пагинация;
   - открытие истории пользователя.

## 7. Точки расширения

- Добавить серверную пагинацию (с backend поддержкой);
- Добавить отдельную страницу профиля пользователя;
- Добавить переключатель плотности таблицы;
- Добавить полноценную тему (light/dark) через CSS variables.

## 8. Быстрый старт

```bash
cp .env.example .env.local
npm install
npm run dev
```

Открыть: `http://localhost:3000`

---

Если вы пришлете новый дизайн-макет (из Figma/AI/скрин), можно внедрить его в 2 этапа:
- этап 1: чисто визуальный рефактор без изменения поведения;
- этап 2: UX-улучшения (новые блоки, микроанимации, дополнительная фильтрация).
