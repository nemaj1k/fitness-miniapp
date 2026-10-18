import { test } from "node:test";
import assert from "node:assert/strict";
import { compareByAttention, getClientStatus, needsNudge, THRESHOLDS } from "./status.ts";

test("клиент, который недавно писал и не пропускал, — активен", () => {
  assert.equal(getClientStatus({ daysSinceLastLog: 2, missedSessions: 0 }), "active");
});

test("пропущено 2 тренировки — жёлтый", () => {
  assert.equal(getClientStatus({ daysSinceLastLog: 4, missedSessions: 2 }), "warning");
});

test("одна пропущенная тренировка ещё не повод для жёлтого", () => {
  assert.equal(getClientStatus({ daysSinceLastLog: 3, missedSessions: 1 }), "active");
});

test("7 дней без записей — риск ухода, даже если пропусков мало", () => {
  assert.equal(getClientStatus({ daysSinceLastLog: 7, missedSessions: 0 }), "risk");
});

test("риск важнее жёлтого", () => {
  assert.equal(getClientStatus({ daysSinceLastLog: 12, missedSessions: 4 }), "risk");
});

test("граница красного: 6 дней — ещё не риск, 7 — уже риск", () => {
  assert.notEqual(getClientStatus({ daysSinceLastLog: THRESHOLDS.riskDaysSilent - 1, missedSessions: 0 }), "risk");
  assert.equal(getClientStatus({ daysSinceLastLog: THRESHOLDS.riskDaysSilent, missedSessions: 0 }), "risk");
});

test("красный флаг «написать» с 5 дней без записей", () => {
  assert.equal(needsNudge({ daysSinceLastLog: 4, missedSessions: 2 }), false);
  assert.equal(needsNudge({ daysSinceLastLog: 5, missedSessions: 2 }), true);
});

test("сортировка: риск, потом жёлтые, потом активные; внутри группы — кто молчит дольше", () => {
  const people = [
    { name: "Анна", daysSinceLastLog: 1, missedSessions: 0 },
    { name: "Павел", daysSinceLastLog: 4, missedSessions: 2 },
    { name: "Артём", daysSinceLastLog: 9, missedSessions: 3 },
    { name: "Екатерина", daysSinceLastLog: 12, missedSessions: 4 },
    { name: "Дмитрий", daysSinceLastLog: 5, missedSessions: 2 },
    { name: "Мария", daysSinceLastLog: 3, missedSessions: 0 },
  ];
  const sorted = [...people].sort(compareByAttention).map((p) => p.name);
  assert.deepEqual(sorted, ["Екатерина", "Артём", "Дмитрий", "Павел", "Мария", "Анна"]);
});
