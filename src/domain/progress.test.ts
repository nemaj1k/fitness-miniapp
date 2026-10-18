import { test } from "node:test";
import assert from "node:assert/strict";
import { chartScale, forecastToGoal, weeklyPace } from "./progress.ts";

const weeks = (...kg: number[]) => kg.map((v, i) => ({ weekStart: `w${i}`, kg: v }));

// Данные из макета Client.dc.html: присед Дмитрия за 8 недель, цель 95
const MOCKUP = weeks(80, 82.5, 85, 85, 87.5, 87.5, 87.5, 87.5);

test("темп по макету — около +1 кг в неделю", () => {
  assert.ok(Math.abs(weeklyPace(MOCKUP) - 1.0417) < 0.001);
});

test("прогноз по макету — 8 недель до цели 95", () => {
  const f = forecastToGoal(MOCKUP, 95);
  assert.equal(f.kind, "weeks");
  if (f.kind === "weeks") assert.equal(f.weeks, 8);
});

test("без роста прогноза нет", () => {
  assert.deepEqual(forecastToGoal(weeks(90, 90, 90, 90), 100), { kind: "stalled" });
  assert.deepEqual(forecastToGoal(weeks(95, 92.5, 90), 100), { kind: "stalled" });
});

test("цель уже взята", () => {
  assert.deepEqual(forecastToGoal(weeks(90, 95, 100), 100), { kind: "reached" });
});

test("одна точка — темп ноль, прогноза нет", () => {
  assert.equal(weeklyPace(weeks(80)), 0);
  assert.deepEqual(forecastToGoal(weeks(80), 90), { kind: "stalled" });
  assert.deepEqual(forecastToGoal([], 90), { kind: "stalled" });
});

test("шкала по макету: 75…100 с шагом 5, цель внутри", () => {
  assert.deepEqual(chartScale([80, 87.5], 95), { min: 75, max: 100, ticks: [75, 80, 85, 90, 95, 100] });
});

test("шкала без цели и с ровными значениями оставляет запас", () => {
  assert.deepEqual(chartScale([60, 60]), { min: 55, max: 65, ticks: [55, 60, 65] });
});
