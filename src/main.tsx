import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App.tsx";
import { initTheme } from "./telegram/theme.ts";
import { getWebApp } from "./telegram/webApp.ts";
import "./styles.css";

// Вне Telegram (обычный браузер при разработке) getWebApp() вернёт undefined — это нормально.
const tg = getWebApp();
tg?.ready();
tg?.expand();
initTheme();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
