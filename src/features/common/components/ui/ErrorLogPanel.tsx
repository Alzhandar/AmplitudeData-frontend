"use client";

import { translateErrorMessage } from "@/features/common/utils/error-messages";

type Props = {
  errorLog: string;
  title?: string;
};

/**
 * Renders a job's error_log string as a structured, professional list.
 *
 * The error_log field from the backend is a newline-separated string of
 * snake_case error codes (e.g. "phone_empty\ninvalid_phone_format").
 * Each line is translated to Russian via translateErrorMessage().
 */
export function ErrorLogPanel({ errorLog, title = "Ошибки при обработке" }: Props) {
  const lines = errorLog
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) return null;

  return (
    <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50">
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200">
        <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
          <svg
            className="h-4 w-4 text-amber-500 shrink-0"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
              clipRule="evenodd"
            />
          </svg>
          {title}
        </div>
        <span className="text-xs text-slate-400 tabular-nums">
          {lines.length} {lines.length === 1 ? "строка" : lines.length < 5 ? "строки" : "строк"}
        </span>
      </div>
      <ul className="max-h-48 overflow-y-auto divide-y divide-slate-100">
        {lines.map((line, index) => (
          <li
            key={index}
            className="flex items-start gap-2 px-3 py-1.5 text-xs text-slate-600"
          >
            <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0" />
            {translateErrorMessage(line)}
          </li>
        ))}
      </ul>
    </div>
  );
}
