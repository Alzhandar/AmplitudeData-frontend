# Адаптивность для мобильных устройств — План улучшений

> **Статус**: ожидает согласования → реализация не начата  
> **Уровни приоритета**: 🔴 Критично | 🟡 Средний | 🟢 Низкий

---

## Общий контекст

Приложение написано на **Next.js + Tailwind CSS v4**. Breakpoints Tailwind:
- `sm` = 640px
- `md` = 768px  
- `lg` = 1024px
- `xl` = 1280px

Целевые устройства: смартфоны **360–430px** ширины (Android/iOS).  
Сейчас фронт в целом «не сломан» на мобиле, но имеет ряд критичных UX-проблем.

---

## 1. `features/navigation/components/app-shell.tsx`

### 1.1 🔴 Шапка (header) — переполнение на узких экранах

**Проблема:**  
В `<header>` есть `flex-wrap` + `justify-between`. На экранах ≤375px блок с именем пользователя (`max-w-[220px]`) и кнопкой «Выйти» переносится на вторую строку, увеличивая высоту шапки до ~100px. Это «крадёт» полезное пространство контента.

```tsx
// СЕЙЧАС (строки ~186–200)
<div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
  <div className="text-right">
    <p className="max-w-[220px] truncate text-sm font-medium text-slate-800">{fullName || "Сотрудник"}</p>
    <p className="max-w-[220px] truncate text-xs text-slate-500">{positionName || "Должность не указана"}</p>
  </div>
  <button ...>Выйти</button>
</div>
```

**Решение:**  
На мобиле скрывать имя/должность (они и так занимают место) и оставлять только компактную иконку + кнопку «Выйти». Имя уже видно в шапке страницы на десктопе, на мобиле это лишняя информация.

```tsx
// ПОСЛЕ
<div className="flex items-center gap-2">
  {/* Имя+должность — только на sm+ */}
  <div className="hidden sm:block text-right">
    <p className="max-w-[200px] truncate text-sm font-medium text-slate-800">{fullName || "Сотрудник"}</p>
    <p className="max-w-[200px] truncate text-xs text-slate-500">{positionName || "Должность не указана"}</p>
  </div>
  <button
    type="button"
    onClick={onLogout}
    className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
  >
    Выйти
  </button>
</div>
```

---

### 1.2 🟡 Мобильная навигация (горизонтальный strip) — улучшение UX

**Проблема:**  
Текущий mobile nav — горизонтально прокручиваемая полоска с полными подписями.  
На 360px при 4–5 пунктах меню пользователь не видит, что список прокручивается.

```tsx
// СЕЙЧАС — строки ~170–187
<div className="border-b border-slate-200 bg-white px-4 py-2 lg:hidden">
  <div className="flex gap-1 overflow-auto">
    {visibleNavItems.map((item) => (
      <Link className={`inline-flex items-center gap-1.5 whitespace-nowrap ...`}>
        {item.icon(active)}
        {item.label}
      </Link>
    ))}
  </div>
</div>
```

**Решение:**  
1. Добавить `scrollbar-none` (скрыть системный скроллбар, но сохранить прокрутку).
2. Добавить fade-индикатор справа (pseudo-element через CSS), что список длиннее.
3. Подписи сократить: на `xs` (< 400px) показывать только иконки, на `sm` — полный текст.

```tsx
// ПОСЛЕ
<div className="border-b border-slate-200 bg-white px-2 py-2 lg:hidden">
  <div className="flex gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
    {visibleNavItems.map((item) => {
      const active = item.href === "/" ? pathname === item.href : pathname.startsWith(item.href);
      return (
        <Link
          key={item.href}
          href={item.href}
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium transition ${
            active ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          {item.icon(active)}
          <span className="hidden xs:inline sm:inline">{item.label}</span>
        </Link>
      );
    })}
  </div>
</div>
```

> **Примечание**: `xs` breakpoint нужно добавить в Tailwind config или использовать `min-[400px]:inline`.

---

### 1.3 🟡 `<main>` padding — слишком большой на мобиле

**Проблема:**  
`px-4 pb-8 pt-6 sm:px-6 lg:px-8` — на мобиле `pt-6` (24px сверху) нормально, но вместе с мобильным nav (≈44px) и header (≈72px) контент начинается очень низко.

**Решение:**  
```tsx
// СЕЙЧАС
<main className="flex-1 px-4 pb-8 pt-6 sm:px-6 lg:px-8">{children}</main>

// ПОСЛЕ
<main className="flex-1 px-4 pb-8 pt-4 sm:px-6 sm:pt-6 lg:px-8">{children}</main>
```

