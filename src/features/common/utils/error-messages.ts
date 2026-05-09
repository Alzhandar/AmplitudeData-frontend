/**
 * Maps backend error codes (stored in error_message / error_log fields)
 * to Russian user-facing messages.
 *
 * All error codes are snake_case strings produced by the backend service layer.
 * The backend never sends raw English sentences to clients anymore.
 */
export const ERROR_MESSAGE_MAP: Record<string, string> = {
  // Phone validation
  phone_empty: "Телефон не указан",
  invalid_phone_format: "Неверный формат телефона",
  duplicate_phone: "Дублирующийся номер",
  coupon_code_empty: "Код купона не указан",

  // Guest lookup
  guest_not_found: "Гость не найден",

  // Coupon dispatch API errors
  assign_api_error: "Ошибка сервиса рассылки купонов",
  coupon_not_assigned: "Купон не был назначен",
  mobile_api_error: "Ошибка мобильного API",

  // Bonus transaction errors
  processing_error: "Ошибка при обработке",

  // Job-level fatal errors
  unhandled_exception: "Непредвиденная ошибка при выполнении задачи",
};

/**
 * Translates a backend error code to a Russian message.
 * Falls back to the original value if the code is not found in the map,
 * so unknown codes are still visible instead of silently swallowed.
 */
export function translateErrorMessage(code: string | null | undefined): string {
  if (!code) return "—";
  return ERROR_MESSAGE_MAP[code] ?? code;
}
