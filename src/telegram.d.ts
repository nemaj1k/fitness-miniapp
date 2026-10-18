// Минимальные типы для window.Telegram.WebApp (скрипт подключён в index.html).
// Когда понадобится больше методов, добавим их сюда по мере использования.
// Методы новее 6.0 вызывать только после проверки supports() из src/telegram/webApp.ts.
interface TelegramBackButton {
  show(): void;
  hide(): void;
  onClick(cb: () => void): void;
  offClick(cb: () => void): void;
}

interface TelegramWebApp {
  ready(): void;
  expand(): void;
  /** «unknown» — страница открыта не в Telegram, а в обычном браузере */
  platform: string;
  version: string;
  colorScheme: "light" | "dark";
  isVersionAtLeast(version: string): boolean;
  onEvent(event: "themeChanged", cb: () => void): void;
  offEvent(event: "themeChanged", cb: () => void): void;
  /** С 6.9 принимает цвет в формате #RRGGBB */
  setHeaderColor(color: string): void;
  setBackgroundColor(color: string): void;
  openTelegramLink(url: string): void;
  BackButton: TelegramBackButton;
  HapticFeedback: { selectionChanged(): void };
}

interface Window {
  Telegram?: { WebApp?: TelegramWebApp };
}
