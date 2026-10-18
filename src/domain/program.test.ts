import { test } from "node:test";
import assert from "node:assert/strict";
import { parseCsv } from "./csv.ts";
import { currentWeekNumber, parseProgram, parseWeek, percentOf, rankProgress } from "./program.ts";

// Вымышленный лист в формате таблицы тренера: те же блоки и колонки, другие упражнения и цифры
const START_WEEK = parseCsv(`,Свои упражнения — не на те же мышцы,,,,,,,,,,,,,,,
,,,,,,,,,,,,,,,,
,Тренировка 1,,,,,,,,,,,,,,,
,Велосипед,"3,5 км",,,ПРИСЕД,,,,ЖИМ,,,,ТЯГА,,,
,Разгибание,10,3,,120,100 %,1,,80,100 %,1,,0,100 %,1,
,Пресс с диском,10/12,,,"110,4",92 %,2,,"73,6",92 %,2,,0,92 %,2,
,Косые,10+10,,,"105,6",88 %,3,,"70,4",88 %,3,,0,88 %,3,
,Присед,"20/10, 60/8, 80/5 в 3",,,,,,,,,,,,,,
,Жим лежа ,"20/10, 50/6, 65/2 в 2",,,,,,,,,,,,,,
,Трицепс в блоке,/12 в 4,,,,,,,,,,,,,,
,сам,,,,,,,,,,,,,,,
,,,,,кмс,50,,,,55,,,,65,,160
,,,,,мс,"57,5",,,,"62,5",,,,75,,185
,Тренировка 2,,,,мсмк,"67,5",,,,"72,5",,,,85,,210
,Гребля,"1,5 км",,,Строгий,,,,Классический,,,,Экстремальный,,,
,Планка,40,3,,"52,5",100 %,1,,60,100 %,1,,70,100 %,1,
,Уголок,12,,,"48,3",92 %,2,,"55,2",92 %,2,,"64,4",92 %,2,
,Строгий ,"20/10, 40/5, 45/2, 50/1 помост  55",,,,,,,,,,,,,,
,Классический,"30/4, 45/3 помост 62,5",,,,,,,,,,,,,,
`);

test("тренировки, кардио, разминочный круг и свои упражнения", () => {
  const week = parseWeek("7 Неделя  СТАРТ", START_WEEK);
  assert.equal(week.number, 7);
  assert.equal(week.note, "Свои упражнения — не на те же мышцы");
  assert.deepEqual(week.workouts.map((w) => w.title), ["Тренировка 1", "Тренировка 2"]);
  const kinds = week.workouts[0]!.exercises.map((e) => `${e.name}:${e.kind}`);
  assert.deepEqual(kinds, [
    "Велосипед:cardio",
    "Разгибание:circuit",
    "Пресс с диском:circuit",
    "Косые:circuit",
    "Присед:main",
    "Жим лежа:main",
    "Трицепс в блоке:main",
    "сам:own",
  ]);
  assert.equal(week.workouts[0]!.exercises[1]!.rounds, 3);
});

test("максимумы из обоих блоков; ноль — дисциплину не делает", () => {
  const week = parseWeek("7 Неделя  СТАРТ", START_WEEK);
  assert.deepEqual(week.maxes, { squat: 120, bench: 80, strictCurl: 52.5, classicCurl: 60, extremeCurl: 70 });
  assert.deepEqual(week.percents, [100, 92, 88]);
});

test("нормативы относятся к ближайшему блоку — здесь к подъёму на бицепс", () => {
  const week = parseWeek("7 Неделя  СТАРТ", START_WEEK);
  assert.deepEqual(week.standards, [
    { rank: "КМС", values: { strictCurl: 50, classicCurl: 55, extremeCurl: 65 }, total: 160 },
    { rank: "МС", values: { strictCurl: 57.5, classicCurl: 62.5, extremeCurl: 75 }, total: 185 },
    { rank: "МСМК", values: { strictCurl: 67.5, classicCurl: 72.5, extremeCurl: 85 }, total: 210 },
  ]);
});

test("помост в неделе старта", () => {
  const week = parseWeek("7 Неделя  СТАРТ", START_WEEK);
  const curls = week.workouts[1]!.exercises.filter((e) => e.prescription.platformKg !== undefined);
  assert.deepEqual(curls.map((e) => e.prescription.platformKg), [55, 62.5]);
});

test("до следующего разряда", () => {
  const { standards } = parseWeek("7 Неделя  СТАРТ", START_WEEK);
  assert.deepEqual(rankProgress(52.5, standards, "strictCurl"), { achieved: "КМС", next: { rank: "МС", gap: 5 } });
  assert.deepEqual(rankProgress(45, standards, "strictCurl"), { next: { rank: "КМС", gap: 5 } });
  assert.deepEqual(rankProgress(90, standards, "extremeCurl"), { achieved: "МСМК" });
  assert.deepEqual(rankProgress(undefined, standards, "strictCurl"), {});
});

test("недели по порядку, пустые листы пропускаются; текущая неделя по дате старта", () => {
  const program = parseProgram([
    { title: "7 Неделя  СТАРТ", grid: START_WEEK },
    { title: "Заметки", grid: [["", "просто текст"]] },
    { title: "1 Неделя 7 НЕДЕЛИ ДО СТАРТА", grid: START_WEEK },
  ]);
  assert.deepEqual(program.weeks.map((w) => w.number), [1, 7]);
  assert.equal(currentWeekNumber(program, "2026-10-24", "2026-10-20"), 7); // старт через 4 дня
  // 0–6 дней до старта — неделя 7, 7–13 — неделя 6, 14–20 — неделя 5
  assert.equal(currentWeekNumber(program, "2026-10-24", "2026-10-14"), 6);
  assert.equal(currentWeekNumber(program, "2026-10-24", "2026-10-10"), 5);
  assert.equal(currentWeekNumber(program, "2026-12-31", "2026-10-10"), 1);
  assert.equal(currentWeekNumber(program, "2026-10-01", "2026-10-10"), 7); // старт прошёл
});

test("проценты от максимума как в таблице", () => {
  assert.equal(percentOf(55, 92), 50.6);
  assert.equal(percentOf(90, 84), 75.6);
});
