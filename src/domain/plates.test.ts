import { test } from "node:test";
import assert from "node:assert/strict";
import { platesPerSide } from "./plates.ts";

test("раскладка как в зале: от тяжёлых блинов к лёгким", () => {
  assert.deepEqual(platesPerSide(107.5).plates, [25, 15, 2.5, 1.25]);
  assert.deepEqual(platesPerSide(87.5).plates, [25, 5, 2.5, 1.25]);
  assert.deepEqual(platesPerSide(60).plates, [20]);
  assert.deepEqual(platesPerSide(140).plates, [25, 25, 10]);
});

test("пустой гриф и вес легче грифа — без блинов", () => {
  assert.deepEqual(platesPerSide(20), { plates: [], rest: 0 });
  assert.deepEqual(platesPerSide(15), { plates: [], rest: 0 });
});

test("вес, который не набирается ровно, — остаток", () => {
  assert.deepEqual(platesPerSide(61), { plates: [20], rest: 0.5 });
});
