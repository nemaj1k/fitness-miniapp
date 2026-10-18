import { formatKg, formatNumber } from "../domain/format.ts";
import { DISCIPLINES, rankProgress, type DisciplineId, type RankStandard, type Sport } from "../domain/program.ts";

interface Props {
  sport: Sport;
  maxes: Partial<Record<DisciplineId, number>>;
  standards: RankStandard[];
}

/** Максимумы против нормативов: шкала с отметками разрядов, где сейчас спортсмен и сколько до следующего. */
export function RankLadder({ sport, maxes, standards }: Props) {
  const rows = DISCIPLINES.filter((d) => d.sport === sport && maxes[d.id] !== undefined);
  if (rows.length === 0) return null;
  return (
    <section className="card">
      <h2 className="card__title">Максимумы и разряды</h2>
      {rows.map((d) => {
        const max = maxes[d.id]!;
        const marks = standards
          .filter((s) => s.values[d.id] !== undefined)
          .map((s) => ({ rank: s.rank, kg: s.values[d.id]! }))
          .sort((a, b) => a.kg - b.kg);
        const { achieved, next } = rankProgress(max, standards, d.id);
        // Шкала от 80 % младшего норматива до старшего с запасом — чтобы отметки не слипались
        const lo = marks.length > 0 ? Math.min(max, marks[0]!.kg) * 0.85 : 0;
        const hi = marks.length > 0 ? Math.max(max, marks[marks.length - 1]!.kg) * 1.05 : max;
        const pos = (kg: number) => `${Math.max(0, Math.min(100, ((kg - lo) / (hi - lo)) * 100))}%`;
        return (
          <div key={d.id} className="rank">
            <div className="rank__head">
              <span className="rank__name">{d.label}</span>
              <span className="row__kg">
                {formatNumber(max)}
                <small>кг</small>
              </span>
            </div>
            {marks.length > 0 && (
              <div className="rank__track" aria-hidden="true">
                <span className="rank__fill" style={{ width: pos(max) }} />
                {marks.map((m) => (
                  <span key={m.rank} className="rank__mark" style={{ left: pos(m.kg) }} data-reached={max >= m.kg}>
                    <span>{m.rank}</span>
                  </span>
                ))}
              </div>
            )}
            <div className="rank__meta">
              {achieved ? `Выполнен ${achieved}` : "Разряд пока не выполнен"}
              {next ? `, до ${next.rank} +${formatKg(next.gap)}` : marks.length > 0 ? ", все нормативы выполнены" : ""}
            </div>
          </div>
        );
      })}
    </section>
  );
}
