import { useState, type FormEvent } from "react";
import { fetchProgramFromSheet, guessSport, ImportError, type Athlete } from "../data/athletes.ts";
import { addDays } from "../domain/format.ts";
import { SPORT_LABELS, type Program, type Sport } from "../domain/program.ts";

interface Props {
  today: string;
  onImported: (athlete: Athlete) => void;
  onCancel: () => void;
}

type State = { kind: "idle" } | { kind: "loading" } | { kind: "error"; message: string } | { kind: "ready"; program: Program };

/** Загрузка программы спортсмена по ссылке на Google Таблицу тренера. */
export function ImportForm({ today, onImported, onCancel }: Props) {
  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [sport, setSport] = useState<Sport>("curl");
  const [startDate, setStartDate] = useState(addDays(today, 14));
  const [state, setState] = useState<State>({ kind: "idle" });

  async function load(e: FormEvent) {
    e.preventDefault();
    setState({ kind: "loading" });
    try {
      const program = await fetchProgramFromSheet(url);
      setSport(guessSport(program));
      setState({ kind: "ready", program });
    } catch (err) {
      setState({ kind: "error", message: err instanceof ImportError ? err.message : "Не удалось прочитать таблицу. Попробуйте ещё раз." });
    }
  }

  function save(e: FormEvent) {
    e.preventDefault();
    if (state.kind !== "ready") return;
    onImported({
      id: `imp-${Date.now()}`,
      name: name.trim(),
      sport,
      startDate,
      program: state.program,
      sourceUrl: url.trim(),
      importedAt: today,
    });
  }

  if (state.kind === "ready") {
    const workouts = state.program.weeks.reduce((n, w) => n + w.workouts.length, 0);
    return (
      <form className="card form" onSubmit={save}>
        <h2 className="card__title">Таблица прочитана</h2>
        <p className="form__hint">
          Недель: {state.program.weeks.length}, тренировок: {workouts}. Осталось указать, чья это программа и когда старт.
        </p>
        <label className="form__field">
          <span>Имя спортсмена</span>
          <input value={name} onChange={(e) => setName(e.target.value)} required autoComplete="off" placeholder="Имя и фамилия" />
        </label>
        <label className="form__field">
          <span>Дата старта</span>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
        </label>
        <div className="form__field">
          <span>Вид спорта</span>
          <div className="segments" role="group" aria-label="Вид спорта">
            {(Object.keys(SPORT_LABELS) as Sport[]).map((s) => (
              <button key={s} type="button" className="segments__item" aria-pressed={sport === s} onClick={() => setSport(s)}>
                {SPORT_LABELS[s]}
              </button>
            ))}
          </div>
        </div>
        <button type="submit" className="button" disabled={!name.trim()}>
          Добавить спортсмена
        </button>
        <button type="button" className="button button--ghost" onClick={onCancel}>
          Отмена
        </button>
      </form>
    );
  }

  return (
    <form className="card form" onSubmit={load}>
      <h2 className="card__title">Загрузить из Google Таблицы</h2>
      <p className="form__hint">
        Вставьте ссылку на таблицу с программой: каждый лист — неделя, в листе «Тренировка 1», «Тренировка 2»… Доступ к таблице
        — «Все, у кого есть ссылка».
      </p>
      <label className="form__field">
        <span>Ссылка на таблицу</span>
        <input
          type="url"
          inputMode="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          required
          placeholder="https://docs.google.com/spreadsheets/d/…"
        />
      </label>
      {state.kind === "error" && (
        <p className="form__error" role="alert">
          {state.message}
        </p>
      )}
      <button type="submit" className="button" disabled={state.kind === "loading" || !url.trim()}>
        {state.kind === "loading" ? "Загружаю таблицу…" : "Загрузить"}
      </button>
      <button type="button" className="button button--ghost" onClick={onCancel}>
        Отмена
      </button>
    </form>
  );
}
