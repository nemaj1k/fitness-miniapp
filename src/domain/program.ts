// Программа спортсмена из еженедельной таблицы тренера: лист = неделя подготовки к старту.
// На вход — таблица как двумерный массив строк (из .xlsx или CSV), без привязки к номерам колонок:
// блоки ищем по содержимому («Тренировка 1», «ПРИСЕД», «кмс»), потому что тренер двигает их свободно.

import { addDays, daysBetween } from "./format.ts";
import { parsePrescription, type Prescription } from "./prescription.ts";

export type DisciplineId = "squat" | "bench" | "deadlift" | "strictCurl" | "classicCurl" | "extremeCurl";
export type Sport = "powerlifting" | "curl";

export const DISCIPLINES: { id: DisciplineId; label: string; sport: Sport }[] = [
  { id: "squat", label: "Присед", sport: "powerlifting" },
  { id: "bench", label: "Жим", sport: "powerlifting" },
  { id: "deadlift", label: "Тяга", sport: "powerlifting" },
  { id: "strictCurl", label: "Строгий", sport: "curl" },
  { id: "classicCurl", label: "Классический", sport: "curl" },
  { id: "extremeCurl", label: "Экстремальный", sport: "curl" },
];

export const SPORT_LABELS: Record<Sport, string> = { powerlifting: "Пауэрлифтинг", curl: "Подъём на бицепс" };

const DISCIPLINE_BY_HEADER: Record<string, DisciplineId> = {
  присед: "squat", жим: "bench", тяга: "deadlift",
  строгий: "strictCurl", классический: "classicCurl", экстремальный: "extremeCurl",
};

/** Разряды от младшего к старшему — для «до следующего разряда». */
const RANKS = ["3 разряд", "2 разряд", "1 разряд", "кмс", "мс", "мсмк", "змс"];

export type ExerciseKind = "cardio" | "circuit" | "main" | "own";

export interface ProgramExercise {
  name: string;
  kind: ExerciseKind;
  prescription: Prescription;
  /** Сколько кругов у разминочного круга — стоит у первого упражнения круга */
  rounds?: number;
}

export interface ProgramWorkout {
  title: string;
  exercises: ProgramExercise[];
}

export interface RankStandard {
  rank: string;
  values: Partial<Record<DisciplineId, number>>;
  total?: number;
}

export interface ProgramWeek {
  /** Номер недели из названия листа: «3 Неделя 5 НЕДЕЛИ ДО СТАРТА» → 3 */
  number: number;
  /** Название листа как у тренера */
  title: string;
  /** Указание тренера в первой строке листа */
  note?: string;
  workouts: ProgramWorkout[];
  /** Максимумы (100 %), от которых тренер считает проценты; 0 и пусто — дисциплину не делает */
  maxes: Partial<Record<DisciplineId, number>>;
  /** Проценты из таблицы тренера: 100, 92, 88… */
  percents: number[];
  standards: RankStandard[];
}

export interface Program {
  weeks: ProgramWeek[];
}

const clean = (s: string | undefined) => (s ?? "").replace(/\s+/g, " ").trim();
const toNumber = (s: string | undefined): number | undefined => {
  const t = clean(s).replace(",", ".");
  if (!/^\d+(\.\d+)?$/.test(t)) return undefined;
  return Number(t);
};

function weekNumber(title: string): number {
  return Number(/^\s*(\d+)/.exec(title)?.[1] ?? 0);
}

/** Строка «основная», а не разминочный круг: лесенка подходов, «в N», свои упражнения, помост. */
function isMain(ex: ProgramExercise): boolean {
  const p = ex.prescription;
  return (
    ex.kind === "own" ||
    p.platformKg !== undefined ||
    p.sets.length > 1 ||
    p.sets.some((s) => s.times > 1) ||
    // Нераспознанная лесенка — всё равно основное упражнение, не разминка
    (p.sets.length === 0 && /[,.]\s/.test(p.raw))
  );
}

function parseWorkouts(grid: string[][]): ProgramWorkout[] {
  const workouts: ProgramWorkout[] = [];
  let current: ProgramWorkout | null = null;
  for (const row of grid) {
    const name = clean(row[1]);
    if (/^тренировка\s*\d+/i.test(name)) {
      current = { title: name.replace(/^т/, "Т"), exercises: [] };
      workouts.push(current);
      continue;
    }
    if (!current || !name) continue;
    const prescription = parsePrescription(clean(row[2]));
    const rounds = toNumber(row[3]);
    const kind: ExerciseKind = /^сам\.?$/i.test(name)
      ? "own"
      : prescription.distanceKm !== undefined
        ? "cardio"
        : "main";
    current.exercises.push({ name, kind, prescription, ...(rounds ? { rounds } : {}) });
  }
  // Разминочный круг: от строки с числом кругов до первой основной строки
  for (const w of workouts) {
    let inCircuit = false;
    for (const ex of w.exercises) {
      if (ex.rounds) inCircuit = true;
      if (inCircuit && (isMain(ex) || ex.kind === "cardio")) inCircuit = false;
      if (inCircuit && ex.kind === "main") ex.kind = "circuit";
    }
  }
  return workouts;
}

function parseMaxesAndPercents(grid: string[][]): { maxes: ProgramWeek["maxes"]; percents: number[] } {
  const maxes: ProgramWeek["maxes"] = {};
  const percents = new Set<number>();
  grid.forEach((row, r) => {
    row.forEach((cell, c) => {
      const id = DISCIPLINE_BY_HEADER[clean(cell).toLowerCase()];
      if (!id) return;
      const max = toNumber(grid[r + 1]?.[c]);
      if (max) maxes[id] = max;
      // Под максимумом — лесенка процентов в соседней колонке: «92 %» в CSV, «0,92» в .xlsx
      for (let k = 1; k <= 8; k++) {
        const cell = clean(grid[r + k]?.[c + 1]);
        const pct = /^(\d+)\s*%$/.exec(cell);
        const fraction = /^(0[.,]\d+|1)$/.test(cell) ? Math.round(Number(cell.replace(",", ".")) * 100) : undefined;
        if (pct) percents.add(Number(pct[1]));
        else if (fraction) percents.add(fraction);
      }
    });
  });
  return { maxes, percents: [...percents].sort((a, b) => b - a) };
}

