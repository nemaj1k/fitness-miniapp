import type { Athlete } from "../data/athletes.ts";
import { daysBetween, formatDayMonth, formatNumber, formatStartCountdown } from "../domain/format.ts";
import { DISCIPLINES, SPORT_LABELS, latestMaxes, latestStandards, rankProgress } from "../domain/program.ts";

/** Самый близкий следующий разряд среди дисциплин спортсмена: «До МС: строгий +2,5 кг». */
function nearestRank(athlete: Athlete): string | null {
  const maxes = latestMaxes(athlete.program);
  const standards = latestStandards(athlete.program);
  let best: { text: string; gap: number } | null = null;
  for (const d of DISCIPLINES.filter((x) => x.sport === athlete.sport)) {
    const next = rankProgress(maxes[d.id], standards, d.id).next;
    if (next && (!best || next.gap < best.gap)) {
      best = { text: `До ${next.rank}: ${d.label.toLowerCase()} +${formatNumber(next.gap)} кг`, gap: next.gap };
    }
  }
  return best?.text ?? null;
}

export function AthleteRow({ athlete, today, onOpen }: { athlete: Athlete; today: string; onOpen: (id: string) => void }) {
  const countdown = formatStartCountdown(daysBetween(today, athlete.startDate));
  const rank = nearestRank(athlete);
  return (
    <li className="list__item">
      <button type="button" className="row" onClick={() => onOpen(athlete.id)}>
        <span className="row__name">{athlete.name}</span>
        <span className="row__weight">
          <span className="row__kg">
            {countdown.value}
            <small>{countdown.label}</small>
          </span>
        </span>
        <span className="row__meta">
          {SPORT_LABELS[athlete.sport]}, старт {formatDayMonth(athlete.startDate)}
          {rank && (
            <>
              <br />
              {rank}
            </>
          )}
        </span>
      </button>
    </li>
  );
}
