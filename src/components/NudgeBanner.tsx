import type { Client } from "../data/mockClients.ts";
import { shortName } from "../domain/format.ts";
import { nudgeTitle } from "../domain/nudge.ts";

/** Красный флаг на списке: кому тренеру пора написать. Имя открывает карточку с готовым сообщением. */
export function NudgeBanner({ clients, onOpen }: { clients: Client[]; onOpen: (id: string) => void }) {
  if (clients.length === 0) return null;
  return (
    <section className="alert" aria-label="Кому написать">
      <h2 className="alert__title">{nudgeTitle(clients.length)}</h2>
      <p className="alert__text">
        {clients.map((c, i) => (
          <span key={c.id}>
            {i > 0 && ", "}
            <button type="button" className="alert__name" onClick={() => onOpen(c.id)}>
              {shortName(c.name)}
            </button>{" "}
            {i === 0 ? `${c.daysSinceLastLog} дн. без записей` : c.daysSinceLastLog}
          </span>
        ))}
        .
      </p>
    </section>
  );
}
