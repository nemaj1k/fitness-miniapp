import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { MOCK_CLIENTS, MOCK_TODAY } from "./data/mockClients.ts";
import { ClientScreen } from "./screens/ClientScreen.tsx";
import { ClientsScreen, type Filter } from "./screens/ClientsScreen.tsx";
import { useBackButton } from "./telegram/useBackButton.ts";
import { hapticSelection, isInTelegram } from "./telegram/webApp.ts";

// Два экрана без роутера: список и карточка. Назад в Telegram — нативная кнопка в шапке.
export function App() {
  const [filter, setFilter] = useState<Filter>("all");
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
  return <ClientsScreen clients={MOCK_CLIENTS} filter={filter} onFilter={setFilter} onOpen={open} />;
}
