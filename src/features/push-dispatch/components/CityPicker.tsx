"use client";

import { useEffect, useRef, useState } from "react";

import { NotificationCityOption } from "@/features/push-dispatch/types";

type Props = {
  cities: NotificationCityOption[];
  value: number | null;
  onChange: (id: number | null) => void;
  loading?: boolean;
};

export function CityPicker({ cities, value, onChange, loading }: Props) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = cities.find((c) => c.id === value) ?? null;
  const selectedLabel = selected ? (selected.name_ru || selected.name_kz) : null;

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close on Escape
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative" onKeyDown={handleKeyDown}>
      {/* Trigger button */}
      <button
        type="button"
        disabled={loading}
        onClick={() => setOpen((o) => !o)}
        className={`flex w-full items-center justify-between gap-2 rounded-xl border px-4 py-2.5 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-1 ${
          open
            ? "border-indigo-400 bg-white shadow-sm ring-1 ring-indigo-400"
            : "border-slate-300 bg-white hover:border-slate-400"
        } ${loading ? "cursor-wait opacity-60" : "cursor-pointer"}`}
      >
        <span className={selectedLabel ? "font-medium text-slate-900" : "text-slate-400"}>
          {loading ? "Загрузка городов…" : (selectedLabel ?? "Выберите город")}
        </span>
        <span className={`shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}>
          <svg className="h-4 w-4 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
              clipRule="evenodd"
            />
          </svg>
        </span>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-30 mt-1.5 w-full rounded-xl border border-slate-200 bg-white shadow-lg ring-1 ring-black/5">
          <ul className="max-h-56 overflow-y-auto py-1.5" role="listbox">
            {/* Clear option */}
            {value !== null && (
              <li>
                <button
                  type="button"
                  onClick={() => { onChange(null); setOpen(false); }}
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm text-slate-400 hover:bg-slate-50"
                >
                  <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                  </svg>
                  Сбросить выбор
                </button>
              </li>
            )}

            {cities.map((city) => {
              const label = city.name_ru || city.name_kz;
              const isSelected = city.id === value;
              return (
                <li key={city.id} role="option" aria-selected={isSelected}>
                  <button
                    type="button"
                    onClick={() => { onChange(city.id); setOpen(false); }}
                    className={`flex w-full items-center justify-between gap-2 px-4 py-2 text-sm transition-colors ${
                      isSelected
                        ? "bg-indigo-50 text-indigo-700"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <span>{label}</span>
                    {isSelected && (
                      <svg className="h-4 w-4 shrink-0 text-indigo-600" viewBox="0 0 20 20" fill="currentColor">
                        <path
                          fillRule="evenodd"
                          d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
