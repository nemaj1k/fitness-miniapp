// Статусы клиентов. Только чистые функции, без React и без обращений к базе:
// так правила легко тестировать и потом переносить на сервер.

export type ClientStatus = "active" | "warning" | "risk";

export interface ClientActivity {
  /** Сколько дней назад клиент последний раз записал подход */
  daysSinceLastLog: number;
  /** Сколько запланированных тренировок подряд пропущено */
  missedSessions: number;
}

/** Пороги в одном месте: тренер потом сможет менять их в настройках. */
export const THRESHOLDS = {
  /** Жёлтый: пропущено столько тренировок и больше */
  warningMissedSessions: 2,
  /** Красный: столько дней без записей и больше */
  riskDaysSilent: 7,
  /** Красный флаг «кому написать»: столько дней без записей и больше */
  nudgeDaysSilent: 5,
} as const;

export function getClientStatus(activity: ClientActivity): ClientStatus {
  if (activity.daysSinceLastLog >= THRESHOLDS.riskDaysSilent) return "risk";
  if (activity.missedSessions >= THRESHOLDS.warningMissedSessions) return "warning";
  return "active";
}

export function needsNudge(activity: ClientActivity): boolean {
  return activity.daysSinceLastLog >= THRESHOLDS.nudgeDaysSilent;
}

const STATUS_RANK: Record<ClientStatus, number> = { risk: 0, warning: 1, active: 2 };

/** Сначала те, кому нужно внимание; внутри группы — кто молчит дольше. */
export function compareByAttention(a: ClientActivity, b: ClientActivity): number {
  const byStatus = STATUS_RANK[getClientStatus(a)] - STATUS_RANK[getClientStatus(b)];
  if (byStatus !== 0) return byStatus;
  return b.daysSinceLastLog - a.daysSinceLastLog;
}
