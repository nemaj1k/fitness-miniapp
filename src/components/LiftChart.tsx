import { useState } from "react";
import type { Client } from "../data/mockClients.ts";
import { formatDateDots, formatKg, formatNumber, formatPace } from "../domain/format.ts";
import { chartScale, forecastToGoal } from "../domain/progress.ts";
import { LIFTS, type LiftId } from "../domain/training.ts";
import { hapticSelection } from "../telegram/webApp.ts";

// Геометрия как в макете Client.dc.html: viewBox 336×196, поле графика 34…322 × 22…170
const W = 336;
const H = 196;
const LEFT = 34;
const RIGHT = 322;
const TOP = 22;
const BOTTOM = 170;

/** График рабочего веса по неделям с линией цели и прогнозом под ним. */
export function LiftChart({ client }: { client: Client }) {
  const [lift, setLift] = useState<LiftId>("squat");
  const points = client.weekly[lift];
  const goal = client.goals[lift];
  const label = LIFTS.find((l) => l.id === lift)!.label;

  return (
    <section className="card">
      <h2 className="card__title">Рабочий вес по неделям, кг</h2>
      <div className="segments" role="group" aria-label="Упражнение">
        {LIFTS.map((l) => (
          <button
            key={l.id}
            type="button"
            className="segments__item"
            aria-pressed={lift === l.id}
            onClick={() => {
              hapticSelection();
              setLift(l.id);
            }}
          >
            {l.label}
          </button>
        ))}
      </div>
      {points.length < 2 ? (
        <p className="muted">Пока мало записей для графика</p>
      ) : (
        <Chart points={points} goal={goal} label={label} />
      )}
      {goal !== undefined && points.length >= 2 && <ForecastLine points={points} goal={goal} />}
    </section>
  );
}

function Chart({ points, goal, label }: { points: Client["weekly"][LiftId]; goal?: number; label: string }) {
  const scale = chartScale(
    points.map((p) => p.kg),
    goal,
  );
  const x = (i: number) => LEFT + ((RIGHT - LEFT) * i) / (points.length - 1);
  const y = (kg: number) => BOTTOM - ((kg - scale.min) / (scale.max - scale.min)) * (BOTTOM - TOP);
  const line = points.map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(2)} ${y(p.kg).toFixed(2)}`).join(" ");
  const area = `${line} L${RIGHT} ${BOTTOM} L${LEFT} ${BOTTOM} Z`;
  const first = points[0]!;
  const last = points[points.length - 1]!;
  const lastX = x(points.length - 1);
  const lastY = y(last.kg);
  const aria =
    `График рабочего веса, ${label.toLowerCase()}, за ${points.length} недель: ` +
    `от ${formatKg(first.kg)} до ${formatKg(last.kg)}` +
    (goal !== undefined ? `, цель ${formatKg(goal)}` : "");

  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={aria}>
      <g className="chart__grid">
        {scale.ticks.map((t) => (
          <line key={t} x1={LEFT} x2={RIGHT} y1={y(t)} y2={y(t)} />
        ))}
      </g>
      <g className="chart__axis" textAnchor="end">
        {scale.ticks.map((t) => (
          <text key={t} x={LEFT - 7} y={y(t) + 3.5}>
            {formatNumber(t)}
          </text>
        ))}
      </g>
      {goal !== undefined && (
        <>
          <line className="chart__goal" x1={LEFT} x2={RIGHT} y1={y(goal)} y2={y(goal)} />
          <text className="chart__goal-label" x={RIGHT} y={y(goal) - 7} textAnchor="end">
            цель {formatNumber(goal)}
          </text>
        </>
      )}
      <path className="chart__area" d={area} />
      <path className="chart__line" d={line} />
      <g className="chart__dots">
        {points.slice(0, -1).map((p, i) => (
          <circle key={p.weekStart} cx={x(i)} cy={y(p.kg)} r={3.5} />
        ))}
      </g>
      <circle className="chart__last" cx={lastX} cy={lastY} r={6} />
      <text className="chart__value" x={lastX + 4} y={lastY - 14} textAnchor="end">
        {formatNumber(last.kg)}
      </text>
      <g className="chart__axis" textAnchor="middle">
        {points.map((p, i) => {
          // Последнюю подпись прижимаем к правому краю, иначе она вылезает за viewBox
          const isLast = i === points.length - 1;
          return (
            <text key={p.weekStart} x={isLast ? W - 1 : x(i)} y={H - 7} textAnchor={isLast ? "end" : undefined}>
              {formatDateDots(p.weekStart)}
            </text>
          );
        })}
      </g>
    </svg>
  );
}

function ForecastLine({ points, goal }: { points: Client["weekly"][LiftId]; goal: number }) {
  const f = forecastToGoal(points, goal);
  if (f.kind === "reached") {
    return (
      <div className="forecast">
        <div className="forecast__text">
          <b>Цель {formatKg(goal)} достигнута</b>пора поставить новую
        </div>
      </div>
    );
  }
  if (f.kind === "stalled") {
    return (
      <div className="forecast">
        <div className="forecast__text">
          <b>Рост остановился</b>
          {`за ${points.length} недель вес не растёт, до цели ${formatKg(goal)} прогноза нет`}
        </div>
      </div>
    );
  }
  return (
    <div className="forecast">
      <div className="forecast__big">
        {f.weeks}
        <span>нед.</span>
      </div>
      <div className="forecast__text">
        <b>до цели {formatKg(goal)}</b>при текущем темпе {formatPace(f.pace)} в неделю
      </div>
    </div>
  );
}