---

## 2. `app/login/page.tsx` и `app/register/page.tsx`

### 2.1 🟢 Уже хорошо — минорные улучшения

Страницы логина и регистрации уже адаптивны: `px-4 py-8`, `max-w-md`, `w-full`.  
Единственная правка:

**Проблема:**  
`h1` `text-2xl` на маленьких экранах занимает больше места чем нужно. Мелочь, но на 320px экране «Вход в аналитику» может переноситься.

```tsx
// СЕЙЧАС
<h1 className="text-2xl font-bold text-slate-900">Вход в аналитику</h1>

// ПОСЛЕ
<h1 className="text-xl sm:text-2xl font-bold text-slate-900">Вход в аналитику</h1>
```

---

## 3. `app/page.tsx` (Аналитика) → компоненты аналитики

### 3.1 🔴 `features/analytics/components/filters-bar.tsx` — выпадающий календарь уходит за экран

**Проблема:**  
Выпадающий календарь: `absolute left-0 top-full mt-2 w-72`.  
На экране 360–390px ширина 288px (`w-72`) от позиции `left-0` кнопки — если кнопка расположена правее 70px, правый край дропдауна уйдёт за viewport.

```tsx
// СЕЙЧАС
<div className="absolute left-0 top-full z-50 mt-2 w-72 rounded-2xl border ...">
```

**Решение:**  
Ограничить максимальную ширину viewport-единицами и прикрепить к правому краю как fallback.

```tsx
// ПОСЛЕ
<div className="absolute left-0 top-full z-50 mt-2 w-72 max-w-[calc(100vw-2rem)] rounded-2xl border ...">
```

---

### 3.2 🟡 `filters-bar.tsx` — поисковое поле не растягивается на всю ширину мобила

**Проблема:**  
Фильтры — `flex flex-wrap items-center gap-3`. На мобиле кнопка даты и поиск стоят рядом, но поле поиска не имеет `flex-1` или `w-full`, поэтому оно может быть слишком узким.

```tsx
// СЕЙЧАС (поле поиска)
<input
  className="rounded-xl border border-gray-300 bg-white pl-9 pr-3 py-2.5 text-sm shadow-sm ..."
  placeholder="Поиск по телефону / User ID"
/>

// ПОСЛЕ — добавить min-w и flex-1
<input
  className="min-w-[160px] flex-1 rounded-xl border border-gray-300 bg-white pl-9 pr-3 py-2.5 text-sm shadow-sm ..."
  placeholder="Поиск по телефону / User ID"
/>
```

---

### 3.3 🟡 `features/analytics/components/activity-table.tsx` — скрыть колонку «Платформа» на мобиле

**Проблема:**  
5 колонок (Пользователь, Устройство, Платформа, Визиты, Последний вход) + `overflow-x-auto` — работает, но горизонтальный скролл неудобен. Колонка «Платформа» (ios/android) наименее приоритетна.

```tsx
// СЕЙЧАС — th «Платформа»
<th className="px-5 py-3">Платформа</th>
// td
<td className="px-5 py-3 text-gray-500">{row.platform || "—"}</td>

// ПОСЛЕ — скрыть на мобиле
<th className="hidden sm:table-cell px-5 py-3">Платформа</th>
<td className="hidden sm:table-cell px-5 py-3 text-gray-500">{row.platform || "—"}</td>
```

---

### 3.4 🟢 `features/analytics/components/stats-cards.tsx` — уменьшить padding карточек

**Проблема:**  
Карточки `p-5` на мобиле — 20px со всех сторон. При 360px экране остаётся 320px контента. Небольшое сжатие улучшит вёрстку.

```tsx
// СЕЙЧАС
<article className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
  <p className="mt-1 text-3xl font-extrabold text-gray-900">

// ПОСЛЕ
<article className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 shadow-sm">
  <p className="mt-1 text-2xl sm:text-3xl font-extrabold text-gray-900">
```

---

### 3.5 🔴 `features/analytics/components/user-history-panel.tsx` — drawer шире экрана

**Проблема:**  
```tsx
<aside className="fixed right-0 top-0 z-50 flex h-full w-full max-w-sm flex-col bg-white shadow-2xl">
```
`max-w-sm` = 384px. На телефоне 360px это уже **шире экрана**. Drawer займёт весь экран, но без плавного перехода.

