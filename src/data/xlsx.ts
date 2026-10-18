// Минимальное чтение .xlsx: листы с названиями и ячейки строками. Без DOMParser,
// чтобы то же самое работало в тестах под Node. Формулы не считаем — берём сохранённые значения.

import { strFromU8, unzipSync } from "fflate";

export interface Sheet {
  title: string;
  grid: string[][];
}

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };

function decode(xml: string): string {
  return xml.replace(/&(#x[0-9a-f]+|#\d+|\w+);/gi, (whole, e: string) => {
    if (e[0] === "#") return String.fromCodePoint(e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : Number(e.slice(1)));
    return ENTITIES[e] ?? whole;
  });
}

/** Весь текст внутри <t>…</t> узла (строка может быть разбита на куски с разным форматированием). */
function textOf(xml: string): string {
  let out = "";
  for (const m of xml.matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)) out += decode(m[1]!);
  return out;
}

/** «AB12» → номер колонки с нуля (27). */
function columnIndex(ref: string): number {
  const letters = /^[A-Z]+/.exec(ref)?.[0] ?? "A";
  let n = 0;
  for (const ch of letters) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n - 1;
}

function attr(tag: string, name: string): string | undefined {
  return new RegExp(`\\s${name}="([^"]*)"`).exec(tag)?.[1];
}

/** Число из ячейки — с запятой, как пишет тренер: 82.8 → «82,8»; хвосты float обрезаем. */
function formatNumber(raw: string): string {
  const n = Number(raw);
  if (!Number.isFinite(n)) return raw;
  return String(Math.round(n * 1e6) / 1e6).replace(".", ",");
}

export function readXlsx(bytes: Uint8Array): Sheet[] {
  const files = unzipSync(bytes);
  const read = (path: string) => (files[path] ? strFromU8(files[path]!) : "");

  const shared = [...read("xl/sharedStrings.xml").matchAll(/<si>([\s\S]*?)<\/si>/g)].map((m) => textOf(m[1]!));

  // id связи → файл листа
  const rels = new Map<string, string>();
  for (const m of read("xl/_rels/workbook.xml.rels").matchAll(/<Relationship\b[^>]*>/g)) {
    const id = attr(m[0], "Id");
    const target = attr(m[0], "Target");
    if (id && target) rels.set(id, target.replace(/^\/?(xl\/)?/, "xl/"));
  }

  const sheets: Sheet[] = [];
  for (const m of read("xl/workbook.xml").matchAll(/<sheet\b[^>]*>/g)) {
    const title = decode(attr(m[0], "name") ?? "");
    const path = rels.get(attr(m[0], "r:id") ?? "");
    if (!path) continue;
    const grid: string[][] = [];
    for (const row of read(path).matchAll(/<row\b([^>]*)>([\s\S]*?)<\/row>/g)) {
      const r = Number(attr(row[1]!, "r") ?? grid.length + 1) - 1;
      const cells: string[] = [];
      for (const c of row[2]!.matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
        const col = columnIndex(attr(c[1]!, "r") ?? "");
        const type = attr(c[1]!, "t");
        const body = c[2] ?? "";
        const v = /<v>([\s\S]*?)<\/v>/.exec(body)?.[1];
        let value = "";
        if (type === "s" && v !== undefined) value = shared[Number(v)] ?? "";
        else if (type === "inlineStr") value = textOf(body);
        else if (type === "str" || type === "b" || type === "e") value = decode(v ?? "");
        else if (v !== undefined) value = formatNumber(v);
        cells[col] = value;
      }
      grid[r] = Array.from(cells, (x) => x ?? "");
    }
    // Google отдаёт ~1000 пустых строк на лист — отрезаем хвост
    const rows = Array.from(grid, (x) => x ?? []);
    while (rows.length > 0 && rows[rows.length - 1]!.every((cell) => cell.trim() === "")) rows.pop();
    sheets.push({ title, grid: rows });
  }
  return sheets;
}
