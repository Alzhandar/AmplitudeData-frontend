"use client";

import { useState } from "react";

import { useAuthGuard } from "@/features/auth/use-auth-guard";
import { AppShell } from "@/features/navigation/components/app-shell";
import { AuthLoadingScreen } from "@/features/common/components/AuthLoadingScreen";
import { Button } from "@/features/common/components/ui/Button";
import { Modal, ModalCancelButton } from "@/features/common/components/ui/Modal";
import { Skeleton } from "@/features/common/components/ui/Skeleton";
import { useToast } from "@/features/common/components/ui/Toast";
import { translateErrorMessage } from "@/features/common/utils/error-messages";
import { formatNumber } from "@/features/common/utils/format";
import { employeeDiscountCheckApi } from "@/features/employee-discount-check/api";
import {
  DiscountScopeResult,
  EmployeeDiscountCheckResponse,
  EmployeeLookupResponse,
} from "@/features/employee-discount-check/types";

function ScopeCard({ title, scope, employeeFound }: { title: string; scope: DiscountScopeResult; employeeFound: boolean }) {
  const hasPolicy = Boolean(scope.policy_name);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-base font-semibold text-slate-900">{title}</h3>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
            scope.eligible ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
          }`}
        >
          {scope.eligible ? "Скидка доступна" : "Скидка недоступна"}
        </span>
      </div>

      {!employeeFound ? (
        <p className="mt-3 text-sm text-slate-500">Сотрудник с таким номером не найден.</p>
      ) : !hasPolicy ? (
        <p className="mt-3 text-sm text-slate-500">
          Для этого сотрудника нет активной политики скидок в этой области.
        </p>
      ) : (
        <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
          <div className="rounded-lg bg-slate-50 px-3 py-2">
            <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Осталось в этом месяце</dt>
            <dd className="mt-0.5 font-medium text-slate-800">
              {formatNumber(scope.remaining_discounts)} из {formatNumber(scope.max_discounts)}
            </dd>
          </div>
          <div className="rounded-lg bg-slate-50 px-3 py-2">
            <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Использовано</dt>
            <dd className="mt-0.5 font-medium text-slate-800">{formatNumber(scope.used_count)}</dd>
          </div>
          <div className="col-span-2 rounded-lg bg-slate-50 px-3 py-2">
            <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Политика</dt>
            <dd className="mt-0.5 font-medium text-slate-800">{scope.policy_name || "—"}</dd>
          </div>
        </dl>
      )}
    </div>
  );
}

function ResultSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {[0, 1].map((i) => (
        <div key={i} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="mt-4 h-10 w-full" />
          <Skeleton className="mt-2 h-10 w-full" />
        </div>
      ))}
    </div>
  );
}

export default function EmployeeDiscountCheckPage() {
  const { ready, authenticated, hasPageAccess, profile, allowedPages, logout } = useAuthGuard("employee-discount-check");
  const { addToast } = useToast();

  // --- Проверка скидки по номеру ---
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<EmployeeDiscountCheckResponse | null>(null);

  const submit = async () => {
    if (!phone.trim()) {
      setError("Укажите номер телефона");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await employeeDiscountCheckApi.checkByPhone(phone.trim());
      setResult(data);
    } catch (err) {
      setError(translateErrorMessage(err instanceof Error ? err.message : "Не удалось проверить скидку сотрудника"));
    } finally {
      setLoading(false);
    }
  };

  // --- Найти и сменить номер (номер -> если не нашли, то ИИН) ---
  const [identifier, setIdentifier] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [lookupResult, setLookupResult] = useState<EmployeeLookupResponse | null>(null);

  const [showChangePhone, setShowChangePhone] = useState(false);
  const [newPhone, setNewPhone] = useState("");
  const [changingPhone, setChangingPhone] = useState(false);
  const [changePhoneError, setChangePhoneError] = useState<string | null>(null);

  const runLookup = async (value: string) => {
    setLookupLoading(true);
    setLookupError(null);
    setLookupResult(null);
    try {
      const data = await employeeDiscountCheckApi.lookup(value);
      setLookupResult(data);
      return data;
    } catch (err) {
      setLookupError(translateErrorMessage(err instanceof Error ? err.message : "Не удалось найти сотрудника"));
      return null;
    } finally {
      setLookupLoading(false);
    }
  };

  const submitLookup = async () => {
    if (!identifier.trim()) {
      setLookupError("Укажите номер телефона или ИИН");
      return;
    }
    await runLookup(identifier.trim());
  };

  const openChangePhone = () => {
    setNewPhone("");
    setChangePhoneError(null);
    setShowChangePhone(true);
  };

  const confirmChangePhone = async () => {
    if (!lookupResult?.found || !newPhone.trim()) return;
    setChangingPhone(true);
    setChangePhoneError(null);
    try {
      const updated = await employeeDiscountCheckApi.changePhone(identifier.trim(), newPhone.trim());
      setShowChangePhone(false);
      addToast("success", `Номер сотрудника обновлён: ${updated.new_phone}`);
      setIdentifier(updated.new_phone);
      await runLookup(updated.new_phone);
    } catch (err) {
      setChangePhoneError(translateErrorMessage(err instanceof Error ? err.message : "Не удалось изменить номер"));
    } finally {
      setChangingPhone(false);
    }
  };

  if (!ready || !authenticated) return <AuthLoadingScreen />;
  if (!hasPageAccess) return <AuthLoadingScreen message="У вас нет доступа к этому разделу." />;

  const employeeName = result?.restaurant.employee_name || result?.park.employee_name;
  const employeeDepartment = result?.restaurant.employee_department || result?.park.employee_department;
  const employeePosition = result?.restaurant.employee_position || result?.park.employee_position;

  return (
    <AppShell
      title="Проверка скидки сотрудника"
      subtitle="Узнать, доступна ли сотруднику скидка в ресторане и парке, по номеру телефона"
      fullName={profile.full_name}
      positionName={profile.position?.name || ""}
      allowedPages={allowedPages}
      onLogout={logout}
    >
      <div className="space-y-5">
        <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">Поиск по номеру телефона</h2>
          <p className="mt-0.5 text-sm text-slate-500">Формат: +7, 8 или 7 + 10 цифр</p>
          <form onSubmit={(e) => { e.preventDefault(); void submit(); }} className="mt-3 flex gap-3">
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Например: 77071234567"
              className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
            />
            <Button type="submit" loading={loading}>Проверить</Button>
          </form>
          {error && (
            <p className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
              {error}
            </p>
          )}
        </section>

        {loading && <ResultSkeleton />}

        {result && !loading && (
          <>
            <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
              {result.employee_found ? (
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">{employeeName || "Сотрудник"}</h3>
                  <p className="mt-0.5 text-sm text-slate-500">
                    {[employeeDepartment, employeePosition].filter(Boolean).join(" · ") || result.phone}
                  </p>
                </div>
              ) : (
                <p className="text-sm font-medium text-slate-600">
                  Сотрудник с номером {result.phone} не найден. Если сотрудник уверяет, что он есть в системе —
                  воспользуйтесь поиском по ИИН ниже.
                </p>
              )}
            </section>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <ScopeCard title="Ресторан" scope={result.restaurant} employeeFound={result.employee_found} />
              <ScopeCard title="Парк" scope={result.park} employeeFound={result.employee_found} />
            </div>
          </>
        )}

        <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">Найти и сменить номер телефона</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            Если по номеру не находит — ищем по ИИН. Пригодится, когда сотрудник хочет использовать для скидки
            номер, который не совпадает с указанным у него в системе.
          </p>
          <form onSubmit={(e) => { e.preventDefault(); void submitLookup(); }} className="mt-3 flex gap-3">
            <input
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="Номер телефона или ИИН"
              className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
            />
            <Button type="submit" loading={lookupLoading}>Найти</Button>
          </form>
          {lookupError && (
            <p className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
              {lookupError}
            </p>
          )}

          {lookupLoading && (
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="mt-2 h-4 w-64" />
            </div>
          )}

          {lookupResult && !lookupLoading && (
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
              {lookupResult.found ? (
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold text-slate-900">{lookupResult.employee_name || "Сотрудник"}</h3>
                      <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[11px] font-semibold text-indigo-700">
                        {lookupResult.matched_by === "iin" ? "найден по ИИН" : "найден по номеру"}
                      </span>
                    </div>
                    <p className="mt-0.5 text-sm text-slate-500">
                      {[lookupResult.employee_department, lookupResult.employee_position].filter(Boolean).join(" · ") || "—"}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      Текущий номер: {lookupResult.current_phone || "—"} · ИИН: {lookupResult.iin || "—"}
                    </p>
                  </div>
                  <Button variant="secondary" size="sm" onClick={openChangePhone}>
                    Изменить номер телефона
                  </Button>
                </div>
              ) : (
                <p className="text-sm font-medium text-slate-600">
                  Сотрудник не найден ни по номеру, ни по ИИН «{identifier}».
                </p>
              )}
            </div>
          )}
        </section>
      </div>

      <Modal
        open={showChangePhone}
        onClose={() => setShowChangePhone(false)}
        title="Изменить номер телефона"
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <ModalCancelButton onClick={() => setShowChangePhone(false)} disabled={changingPhone} />
            <Button loading={changingPhone} disabled={!newPhone.trim()} onClick={() => void confirmChangePhone()}>
              Сохранить
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-slate-600">
            Текущий номер{" "}
            <span className="font-semibold text-slate-900">{lookupResult?.current_phone || "—"}</span> сотрудника{" "}
            <span className="font-semibold text-slate-900">{lookupResult?.employee_name}</span> будет заменён на
            новый — по нему сотрудник сможет проверять и использовать скидку.
          </p>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Новый номер</span>
            <input
              autoFocus
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              placeholder="Например: 77071234567"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
            />
          </label>
          {changePhoneError && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
              {changePhoneError}
            </p>
          )}
        </div>
      </Modal>
    </AppShell>
  );
}
