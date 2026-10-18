import { formatNumber } from "../domain/format.ts";
import { DISCIPLINES, percentOf, type DisciplineId, type Sport } from "../domain/program.ts";

interface Props {
  sport: Sport;
  maxes: Partial<Record<DisciplineId, number>>;
  percents: number[];
}

/** Таблица процентов от максимума — как справа в таблице тренера. Свёрнута, чтобы не мешать плану. */
export function PercentTable({ sport, maxes, percents }: Props) {
  const cols = DISCIPLINES.filter((d) => d.sport === sport && maxes[d.id] !== undefined);
  if (cols.length === 0 || percents.length === 0) return null;
  return (
    <details className="card percents">
      <summary className="card__title">Проценты от максимума</summary>
      <table>
        <thead>
          <tr>
            <th scope="col">%</th>
            {cols.map((d) => (
              <th key={d.id} scope="col">
                {d.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {percents.map((p) => (
            <tr key={p}>
              <th scope="row">{p}</th>
              {cols.map((d) => (
                <td key={d.id}>{formatNumber(percentOf(maxes[d.id]!, p))}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  );
}
