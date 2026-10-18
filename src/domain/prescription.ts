// Разбор записи тренера в ячейке таблицы: «20/10, 50/8, 70/3 в 2», «/10 в 4», «3,5 км», «помост 55».
// Формат свободный, поэтому разбор «по возможности»: исходный текст всегда сохраняется в raw,
// и если ничего не распознано, интерфейс показывает его как есть.

export interface PrescribedSet {
  /** Вес, кг; нет — упражнение с собственным весом или в блоке без указания веса */
  kg?: number;
  /** Повторы строкой: «10», «10+10» (на каждую сторону), «2» */
  reps: string;
  /** Сколько раз повторить этот подход («в 2» → 2) */
  times: number;
}

export interface Prescription {
  raw: string;
  sets: PrescribedSet[];
  /** «3,5 км» — дистанция кардио */
  distanceKm?: number;
  /** «помост 55» — вес, запланированный на соревнованиях */
  platformKg?: number;
  /** «82,5/2 ?» — тренер оставил на самочувствие */
  optional?: boolean;
}

const num = (s: string) => Number(s.replace(",", "."));

/** Один подход: «70/3 в 2», «/10», «15/10+10», «12», «45/2/», «45/2/1» (третье число — подходы). */
function parseSet(part: string): PrescribedSet | null {
  const m = /^(\d+(?:[.,]\d+)?)?\s*\/\s*(\d+(?:\+\d+)?)\s*(?:\/\s*(\d+)?)?\s*(?:в\s*(\d+))?$/i.exec(part);
  if (m) {
    const times = m[4] ?? m[3];
    return { ...(m[1] ? { kg: num(m[1]) } : {}), reps: m[2]!, times: times ? Number(times) : 1 };
  }
  // Только повторы: «12», «10+10», «12 в 3»
  const r = /^(\d+(?:\+\d+)?)(?:\s*в\s*(\d+))?$/i.exec(part);
  if (r) return { reps: r[1]!, times: r[2] ? Number(r[2]) : 1 };
  return null;
}

export function parsePrescription(text: string): Prescription {
  const raw = text.trim().replace(/\s+/g, " ");
  const result: Prescription = { raw, sets: [] };
  if (!raw) return result;

  const km = /^(\d+(?:[.,]\d+)?)\s*км$/i.exec(raw);
  if (km) return { ...result, distanceKm: num(km[1]!) };

  let rest = raw;
  const platform = /помост\s*(\d+(?:[.,]\d+)?)/i.exec(rest);
  if (platform) {
    result.platformKg = num(platform[1]!);
    rest = rest.slice(0, platform.index);
  }

  if (/\?\s*$/.test(rest)) {
    result.optional = true;
    rest = rest.replace(/\?\s*$/, "");
  }

  // Подходы разделены запятыми; точка с пробелом после — та же опечатка-разделитель («50/6. 60/4»)
  const parts = rest.split(/,|\.(?=\s)/).map((p) => p.trim()).filter(Boolean);
  // Запятая — и разделитель подходов, и десятичный знак («12,5/10»): склеиваем обратно,
  // если следующая часть начинается с цифр и «/» после дробной части
  const merged: string[] = [];
  for (const p of parts) {
    const prev = merged[merged.length - 1];
    if (prev !== undefined && /^\d+$/.test(prev) && /^\d\s*\//.test(p)) merged[merged.length - 1] = `${prev},${p}`;
    else merged.push(p);
  }
  const sets = merged.map(parseSet);
  if (sets.every((s): s is PrescribedSet => s !== null)) result.sets = sets;
  return result;
}

/** Подходы по одному, как их отмечает спортсмен: «70/3 в 2» → два подхода 70×3. */
export function expandSets(p: Prescription): { kg?: number; reps: string }[] {
  return p.sets.flatMap((s) => Array.from({ length: s.times }, () => ({ ...(s.kg !== undefined ? { kg: s.kg } : {}), reps: s.reps })));
}

/** Сколько всего подходов прописано (с учётом «в 2»). */
export function totalSets(p: Prescription): number {
  return p.sets.reduce((sum, s) => sum + s.times, 0);
}
