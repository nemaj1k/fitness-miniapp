import { addDays } from "../domain/format.ts";
import type { ClientActivity } from "../domain/status.ts";
import type { Exercise, LiftId, WeeklyPoint, Workout } from "../domain/training.ts";

export interface Client extends ClientActivity {
  id: string;
  name: string;
  /** Главное упражнение, по которому тренер смотрит прогресс */
  mainLift: { name: string; kg: number };
  /** Ник для кнопки «Написать в Telegram». У моков нет: выдуманный ник может принадлежать реальному человеку. */
  telegramUsername?: string;
  goals: Partial<Record<LiftId, number>>;
  /** Рабочий вес за последние 8 недель, от старых к новым */
  weekly: Record<LiftId, WeeklyPoint[]>;
  /** Последние тренировки, от новых к старым */
  workouts: Workout[];
}

// Вымышленные данные. Заменим на данные из базы, когда подключим Supabase.

/** «Сегодня» для моков — как в макетах (суббота, 17 октября). */
export const MOCK_TODAY = "2026-10-17";

/** Понедельник последней недели графика; 8 недель: 24.08 … 12.10 */
const LAST_WEEK = "2026-10-12";

function weekly(...kg: number[]): WeeklyPoint[] {
  return kg.map((v, i) => ({ weekStart: addDays(LAST_WEEK, (i - kg.length + 1) * 7), kg: v }));
}

/** Подходы: разминка и рабочие; rpe — для рабочих подходов, если клиент их отмечает. */
function sets(warmup: [number, number] | null, work: [number, number], count: number, rpe?: number[]) {
  const result: Exercise["sets"] = [];
  if (warmup) result.push({ kg: warmup[0], reps: warmup[1], ...(rpe ? { rpe: rpe[0]! - 2 } : {}) });
  for (let i = 0; i < count; i++) {
    result.push({ kg: work[0], reps: work[1], ...(rpe ? { rpe: rpe[Math.min(i, rpe.length - 1)]! } : {}) });
  }
  return result;
}

type Lifts = Record<LiftId, number>;

/**
 * Три тренировки по сплиту ноги / грудь / спина от рабочих весов клиента.
 * withRpe — отмечает ли клиент RPE; для Дмитрия данные заданы вручную по макету.
 */
function workoutsFor(lastDate: string, w: Lifts, withRpe: boolean): Workout[] {
  const r = withRpe ? [7, 8, 8, 9] : undefined;
  const round = (kg: number) => Math.round(kg / 2.5) * 2.5;
  return [
    {
      date: lastDate,
      title: "Ноги",
      exercises: [
        { name: "Присед со штангой", sets: sets([round(w.squat * 0.8), 8], [w.squat, 5], 3, r) },
        { name: "Жим ногами", sets: sets(null, [round(w.squat * 1.7), 10], 3, r) },
      ],
    },
    {
      date: addDays(lastDate, -4),
      title: "Грудь",
      exercises: [
        { name: "Жим лёжа", sets: sets([round(w.bench * 0.8), 8], [w.bench, 6], 3, r) },
        { name: "Жим гантелей на наклонной", sets: sets(null, [round(w.bench * 0.3), 10], 3, r) },
      ],
    },
    {
      date: addDays(lastDate, -7),
      title: "Спина",
      exercises: [
        { name: "Становая тяга", sets: sets([round(w.deadlift * 0.8), 5], [w.deadlift, 4], 3, r) },
        { name: "Тяга штанги в наклоне", sets: sets(null, [round(w.deadlift * 0.5), 8], 3, r) },
      ],
    },
  ];
}

interface Seed extends ClientActivity {
  id: string;
  name: string;
  goals: Client["goals"];
  weekly: Client["weekly"];
  withRpe: boolean;
  workouts?: Workout[];
}

function client(seed: Seed): Client {
  const last = (id: LiftId) => seed.weekly[id][seed.weekly[id].length - 1]!.kg;
  const current = { squat: last("squat"), bench: last("bench"), deadlift: last("deadlift") };
  return {
    id: seed.id,
    name: seed.name,
    daysSinceLastLog: seed.daysSinceLastLog,
    missedSessions: seed.missedSessions,
    mainLift: { name: "Присед", kg: current.squat },
    goals: seed.goals,
    weekly: seed.weekly,
    workouts: seed.workouts ?? workoutsFor(addDays(MOCK_TODAY, -seed.daysSinceLastLog), current, seed.withRpe),
  };
}

