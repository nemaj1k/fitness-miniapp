// Вымышленные спортсмены для примера. Программа собирается тем же разбором, что и таблица тренера:
// записи подходов — строками («20/10, 50/8, 70/3 в 2»), чтобы пример проверял настоящий путь данных.

import { addDays } from "../domain/format.ts";
import { parsePrescription } from "../domain/prescription.ts";
import type { Program, ProgramExercise, ProgramWeek, RankStandard } from "../domain/program.ts";
import type { Athlete } from "./athletes.ts";
import { MOCK_TODAY } from "./mockClients.ts";

const round = (kg: number) => Math.round(kg / 2.5) * 2.5;
const kg = (n: number) => String(n).replace(".", ",");

/** Лесенка к рабочему весу: разминка, подводящие, рабочий подход «в 2». */
function ladder(max: number, topPercent: number, topReps: number, bar = 20): string {
  const top = round((max * topPercent) / 100);
  const steps = [bar, round(top * 0.6), round(top * 0.8)].filter((w, i, a) => w < top && a.indexOf(w) === i);
  return [...steps.map((w, i) => `${kg(w)}/${[10, 6, 4][i]}`), `${kg(top)}/${topReps} в 2`].join(", ");
}

function ex(name: string, text: string, extra: Partial<ProgramExercise> = {}): ProgramExercise {
  const prescription = parsePrescription(text);
  const kind = extra.kind ?? (prescription.distanceKm !== undefined ? "cardio" : "main");
  return { name, prescription, ...extra, kind };
}

const warmup = (cardio: string, distance: string, circuit: [string, string][]): ProgramExercise[] => [
  ex(cardio, distance),
  ...circuit.map(([n, t], i) => ex(n, t, { kind: "circuit", ...(i === 0 ? { rounds: 3 } : {}) })),
];
const own = (): ProgramExercise[] => [0, 1, 2].map(() => ex("сам", "", { kind: "own" }));

/** Интенсивность по неделям: подводка к пику и разгрузка перед стартом. */
const TOP_PERCENT = [80, 84, 88, 90, 92, 85];
const TOP_REPS = [5, 4, 3, 2, 2, 2];

function curlProgram(maxes: Record<"strictCurl" | "classicCurl" | "extremeCurl" | "squat" | "bench", number>, standards: RankStandard[]): Program {
  const weeks: ProgramWeek[] = [];
  for (let n = 1; n <= 7; n++) {
    const start = n === 7;
    const p = TOP_PERCENT[n - 1] ?? 85;
    const r = TOP_REPS[n - 1] ?? 2;
    const attempt = (max: number) => `${ladder(max, 80, 2)} помост ${kg(round(max * 1.02))}`;
    weeks.push({
      number: n,
      title: start ? `${n} Неделя СТАРТ` : `${n} Неделя ${8 - n} НЕДЕЛИ ДО СТАРТА`,
      note: "Свои упражнения — не на те же мышцы, что я прописал",
      maxes: { ...maxes },
      percents: [100, 92, 88, 84, 80, 70],
      standards: start ? standards : [],
      workouts: [
        {
          title: "Тренировка 1",
          exercises: [
            ...warmup("Велосипед", "3,5 км", [["Присед с диском", "15/15"], ["Пресс с диском", "12"], ["Косые", "10+10"]]),
            ex("Присед", ladder(maxes.squat, start ? 60 : p - 10, 5)),
            ex("Жим лёжа", ladder(maxes.bench, start ? 60 : p - 8, 4)),
            ex("Строгий бицепс", start ? "10/10, 30/6, 40/3 в 2" : ladder(maxes.strictCurl, p, r, 10)),
            ...(start ? [ex("Трицепс в блоке", "/10 в 4")] : own()),
          ],
        },
        {
          title: "Тренировка 2",
          exercises: [
            ...warmup("Гребля", "1,5 км", [["Разгибания", "/10"], ["Уголок", "12"], ["Планка", "40"]]),
            ex("Жим гантелей лёжа", "12,5/10, 15/8, 17,5/8, 15/8"),
            ex("Становая тяга в лямках", ladder(maxes.squat * 1.1, start ? 60 : p - 12, 3)),
            ex("Классический бицепс", start ? "30/4, 45/3" : ladder(maxes.classicCurl, p, r, 10)),
          ],
        },
        {
          title: "Тренировка 3",
          exercises: [
            ...warmup("Велосипед", "3,5 км", [["Присед с диском", "15/12"], ["Уголок", "12"], ["Косые", "10+10"]]),
            ...(start
              ? [
                  ex("Строгий", attempt(maxes.strictCurl)),
                  ex("Классический", attempt(maxes.classicCurl)),
                  ex("Экстремальный", attempt(maxes.extremeCurl)),
                ]
              : [
                  ex("Присед", ladder(maxes.squat, p - 6, 3)),
                  ex("Жим лёжа", ladder(maxes.bench, p - 6, 3)),
                  ex("Экстремальный бицепс", ladder(maxes.extremeCurl, p, r, 10) + (n === 6 ? " ?" : "")),
                  ...own(),
                ]),
          ],
        },
      ],
    });
  }
  return { weeks };
}

