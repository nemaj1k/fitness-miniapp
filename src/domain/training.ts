// Типы тренировочных данных. Так же, как status.ts, — без React и без базы.

export type LiftId = "squat" | "bench" | "deadlift";

/** Упражнения, по которым тренер смотрит прогресс, в порядке переключателя на графике. */
export const LIFTS: { id: LiftId; label: string }[] = [
  { id: "squat", label: "Присед" },
  { id: "bench", label: "Жим" },
  { id: "deadlift", label: "Тяга" },
];

/** Рабочий вес за неделю. Дата — понедельник недели, строкой YYYY-MM-DD. */
export interface WeeklyPoint {
  weekStart: string;
  kg: number;
}

export interface WorkoutSet {
  kg: number;
  reps: number;
  /** Субъективная тяжесть 1–10; клиент может не указывать */
  rpe?: number;
}

export interface Exercise {
  name: string;
  sets: WorkoutSet[];
}

export interface Workout {
  /** YYYY-MM-DD */
  date: string;
  /** «Ноги», «Грудь»… */
  title: string;
  exercises: Exercise[];
}
