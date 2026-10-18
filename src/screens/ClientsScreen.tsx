import { useMemo } from "react";
import { ClientRow } from "../components/ClientRow.tsx";
import { NudgeBanner } from "../components/NudgeBanner.tsx";
import type { Client } from "../data/mockClients.ts";
import { formatHeaderDate, plural } from "../domain/format.ts";
import { compareByAttention, getClientStatus, needsNudge, type ClientStatus } from "../domain/status.ts";

const GROUPS: { status: ClientStatus; title: string }[] = [
  { status: "risk", title: "Риск ухода" },
  { status: "warning", title: "Пропускают" },
  { status: "active", title: "В графике" },
];

interface Props {
  clients: Client[];
  today: string;
  onOpen: (id: string) => void;
}

/** Список клиентов, сгруппированный по статусу: сверху те, кому нужно внимание. */
export function ClientsScreen({ clients, today, onOpen }: Props) {
  const sorted = useMemo(() => [...clients].sort(compareByAttention), [clients]);
  const nudges = useMemo(() => sorted.filter(needsNudge), [sorted]);

  return (
    <>
      <div className="head">
        <h1 className="head__title">Клиенты</h1>
        <p className="head__meta">
          {formatHeaderDate(today)}
          <br />
          {clients.length} {plural(clients.length, "человек", "человека", "человек")}
        </p>
      </div>

      <NudgeBanner clients={nudges} onOpen={onOpen} />

      {GROUPS.map(({ status, title }) => {
        const rows = sorted.filter((c) => getClientStatus(c) === status);
        if (rows.length === 0) return null;
        return (
          <section key={status} aria-label={title}>
            <h2 className="group">
              {title} <span>{rows.length}</span>
            </h2>
            <ul className="list">
              {rows.map((client) => (
                <ClientRow key={client.id} client={client} onOpen={onOpen} />
              ))}
            </ul>
          </section>
        );
      })}
    </>
  );
}