function powerliftingProgram(maxes: Record<"squat" | "bench" | "deadlift", number>, standards: RankStandard[]): Program {
  const weeks: ProgramWeek[] = [];
  for (let n = 1; n <= 7; n++) {
    const start = n === 7;
    const p = TOP_PERCENT[n - 1] ?? 85;
    const r = TOP_REPS[n - 1] ?? 2;
    const attempt = (max: number) => `${ladder(max, 85, 1)} помост ${kg(round(max * 1.02))}`;
    weeks.push({
      number: n,
      title: start ? `${n} Неделя СТАРТ` : `${n} Неделя ${8 - n} НЕДЕЛИ ДО СТАРТА`,
      maxes: { ...maxes },
      percents: [100, 92, 88, 84, 80, 70],
      standards: start ? standards : [],
      workouts: [
        {
          title: "Тренировка 1",
          exercises: [
            ...warmup("Велосипед", "3,5 км", [["Присед с диском", "15/15"], ["Пресс с диском", "12"]]),
            ex("Присед", start ? ladder(maxes.squat, 70, 2) : ladder(maxes.squat, p, r)),
            ex("Жим лёжа", start ? ladder(maxes.bench, 70, 2) : ladder(maxes.bench, p - 4, r + 1)),
            ex("Тяга верхнего блока", "/10 в 4"),
            ...(start ? [] : own()),
          ],
        },
        {
          title: "Тренировка 2",
          exercises: [
            ...warmup("Гребля", "1,5 км", [["Планка", "40"], ["Уголок", "12"]]),
            ex("Становая тяга", start ? ladder(maxes.deadlift, 65, 2) : ladder(maxes.deadlift, p - 2, r)),
            ex("Жим лёжа с паузой", ladder(maxes.bench, start ? 60 : p - 12, 3)),
          ],
        },
        {
          title: "Тренировка 3",
          exercises: start
            ? [ex("Присед", attempt(maxes.squat)), ex("Жим лёжа", attempt(maxes.bench)), ex("Становая тяга", attempt(maxes.deadlift))]
            : [
                ...warmup("Велосипед", "3,5 км", [["Косые", "10+10"], ["Разгибания", "/12"]]),
                ex("Присед с паузой", ladder(maxes.squat, p - 15, 3)),
                ex("Жим лёжа", ladder(maxes.bench, p, r) + (n === 5 ? " ?" : "")),
                ...own(),
              ],
        },
      ],
    });
  }
  return { weeks };
}

// Нормативы вымышленные — у настоящих федераций они зависят от весовой категории
const CURL_STANDARDS: RankStandard[] = [
  { rank: "КМС", values: { strictCurl: 45, classicCurl: 50, extremeCurl: 60 }, total: 155 },
  { rank: "МС", values: { strictCurl: 52.5, classicCurl: 57.5, extremeCurl: 70 }, total: 180 },
  { rank: "МСМК", values: { strictCurl: 62.5, classicCurl: 67.5, extremeCurl: 80 }, total: 210 },
];
const PL_STANDARDS: RankStandard[] = [
  { rank: "КМС", values: { squat: 140, bench: 90, deadlift: 160 }, total: 390 },
  { rank: "МС", values: { squat: 165, bench: 105, deadlift: 185 }, total: 455 },
  { rank: "МСМК", values: { squat: 190, bench: 125, deadlift: 215 }, total: 530 },
];

export const MOCK_ATHLETES: Athlete[] = [
  {
    id: "a1", name: "Кирилл Соколов", sport: "curl", startDate: addDays(MOCK_TODAY, 10), demo: true,
    program: curlProgram({ strictCurl: 50, classicCurl: 57.5, extremeCurl: 65, squat: 110, bench: 95 }, CURL_STANDARDS),
  },
  {
    id: "a2", name: "Вера Ильина", sport: "powerlifting", startDate: addDays(MOCK_TODAY, 31), demo: true,
    program: powerliftingProgram({ squat: 135, bench: 77.5, deadlift: 165 }, PL_STANDARDS),
  },
  {
    id: "a3", name: "Тимур Галиев", sport: "curl", startDate: addDays(MOCK_TODAY, 44), demo: true,
    program: curlProgram({ strictCurl: 57.5, classicCurl: 62.5, extremeCurl: 72.5, squat: 140, bench: 110 }, CURL_STANDARDS),
  },
];