**Ещё проблема:**  
Зигзаг-таймлайн с `w-[calc(50%-20px)]` на узком drawer (≤384px) даёт карточкам всего ~150px — текст времени почти не помещается.

```tsx
// СЕЙЧАС
<aside className="fixed right-0 top-0 z-50 flex h-full w-full max-w-sm flex-col bg-white shadow-2xl">

// ПОСЛЕ — на мобиле full-screen, на sm+ = 384px
<aside className="fixed inset-0 z-50 flex flex-col bg-white shadow-2xl sm:inset-auto sm:right-0 sm:top-0 sm:h-full sm:w-full sm:max-w-sm">
```

**Таймлайн на мобиле — упростить:**  
Вместо зигзага сделать вертикальный список (timeline без `left`/`right` чередования):

```tsx
// ПОСЛЕ — для экранов меньше sm используем простую вертикальную линию
<div className="relative pl-6">
  <div className="absolute left-2.5 top-0 h-full w-px bg-gray-200" />
  <div className="space-y-4">
    {compactedVisitTimes.map((time, index) => (
      <div key={time} className="relative flex items-start gap-3">
        <div className="absolute -left-6 mt-1 z-10 h-4 w-4 rounded-full bg-blue-600 ring-4 ring-blue-100" />
        <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm w-full">
          <div className="flex items-center gap-1 text-xs text-gray-500">
            {/* clock icon */}
            {formatTimelineTime(time)}
          </div>
        </div>
      </div>
    ))}
  </div>
</div>
```

---

## 4. `app/coupon-dispatch/page.tsx`

### 4.1 🔴 История рассылок — таблица с 9 колоннами на мобиле

**Проблема:**  
Таблица истории имеет 9 колонок: Дата, Инициатор, Купон, Акция, Действует до, Статус, Успешно, Ошибок, кнопка.  
На мобиле это нечитаемый горизонтальный скролл длиной ~900px.

**Решение: скрыть второстепенные колонки на мобиле:**

```tsx
// СЕЙЧАС — все th/td без responsive классов
<th className="px-3 py-2">Инициатор</th>
<th className="px-3 py-2">Акция</th>
<th className="px-3 py-2">Действует до</th>

// ПОСЛЕ — скрыть на мобиле
<th className="hidden md:table-cell px-3 py-2">Инициатор</th>
<th className="hidden lg:table-cell px-3 py-2">Акция</th>
<th className="hidden md:table-cell px-3 py-2">Действует до</th>

// И соответствующие td:
<td className="hidden md:table-cell px-3 py-2.5 text-slate-600">{job.initiated_by_email || "-"}</td>
<td className="hidden lg:table-cell max-w-[200px] px-3 py-2.5">...</td>
<td className="hidden md:table-cell px-3 py-2.5 text-slate-600">{formatIsoDate(job.valid_until)}</td>
```

**Итог на мобиле:** Дата, Купон, Статус, Успешно/Ошибок, кнопка = 6 колонок — читаемо.

---

### 4.2 🔴 Секции — `p-6` padding слишком большой на мобиле

**Проблема:**  
Все секции `p-6` = 24px со всех сторон. На 360px экране контент = 360 - 2×16(px-4 main) - 2×24 = 280px — очень мало.

```tsx
// СЕЙЧАС (встречается 3 раза в файле)
<section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

// ПОСЛЕ
<section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
```

---

### 4.3 🟡 Переключатель режима (tabs) — может не влезть на одной строке

**Проблема:**  
```tsx
<div className="mt-4 inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1">
  <button ...>По маркетинговой акции</button>
  <button ...>Готовые коды из Excel</button>
</div>
```
Оба текста длинные. На 360px inline-flex может либо уйти за экран, либо текст внутри кнопок перенесётся некрасиво.

```tsx
// ПОСЛЕ — flex-wrap и w-full на мобиле
<div className="mt-4 flex flex-wrap rounded-xl border border-slate-200 bg-slate-50 p-1 sm:inline-flex">
  <button className={`flex-1 sm:flex-none rounded-lg px-3 py-1.5 text-sm font-medium transition text-center ${...}`}>
    По маркетинговой акции
  </button>
  <button className={`flex-1 sm:flex-none rounded-lg px-3 py-1.5 text-sm font-medium transition text-center ${...}`}>
    Готовые коды из Excel
  </button>
</div>
```

---

