// Прогресс по рабочему весу: темп, прогноз до цели и шкала для графика.

import type { WeeklyPoint } from "./training.ts";

/** Темп роста, кг в неделю: наклон прямой по методу наименьших квадратов. */
export function weeklyPace(points: WeeklyPoint[]): number {
  const n = points.length;
  if (n < 2) return 0;
  const meanX = (n - 1) / 2;
  const meanY = points.reduce((sum, p) => sum + p.kg, 0) / n;
  let sxy = 0;
  let sxx = 0;
  points.forEach((p, x) => {
    sxy += (x - meanX) * (p.kg - meanY);
    sxx += (x - meanX) ** 2;
  });
  return sxy / sxx;
}

export type Forecast =
  | { kind: "reached" }
  | { kind: "weeks"; weeks: number; pace: number }
  | { kind: "stalled" };

/** Сколько недель до цели при текущем темпе. Без роста прогноза нет — «stalled». */
export function forecastToGoal(points: WeeklyPoint[], goal: number): Forecast {
  const last = points[points.length - 1]; // без .at(): его нет в iOS до 15.4
  if (last && last.kg >= goal) return { kind: "reached" };
  const pace = weeklyPace(points);
  if (!last || pace <= 0) return { kind: "stalled" };
  return { kind: "weeks", weeks: Math.ceil((goal - last.kg) / pace), pace };
}

/**
 * Границы оси Y с круглым шагом: полшага запаса снизу и сверху, цель всегда в поле.
 * Значения 80…87,5 и цель 95 → 75…100, деления через 5.
 */
export function chartScale(values: number[], goal?: number, step = 5): { min: number; max: number; ticks: number[] } {
  const all = goal === undefined ? values : [...values, goal];
  const min = Math.floor((Math.min(...all) - step / 2) / step) * step;
  const max = Math.ceil((Math.max(...all) + step / 2) / step) * step;
  const ticks: number[] = [];
  for (let t = min; t <= max; t += step) ticks.push(t);
  return { min, max, ticks };
}
