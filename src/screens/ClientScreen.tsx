import { LiftChart } from "../components/LiftChart.tsx";
import { NudgeCard } from "../components/NudgeCard.tsx";
import { StatsStrip } from "../components/StatsStrip.tsx";
import { StatusPill } from "../components/StatusPill.tsx";
import { WorkoutCard } from "../components/WorkoutCard.tsx";
import type { Client } from "../data/mockClients.ts";
import { initials } from "../domain/format.ts";
import { getClientStatus, needsNudge } from "../domain/status.ts";

interface Props {
  client: Client;
  today: string;
  /** Ссылка «‹ Клиенты» в шапке — только вне Telegram; в Telegram назад ведёт нативная кнопка */
  onBack: (() => void) | null;
}

/** Карточка клиента по макету project/Client.dc.html. */
export function ClientScreen({ client, today, onBack }: Props) {
  return (
    <main className="screen">
      <header className="topbar">
        {onBack ? (
          <button type="button" className="back" onClick={onBack}>
            <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
              <path d="M12.5 4.5L7 10l5.5 5.5" />
            </svg>
            Клиенты
          </button>
        ) : (
          <span />
        )}
        <span className="mono muted">тренер</span>
      </header>

      <div className="profile">
        <span className="avatar avatar--large" aria-hidden="true">
          {initials(client.name)}
        </span>
        <div className="profile__main">
          <h1 className="profile__name">{client.name}</h1>
          <StatusPill status={getClientStatus(client)} missedSessions={client.missedSessions} />
        </div>
      </div>

      {needsNudge(client) && <NudgeCard client={client} today={today} />}
      <StatsStrip client={client} />
      <LiftChart client={client} />

      <p className="caption caption--section mono muted">Последние тренировки</p>
      <div className="workouts">
        {client.workouts.slice(0, 3).map((w) => (
          <WorkoutCard key={w.date} workout={w} today={today} />
        ))}
      </div>
    </main>
  );
}
