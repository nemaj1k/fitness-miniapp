import type { Client } from "../data/mockClients.ts";
import { formatDaysAgoShort, rpeUsage } from "../domain/format.ts";

export function StatsStrip({ client }: { client: Client }) {
  const stats = [
    { label: "Пропуски", value: String(client.missedSessions) },
    { label: "Последняя запись", value: formatDaysAgoShort(client.daysSinceLastLog) },
    { label: "RPE", value: rpeUsage(client.workouts) },
  ];
  return (
    <dl className="stats">
      {stats.map((s) => (
        <div key={s.label} className="stats__item">
          <dt className="stats__label">{s.label}</dt>
          <dd className="stats__value">{s.value}</dd>
        </div>
      ))}
    </dl>
  );
}
