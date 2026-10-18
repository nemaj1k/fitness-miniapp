// Минимальные типы для window.Telegram.WebApp (скрипт подключён в index.html).
// Когда понадобится больше методов, добавим их сюда по мере использования.
interface TelegramWebApp {
  ready(): void;
  expand(): void;
  colorScheme: "light" | "dark";
}

interface Window {
  Telegram?: { WebApp?: TelegramWebApp };
}
