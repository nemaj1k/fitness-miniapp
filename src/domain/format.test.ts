import { test } from "node:test";
import assert from "node:assert/strict";
import { formatDaysAgo, formatKg, initials, plural, shortName } from "./format.ts";

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
