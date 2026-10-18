import { test } from "node:test";
import assert from "node:assert/strict";
import { expandSets, parsePrescription, totalSets } from "./prescription.ts";

test("подходы по одному для отметок", () => {
  assert.deepEqual(expandSets(parsePrescription("50/8, 70/3 в 2")), [
    { kg: 50, reps: "8" },
    { kg: 70, reps: "3" },
    { kg: 70, reps: "3" },
  ]);
  assert.deepEqual(expandSets(parsePrescription("/10 в 2")), [{ reps: "10" }, { reps: "10" }]);
});

test("лесенка подходов вес/повторы", () => {
  const p = parsePrescription("20/10, 50/8, 70/6, 80/5");
  assert.deepEqual(p.sets, [
    { kg: 20, reps: "10", times: 1 },
    { kg: 50, reps: "8", times: 1 },
    { kg: 70, reps: "6", times: 1 },
    { kg: 80, reps: "5", times: 1 },
  ]);
  assert.equal(totalSets(p), 4);
});

test("«в 2» — повторить подход", () => {
  const p = parsePrescription("20/10, 50/8, 60/6, 70/3 в 2");
  assert.deepEqual(p.sets[p.sets.length - 1], { kg: 70, reps: "3", times: 2 });
  assert.equal(totalSets(p), 5);
});

test("без веса: «/10 в 4», только повторы, на каждую сторону", () => {
  assert.deepEqual(parsePrescription("/10 в 4").sets, [{ reps: "10", times: 4 }]);
  assert.deepEqual(parsePrescription("12").sets, [{ reps: "12", times: 1 }]);
  assert.deepEqual(parsePrescription("10+10").sets, [{ reps: "10+10", times: 1 }]);
  assert.deepEqual(parsePrescription("15/10+10").sets, [{ kg: 15, reps: "10+10", times: 1 }]);
});

test("дробный вес с запятой не путается с разделителем подходов", () => {
  assert.deepEqual(parsePrescription("12,5/10, 15/8, 17,5/8").sets, [
    { kg: 12.5, reps: "10", times: 1 },
    { kg: 15, reps: "8", times: 1 },
    { kg: 17.5, reps: "8", times: 1 },
  ]);
  assert.deepEqual(parsePrescription("40/4, 50/3, 60/1, 67,5/1").sets[3], { kg: 67.5, reps: "1", times: 1 });
});

test("опечатки тренера: лишний слэш и запятая в конце", () => {
  assert.equal(parsePrescription("10/10, 30/6, 40/3, 45/2/, 50/2, ").sets.length, 5);
});

test("точка вместо запятой, третье число — подходы, «?» — на самочувствие", () => {
  assert.equal(parsePrescription("20/10. 40/8, 50/5, 60/3").sets.length, 4);
  assert.equal(parsePrescription("20/10, 40/6, 50/6. 60/4, 65/2, 70/2 в 3").sets.length, 6);
  assert.deepEqual(parsePrescription("40/3, 45/2/1, 50/2").sets[1], { kg: 45, reps: "2", times: 1 });
  const p = parsePrescription("20/10, 50/6, 65/5, 75/2, 82,5/2 ?");
  assert.equal(p.optional, true);
  assert.deepEqual(p.sets[4], { kg: 82.5, reps: "2", times: 1 });
});

test("кардио и помост", () => {
  assert.equal(parsePrescription("3,5 км").distanceKm, 3.5);
  const p = parsePrescription("20/10, 40/5, 45/2, 50/1 помост  55");
  assert.equal(p.platformKg, 55);
  assert.equal(p.sets.length, 4);
});

test("нераспознанное остаётся текстом", () => {
  const p = parsePrescription("до отказа");
  assert.deepEqual(p.sets, []);
  assert.equal(p.raw, "до отказа");
});
