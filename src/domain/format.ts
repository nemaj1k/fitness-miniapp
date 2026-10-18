/** Русское склонение: plural(1, ...) → «день», 2 → «дня», 5 → «дней», 11 → «дней», 21 → «день». */
export function plural(n: number, one: string, few: string, many: string): string {
  const abs = Math.abs(n);
  const lastTwo = abs % 100;
  const last = abs % 10;
  if (lastTwo >= 11 && lastTwo <= 14) return many;
  if (last === 1) return one;
  if (last >= 2 && last <= 4) return few;
  return many;
}

/** 0 → «сегодня», 1 → «вчера», 5 → «5 дней назад». */
export function formatDaysAgo(days: number): string {
  if (days <= 0) return "сегодня";
  if (days === 1) return "вчера";
  return `${days} ${plural(days, "день", "дня", "дней")} назад`;
}

/** «Екатерина Власова» → «ЕВ»; одно слово → одна буква. */
export function initials(fullName: string): string {
  return fullName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");
}

/** «Екатерина Власова» → «Екатерина В.»; для узкого списка. */
export function shortName(fullName: string): string {
  const [first, second] = fullName.trim().split(/\s+/);
  if (!second) return first ?? "";
  return `${first} ${second.charAt(0).toUpperCase()}.`;
}

/** 62.5 → «62,5 кг», 50 → «50 кг» (запятая, как принято в русском). */
export function formatKg(kg: number): string {
  return `${formatNumber(kg)} кг`;
}

/** 87.5 → «87,5»; без единиц — для графика и подходов. */
export function formatNumber(n: number): string {
  return String(n).replace(".", ",");
}

/** Темп с одним знаком и знаком плюса: 1.04 → «+1,0 кг». */
export function formatPace(kgPerWeek: number): string {
  const sign = kgPerWeek > 0 ? "+" : kgPerWeek < 0 ? "−" : "";
  return `${sign}${Math.abs(kgPerWeek).toFixed(1).replace(".", ",")} кг`;
}

/** 0 → «сегодня», 1 → «вчера», 5 → «5 дн. назад» — короткая форма для узких мест. */
export function formatDaysAgoShort(days: number): string {
  if (days <= 0) return "сегодня";
  if (days === 1) return "вчера";
  return `${days} дн. назад`;
}

// Даты — строки YYYY-MM-DD. Считаем в UTC, чтобы часовой пояс не сдвигал день.
const DAY_MS = 24 * 60 * 60 * 1000;
const WEEKDAYS_SHORT = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
const MONTHS_SHORT = ["янв", "фев", "мар", "апр", "мая", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];

function toUtc(date: string): Date {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y!, m! - 1, d!));
}

/** Целых дней от from до to: daysBetween("2026-10-12", "2026-10-17") → 5. */
export function daysBetween(from: string, to: string): number {
  return Math.round((toUtc(to).getTime() - toUtc(from).getTime()) / DAY_MS);
}

/** Сдвиг даты на n дней (n может быть отрицательным). */
export function addDays(date: string, n: number): string {
  return new Date(toUtc(date).getTime() + n * DAY_MS).toISOString().slice(0, 10);
}

/** 0 — воскресенье … 6 — суббота. */
export function weekday(date: string): number {
  return toUtc(date).getUTCDay();
}

/** «2026-10-12» → «Пн 12 окт». */
export function formatWorkoutDate(date: string): string {
  const d = toUtc(date);
  return `${WEEKDAYS_SHORT[d.getUTCDay()]} ${d.getUTCDate()} ${MONTHS_SHORT[d.getUTCMonth()]}`;
}

const MONTHS_GENITIVE = [
  "января", "февраля", "марта", "апреля", "мая", "июня",
  "июля", "августа", "сентября", "октября", "ноября", "декабря",
];

/** «2026-10-17» → «Сб, 17 октября» — дата в шапке экрана. */
export function formatHeaderDate(date: string): string {
  const d = toUtc(date);
  return `${WEEKDAYS_SHORT[d.getUTCDay()]}, ${d.getUTCDate()} ${MONTHS_GENITIVE[d.getUTCMonth()]}`;
}

/** «2026-10-05» → «5 окт». */
export function formatDayMonth(date: string): string {
  const d = toUtc(date);
  return `${d.getUTCDate()} ${MONTHS_SHORT[d.getUTCMonth()]}`;
}

/** «2026-08-24» → «24.08» — подписи оси графика. */
export function formatDateDots(date: string): string {
  const [, m, d] = date.split("-");
  return `${d}.${m}`;
}

/** Подход: «87,5×5», с RPE — «65×6 @8». */
export function formatSet(set: { kg: number; reps: number; rpe?: number }): string {
  const base = `${formatNumber(set.kg)}×${set.reps}`;
  return set.rpe === undefined ? base : `${base} @${set.rpe}`;
}

/** Как часто клиент указывает RPE: по всем подходам всех тренировок. */
export function rpeUsage(workouts: { exercises: { sets: { rpe?: number }[] }[] }[]): string {
  const sets = workouts.flatMap((w) => w.exercises.flatMap((e) => e.sets));
  const withRpe = sets.filter((s) => s.rpe !== undefined).length;
  if (withRpe === 0) return "не указывает";
  if (withRpe === sets.length) return "всегда";
  return "иногда";
}
