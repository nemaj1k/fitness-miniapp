import { getWebApp, supports } from "./webApp.ts";

// Тема ставится атрибутом data-theme на <html>, CSS смотрит только на него.
// В Telegram источник — тема Telegram, а не системная: они могут не совпадать.
// В браузере — ?theme=light|dark (для страницы предпросмотра), иначе системная тема.

function apply(theme: "light" | "dark"): void {
  document.documentElement.dataset.theme = theme;
  const tg = getWebApp();
  if (tg && supports("6.9")) {
    // Шапка и фон Telegram в цвет приложения
    const bg = getComputedStyle(document.documentElement).getPropertyValue("--bg").trim();
    tg.setHeaderColor(bg);
    tg.setBackgroundColor(bg);
  }
}

export function initTheme(): void {
  const tg = getWebApp();
  if (tg) {
    apply(tg.colorScheme);
    tg.onEvent("themeChanged", () => apply(tg.colorScheme));
    return;
  }
  const forced = new URLSearchParams(location.search).get("theme");
  if (forced === "light" || forced === "dark") {
    apply(forced);
    return;
  }
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  apply(media.matches ? "dark" : "light");
  media.addEventListener("change", (e) => apply(e.matches ? "dark" : "light"));
}
