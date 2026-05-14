# План реализации frontend: блок «Новые регистрации в мобильном приложении»

Статус: Draft (ожидает согласования)

## 1. Цель

Добавить в раздел аналитики отдельный блок с метрикой регистраций в мобильном приложении за выбранный период.

Ключевое требование:
1. Это отдельный блок внутри текущей страницы аналитики.
2. Не full-screen и не отдельная страница.
3. Должен органично работать рядом с существующими аналитиками.
4. Интерфейс должен быть понятен лид-менеджеру и менеджеру без технической подготовки.

## 2. Текущий контекст проекта (что уже есть)

1. Главная аналитика собирается в [src/app/page.tsx](src/app/page.tsx).
2. Фильтры периода и окно времени реализованы в [src/features/analytics/components/filters-bar.tsx](src/features/analytics/components/filters-bar.tsx).
3. Основные KPI-карточки реализованы в [src/features/analytics/components/stats-cards.tsx](src/features/analytics/components/stats-cards.tsx).
4. Данные страницы приходят через хук [src/features/analytics/hooks.ts](src/features/analytics/hooks.ts).
5. API-клиент аналитики находится в [src/features/analytics/api.ts](src/features/analytics/api.ts).
6. Proxy-паттерн для backend endpoint уже стандартный через [src/app/api/amplitude/_lib/proxy.ts](src/app/api/amplitude/_lib/proxy.ts).

Вывод:
интеграцию нужно делать через существующий pipeline types -> api -> hooks -> component -> page.

## 3. Целевой UX и размещение блока

## 3.1 Где размещаем

Новый блок размещается на странице аналитики под текущими фильтрами и рядом с KPI карточками:
1. Десктоп: в той же сетке аналитики, как отдельная карточка/панель.
2. Мобильная версия: отдельной карточкой в вертикальном порядке между фильтрами и остальными аналитиками.

## 3.2 Что показывает блок

Минимальный состав блока:
1. Заголовок: «Новые регистрации в мобильном приложении».
2. Основная метрика: registrations (крупным числом).
3. Вторичная метрика: total_users (меньшим числом).
4. Период: date_from - date_to (человеко-понятный формат).
5. Служебный индикатор:
   - loading (skeleton)
   - error (компактный inline banner)
   - успешное обновление (timestamp последнего обновления)

## 3.3 Текстовая подача для менеджеров

Смысловой текст в блоке:
1. «Показывает количество новых регистраций в мобильном приложении за выбранный период».
2. Подсказка рядом с total_users: «Общее количество пользователей на конец периода».

## 4. API-контракт для frontend

Источник данных: backend endpoint

GET /api/amplitude/mobile-registrations-stats/?year=YYYY&start_date=YYYY-MM-DD&end_date=YYYY-MM-DD

Ожидаемый ответ:
1. registrations: number
2. total_users: number
3. date_from: string (YYYY-MM-DD)
4. date_to: string (YYYY-MM-DD)
5. source: string
6. cached: boolean

## 5. Архитектура реализации (Clean Code + SOLID)

## 5.1 Type layer

Файл: [src/features/analytics/types.ts](src/features/analytics/types.ts)

Добавить тип:
1. MobileRegistrationsStats

Назначение:
1. Единый контракт между api/hook/component.
2. Исключить «магические поля» и any.

## 5.2 API layer

Файл: [src/features/analytics/api.ts](src/features/analytics/api.ts)

Добавить метод:
1. getMobileRegistrationsStats(startDate, endDate, signal?)

Логика:
1. year вычисляется из startDate.
2. Параметры запроса формируются через существующий buildUrl.
3. Используется текущий getJson и централизованный parseApiErrorMessage.

## 5.3 Proxy route

Новый файл:
1. src/app/api/amplitude/mobile-registrations-stats/route.ts

Паттерн:
1. Аналогично существующим роутам today-mobile-activity и location-presence-stats.
2. GET -> proxyGet(request, "/api/amplitude/mobile-registrations-stats/").

## 5.4 Hook layer

Файл: [src/features/analytics/hooks.ts](src/features/analytics/hooks.ts)

Расширение DashboardState:
1. mobileRegistrations: MobileRegistrationsStats | null

