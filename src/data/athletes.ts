// Спортсмены: вымышленные для примера + загруженные тренером из Google Таблиц.
// Пока нет базы, загруженные спортсмены и отметки «сделано» живут только в этом браузере
// (localStorage на телефоне тренера). Таблица с сервера Google читается напрямую, без нашего сервера.

import { latestStandards, parseProgram, type Program, type Sport } from "../domain/program.ts";
import { readXlsx } from "./xlsx.ts";

export interface Athlete {
  id: string;
  name: string;
  sport: Sport;
  /** Дата старта (соревнований), YYYY-MM-DD */
  startDate: string;
  program: Program;
  /** Ссылка на таблицу тренера, если спортсмен загружен из неё */
  sourceUrl?: string;
  /** Когда загрузили, YYYY-MM-DD */
  importedAt?: string;
  /** Вымышленный спортсмен из примера — удалить нельзя */
  demo?: boolean;
}

const STORAGE_KEY = "logbook.athletes.v1";
const DONE_KEY = "logbook.done.v1";

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function loadImportedAthletes(): Athlete[] {
  return readJson<Athlete[]>(STORAGE_KEY, []);
}

/** false — браузер не дал сохранить (приватный режим): спортсмен останется до перезапуска. */
export function saveImportedAthletes(athletes: Athlete[]): boolean {
  return writeJson(STORAGE_KEY, athletes);
}

// ── Отметки «сделано»: ключ — спортсмен, неделя, тренировка, упражнение, подход ──

export type DoneMap = Record<string, true>;

export function setKey(athleteId: string, week: number, workout: number, exercise: number, set: number): string {
  return `${athleteId}:${week}:${workout}:${exercise}:${set}`;
}

export function loadDone(): DoneMap {
  return readJson<DoneMap>(DONE_KEY, {});
}

export function saveDone(done: DoneMap): void {
  writeJson(DONE_KEY, done);
}

// ── Загрузка из Google Таблиц ──

/** ID таблицы из любой ссылки вида docs.google.com/spreadsheets/d/<id>/… */
export function sheetIdFromUrl(url: string): string | null {
  return /\/spreadsheets\/d\/([a-zA-Z0-9_-]{20,})/.exec(url)?.[1] ?? null;
}

export class ImportError extends Error {}

/** Скачивает таблицу целиком (.xlsx со всеми листами-неделями) и разбирает программу. */
export async function fetchProgramFromSheet(url: string): Promise<Program> {
  const id = sheetIdFromUrl(url);
  if (!id) throw new ImportError("Это не ссылка на Google Таблицу. Скопируйте адрес из строки браузера или кнопкой «Поделиться».");
  let response: Response;
  try {
    response = await fetch(`https://docs.google.com/spreadsheets/d/${id}/export?format=xlsx`);
  } catch {
    throw new ImportError("Не удалось связаться с Google. Проверьте интернет и попробуйте ещё раз.");
  }
  const type = response.headers.get("content-type") ?? "";
  if (!response.ok || !type.includes("spreadsheetml")) {
    throw new ImportError(
      "Таблица закрыта. В Google Таблицах нажмите «Настройки доступа» и выберите «Все, у кого есть ссылка», затем загрузите снова.",
    );
  }
  const sheets = readXlsx(new Uint8Array(await response.arrayBuffer()));
  const program = parseProgram(sheets);
  if (program.weeks.length === 0) {
    throw new ImportError("В таблице не нашлось тренировок. Нужны листы-недели со строками «Тренировка 1», «Тренировка 2»…");
  }
  return program;
}

/** Вид спорта по нормативам в таблице: тренер указывает их для своей дисциплины. */
export function guessSport(program: Program): Sport {
  const standards = latestStandards(program);
  const curl = standards.some((s) => s.values.strictCurl ?? s.values.classicCurl ?? s.values.extremeCurl);
  return curl ? "curl" : "powerlifting";
}