### 4.4 🟡 Детали задачи — grid `md:grid-cols-3` хорош, но карточки слишком маленькие на мобиле

**Проблема:**  
```tsx
<dl className="mt-4 grid gap-3 text-sm md:grid-cols-3">
```
На мобиле это 1 колонка — нормально. Но 9 карточек подряд — много вертикального пространства.

**Решение:** Использовать 2 колонки уже с `xs` (400px) или `sm` (640px):

```tsx
// ПОСЛЕ
<dl className="mt-4 grid gap-2 text-sm grid-cols-2 md:grid-cols-3">
```

---

### 4.5 🟡 Таблица результатов (детали задачи) — горизонтальный скролл без подсказки

**Проблема:**  
Таблица результатов внутри детали задачи (строки ~450–500 в файле) имеет `overflow-auto` — технически скроллится, но пользователь не знает об этом.

```tsx
// СЕЙЧАС
<div className="mt-2 max-h-[520px] overflow-auto rounded-lg border border-slate-200">

// ПОСЛЕ — добавить явный индикатор + скрыть менее важные колонки
<div className="mt-2 max-h-[520px] overflow-auto rounded-lg border border-slate-200">
  <table className="min-w-full text-xs">
    <thead>
      <tr>
        <th className="px-3 py-2">Телефон</th>
        <th className="hidden sm:table-cell px-3 py-2">ФИО гостя</th>
        <th className="hidden md:table-cell px-3 py-2">Купон</th>
        <th className="px-3 py-2">Статус</th>
        <th className="px-3 py-2">Ошибка</th>
      </tr>
    </thead>
```

---

## 5. `app/bonus-transactions/page.tsx`

### 5.1 🔴 История начислений — 9 колонок на мобиле (идентично coupon-dispatch)

**Проблема:**  
Дата, Инициатор, Причина, Сумма, Период, Статус, Успешно, Ошибок, кнопка = 9 колонок.

```tsx
// ПОСЛЕ — скрывать на мобиле
<th className="hidden sm:table-cell px-3 py-2">Инициатор</th>
<th className="hidden md:table-cell px-3 py-2">Период</th>

// Соответствующие td:
<td className="hidden sm:table-cell px-3 py-2.5 text-slate-600">{job.initiated_by_email || "-"}</td>
<td className="hidden md:table-cell px-3 py-2.5 text-slate-500">{job.start_date} – {job.expiration_date}</td>
```

**Итог на мобиле:** Дата, Причина, Сумма, Статус, Успешно/Ошибок, кнопка = 7 колонок.

---

### 5.2 🔴 Секции — `p-6` на мобиле (идентично coupon-dispatch)

```tsx
// ПОСЛЕ (встречается 3 раза)
<section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
```

---

### 5.3 🟡 Таблица результатов — скрыть длинные колонки

**Проблема:**  
6 колонок: Телефон, ID гостя, GUID документа, ID базы, Статус, Ошибка.  
`GUID документа` и `ID базы` — очень длинные UUID-строки, на мобиле занимают много места.

```tsx
// ПОСЛЕ
<th className="hidden md:table-cell px-3 py-2">GUID документа</th>
<th className="hidden md:table-cell px-3 py-2">ID базы</th>

<td className="hidden md:table-cell max-w-[220px] truncate px-3 py-2" title={row.doc_guid || ""}>{row.doc_guid || "-"}</td>
<td className="hidden md:table-cell max-w-[220px] truncate px-3 py-2" title={row.base_id || ""}>{row.base_id || "-"}</td>
```

---

### 5.4 🟡 Детали задачи — grid `md:grid-cols-3` → 2 колонки на sm

Аналогично coupon-dispatch п. 4.4:

```tsx
// ПОСЛЕ
<dl className="mt-4 grid gap-2 text-sm grid-cols-2 md:grid-cols-3">
```

---

## 6. `app/push-dispatch/page.tsx`

### 6.1 🔴 Секция — `p-6` на мобиле

```tsx
// СЕЙЧАС
<section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

// ПОСЛЕ
<section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
```

---

### 6.2 🟡 Форма — 2 поля textarea (RU/KZ) расположены горизонтально на md

```tsx
// СЕЙЧАС
<div className="mt-5 grid gap-4 md:grid-cols-2">
  <label>Заголовок (RU)</label>
  <label>Заголовок (KZ)</label>
  <label>Текст (RU)</label>
  <label>Текст (KZ)</label>
</div>
```

