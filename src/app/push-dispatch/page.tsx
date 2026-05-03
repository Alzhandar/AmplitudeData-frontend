"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { AppShell } from "@/features/navigation/components/app-shell";
import { useAuthGuard } from "@/features/auth/use-auth-guard";
import { pushDispatchApi } from "@/features/push-dispatch/api";
import { NotificationCityOption, PushTarget } from "@/features/push-dispatch/types";
import { CityPicker } from "@/features/push-dispatch/components/CityPicker";
import { AuthLoadingScreen } from "@/features/common/components/AuthLoadingScreen";
import { Button } from "@/features/common/components/ui/Button";
import { Modal, ModalCancelButton } from "@/features/common/components/ui/Modal";
import { useToast } from "@/features/common/components/ui/Toast";

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
  if (digits.length === 11 && digits.startsWith("8")) return `7${digits.slice(1)}`;
  if (digits.length === 11 && digits.startsWith("7")) return digits;
  return "";
}

function parsePhones(text: string): string[] {
  const rows = text.replace(/\r/g, "\n").replace(/[;,]/g, "\n").split("\n");
  const unique = new Set<string>();
  const result: string[] = [];

  for (const row of rows) {
    const trimmed = row.trim();
    if (!trimmed || isPhoneHeaderLabel(trimmed)) continue;
    const normalized = normalizePhone(trimmed);
    if (!normalized || unique.has(normalized)) continue;
    unique.add(normalized);
    result.push(normalized);
  }

  return result;
}

