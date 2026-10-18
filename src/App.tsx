import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { loadDone, loadImportedAthletes, saveDone, saveImportedAthletes, type Athlete, type DoneMap } from "./data/athletes.ts";
import { MOCK_ATHLETES } from "./data/mockAthletes.ts";
import { MOCK_CLIENTS, MOCK_TODAY } from "./data/mockClients.ts";
import { AthleteScreen } from "./screens/AthleteScreen.tsx";
import { AthletesScreen } from "./screens/AthletesScreen.tsx";
import { ClientScreen } from "./screens/ClientScreen.tsx";
import { ClientsScreen } from "./screens/ClientsScreen.tsx";
import { useBackButton } from "./telegram/useBackButton.ts";
import { hapticSelection, isInTelegram } from "./telegram/webApp.ts";

type Section = "clients" | "athletes";
type Opened = { kind: "client" | "athlete"; id: string } | null;

const SECTIONS: { id: Section; label: string }[] = [
  { id: "clients", label: "Клиенты" },
  { id: "athletes", label: "Спортсмены" },
];

/** ?client=c3 или ?athlete=a1 сразу открывает карточку — для предпросмотра и ссылок. */
function openedFromUrl(): Opened {
  const params = new URLSearchParams(location.search);
  const client = params.get("client");
  const athlete = params.get("athlete");
  if (client) return { kind: "client", id: client };
  if (athlete) return { kind: "athlete", id: athlete };
  return null;
}

// Без роутера: вкладки «Клиенты / Спортсмены» и карточка поверх них.
// Назад из карточки в Telegram — нативная кнопка в шапке.
export function App() {
  const [opened, setOpened] = useState<Opened>(openedFromUrl);
  const [section, setSection] = useState<Section>(() =>
    opened?.kind === "athlete" || new URLSearchParams(location.search).get("tab") === "athletes" ? "athletes" : "clients",
  );
  const [imported, setImported] = useState<Athlete[]>(loadImportedAthletes);
  const [done, setDone] = useState<DoneMap>(loadDone);
  const listScroll = useRef(0);
  const athletes = [...imported, ...MOCK_ATHLETES];

  const open = useCallback((kind: "client" | "athlete", id: string) => {
    hapticSelection();
    listScroll.current = window.scrollY;
    setOpened({ kind, id });
  }, []);
  const openClient = useCallback((id: string) => open("client", id), [open]);
  const openAthlete = useCallback((id: string) => open("athlete", id), [open]);
  const back = useCallback(() => setOpened(null), []);

  const toggleSet = useCallback((key: string) => {
    hapticSelection();
    setDone((prev) => {
      const next = { ...prev };
      if (next[key]) delete next[key];
      else next[key] = true;
      saveDone(next);
      return next;
    });
  }, []);

  function addAthlete(athlete: Athlete) {
    const next = [athlete, ...imported];
    setImported(next);
    saveImportedAthletes(next);
    setOpened({ kind: "athlete", id: athlete.id });
  }

  function deleteAthlete(id: string) {
    const next = imported.filter((a) => a.id !== id);
    setImported(next);
    saveImportedAthletes(next);
    setOpened(null);
  }

  // Карточка открывается сверху, список — там, где тренер его оставил
  useLayoutEffect(() => {
    window.scrollTo(0, opened ? 0 : listScroll.current);
  }, [opened]);

  const client = opened?.kind === "client" ? MOCK_CLIENTS.find((c) => c.id === opened.id) : undefined;
  const athlete = opened?.kind === "athlete" ? athletes.find((a) => a.id === opened.id) : undefined;
  useBackButton(client || athlete ? back : null);
  const browserBack = isInTelegram() ? null : back;

  if (client) return <ClientScreen client={client} today={MOCK_TODAY} onBack={browserBack} />;
  if (athlete) {
    return (
      <AthleteScreen
        key={athlete.id}
        athlete={athlete}
        today={MOCK_TODAY}
        done={done}
        onToggle={toggleSet}
        onDelete={deleteAthlete}
        onBack={browserBack}
      />
    );
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
      {section === "clients" ? (
        <ClientsScreen clients={MOCK_CLIENTS} today={MOCK_TODAY} onOpen={openClient} />
      ) : (
        <AthletesScreen athletes={athletes} today={MOCK_TODAY} onOpen={openAthlete} onImported={addAthlete} />
      )}
    </main>
  );
}
