import { useMemo, useState } from "react";
import { AthleteRow } from "../components/AthleteRow.tsx";
import { ImportForm } from "../components/ImportForm.tsx";
import type { Athlete } from "../data/athletes.ts";
import { daysBetween, plural } from "../domain/format.ts";

interface Props {
  athletes: Athlete[];
  today: string;
  onOpen: (id: string) => void;
  onImported: (athlete: Athlete) => void;
}

/** Спортсмены, которых тренер ведёт к старту: ближайший старт — сверху. */
export function AthletesScreen({ athletes, today, onOpen, onImported }: Props) {
  const [importing, setImporting] = useState(false);
  const sorted = useMemo(() => {
    const left = (a: Athlete) => daysBetween(today, a.startDate);
    // Прошедшие старты — в конец
    return [...athletes].sort((a, b) => (left(a) < 0 ? 1e6 : left(a)) - (left(b) < 0 ? 1e6 : left(b)));
  }, [athletes, today]);

  return (
    <>
      <div className="head">
        <h1 className="head__title">Спортсмены</h1>
        <p className="head__meta">
          {athletes.length} {plural(athletes.length, "человек", "человека", "человек")}
          <br />
          готовятся к старту
        </p>
      </div>

      {importing ? (
        <ImportForm
          today={today}
          onCancel={() => setImporting(false)}
          onImported={(a) => {
            setImporting(false);
            onImported(a);
          }}
        />
      ) : (
        <button type="button" className="button button--outline" onClick={() => setImporting(true)}>
          Загрузить из Google Таблицы
        </button>
      )}

      <h2 className="group">
        Ближайшие старты <span>{athletes.length}</span>
      </h2>
      <ul className="list">
        {sorted.map((a) => (
          <AthleteRow key={a.id} athlete={a} today={today} onOpen={onOpen} />
        ))}
      </ul>
    </>
  );
}
