import { useEffect } from "react";
import { getWebApp, supports } from "./webApp.ts";

/** Нативная кнопка «Назад» в шапке Telegram, пока onBack задан. Вне Telegram ничего не делает. */
export function useBackButton(onBack: (() => void) | null): void {
  useEffect(() => {
    if (!onBack || !supports("6.1")) return;
    const button = getWebApp()!.BackButton;
    button.onClick(onBack);
    button.show();
    return () => {
      button.offClick(onBack);
      button.hide();
    };
  }, [onBack]);
}