На мобиле (single column) всё корректно стекается. Проблема в том, что пользователю нужно **переключаться** между RU и KZ полями. На мобиле удобнее если RU идёт полностью (заголовок + текст), потом KZ блок.

```tsx
// ПОСЛЕ — переупорядочить для мобильного UX
<div className="mt-5 space-y-4 md:grid md:grid-cols-2 md:gap-4 md:space-y-0">
  {/* RU блок */}
  <div className="space-y-3 md:space-y-4">
    <label>Заголовок (RU) ...</label>
    <label>Текст (RU) ...</label>
  </div>
  {/* KZ блок */}
  <div className="space-y-3 md:space-y-4">
    <label>Заголовок (KZ) ...</label>
    <label>Текст (KZ) ...</label>
  </div>
</div>
```

---

### 6.3 🟡 Кнопки выбора «По списку» / «По городу»

```tsx
// СЕЙЧАС
<div className="flex flex-wrap gap-2">
  <button>По списку номеров</button>
  <button>По городу</button>
</div>
```

На мобиле эти кнопки должны быть равной ширины:

```tsx
// ПОСЛЕ
<div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
  <button className={`rounded-md px-3 py-2 text-sm font-medium transition text-center ...`}>По списку номеров</button>
  <button className={`rounded-md px-3 py-2 text-sm font-medium transition text-center ...`}>По городу</button>
</div>
```

---

## 7. `app/blacklist/page.tsx`

### 7.1 🟡 Форма добавления — кнопка без `w-full` на мобиле

**Проблема:**  
```tsx
<div className="mt-4 grid gap-4 md:grid-cols-[1fr_1fr_auto]">
  <input placeholder="Телефон" />
  <input placeholder="Причина" />
  <button>Добавить</button>
</div>
```
На мобиле grid стекается в 1 колонку — `auto` у кнопки даёт ей минимальную ширину. Выглядит несогласованно с инпутами.

```tsx
// ПОСЛЕ
<div className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_auto]">
  <input className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Телефон" />
  <input className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Причина" />
  <button className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 md:w-auto">
    Добавить
  </button>
</div>
```

---

## 8. `features/common/components/CalendarField.tsx`

### 8.1 🔴 Выпадающий календарь уходит за правый край экрана

**Проблема:**  
```tsx
// СЕЙЧАС — строка ~185
<div className="absolute left-0 z-30 mt-2 w-full min-w-[300px] rounded-xl border ... md:w-[340px]">
```
`min-w-[300px]` при `w-full` — если родительский элемент узкий (например, в колонке 50% grid), а экран 360px, dropdown может выйти за viewport.

```tsx
// ПОСЛЕ
<div className="absolute left-0 z-30 mt-2 w-full min-w-[280px] max-w-[calc(100vw-2rem)] rounded-xl border border-slate-200 bg-white p-3 shadow-xl sm:w-[320px] md:w-[340px]">
```

**Дополнительно:** добавить `overflow-hidden` на контейнер, чтобы calendar cells не выходили.

---

### 8.2 🟢 Quick options — кнопки могут быть чуть крупнее для мобильного tap target

**Проблема:**  
```tsx
<button className="rounded-md border ... px-2.5 py-1 text-xs ...">
```
`py-1` = 4px — слишком мало для комфортного касания. Рекомендуемый минимум tap target = 44px по высоте.

```tsx
// ПОСЛЕ
<button className="rounded-md border ... px-3 py-1.5 text-xs ...">
```

---

## 9. `features/common/components/ui/Modal.tsx`

### 9.1 🟡 Модальное окно — нет `max-h` и `overflow-y` на мобиле

**Проблема:**  
На очень высоком контенте (форма подтверждения с длинным текстом) модал может выйти за нижнюю границу экрана на маленьких телефонах.

```tsx
// СЕЙЧАС
<div className={`relative w-full ${SIZE_CLASSES[size]} rounded-2xl border border-slate-200 bg-white shadow-2xl`}>

// ПОСЛЕ
<div className={`relative w-full ${SIZE_CLASSES[size]} max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl`}>
```

---

### 9.2 🟢 Backdrop padding на xs

```tsx
// СЕЙЧАС
<div className="fixed inset-0 z-50 flex items-center justify-center px-4">

// ПОСЛЕ — на мобиле меньше padding, чтобы модал был шире
<div className="fixed inset-0 z-50 flex items-center justify-center px-3 sm:px-4">
```

---

## 10. `features/common/components/AuthLoadingScreen.tsx`

