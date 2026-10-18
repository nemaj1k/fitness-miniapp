import { useMemo, useState } from "react";
import { ClientRow } from "./components/ClientRow.tsx";
import { NudgeBanner } from "./components/NudgeBanner.tsx";
import { MOCK_CLIENTS } from "./data/mockClients.ts";
import { compareByAttention, getClientStatus, needsNudge, type ClientStatus } from "./domain/status.ts";

type Filter = "all" | ClientStatus;

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "Все" },
  { id: "active", label: "Активны" },
  { id: "warning", label: "Пропуски" },
  { id: "risk", label: "Риск" },
];

export function App() {
  const [filter, setFilter] = useState<Filter>("all");

  const sorted = useMemo(() => [...MOCK_CLIENTS].sort(compareByAttention), []);
  const nudges = useMemo(() => sorted.filter(needsNudge), [sorted]);

  const counts = useMemo(() => {
    const c: Record<Filter, number> = { all: sorted.length, active: 0, warning: 0, risk: 0 };
    for (const client of sorted) c[getClientStatus(client)] += 1;
    return c;
  }, [sorted]);

  const visible = filter === "all" ? sorted : sorted.filter((c) => getClientStatus(c) === filter);

  return (
    <main className="screen">
      <header className="topbar">
        <span className="brand">Logbook Coach</span>
        <span className="mono muted">тренер</span>
      </header>

      <h1 className="title">Клиенты</h1>

      <div className="filters" role="group" aria-label="Фильтр по статусу">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            className="chip"
            aria-pressed={filter === f.id}
            onClick={() => setFilter(f.id)}
          >
            {f.label} <span className="mono">{counts[f.id]}</span>
          </button>
        ))}
      </div>

      <NudgeBanner clients={nudges} />

      <p className="caption mono muted">Сначала те, кому нужно внимание</p>
      <ul className="list">
        {visible.map((client) => (
          <ClientRow key={client.id} client={client} />
        ))}
      </ul>
    </main>
  );
}
