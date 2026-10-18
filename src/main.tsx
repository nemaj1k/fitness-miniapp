import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App.tsx";
import "./styles.css";

// Вне Telegram (обычный браузер при разработке) объекта WebApp нет — это нормально.
const tg = window.Telegram?.WebApp;
tg?.ready();
tg?.expand();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
