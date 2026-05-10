import { useState } from "react";

type AuthFormFieldProps = {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  autocomplete?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  maxLength?: number;
  pattern?: string;
  hint?: string;
  touched?: boolean;
  validate?: (v: string) => string | null;
  showToggle?: boolean; // for password fields
};

export function AuthFormField({
  id,
  label,
  type = "text",
  value,
  onChange,
  autocomplete,
  disabled,
  autoFocus,
  inputMode,
  maxLength,
  pattern,
  hint,
  touched,
  validate,
  showToggle,
}: AuthFormFieldProps) {
  const [fieldTouched, setFieldTouched] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const isTouched = touched || fieldTouched;
  const error = isTouched && validate ? validate(value) : null;
  const resolvedType = showToggle ? (showPassword ? "text" : "password") : type;

  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={resolvedType}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={() => setFieldTouched(true)}
          autoComplete={autocomplete}
          disabled={disabled}
          autoFocus={autoFocus}
          inputMode={inputMode}
          maxLength={maxLength}
          pattern={pattern}
          aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
          aria-invalid={!!error}
          className={[
            "w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition",
            "focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-400",
            "disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400",
            showToggle ? "pr-10" : "",
            error
              ? "border-red-400 focus:border-red-400 focus:ring-red-300/30"
              : "border-slate-300",
          ]
            .filter(Boolean)
            .join(" ")}
        />
        {showToggle && (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowPassword((p) => !p)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
          >
            {showPassword ? (
              // Eye-off
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                <line x1="1" y1="1" x2="23" y2="23" strokeLinecap="round" />
              </svg>
            ) : (
              // Eye
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M1 12S5 4 12 4s11 8 11 8-4 8-11 8S1 12 1 12z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        )}
      </div>
      {error && (
        <p id={`${id}-error`} className="mt-1 text-xs text-red-600">
          {error}
        </p>
      )}
      {!error && hint && (
        <p id={`${id}-hint`} className="mt-1 text-xs text-slate-400">
          {hint}
        </p>
      )}
    </div>
  );
}
