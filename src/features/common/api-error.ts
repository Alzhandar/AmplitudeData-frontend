type ApiErrorPayload = Record<string, unknown>;

const TECHNICAL_MESSAGE_RE = /traceback|exception|stack|sql|internal server error|request failed with status|<!doctype|<html|syntaxerror|typeerror|referenceerror/i;

function normalizeMessage(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function extractMessageFromValue(value: unknown): string | null {
  if (typeof value === "string") {
    const normalized = normalizeMessage(value);
    return normalized || null;
  }

  if (Array.isArray(value)) {
    const items = value
      .map((item) => (typeof item === "string" ? normalizeMessage(item) : ""))
      .filter(Boolean);

    if (items.length > 0) {
      return items.join(", ");
    }
  }

  return null;
}

function extractPayloadMessage(payload: ApiErrorPayload): string | null {
  const preferredKeys = ["detail", "message", "non_field_errors", "error"];

  for (const key of preferredKeys) {
    const message = extractMessageFromValue(payload[key]);
    if (message) {
      return message;
    }
  }

  for (const value of Object.values(payload)) {
    const message = extractMessageFromValue(value);
    if (message) {
      return message;
    }
  }

  return null;
}

function defaultStatusMessage(status: number): string {
  if (status === 400) return "Проверьте заполнение полей и попробуйте снова.";
  if (status === 401) return "Сессия истекла. Войдите снова.";
  if (status === 403) return "Недостаточно прав для этого действия.";
  if (status === 404) return "Запрошенные данные не найдены.";
  if (status === 408 || status === 504) return "Сервер отвечает слишком долго. Попробуйте еще раз.";
  if (status === 409) return "Конфликт данных. Обновите страницу и повторите действие.";
  if (status === 422) return "Некорректные данные. Проверьте поля и попробуйте снова.";
  if (status === 429) return "Слишком много запросов. Попробуйте немного позже.";
  if (status >= 500) return "Сервис временно недоступен. Попробуйте позже.";
  return "Не удалось выполнить запрос. Попробуйте еще раз.";
}

function isTechnicalMessage(message: string): boolean {
  if (!message) {
    return true;
  }

  return TECHNICAL_MESSAGE_RE.test(message) || message.length > 220;
}

function buildUserMessage(status: number, candidate: string | null): string {
  const fallback = defaultStatusMessage(status);

  if (!candidate) {
    return fallback;
  }

  if (status >= 500) {
    return fallback;
  }

  if (status === 401 || status === 403) {
    return fallback;
  }

  return isTechnicalMessage(candidate) ? fallback : candidate;
}

export async function parseApiErrorMessage(response: Response): Promise<string> {
  const raw = await response.text();
  let candidate: string | null = null;

  try {
    const parsed = JSON.parse(raw) as ApiErrorPayload;
    candidate = extractPayloadMessage(parsed);
  } catch {
    candidate = extractMessageFromValue(raw);
  }

  return buildUserMessage(response.status, candidate);
}

export function getNetworkErrorMessage(error: unknown): string {
  if (error instanceof DOMException && error.name === "AbortError") {
    return "Превышено время ожидания ответа. Попробуйте еще раз.";
  }

  if (error instanceof TypeError) {
    return "Нет соединения с сервером. Проверьте интернет и повторите попытку.";
  }

  return "Не удалось выполнить запрос. Попробуйте еще раз.";
}
