import type { Client } from "../data/mockClients.ts";
import { formatDaysAgo, formatKg, initials } from "../domain/format.ts";
import { getClientStatus } from "../domain/status.ts";
import { StatusPill } from "./StatusPill.tsx";

export function ClientRow({ client }: { client: Client }) {
  const status = getClientStatus(client);
  return (
    <li className="row">
      <span className="avatar" aria-hidden="true">
        {initials(client.name)}
      </span>
      <div className="row__main">
        <div className="row__name">{client.name}</div>
        <div className="row__sub">
          {client.mainLift.name} {formatKg(client.mainLift.kg)}
        </div>
      </div>
      <div className="row__side">
        <StatusPill status={status} missedSessions={client.missedSessions} />
        <span className="row__sub">{formatDaysAgo(client.daysSinceLastLog)}</span>
      </div>
    </li>
  );
}
