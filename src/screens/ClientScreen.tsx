import { Barbell } from "../components/Barbell.tsx";
import { LiftChart } from "../components/LiftChart.tsx";
import { NudgeCard } from "../components/NudgeCard.tsx";
import { StatsStrip } from "../components/StatsStrip.tsx";
import { StatusPill } from "../components/StatusPill.tsx";
import { WorkoutCard } from "../components/WorkoutCard.tsx";
import type { Client } from "../data/mockClients.ts";
import { formatNumber } from "../domain/format.ts";
import { getClientStatus, needsNudge } from "../domain/status.ts";

interface Props {
  client: Client;
  today: string;
  /** Ссылка «‹ Клиенты» — только вне Telegram; в Telegram назад ведёт нативная кнопка */
  onBack: (() => void) | null;
}

/** Карточка клиента по макету project/Client.dc.html в стиле «Помост». */
export function ClientScreen({ client, today, onBack }: Props) {
  return (
    <main className="screen">
      {onBack && (
        <button type="button" className="back" onClick={onBack}>
          <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
            <path d="M12.5 4.5L7 10l5.5 5.5" />
          </svg>
          Клиенты
        </button>
      )}

      <div className="profile">
        <div className="profile__main">
          <h1 className="profile__name">{client.name}</h1>
          <StatusPill status={getClientStatus(client)} missedSessions={client.missedSessions} />
        </div>
        <div className="row__weight">
          <span className="row__kg">
            {formatNumber(client.mainLift.kg)}
            <small>кг {client.mainLift.name.toLowerCase()}</small>
          </span>
          <Barbell kg={client.mainLift.kg} />
        </div>
      </div>

      {needsNudge(client) && <NudgeCard client={client} today={today} />}
      <StatsStrip client={client} />
      <LiftChart client={client} />

      <h2 className="group">Последние тренировки</h2>
      <div className="workouts">
        {client.workouts.slice(0, 3).map((w) => (
          <WorkoutCard key={w.date} workout={w} today={today} />
        ))}
      </div>
    </main>
  );
}
