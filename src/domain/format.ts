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
  return `${String(kg).replace(".", ",")} кг`;
}
