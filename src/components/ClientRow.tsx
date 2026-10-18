import type { Client } from "../data/mockClients.ts";
import { formatDaysAgo, formatKg, initials } from "../domain/format.ts";
import { getClientStatus } from "../domain/status.ts";
import { StatusPill } from "./StatusPill.tsx";

export function ClientRow({ client, onOpen }: { client: Client; onOpen: (id: string) => void }) {
  const status = getClientStatus(client);
  return (
    <li className="list__item">
      <button type="button" className="row" onClick={() => onOpen(client.id)}>
        <span className="avatar" aria-hidden="true">
          {initials(client.name)}
        </span>
        <span className="row__main">
          <span className="row__name">{client.name}</span>
          <span className="row__sub">
            {client.mainLift.name} {formatKg(client.mainLift.kg)}
          </span>
        </span>
        <span className="row__side">
          <StatusPill status={status} missedSessions={client.missedSessions} />
          <span className="row__sub">{formatDaysAgo(client.daysSinceLastLog)}</span>
        </span>
      </button>
    </li>
  );
}
