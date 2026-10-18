import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { MOCK_CLIENTS, MOCK_TODAY } from "./data/mockClients.ts";
import { AthletesScreen } from "./screens/AthletesScreen.tsx";
import { ClientScreen } from "./screens/ClientScreen.tsx";
import { ClientsScreen } from "./screens/ClientsScreen.tsx";
import { useBackButton } from "./telegram/useBackButton.ts";
import { hapticSelection, isInTelegram } from "./telegram/webApp.ts";

type Section = "clients" | "athletes";

const SECTIONS: { id: Section; label: string }[] = [
  { id: "clients", label: "Клиенты" },
  { id: "athletes", label: "Спортсмены" },
];

// Без роутера: вкладки «Клиенты / Спортсмены» и карточка клиента поверх них.
// Назад из карточки в Telegram — нативная кнопка в шапке.
export function App() {
  const [section, setSection] = useState<Section>("clients");
  // ?client=c3 сразу открывает карточку — для предпросмотра и ссылок
  const [openedId, setOpenedId] = useState<string | null>(() => new URLSearchParams(location.search).get("client"));
  const listScroll = useRef(0);

  const open = useCallback((id: string) => {
    hapticSelection();
    listScroll.current = window.scrollY;
    setOpenedId(id);
  }, []);
  const back = useCallback(() => setOpenedId(null), []);

  // Карточка открывается сверху, список — там, где тренер его оставил
  useLayoutEffect(() => {
    window.scrollTo(0, openedId ? 0 : listScroll.current);
  }, [openedId]);

  const opened = openedId ? MOCK_CLIENTS.find((c) => c.id === openedId) : undefined;
  useBackButton(opened ? back : null);

  if (opened) {
    return <ClientScreen client={opened} today={MOCK_TODAY} onBack={isInTelegram() ? null : back} />;
  }
  return (
    <main className="screen">
      <div className="tabs" role="group" aria-label="Раздел">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            type="button"
            className="tabs__item"
            aria-pressed={section === s.id}
            onClick={() => {
              hapticSelection();
              setSection(s.id);
            }}
          >
            {s.label}
          </button>
        ))}
      </div>
      {section === "clients" ? <ClientsScreen clients={MOCK_CLIENTS} today={MOCK_TODAY} onOpen={open} /> : <AthletesScreen />}
    </main>
  );
}
