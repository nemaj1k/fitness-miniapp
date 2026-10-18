// Раскладка веса на блины: что повесить на одну сторону грифа.

/** Олимпийские блины, от тяжёлых к лёгким. */
export const PLATES = [25, 20, 15, 10, 5, 2.5, 1.25] as const;
export type Plate = (typeof PLATES)[number];

export const BAR_KG = 20;

/**
 * Блины на одну сторону: 107,5 кг → 25, 15, 2,5, 1,25.
 * Если вес не набирается ровно (61 кг), остаток уходит в rest; легче грифа — пусто.
 */
export function platesPerSide(totalKg: number, barKg = BAR_KG): { plates: Plate[]; rest: number } {
  let side = (totalKg - barKg) / 2;
  if (side <= 0) return { plates: [], rest: 0 };
  const plates: Plate[] = [];
  for (const p of PLATES) {
    while (side >= p - 1e-9) {
      plates.push(p);
      side -= p;
    }
  }
  return { plates, rest: Math.round(side * 1000) / 1000 };
}
