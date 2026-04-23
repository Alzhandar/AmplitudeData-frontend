"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { AppShell } from "@/features/navigation/components/app-shell";
import { useAuthGuard } from "@/features/auth/use-auth-guard";
import { pushDispatchApi } from "@/features/push-dispatch/api";
import { NotificationCityOption, PushTarget } from "@/features/push-dispatch/types";

function isPhoneHeaderLabel(value: string): boolean {
  const cleaned = value
    .toLowerCase()
    .split("")
    .filter((ch) => /[\p{L}\p{N}_\- ]/u.test(ch))
    .join("")
    .replace(/[-_]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const compact = cleaned.replace(/\s+/g, "");
  const candidates = new Set([
    "phone",
    "phones",
    "phonenumber",
    "phonenumbers",
    "phone number",
    "phone numbers",
    "телефон",
    "телефоны",
    "номер телефона",
    "номертелефона",
  ]);

  return candidates.has(cleaned) || candidates.has(compact);
}

function normalizePhone(rawValue: string): string {
  const digits = rawValue.replace(/\D/g, "");
  if (!digits) return "";

  if (digits.length === 11 && digits.startsWith("8")) {
    return `7${digits.slice(1)}`;
  }

  if (digits.length === 11 && digits.startsWith("7")) {
    return digits;
  }

  return "";
}

function parsePhones(text: string): string[] {
  const rows = text.replace(/\r/g, "\n").replace(/[;,]/g, "\n").split("\n");
  const unique = new Set<string>();
  const result: string[] = [];

  for (const row of rows) {
    const trimmed = row.trim();
    if (!trimmed || isPhoneHeaderLabel(trimmed)) {
      continue;
    }

    const normalized = normalizePhone(trimmed);
    if (!normalized || unique.has(normalized)) {
      continue;
    }

    unique.add(normalized);
    result.push(normalized);
  }

  return result;
}

export default function PushDispatchPage() {
  const { ready, authenticated, hasPageAccess, profile, allowedPages, logout } = useAuthGuard("push-dispatch");
  const [target, setTarget] = useState<PushTarget>("phones");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [titleKz, setTitleKz] = useState("");
  const [bodyKz, setBodyKz] = useState("");
  const [phonesText, setPhonesText] = useState("");
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [cities, setCities] = useState<NotificationCityOption[]>([]);
  const [selectedCityId, setSelectedCityId] = useState<number | null>(null);
  const [showCityConfirmModal, setShowCityConfirmModal] = useState(false);
  const [citiesLoading, setCitiesLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const excelInputRef = useRef<HTMLInputElement | null>(null);

  const parsedPhones = useMemo(() => parsePhones(phonesText), [phonesText]);
  const selectedCity = useMemo(
    () => cities.find((item) => item.id === selectedCityId) || null,
    [cities, selectedCityId],
  );
  const selectedCityName = useMemo(() => {
    if (!selectedCity) {
      return "";
    }
    return selectedCity.name_ru || selectedCity.name_kz || "Выбранный город";
  }, [selectedCity]);

  const canSubmit = useMemo(() => {
    if (!title.trim() || !body.trim()) {
      return false;
    }
    if (target === "phones") {
      return parsedPhones.length > 0 || Boolean(excelFile);
    }
    return selectedCityId !== null;
  }, [title, body, target, parsedPhones.length, excelFile, selectedCityId]);

  useEffect(() => {
    let canceled = false;
    const loadCities = async () => {
      setCitiesLoading(true);
      try {
        const data = await pushDispatchApi.listCities();
        if (canceled) {
          return;
        }
        setCities(data);
        if (selectedCityId !== null && !data.some((city) => city.id === selectedCityId)) {
          setSelectedCityId(null);
        }
      } catch (err) {
        if (!canceled) {
          setError(err instanceof Error ? err.message : "Не удалось загрузить список городов");
        }
      } finally {
        if (!canceled) {
          setCitiesLoading(false);
        }
      }
    };

    void loadCities();
    return () => {
      canceled = true;
    };
  }, [selectedCityId]);

  useEffect(() => {
    if (target !== "city" && showCityConfirmModal) {
      setShowCityConfirmModal(false);
    }
  }, [target, showCityConfirmModal]);

  const submit = async () => {
    setSending(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await pushDispatchApi.sendPush({
        target,
        title: title.trim(),
        body: body.trim(),
        titleKz: titleKz.trim(),
        bodyKz: bodyKz.trim(),
        phoneNumbers: target === "phones" ? parsedPhones : undefined,
        excelFile: target === "phones" ? excelFile : null,
        cityId: target === "city" ? selectedCityId || undefined : undefined,
        notificationType: "default",
      });

      if (target === "phones") {
        const sentCount = response.recipients_count ?? parsedPhones.length;
        setSuccess(`Push принят в обработку по ${sentCount} номерам.`);
        setPhonesText("");
        setExcelFile(null);
        if (excelInputRef.current) {
          excelInputRef.current.value = "";
        }
      } else {
        const cityName = selectedCityName || "выбранный город";
        setSuccess(`Push принят в обработку по городу: ${cityName}.`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось отправить push");
    } finally {
      setSending(false);
    }
  };

  const handleSendClick = () => {
    if (target === "city") {
      setShowCityConfirmModal(true);
      return;
    }
    void submit();
  };

  if (!ready || !authenticated) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#edf1f8]">
        <p className="text-sm text-slate-600">Проверка доступа...</p>
      </main>
    );
  }

  if (!hasPageAccess) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#edf1f8] px-4">
        <p className="text-sm text-slate-600">У вас нет доступа к этому разделу.</p>
      </main>
    );
  }

  return (
    <AppShell
      title="Отправка пушей"
      subtitle="Массовая отправка push-уведомлений по номерам или городу"
      fullName={profile.full_name}
      positionName={profile.position?.name || ""}
      allowedPages={allowedPages}
      onLogout={logout}
    >
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Новая push-рассылка</h2>
        <p className="mt-1 text-sm text-slate-500">Заполните текст сообщения и выберите способ отправки: по списку номеров или по городу.</p>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Заголовок (RU)</span>
            <input
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              placeholder="Например: Не забудьте про ваш приз"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Заголовок (KZ)</span>
            <input
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              placeholder="Мысалы: Сыйлығыңызды ұмытпаңыз"
              value={titleKz}
              onChange={(event) => setTitleKz(event.target.value)}
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Текст (RU)</span>
            <textarea
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              rows={4}
              placeholder="Текст уведомления на русском"
              value={body}
              onChange={(event) => setBody(event.target.value)}
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Текст (KZ)</span>
            <textarea
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              rows={4}
              placeholder="Хабарлама мәтіні қазақ тілінде"
              value={bodyKz}
              onChange={(event) => setBodyKz(event.target.value)}
            />
          </label>
        </div>

        <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <span className="mb-2 block text-sm font-medium text-slate-700">Кому отправлять</span>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setTarget("phones")}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                target === "phones" ? "bg-indigo-600 text-white" : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
              }`}
            >
              По списку номеров
            </button>
            <button
              type="button"
              onClick={() => setTarget("city")}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                target === "city" ? "bg-indigo-600 text-white" : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
              }`}
            >
              По городу
            </button>
          </div>

          {target === "phones" ? (
            <div className="mt-4 space-y-3">
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">Телефоны (по одному в строке, можно через запятую)</span>
                <textarea
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                  rows={6}
                  placeholder={"77071234567\n77075554433"}
                  value={phonesText}
                  onChange={(event) => setPhonesText(event.target.value)}
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">Или загрузите Excel с номерами</span>
                <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm">
                  <input
                    ref={excelInputRef}
                    id="push-dispatch-excel"
                    type="file"
                    accept=".xlsx,.xlsm,.xltx,.xltm"
                    className="hidden"
                    onChange={(event) => setExcelFile(event.target.files?.[0] || null)}
                  />
                  <label
                    htmlFor="push-dispatch-excel"
                    className="cursor-pointer rounded-md border border-slate-300 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
                  >
                    Выбрать Excel
                  </label>
                  <span className="max-w-[260px] truncate text-slate-600">{excelFile ? excelFile.name : "Файл не выбран"}</span>
                  {excelFile ? (
                    <button
                      type="button"
                      onClick={() => {
                        setExcelFile(null);
                        if (excelInputRef.current) {
                          excelInputRef.current.value = "";
                        }
                      }}
                      className="rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-700 hover:bg-slate-100"
                    >
                      Очистить
                    </button>
                  ) : null}
                </div>
              </label>

              <span className="block text-xs text-slate-500">
                К отправке подготовлено номеров из текста: {parsedPhones.length}
                {excelFile ? " (плюс номера из Excel)" : ""}
              </span>
            </div>
          ) : (
            <label className="mt-4 block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Выберите город</span>
              <select
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                value={selectedCityId ?? ""}
                onChange={(event) => {
                  const raw = event.target.value;
                  setSelectedCityId(raw ? Number(raw) : null);
                }}
              >
                <option value="">Выберите город</option>
                {cities.map((city) => (
                  <option key={city.id} value={city.id}>
                    {city.name_ru || city.name_kz}
                  </option>
                ))}
              </select>
              <span className="mt-1 block text-xs text-slate-500">{citiesLoading ? "Загрузка городов..." : `Доступно городов: ${cities.length}`}</span>
            </label>
          )}
        </div>

        {error ? <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
        {success ? <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</p> : null}

        <div className="mt-5">
          <button
            type="button"
            disabled={!canSubmit || sending}
            onClick={handleSendClick}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {sending ? "Отправка..." : "Отправить push"}
          </button>
        </div>
      </section>

      {showCityConfirmModal && target === "city" ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-5 shadow-xl">
            <h3 className="text-base font-semibold text-slate-900">Подтверждение отправки</h3>
            <p className="mt-2 text-sm text-slate-600">
              Вы уверены, что хотите отправить уведомление в город
              <span className="font-semibold text-slate-900"> {selectedCityName || "не выбран"}</span>?
            </p>

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCityConfirmModal(false)}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100"
                disabled={sending}
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCityConfirmModal(false);
                  void submit();
                }}
                className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
                disabled={sending}
              >
                Подтвердить
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}
