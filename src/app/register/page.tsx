"use client";

import { FormEvent, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { authApi } from "@/features/auth/api";
import { saveAuthSession } from "@/features/auth/storage";
import { AuthFormField } from "@/features/auth/components/AuthFormField";
import { Button } from "@/features/common/components/ui/Button";
import { translateErrorMessage } from "@/features/common/utils/error-messages";

function passwordStrength(password: string): { level: 0 | 1 | 2 | 3; label: string; color: string } {
  if (!password) return { level: 0, label: "", color: "" };
  if (password.length < 8) return { level: 1, label: "Слабый", color: "bg-red-400" };
  const hasDigit = /\d/.test(password);
  const hasSpecial = /[^a-zA-Z0-9]/.test(password);
  if (hasDigit || hasSpecial) return { level: 3, label: "Сильный", color: "bg-emerald-500" };
  return { level: 2, label: "Средний", color: "bg-amber-400" };
}

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [iin, setIin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const strength = passwordStrength(password);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await authApi.register({
        email: email.trim().toLowerCase(),
        password,
        iin: iin.trim(),
      });
      saveAuthSession(result.token, result.iin);
      router.push("/");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Ошибка регистрации";
      setError(translateErrorMessage(message));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen bg-slate-50">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-indigo-700 p-12 text-white">
        <Image src="/logo-avametric-white.svg" alt="avametric" width={180} height={40} priority />
        <div>
          <h2 className="text-3xl font-bold leading-snug">
            Аналитика и инструменты<br />для сотрудников
          </h2>
          <p className="mt-4 text-indigo-200 text-sm leading-relaxed">
            Управляйте бонусами, купонами, уведомлениями и анализируйте активность гостей — всё в одном месте.
          </p>
        </div>
        <p className="text-xs text-indigo-300">© {new Date().getFullYear()} Avatariya. Только для сотрудников.</p>
      </div>

      {/* Right panel — form */}
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-12">
        {/* Mobile logo */}
        <div className="mb-8 lg:hidden">
          <Image src="/logo-avametric.svg" alt="avametric" width={160} height={36} priority />
        </div>

        <section className="w-full max-w-sm">
          <h1 className="text-2xl font-bold text-slate-900">Регистрация</h1>
          <p className="mt-1 text-sm text-slate-500">Укажите Email, пароль и ИИН сотрудника.</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
            <AuthFormField
              id="email"
              label="Email"
              type="email"
              value={email}
              onChange={setEmail}
              autocomplete="email"
              disabled={loading}
              autoFocus
              validate={(v) => (v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? "Введите корректный email" : null)}
            />

            <div>
              <AuthFormField
                id="password"
                label="Пароль"
                value={password}
                onChange={setPassword}
                autocomplete="new-password"
                disabled={loading}
                showToggle
                validate={(v) => (v && v.length < 8 ? "Минимум 8 символов" : null)}
              />
              {/* Password strength bar */}
              {password.length > 0 && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex flex-1 gap-1">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className={`h-1.5 flex-1 rounded-full transition-colors ${
                          i <= strength.level ? strength.color : "bg-slate-200"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-slate-400">{strength.label}</span>
                </div>
              )}
            </div>

            <AuthFormField
              id="iin"
              label="ИИН"
              value={iin}
              onChange={(v) => setIin(v.replace(/\D/g, "").slice(0, 12))}
              autocomplete="off"
              disabled={loading}
              inputMode="numeric"
              maxLength={12}
              hint="12 цифр"
              validate={(v) => (v && v.length !== 12 ? "Должно быть ровно 12 цифр" : null)}
            />

            <div role="alert" aria-live="assertive">
              {error && (
                <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5">
                  <svg className="mt-0.5 h-4 w-4 shrink-0 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" strokeLinecap="round" />
                    <line x1="12" y1="16" x2="12.01" y2="16" strokeLinecap="round" strokeWidth="2.5" />
                  </svg>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}
            </div>

            <Button type="submit" loading={loading} className="w-full justify-center py-2.5 text-sm">
              Зарегистрироваться
            </Button>

            <p className="text-center text-sm text-slate-500">
              Уже есть аккаунт?{" "}
              <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-700">
                Войти
              </Link>
            </p>
          </form>
        </section>
      </div>
    </main>
  );
}