export default function PushDispatchPage() {
  const { ready, authenticated, hasPageAccess, profile, allowedPages, logout } = useAuthGuard("push-dispatch");
  const { addToast } = useToast();

  const [target, setTarget] = useState<PushTarget>("phones");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [titleKz, setTitleKz] = useState("");
  const [bodyKz, setBodyKz] = useState("");
  const [phonesText, setPhonesText] = useState("");
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [cities, setCities] = useState<NotificationCityOption[]>([]);
  const [selectedCityId, setSelectedCityId] = useState<number | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [citiesLoading, setCitiesLoading] = useState(false);
  const [citiesError, setCitiesError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const excelInputRef = useRef<HTMLInputElement | null>(null);

  const parsedPhones = useMemo(() => parsePhones(phonesText), [phonesText]);
  const selectedCity = useMemo(() => cities.find((c) => c.id === selectedCityId) ?? null, [cities, selectedCityId]);
  const selectedCityName = useMemo(
    () => selectedCity?.name_ru || selectedCity?.name_kz || "Выбранный город",
    [selectedCity],
  );

  const canSubmit = useMemo(() => {
    if (!title.trim() || !body.trim()) return false;
    if (target === "phones") return parsedPhones.length > 0 || Boolean(excelFile);
    return selectedCityId !== null;
  }, [title, body, target, parsedPhones.length, excelFile, selectedCityId]);

  useEffect(() => {
    let canceled = false;
    const loadCities = async () => {
      setCitiesLoading(true);
      setCitiesError(null);
      try {
        const data = await pushDispatchApi.listCities();
        if (canceled) return;
        setCities(data);
        if (selectedCityId !== null && !data.some((c) => c.id === selectedCityId)) {
          setSelectedCityId(null);
        }
      } catch (err) {
        if (!canceled) {
          setCitiesError(err instanceof Error ? err.message : "Не удалось загрузить список городов");
        }
      } finally {
        if (!canceled) setCitiesLoading(false);
      }
    };

    void loadCities();
    return () => { canceled = true; };
  // Only run once on mount — selectedCityId intentionally excluded
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (target !== "city" && showConfirmModal) setShowConfirmModal(false);
  }, [target, showConfirmModal]);

  const submit = async () => {
    setSending(true);
    setSendError(null);
    try {
      const response = await pushDispatchApi.sendPush({
        target,
        title: title.trim(),
        body: body.trim(),
        titleKz: titleKz.trim(),
        bodyKz: bodyKz.trim(),
        phoneNumbers: target === "phones" ? parsedPhones : undefined,
        excelFile: target === "phones" ? excelFile : null,
        cityId: target === "city" ? selectedCityId ?? undefined : undefined,
        notificationType: "default",
      });

      if (target === "phones") {
        const sentCount = response.recipients_count ?? parsedPhones.length;
        addToast("success", `Push принят в обработку по ${sentCount} номерам.`);
        setPhonesText("");
        setExcelFile(null);
        if (excelInputRef.current) excelInputRef.current.value = "";
      } else {
        addToast("success", `Push принят в обработку по городу: ${selectedCityName}.`);
      }
    } catch (err) {
      setSendError(err instanceof Error ? err.message : "Не удалось отправить push");
    } finally {
      setSending(false);
    }
  };

  const handleSendClick = () => {
    if (target === "city") {
      setShowConfirmModal(true);
      return;
    }
    void submit();
  };

  if (!ready || !authenticated) return <AuthLoadingScreen />;
  if (!hasPageAccess) return <AuthLoadingScreen message="У вас нет доступа к этому разделу." />;

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
        <p className="mt-1 text-sm text-slate-500">
          Заполните текст сообщения и выберите способ отправки: по списку номеров или по городу.
        </p>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Заголовок (RU)</span>
            <input
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
              placeholder="Например: Не забудьте про ваш приз"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Заголовок (KZ)</span>
            <input
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
              placeholder="Мысалы: Сыйлығыңызды ұмытпаңыз"
              value={titleKz}
              onChange={(e) => setTitleKz(e.target.value)}
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Текст (RU)</span>
            <textarea
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
              rows={4}
              placeholder="Текст уведомления на русском"
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Текст (KZ)</span>
            <textarea
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
              rows={4}
              placeholder="Хабарлама мәтіні қазақ тілінде"
              value={bodyKz}
              onChange={(e) => setBodyKz(e.target.value)}
            />
          </label>
        </div>

        {/* Target selector */}
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
                <span className="mb-1 block text-sm font-medium text-slate-700">
                  Телефоны (по одному в строке, можно через запятую)
                </span>
                <textarea
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                  rows={6}
                  placeholder={"77071234567\n77075554433"}
                  value={phonesText}
                  onChange={(e) => setPhonesText(e.target.value)}
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">
                  Или загрузите Excel с номерами
                </span>
                <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm">
                  <input
                    ref={excelInputRef}
                    id="push-dispatch-excel"
                    type="file"
                    accept=".xlsx,.xlsm,.xltx,.xltm"
                    className="hidden"
                    onChange={(e) => setExcelFile(e.target.files?.[0] || null)}
                  />
                  <label
                    htmlFor="push-dispatch-excel"
                    className="cursor-pointer rounded-md border border-slate-300 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
                  >
                    Выбрать Excel
                  </label>
                  <span className="max-w-[260px] truncate text-slate-600">
                    {excelFile ? excelFile.name : "Файл не выбран"}
                  </span>
                  {excelFile && (
                    <button
                      type="button"
                      onClick={() => {
                        setExcelFile(null);
                        if (excelInputRef.current) excelInputRef.current.value = "";
                      }}
                      className="rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-700 hover:bg-slate-100"
                    >
                      Очистить
                    </button>
                  )}
                </div>
              </label>

              <span className="block text-xs text-slate-500">
                К отправке подготовлено номеров из текста: {parsedPhones.length}
                {excelFile ? " (плюс номера из Excel)" : ""}
              </span>
            </div>
          ) : (
              <div className="mt-4">
              {citiesError ? (
                <p className="mb-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800" role="alert">
                  {citiesError}
                </p>
              ) : null}
              <div className="block">
                <span className="mb-1.5 block text-sm font-medium text-slate-700">Выберите город</span>
                <CityPicker
                  cities={cities}
                  value={selectedCityId}
                  onChange={setSelectedCityId}
                  loading={citiesLoading}
                />
              </div>
            </div>
          )}
        </div>

        {sendError && (
          <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
            {sendError}
          </p>
        )}

        <div className="mt-5">
          <Button disabled={!canSubmit} loading={sending} onClick={handleSendClick}>
            Отправить push
          </Button>
        </div>
      </section>

      {/* Confirm city modal */}
      <Modal
        open={showConfirmModal && target === "city"}
        onClose={() => setShowConfirmModal(false)}
        title="Подтверждение отправки"
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <ModalCancelButton onClick={() => setShowConfirmModal(false)} disabled={sending} />
            <Button
              loading={sending}
              onClick={() => {
                setShowConfirmModal(false);
                void submit();
              }}
            >
              Подтвердить
            </Button>
          </div>
        }
      >
        <p className="text-sm text-slate-600">
          Вы уверены, что хотите отправить уведомление в город{" "}
          <span className="font-semibold text-slate-900">{selectedCityName || "не выбран"}</span>?
        </p>
      </Modal>
    </AppShell>
  );
}
