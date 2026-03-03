import { useEffect, useMemo, useRef, useState } from "react";

const RU_MONTHS = [
  "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
  "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь",
];
const RU_MONTHS_SHORT = [
  "янв", "фев", "мар", "апр", "май", "июн",
  "июл", "авг", "сен", "окт", "ноя", "дек",
];
const RU_DAYS_SHORT = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

function buildCalendarDays(year: number, month: number): (number | null)[] {
  const firstDay = new Date(year, month, 1).getDay();
  const offset = (firstDay + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = Array(offset).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function formatRangeLabel(startDate: string, endDate: string): string {
  const s = new Date(startDate + "T00:00:00");
  const e = new Date(endDate + "T00:00:00");
  if (Number.isNaN(s.getTime())) return "Выберите диапазон";
  const sd = s.getDate();
  const sm = RU_MONTHS_SHORT[s.getMonth()];
  if (startDate === endDate) {
    return `${sd} ${sm} ${s.getFullYear()}`;
  }
  const ed = e.getDate();
  const em = RU_MONTHS_SHORT[e.getMonth()];
  if (s.getFullYear() === e.getFullYear()) {
    return `${sd} ${sm} – ${ed} ${em} ${e.getFullYear()}`;
  }
  return `${sd} ${sm} ${s.getFullYear()} – ${ed} ${em} ${e.getFullYear()}`;
}

type FiltersBarProps = {
  startDate: string;
  endDate: string;
  onRangeChange: (start: string, end: string) => void;
  search: string;
  onSearchChange: (value: string) => void;
  windowHours: 6 | 24;
  onWindowHoursChange: (value: 6 | 24) => void;
  loading: boolean;
  lastUpdatedAt: string | null;
};

export function FiltersBar({
  startDate,
  endDate,
  onRangeChange,
  search,
  onSearchChange,
  windowHours,
  onWindowHoursChange,
  loading,
  lastUpdatedAt,
}: FiltersBarProps) {
  const [calOpen, setCalOpen] = useState(false);
  // 'start' = picking start date, 'end' = picking end date
  const [picking, setPicking] = useState<"start" | "end">("start");
  const [hoverDate, setHoverDate] = useState<string | null>(null);
  const calRef = useRef<HTMLDivElement>(null);

  const anchorDate = startDate || new Date().toISOString().slice(0, 10);
  const [viewYear, setViewYear] = useState(() => new Date(anchorDate + "T00:00:00").getFullYear());
  const [viewMonth, setViewMonth] = useState(() => new Date(anchorDate + "T00:00:00").getMonth());

  // When calendar opens, reset picking phase and view to startDate
  useEffect(() => {
    if (calOpen) {
      setPicking("start");
      setHoverDate(null);
      const d = new Date(startDate + "T00:00:00");
      if (!Number.isNaN(d.getTime())) {
        setViewYear(d.getFullYear());
        setViewMonth(d.getMonth());
      }
    }
  }, [calOpen, startDate]);

  // close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (calRef.current && !calRef.current.contains(e.target as Node)) {
        setCalOpen(false);
      }
    }
    if (calOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [calOpen]);

  const lastUpdatedTime = useMemo(() => {
    if (!lastUpdatedAt) return null;
    const parsed = new Date(lastUpdatedAt);
    if (Number.isNaN(parsed.getTime())) return null;
    return new Intl.DateTimeFormat("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(parsed);
  }, [lastUpdatedAt]);

  const cells = buildCalendarDays(viewYear, viewMonth);
  const todayStr = new Date().toISOString().slice(0, 10);

  // Effective range including hover preview
  const effectiveEnd = picking === "end" && hoverDate ? hoverDate : endDate;
  const rangeStart = startDate <= effectiveEnd ? startDate : effectiveEnd;
  const rangeEnd = startDate <= effectiveEnd ? effectiveEnd : startDate;

  function cellDateStr(day: number) {
    const m = String(viewMonth + 1).padStart(2, "0");
    const d = String(day).padStart(2, "0");
    return `${viewYear}-${m}-${d}`;
  }

  function selectDay(day: number) {
    const clicked = cellDateStr(day);
    if (picking === "start") {
      onRangeChange(clicked, clicked);
      setPicking("end");
    } else {
      const [s, e] = clicked >= startDate ? [startDate, clicked] : [clicked, startDate];
      onRangeChange(s, e);
      setCalOpen(false);
      setPicking("start");
      setHoverDate(null);
    }
  }

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  }

  const rangeLabel = formatRangeLabel(startDate, endDate);

  return (
    <section className="flex flex-wrap items-center gap-3">
      {/* Range calendar picker */}
      <div ref={calRef} className="relative">
        <button
          type="button"
          onClick={() => setCalOpen((o) => !o)}
          className="flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 shadow-sm hover:border-blue-400 transition"
        >
          <svg className="h-4 w-4 flex-shrink-0 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-sm font-medium text-gray-800 whitespace-nowrap">{rangeLabel}</span>
        </button>

        {calOpen && (
          <div className="absolute left-0 top-full z-50 mt-2 w-72 rounded-2xl border border-gray-200 bg-white p-4 shadow-xl select-none">
            {/* Phase hint */}
            <p className="mb-2 text-center text-xs font-medium text-blue-600">
              {picking === "start" ? "Выберите начало" : "Выберите конец"}
            </p>

            {/* Month nav */}
            <div className="mb-3 flex items-center justify-between">
              <button type="button" onClick={prevMonth} className="rounded-lg p-1.5 hover:bg-gray-100 text-gray-500 transition">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <span className="text-sm font-semibold text-gray-800">
                {RU_MONTHS[viewMonth]} {viewYear}
              </span>
              <button type="button" onClick={nextMonth} className="rounded-lg p-1.5 hover:bg-gray-100 text-gray-500 transition">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Weekday headers */}
            <div className="mb-1 grid grid-cols-7 text-center">
              {RU_DAYS_SHORT.map((d) => (
                <span key={d} className="text-[10px] font-semibold uppercase text-gray-400">{d}</span>
              ))}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7 gap-y-0.5 text-center">
              {cells.map((day, i) => {
                if (!day) return <span key={i} className="h-8" />;
                const cd = cellDateStr(day);
                const isStart = cd === startDate;
                const isEnd = cd === (picking === "end" && hoverDate ? hoverDate : endDate);
                const isInRange = cd > rangeStart && cd < rangeEnd;
                const isToday = cd === todayStr;
                const isEndpoint = isStart || isEnd;

                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => selectDay(day)}
                    onMouseEnter={() => picking === "end" && setHoverDate(cd)}
                    onMouseLeave={() => picking === "end" && setHoverDate(null)}
                    className={[
                      "relative flex h-8 w-full items-center justify-center text-sm transition",
                      isEndpoint ? "z-10" : "",
                      isInRange ? "bg-blue-50 text-blue-800" : "",
                    ].join(" ")}
                  >
                    <span
                      className={[
                        "flex h-8 w-8 items-center justify-center rounded-full",
                        isEndpoint ? "bg-blue-600 font-bold text-white" : "",
                        !isEndpoint && isToday ? "border border-blue-400 font-semibold text-blue-600" : "",
                        !isEndpoint && !isToday && !isInRange ? "text-gray-700 hover:bg-gray-100" : "",
                      ].join(" ")}
                    >
                      {day}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Quick presets */}
            <div className="mt-3 flex flex-wrap gap-1.5 border-t border-gray-100 pt-3">
              {[
                { label: "Сегодня", days: 0 },
                { label: "7 дней", days: 6 },
                { label: "30 дней", days: 29 },
                { label: "Этот месяц", days: -1 },
              ].map(({ label, days }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => {
                    const today = new Date();
                    let s: string;
                    let e: string;
                    if (days === -1) {
                      s = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
                      e = today.toISOString().slice(0, 10);
                    } else {
                      e = today.toISOString().slice(0, 10);
                      const start = new Date(today);
                      start.setDate(today.getDate() - days);
                      s = start.toISOString().slice(0, 10);
                    }
                    onRangeChange(s, e);
                    setCalOpen(false);
                    setPicking("start");
                  }}
                  className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-600 hover:border-blue-400 hover:text-blue-700 transition"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Search */}
      <div className="relative flex-1 min-w-[200px]">
        <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Поиск по пользователю, телефону или устройству..."
          className="w-full rounded-xl border border-gray-300 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-800 shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* Window toggle */}
      <div className="flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-3 py-2 shadow-sm">
        <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="text-sm text-gray-500">Окно</span>
        {([6, 24] as const).map((hours) => {
          const selected = windowHours === hours;
          return (
            <button
              key={hours}
              type="button"
              onClick={() => onWindowHoursChange(hours)}
              className={`rounded-lg px-3 py-1 text-sm font-semibold transition ${
                selected ? "bg-blue-600 text-white shadow-sm" : "text-gray-500 hover:bg-gray-100"
              }`}
            >
              {hours}ч
            </button>
          );
        })}
      </div>

      {/* Status dot */}
      <div className="flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${loading ? "bg-amber-400 animate-pulse" : "bg-emerald-500"}`} />
        <span className="text-xs text-gray-500">{loading ? "Обновление..." : "В эфире"}</span>
        {!loading && lastUpdatedTime && (
          <span className="text-xs text-gray-400">· обновлено {lastUpdatedTime}</span>
        )}
      </div>
    </section>
  );
}