/** Блоки дисциплин: строка заголовка («ПРИСЕД … ЖИМ … ТЯГА») и колонки каждой дисциплины. */
function disciplineBlocks(grid: string[][]): { row: number; columns: { id: DisciplineId; col: number }[] }[] {
  const blocks: { row: number; columns: { id: DisciplineId; col: number }[] }[] = [];
  grid.forEach((row, r) => {
    const columns = row
      .map((cell, col) => ({ id: DISCIPLINE_BY_HEADER[clean(cell).toLowerCase()], col }))
      .filter((x): x is { id: DisciplineId; col: number } => x.id !== undefined);
    if (columns.length > 0) blocks.push({ row: r, columns });
  });
  return blocks;
}

function parseStandards(grid: string[][]): RankStandard[] {
  const blocks = disciplineBlocks(grid);
  if (blocks.length === 0) return [];
  const standards: RankStandard[] = [];
  grid.forEach((row, r) => {
    const labelCol = row.findIndex((cell) => RANKS.includes(clean(cell).toLowerCase()));
    if (labelCol < 0) return;
    // Блоки пауэрлифтинга и бицепса стоят в одних колонках — норматив относится к ближайшему по строкам
    const block = blocks.reduce((best, b) => (Math.abs(b.row - r) < Math.abs(best.row - r) ? b : best));
    const values: RankStandard["values"] = {};
    let lastUsed = labelCol;
    for (const { id, col } of block.columns) {
      // Значение норматива — в колонке дисциплины или чуть правее (рядом с подписью разряда)
      for (let c = Math.max(col, lastUsed + 1); c <= col + 2; c++) {
        const v = toNumber(row[c]);
        if (v !== undefined) {
          values[id] = v;
          lastUsed = c;
          break;
        }
      }
    }
    const total = row.slice(lastUsed + 1).map(toNumber).find((v) => v !== undefined);
    standards.push({ rank: clean(row[labelCol]).toUpperCase(), values, ...(total !== undefined ? { total } : {}) });
  });
  return standards;
}

export function parseWeek(title: string, grid: string[][]): ProgramWeek {
  const first = clean(grid[0]?.[1]);
  const { maxes, percents } = parseMaxesAndPercents(grid);
  return {
    number: weekNumber(title),
    title: clean(title),
    ...(first && !/^тренировка/i.test(first) ? { note: first } : {}),
    workouts: parseWorkouts(grid),
    maxes,
    percents,
    standards: parseStandards(grid),
  };
}

/** Листы книги → программа; листы без тренировок пропускаем, недели по порядку. */
export function parseProgram(sheets: { title: string; grid: string[][] }[]): Program {
  const weeks = sheets
    .map((s) => parseWeek(s.title, s.grid))
    .filter((w) => w.workouts.length > 0)
    .sort((a, b) => a.number - b.number);
  return { weeks };
}

/** Какая неделя программы сейчас: последняя — неделя старта, каждые 7 дней до старта — на неделю раньше. */
export function currentWeekNumber(program: Program, startDate: string, today: string): number {
  const numbers = program.weeks.map((w) => w.number);
  if (numbers.length === 0) return 0;
  const last = Math.max(...numbers);
  const first = Math.min(...numbers);
  const weeksBefore = Math.floor(Math.max(0, daysBetween(today, startDate)) / 7);
  return Math.min(last, Math.max(first, last - weeksBefore));
}

/** Дата начала недели программы (для подписи), если известна дата старта. */
export function weekStartDate(program: Program, weekNumberValue: number, startDate: string): string {
  const last = Math.max(...program.weeks.map((w) => w.number));
  return addDays(startDate, -7 * (last - weekNumberValue) - 6);
}

/** Самые свежие максимумы и нормативы — с последней недели, где они указаны. */
export function latestMaxes(program: Program): ProgramWeek["maxes"] {
  const result: ProgramWeek["maxes"] = {};
  for (const w of program.weeks) Object.assign(result, w.maxes);
  return result;
}

export function latestStandards(program: Program): RankStandard[] {
  for (let i = program.weeks.length - 1; i >= 0; i--) {
    if (program.weeks[i]!.standards.length > 0) return program.weeks[i]!.standards;
  }
  return [];
}

/** Достигнутый и следующий разряд по дисциплине: «до МС +7,5 кг». */
export function rankProgress(
  max: number | undefined,
  standards: RankStandard[],
  id: DisciplineId,
): { achieved?: string; next?: { rank: string; gap: number } } {
  if (max === undefined) return {};
  const rows = standards
    .filter((s) => s.values[id] !== undefined)
    .sort((a, b) => a.values[id]! - b.values[id]!);
  const achieved = [...rows].reverse().find((s) => max >= s.values[id]!);
  const next = rows.find((s) => max < s.values[id]!);
  return {
    ...(achieved ? { achieved: achieved.rank } : {}),
    ...(next ? { next: { rank: next.rank, gap: Math.round((next.values[id]! - max) * 100) / 100 } } : {}),
  };
}

/** Вес от максимума по проценту, до десятых — как в таблице тренера (92 % от 55 = 50,6). */
export function percentOf(max: number, percent: number): number {
  return Math.round(max * percent) / 100;
}