// Дмитрий Орлов — ровно как в макете Client.dc.html
const DMITRY_WORKOUTS: Workout[] = [
  {
    date: "2026-10-12",
    title: "Ноги",
    exercises: [
      { name: "Присед со штангой", sets: [{ kg: 70, reps: 8 }, { kg: 87.5, reps: 5 }, { kg: 87.5, reps: 5 }, { kg: 87.5, reps: 5 }] },
      { name: "Жим ногами", sets: [{ kg: 150, reps: 10 }, { kg: 150, reps: 10 }, { kg: 150, reps: 10 }] },
    ],
  },
  {
    date: "2026-10-08",
    title: "Грудь",
    exercises: [
      {
        name: "Жим лёжа",
        sets: [{ kg: 52.5, reps: 8, rpe: 6 }, { kg: 65, reps: 6, rpe: 8 }, { kg: 65, reps: 6, rpe: 8 }, { kg: 65, reps: 5, rpe: 9 }],
      },
      {
        name: "Жим гантелей на наклонной",
        sets: [{ kg: 20, reps: 10, rpe: 7 }, { kg: 20, reps: 10, rpe: 8 }, { kg: 20, reps: 9, rpe: 9 }],
      },
    ],
  },
  {
    date: "2026-10-05",
    title: "Спина",
    exercises: [
      {
        name: "Становая тяга",
        sets: [{ kg: 87.5, reps: 5, rpe: 6 }, { kg: 110, reps: 4, rpe: 8 }, { kg: 110, reps: 3, rpe: 8 }, { kg: 110, reps: 3, rpe: 9 }],
      },
      {
        name: "Тяга штанги в наклоне",
        sets: [{ kg: 55, reps: 8, rpe: 7 }, { kg: 55, reps: 8, rpe: 8 }, { kg: 55, reps: 8, rpe: 8 }],
      },
    ],
  },
];

export const MOCK_CLIENTS: Client[] = [
  client({
    id: "c1", name: "Екатерина Власова", daysSinceLastLog: 12, missedSessions: 4, withRpe: false,
    goals: { squat: 70, bench: 45 },
    weekly: {
      squat: weekly(57.5, 60, 60, 62.5, 62.5, 62.5, 62.5, 62.5),
      bench: weekly(35, 37.5, 37.5, 40, 40, 40, 40, 40),
      deadlift: weekly(70, 72.5, 75, 75, 77.5, 77.5, 77.5, 77.5),
    },
  }),
  client({
    id: "c2", name: "Артём Беляев", daysSinceLastLog: 9, missedSessions: 3, withRpe: true,
    goals: { squat: 120, bench: 100, deadlift: 160 },
    weekly: {
      squat: weekly(100, 102.5, 105, 105, 107.5, 107.5, 107.5, 107.5),
      bench: weekly(85, 87.5, 87.5, 90, 90, 90, 90, 90),
      deadlift: weekly(135, 140, 140, 142.5, 145, 145, 145, 145),
    },
  }),
  client({
    id: "c3", name: "Дмитрий Орлов", daysSinceLastLog: 5, missedSessions: 2, withRpe: false,
    goals: { squat: 95, bench: 75, deadlift: 130 },
    weekly: {
      squat: weekly(80, 82.5, 85, 85, 87.5, 87.5, 87.5, 87.5),
      bench: weekly(57.5, 60, 60, 62.5, 62.5, 65, 65, 65),
      deadlift: weekly(100, 102.5, 105, 105, 107.5, 110, 110, 110),
    },
    workouts: DMITRY_WORKOUTS,
  }),
  client({
    id: "c4", name: "Павел Новиков", daysSinceLastLog: 4, missedSessions: 2, withRpe: true,
    goals: { squat: 90, deadlift: 120 },
    weekly: {
      squat: weekly(70, 72.5, 72.5, 75, 75, 77.5, 77.5, 77.5),
      bench: weekly(60, 60, 62.5, 62.5, 62.5, 65, 65, 65),
      deadlift: weekly(95, 97.5, 100, 100, 102.5, 102.5, 105, 105),
    },
  }),
  client({
    id: "c5", name: "Мария Козлова", daysSinceLastLog: 3, missedSessions: 0, withRpe: true,
    goals: { squat: 50, bench: 35 },
    weekly: {
      squat: weekly(40, 42.5, 42.5, 45, 45, 47.5, 47.5, 50),
      bench: weekly(25, 25, 27.5, 27.5, 30, 30, 30, 32.5),
      deadlift: weekly(50, 52.5, 55, 55, 57.5, 60, 60, 62.5),
    },
  }),
  client({
    id: "c6", name: "Игорь Лебедев", daysSinceLastLog: 2, missedSessions: 0, withRpe: true,
    goals: { squat: 120, bench: 100, deadlift: 150 },
    weekly: {
      squat: weekly(92.5, 95, 97.5, 97.5, 100, 102.5, 102.5, 105),
      bench: weekly(80, 82.5, 82.5, 85, 85, 87.5, 87.5, 90),
      deadlift: weekly(120, 122.5, 125, 127.5, 127.5, 130, 132.5, 135),
    },
  }),
  client({
    id: "c7", name: "Анна Смирнова", daysSinceLastLog: 1, missedSessions: 0, withRpe: false,
    goals: { squat: 75, deadlift: 90 },
    weekly: {
      squat: weekly(57.5, 60, 60, 62.5, 62.5, 65, 65, 67.5),
      bench: weekly(32.5, 35, 35, 35, 37.5, 37.5, 37.5, 40),
      deadlift: weekly(70, 72.5, 72.5, 75, 77.5, 77.5, 80, 80),
    },
  }),
  client({
    id: "c8", name: "Олеся Романова", daysSinceLastLog: 1, missedSessions: 0, withRpe: true,
    goals: { squat: 60, bench: 40, deadlift: 80 },
    weekly: {
      squat: weekly(50, 52.5, 52.5, 55, 55, 57.5, 57.5, 60),
      bench: weekly(30, 30, 32.5, 32.5, 35, 35, 35, 37.5),
      deadlift: weekly(60, 62.5, 65, 65, 67.5, 70, 70, 72.5),
    },
  }),
];
