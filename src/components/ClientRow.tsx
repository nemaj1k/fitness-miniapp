import type { Client } from "../data/mockClients.ts";
import { formatDaysAgoShort, formatNumber } from "../domain/format.ts";
import { Barbell } from "./Barbell.tsx";

export function ClientRow({ client, onOpen }: { client: Client; onOpen: (id: string) => void }) {
  const missed = client.missedSessions > 0 ? `, пропусков: ${client.missedSessions}` : "";
  return (
    <li className="list__item">
      <button type="button" className="row" onClick={() => onOpen(client.id)}>
        <span className="row__name">{client.name}</span>
        <span className="row__weight">
          <span className="row__kg">
            {formatNumber(client.mainLift.kg)}
            <small>кг {client.mainLift.name.toLowerCase()}</small>
          </span>
          <Barbell kg={client.mainLift.kg} />
        </span>
        <span className="row__meta">
          {formatDaysAgoShort(client.daysSinceLastLog)}
          {missed}
        </span>
      </button>
    </li>
  );
}
