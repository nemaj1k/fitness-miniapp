import { test } from "node:test";
import assert from "node:assert/strict";
import { strToU8, zipSync } from "fflate";
import { readXlsx } from "./xlsx.ts";

// Крошечная книга в формате Google Таблиц: два листа, общие строки, числа, пустые хвосты
function book(): Uint8Array {
  const files: Record<string, string> = {
    "xl/workbook.xml": `<workbook><sheets>
      <sheet name="7 Неделя  СТАРТ" sheetId="1" r:id="rId3"/>
      <sheet name="1 Неделя &amp; заметки" sheetId="2" r:id="rId4"/>
    </sheets></workbook>`,
    "xl/_rels/workbook.xml.rels": `<Relationships>
      <Relationship Id="rId3" Type="ws" Target="worksheets/sheet1.xml"/>
      <Relationship Id="rId4" Type="ws" Target="worksheets/sheet2.xml"/>
    </Relationships>`,
    "xl/sharedStrings.xml": `<sst><si><t>Тренировка 1</t></si><si><r><t>20/10, </t></r><r><t xml:space="preserve">50/8</t></r></si><si><t>Присед</t></si></sst>`,
    "xl/worksheets/sheet1.xml": `<worksheet><sheetData>
      <row r="1"><c r="B1" t="s"><v>0</v></c></row>
      <row r="3"><c r="B3" t="s"><v>2</v></c><c r="C3" t="s"><v>1</v></c><c r="F3"><v>82.799999999999997</v></c><c r="G3"><v>0.92</v></c></row>
      <row r="5"><c r="B5" t="inlineStr"><is><t>сам</t></is></c></row>
      <row r="9"><c r="A9" t="s"/></row>
    </sheetData></worksheet>`,
    "xl/worksheets/sheet2.xml": `<worksheet><sheetData/></worksheet>`,
  };
  return zipSync(Object.fromEntries(Object.entries(files).map(([k, v]) => [k, strToU8(v)])));
}

test("листы по порядку с названиями, ячейки по своим колонкам", () => {
  const sheets = readXlsx(book());
  assert.deepEqual(sheets.map((s) => s.title), ["7 Неделя  СТАРТ", "1 Неделя & заметки"]);
  const g = sheets[0]!.grid;
  assert.equal(g[0]![1], "Тренировка 1");
  assert.equal(g[1]!.length, 0, "пропущенная строка остаётся пустой");
  assert.equal(g[2]![1], "Присед");
  assert.equal(g[2]![2], "20/10, 50/8", "строка из кусков склеивается");
  assert.equal(g[4]![1], "сам");
});

test("числа с запятой без хвостов float; пустой хвост листа отрезан", () => {
  const g = readXlsx(book())[0]!.grid;
  assert.equal(g[2]![5], "82,8");
  assert.equal(g[2]![6], "0,92");
  assert.equal(g.length, 5);
  assert.deepEqual(readXlsx(book())[1]!.grid, []);
});
