// Тексты красного флага «написать клиенту». Формулировки без рода:
// среди клиентов и тренеров есть и мужчины, и женщины.

import { daysBetween, formatDayMonth, plural, weekday } from "./format.ts";

/** В винительном падеже: «в понедельник», «во вторник»… Индекс — getUTCDay(). */
const WEEKDAYS_ON = ["в воскресенье", "в понедельник", "во вторник", "в среду", "в четверг", "в пятницу", "в субботу"];

/** «Нет записей 5 дней». */
export function nudgeHeadline(daysSilent: number): string {
  return `Нет записей ${daysSilent} ${plural(daysSilent, "день", "дня", "дней")}`;
}

/**
 * «Последняя запись в понедельник, после неё пропущены 2 тренировки.»
 * Старше недели день недели путает, поэтому тогда пишем дату: «Последняя запись 5 окт.»
 */
export function nudgeDetails(lastWorkoutDate: string, today: string, missedSessions: number): string {
  const when =
    daysBetween(lastWorkoutDate, today) < 7 ? WEEKDAYS_ON[weekday(lastWorkoutDate)] : formatDayMonth(lastWorkoutDate);
  if (missedSessions <= 0) return `Последняя запись ${when}.`;
  const missed = plural(missedSessions, "пропущена", "пропущены", "пропущено");
  const sessions = plural(missedSessions, "тренировка", "тренировки", "тренировок");
  return `Последняя запись ${when}, после неё ${missed} ${missedSessions} ${sessions}.`;
}

/** Черновик сообщения клиенту; тренер может поправить его перед отправкой. */
export function nudgeMessage(firstName: string): string {
  return (
    `Привет, ${firstName}! Давно не вижу твоих записей о тренировках. Как ты? ` +
    "Давай вернёмся в график: на этой неделе можно сделать лёгкую тренировку, без рекордов."
  );
}
