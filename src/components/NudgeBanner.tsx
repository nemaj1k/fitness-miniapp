import type { Client } from "../data/mockClients.ts";
import { plural, shortName } from "../domain/format.ts";

/** Красный флаг: кому из клиентов тренеру пора написать. */
export function NudgeBanner({ clients }: { clients: Client[] }) {
  if (clients.length === 0) return null;
  return (
    <section className="nudge" aria-label="Кому написать">
      <div className="nudge__head">
        <span>Кому написать</span>
        <span className="mono">{clients.length}</span>
      </div>
      <ul className="nudge__list">
        {clients.map((c) => (
          <li key={c.id} className="nudge__item">
            <b>{shortName(c.name)}</b> нет записей {c.daysSinceLastLog}{" "}
            {plural(c.daysSinceLastLog, "день", "дня", "дней")}
          </li>
        ))}
      </ul>
    </section>
  );
}
