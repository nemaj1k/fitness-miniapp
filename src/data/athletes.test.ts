import { test } from "node:test";
import assert from "node:assert/strict";
import { guessSport, sheetIdFromUrl } from "./athletes.ts";
import { MOCK_ATHLETES } from "./mockAthletes.ts";

test("ID таблицы из разных видов ссылок", () => {
  const id = "14jBzWvQN_ueTxDSCfBFjXGxCousTD-pck03IqOhxmCQ";
  assert.equal(sheetIdFromUrl(`https://docs.google.com/spreadsheets/d/${id}/edit?usp=sharing`), id);
  assert.equal(sheetIdFromUrl(`https://docs.google.com/spreadsheets/d/${id}/edit#gid=180748806`), id);
  assert.equal(sheetIdFromUrl(`docs.google.com/spreadsheets/d/${id}`), id);
  assert.equal(sheetIdFromUrl("https://example.com/table"), null);
});

test("вид спорта — по нормативам в программе", () => {
  assert.equal(guessSport(MOCK_ATHLETES[0]!.program), "curl");
  assert.equal(guessSport(MOCK_ATHLETES[1]!.program), "powerlifting");
});

test("в примерах все записи подходов разбираются", () => {
  for (const a of MOCK_ATHLETES) {
    assert.equal(a.program.weeks.length, 7, a.name);
    for (const w of a.program.weeks) {
      for (const e of w.workouts.flatMap((x) => x.exercises)) {
        if (e.kind === "own") continue;
        const p = e.prescription;
        assert.ok(p.sets.length > 0 || p.distanceKm !== undefined, `${a.name}, неделя ${w.number}: «${p.raw}»`);
      }
    }
    const start = a.program.weeks[6]!;
    assert.ok(start.workouts.some((x) => x.exercises.some((e) => e.prescription.platformKg)), `${a.name}: помост в неделе старта`);
  }
});
