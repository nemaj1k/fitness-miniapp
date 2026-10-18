import { test } from "node:test";
import assert from "node:assert/strict";
import { nudgeDetails, nudgeHeadline, nudgeMessage, nudgeTitle } from "./nudge.ts";

test("заголовок блока: собирательные до семи, дальше числом", () => {
  assert.equal(nudgeTitle(1), "Написать одному клиенту");
  assert.equal(nudgeTitle(3), "Написать троим");
  assert.equal(nudgeTitle(7), "Написать семерым");
  assert.equal(nudgeTitle(9), "Написать 9 клиентам");
  assert.equal(nudgeTitle(21), "Написать 21 клиенту");
});

const TODAY = "2026-10-17"; // суббота

test("заголовок со склонением", () => {
  assert.equal(nudgeHeadline(5), "Нет записей 5 дней");
  assert.equal(nudgeHeadline(21), "Нет записей 21 день");
  assert.equal(nudgeHeadline(22), "Нет записей 22 дня");
});

test("пояснение как в макете: понедельник и 2 пропуска", () => {
  assert.equal(
    nudgeDetails("2026-10-12", TODAY, 2),
    "Последняя запись в понедельник, после неё пропущены 2 тренировки.",
  );
});

test("склонение пропусков и предлог «во вторник»", () => {
  assert.equal(nudgeDetails("2026-10-13", TODAY, 1), "Последняя запись во вторник, после неё пропущена 1 тренировка.");
  assert.equal(nudgeDetails("2026-10-14", TODAY, 5), "Последняя запись в среду, после неё пропущено 5 тренировок.");
  assert.equal(nudgeDetails("2026-10-14", TODAY, 0), "Последняя запись в среду.");
});

test("старше недели — дата вместо дня недели", () => {
  assert.equal(nudgeDetails("2026-10-05", TODAY, 4), "Последняя запись 5 окт, после неё пропущены 4 тренировки.");
});

test("сообщение обращается по имени", () => {
  assert.match(nudgeMessage("Дмитрий"), /^Привет, Дмитрий! /);
});