Этот компонент нужно проверить отдельно — скорее всего уже адаптивен (full-screen centred).  
Если использует фиксированные размеры — добавить `px-4` и `max-w-sm`.

---

## Сводная таблица всех изменений

| № | Файл | Проблема | Приоритет |
|---|------|----------|-----------|
| 1.1 | `app-shell.tsx` | Шапка переполняется, имя/должность на мобиле | 🔴 |
| 1.2 | `app-shell.tsx` | Mobile nav UX — нет индикатора прокрутки | 🟡 |
| 1.3 | `app-shell.tsx` | `<main>` pt-6 слишком большой на мобиле | 🟡 |
| 2.1 | `login/page.tsx`, `register/page.tsx` | h1 text-2xl на узких экранах | 🟢 |
| 3.1 | `filters-bar.tsx` | Calendar dropdown уходит за экран | 🔴 |
| 3.2 | `filters-bar.tsx` | Поле поиска не растягивается | 🟡 |
| 3.3 | `activity-table.tsx` | Колонка «Платформа» видна на мобиле | 🟡 |
| 3.4 | `stats-cards.tsx` | p-5 и text-3xl слишком крупно | 🟢 |
| 3.5 | `user-history-panel.tsx` | Drawer шире экрана + сложный таймлайн | 🔴 |
| 4.1 | `coupon-dispatch/page.tsx` | Таблица истории — 9 колонок | 🔴 |
| 4.2 | `coupon-dispatch/page.tsx` | Секции p-6 на мобиле | 🔴 |
| 4.3 | `coupon-dispatch/page.tsx` | Toggle tabs не влезает | 🟡 |
| 4.4 | `coupon-dispatch/page.tsx` | dl grid cols 2 начиная с sm | 🟡 |
| 4.5 | `coupon-dispatch/page.tsx` | Таблица результатов — лишние колонки | 🟡 |
| 5.1 | `bonus-transactions/page.tsx` | Таблица истории — 9 колонок | 🔴 |
| 5.2 | `bonus-transactions/page.tsx` | Секции p-6 на мобиле | 🔴 |
| 5.3 | `bonus-transactions/page.tsx` | UUID колонки на мобиле | 🟡 |
| 5.4 | `bonus-transactions/page.tsx` | dl grid cols 2 начиная с sm | 🟡 |
| 6.1 | `push-dispatch/page.tsx` | Секция p-6 на мобиле | 🔴 |
| 6.2 | `push-dispatch/page.tsx` | RU/KZ поля — порядок для мобиле | 🟡 |
| 6.3 | `push-dispatch/page.tsx` | Кнопки target — неравная ширина | 🟡 |
| 7.1 | `blacklist/page.tsx` | Кнопка без w-full на мобиле | 🟡 |
| 8.1 | `CalendarField.tsx` | Dropdown уходит за экран + min-w | 🔴 |
| 8.2 | `CalendarField.tsx` | Tap target кнопок слишком мал | 🟢 |
| 9.1 | `Modal.tsx` | Нет max-h + overflow-y на мобиле | 🟡 |
| 9.2 | `Modal.tsx` | px-4 backdrop на xs | 🟢 |

---

## Порядок реализации (рекомендованный)

### Этап 1 — Критичные (🔴) — быстрое исправление
1. `p-6` → `p-4 sm:p-6` во всех секциях (coupon, bonus, push) — 1 файл × 3 места
2. `CalendarField.tsx` — ограничить dropdown по viewport
3. `filters-bar.tsx` — то же для аналитики calendar
4. `user-history-panel.tsx` — full-width drawer на мобиле
5. Таблицы истории — скрыть второстепенные колонки

### Этап 2 — Средние (🟡)
6. `app-shell.tsx` — шапка mobile
7. Таблицы результатов — скрыть UUID колонки
8. push-dispatch — переупорядочить RU/KZ блоки
9. `Modal.tsx` — max-h
10. Blacklist button

### Этап 3 — Мелкие (🟢)
11. `login/register` — text-xl на мобиле
12. `stats-cards.tsx` — уменьшить текст/padding
13. `CalendarField.tsx` — увеличить tap target

---

## Итог

Самая болезненная проблема — таблицы с 8–9 колонками без responsive-скрытия колонок.  
Следующая по приоритету — выпадающие блоки (calendars), которые уходят за viewport.  
Все остальные — улучшения UX/комфорта, не blockers.

После согласования начинаю реализацию в порядке Этап 1 → 2 → 3.
