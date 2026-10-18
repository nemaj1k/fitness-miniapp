import { test } from "node:test";
import assert from "node:assert/strict";
import {
  addDays,
  daysBetween,
  formatDateDots,
  formatDayMonth,
  formatDaysAgo,
  formatDaysAgoShort,
  formatHeaderDate,
  formatKg,
  formatPace,
  formatSet,
  formatWorkoutDate,
  initials,
  plural,
  rpeUsage,
  shortName,
} from "./format.ts";

test("склонение: день / дня / дней, включая 11-14 и 21", () => {
  const f = (n: number) => plural(n, "день", "дня", "дней");
  assert.equal(f(1), "день");
  assert.equal(f(2), "дня");
  assert.equal(f(4), "дня");
  assert.equal(f(5), "дней");
  assert.equal(f(11), "дней");
  assert.equal(f(12), "дней");
  assert.equal(f(14), "дней");
  assert.equal(f(21), "день");
  assert.equal(f(22), "дня");
  assert.equal(f(25), "дней");
  assert.equal(f(111), "дней");
});

test("давность записи", () => {
  assert.equal(formatDaysAgo(0), "сегодня");
  assert.equal(formatDaysAgo(1), "вчера");
  assert.equal(formatDaysAgo(3), "3 дня назад");
  assert.equal(formatDaysAgo(12), "12 дней назад");
  assert.equal(formatDaysAgo(21), "21 день назад");
});

test("инициалы и короткое имя", () => {
  assert.equal(initials("Екатерина Власова"), "ЕВ");
  assert.equal(initials("  дмитрий  орлов "), "ДО");
  assert.equal(initials("Мадонна"), "М");
  assert.equal(shortName("Екатерина Власова"), "Екатерина В.");
  assert.equal(shortName("Мадонна"), "Мадонна");
});

test("вес с запятой", () => {
  assert.equal(formatKg(62.5), "62,5 кг");
  assert.equal(formatKg(50), "50 кг");
});

test("темп: один знак после запятой и знак", () => {
  assert.equal(formatPace(1.0417), "+1,0 кг");
  assert.equal(formatPace(2.25), "+2,3 кг");
  assert.equal(formatPace(-0.5), "−0,5 кг");
  assert.equal(formatPace(0), "0,0 кг");
});

test("короткая давность для карточки", () => {
  assert.equal(formatDaysAgoShort(0), "сегодня");
  assert.equal(formatDaysAgoShort(1), "вчера");
  assert.equal(formatDaysAgoShort(5), "5 дн. назад");
});

test("даты как в макете", () => {
  assert.equal(formatWorkoutDate("2026-10-12"), "Пн 12 окт");
  assert.equal(formatWorkoutDate("2026-10-17"), "Сб 17 окт");
  assert.equal(formatWorkoutDate("2026-10-08"), "Чт 8 окт");
  assert.equal(formatDayMonth("2026-10-05"), "5 окт");
  assert.equal(formatDateDots("2026-08-24"), "24.08");
  assert.equal(formatHeaderDate("2026-10-17"), "Сб, 17 октября");
  assert.equal(formatHeaderDate("2026-03-01"), "Вс, 1 марта");
});

test("разница и сдвиг дат, в том числе через месяц", () => {
  assert.equal(daysBetween("2026-10-12", "2026-10-17"), 5);
  assert.equal(daysBetween("2026-09-28", "2026-10-05"), 7);
  assert.equal(addDays("2026-10-12", -49), "2026-08-24");
  assert.equal(addDays("2026-10-31", 1), "2026-11-01");
});

test("подходы: вес с запятой, RPE через @", () => {
  assert.equal(formatSet({ kg: 87.5, reps: 5 }), "87,5×5");
  assert.equal(formatSet({ kg: 65, reps: 6, rpe: 8 }), "65×6 @8");
});

test("RPE: всегда / иногда / не указывает", () => {
  const w = (...rpe: (number | undefined)[]) => ({ exercises: [{ sets: rpe.map((r) => ({ rpe: r })) }] });
  assert.equal(rpeUsage([w(7, 8)]), "всегда");
  assert.equal(rpeUsage([w(undefined), w(7)]), "иногда");
  assert.equal(rpeUsage([w(undefined, undefined)]), "не указывает");
  assert.equal(rpeUsage([]), "не указывает");
});
