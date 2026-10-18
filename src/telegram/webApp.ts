// Доступ к Telegram.WebApp. Скрипт Telegram создаёт объект и в обычном браузере,
// но с platform = "unknown", поэтому «мы в Telegram» проверяем по платформе.

export function getWebApp(): TelegramWebApp | undefined {
  const tg = window.Telegram?.WebApp;
  return tg && tg.platform !== "unknown" ? tg : undefined;
}

export function isInTelegram(): boolean {
  return getWebApp() !== undefined;
}

/** Есть ли метод в этой версии клиента: старые клиенты Telegram не знают новых методов. */
export function supports(version: string): boolean {
  return getWebApp()?.isVersionAtLeast(version) ?? false;
}

/** Лёгкий отклик вибрацией при выборе. */
export function hapticSelection(): void {
  if (supports("6.1")) getWebApp()!.HapticFeedback.selectionChanged();
}