Обновление загрузки:
1. Добавить третий параллельный запрос в Promise.all.
2. Сохранить существующий AbortController-паттерн.
3. Ошибки не должны ломать другие блоки:
   - вариант A: единая ошибка на страницу (как сейчас)
   - вариант B (рекомендуется): локальная ошибка блока + остальные метрики продолжают отображаться

Рекомендация для продукта:
1. Вариант B, чтобы сбой одного endpoint не «гасил» всю аналитику.

## 5.5 UI component layer

Новый компонент:
1. src/features/analytics/components/mobile-registrations-card.tsx

Ответственность:
1. Только отображение данных блока.
2. Не содержит fetch-логики.
3. Принимает через props: data, loading, error, lastUpdatedAt.

Стили:
1. Использовать визуальный язык существующих карточек (border, shadow-sm, rounded-2xl, типографика из stats-cards).
2. Не перегружать графикой: акцент на читаемом числе и ясном тексте.

## 5.6 Page composition

Файл: [src/app/page.tsx](src/app/page.tsx)

Интеграция:
1. Подключить MobileRegistrationsCard рядом со StatsCards.
2. Порядок блоков:
   - FiltersBar
   - ErrorBanner (общие ошибки)
   - MobileRegistrationsCard
   - StatsCards

Примечание:
1. Если внедряем локальные ошибки блока (рекомендовано), блок должен уметь показывать свою ошибку независимо от общего ErrorBanner.

## 6. UI/UX спецификация блока

## 6.1 Десктоп

1. Ширина: в сетке контента, без захвата всей страницы.
2. Компоновка:
   - слева: registrations крупным числом
   - справа: total_users и период
3. Доп. строка: поясняющий текст для менеджеров.

## 6.2 Мобильная версия

1. Карточка в один столбец.
2. Числа и подписи без горизонтального скролла.
3. Тап-таргеты и отступы не менее текущего стандарта страницы.

## 6.3 States

1. Loading:
   - skeleton для чисел и подписей.
2. Empty:
   - если backend вернул 0, показываем 0 (это валидные данные, не пустое состояние).
3. Error:
   - компактный alert внутри карточки.
4. Success:
   - нормальный контент + метка времени обновления.

## 7. Технические требования качества

1. Без дублирования логики дат между компонентами.
2. Без any, строгие типы TS.
3. SRP: отдельный компонент для блока, отдельный метод API.
4. Читаемость и predictability: короткие функции, понятные имена.

## 8. Тестирование

## 8.1 Functional checks

1. Период изменяется в FiltersBar -> блок регистраций обновляется.
2. При смене периода и windowHours существующие аналитики не ломаются.
3. При 502 от backend блок показывает понятную ошибку.
4. На мобильном и десктопе верстка корректна.

## 8.2 Regression checks

1. Build: npm run build
2. Проверка аналитики на отсутствие layout shift.
3. Проверка auth guard и доступа к странице аналитики.

## 9. Риски и как снижаем

1. Риск: backend year и диапазон дат должны быть согласованы.
   - Митигируем: year всегда берем из startDate.
2. Риск: единый error state может скрыть остальные данные.
   - Митигируем: выносим локальный error-state для нового блока.
3. Риск: перегрузка визуала на странице.
   - Митигируем: лаконичная карточка без лишней декоративности.

## 10. План реализации (после согласования)

1. Добавить типы в types.ts.
2. Добавить proxy route mobile-registrations-stats.
3. Добавить метод API в analytics api.ts.
4. Расширить hook hooks.ts.
5. Реализовать компонент MobileRegistrationsCard.
6. Подключить блок в page.tsx.
7. Прогнать build и ручные сценарии.

## 11. Definition of Done

1. На странице аналитики виден отдельный блок регистраций (не full-screen).
2. Блок корректно обновляется по выбранному периоду.
3. Блок имеет стабильные состояния loading/error/success.
4. Существующие аналитические блоки продолжают работать.
5. Код соответствует архитектуре проекта и читается без скрытой логики.

## 12. Что дальше

После вашего согласования этого документа начинаю реализацию по шагам с аккуратной интеграцией в текущую архитектуру analytics.
