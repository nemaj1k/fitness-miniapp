import { useState } from "react";
import { PercentTable } from "../components/PercentTable.tsx";
import { RankLadder } from "../components/RankLadder.tsx";
import { WorkoutPlan } from "../components/WorkoutPlan.tsx";
import type { Athlete, DoneMap } from "../data/athletes.ts";
import { daysBetween, formatDayMonth, formatStartCountdown } from "../domain/format.ts";
import { SPORT_LABELS, currentWeekNumber, latestMaxes, latestStandards } from "../domain/program.ts";
import { hapticSelection } from "../telegram/webApp.ts";

interface Props {
  athlete: Athlete;
  today: string;
  done: DoneMap;
  onToggle: (key: string) => void;
  onDelete: (id: string) => void;
  /** Ссылка «‹ Спортсмены» — только вне Telegram; в Telegram назад ведёт нативная кнопка */
  onBack: (() => void) | null;
}

/** Название листа тренера капсом → обычный регистр: «6 Неделя 2 НЕДЕЛИ ДО СТАРТА» → «6 неделя, 2 недели до старта». */
function sentenceCase(title: string): string {
  const lower = title.toLowerCase().replace(/(неделя)\s+(\d)/, "$1, $2").replace(/\s+/g, " ");
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

/** Карточка спортсмена: неделя программы, отметки подходов, максимумы против нормативов. */
export function AthleteScreen({ athlete, today, done, onToggle, onDelete, onBack }: Props) {
  const { program } = athlete;
  const current = currentWeekNumber(program, athlete.startDate, today);
  const [weekNumber, setWeekNumber] = useState(current);
  const week = program.weeks.find((w) => w.number === weekNumber) ?? program.weeks[0]!;
  const countdown = formatStartCountdown(daysBetween(today, athlete.startDate));
  const lastWeek = program.weeks[program.weeks.length - 1]!.number;
  const maxes = { ...latestMaxes(program), ...week.maxes };

  return (
    <main className="screen">
      {onBack && (
        <button type="button" className="back" onClick={onBack}>
          <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
            <path d="M12.5 4.5L7 10l5.5 5.5" />
          </svg>
          Спортсмены
        </button>
      )}

      <div className="profile">
        <div className="profile__main">
          <h1 className="profile__name">{athlete.name}</h1>
          <span className="pill pill--active">
            <span className="pill__dot" aria-hidden="true" />
            {SPORT_LABELS[athlete.sport]}
          </span>
        </div>
        <div className="row__weight">
          <span className="row__kg">
            {countdown.value}
            <small>{countdown.label}</small>
          </span>
          <span className="muted profile__date">старт {formatDayMonth(athlete.startDate)}</span>
        </div>
      </div>

      <div className="weeks" role="group" aria-label="Неделя программы">
        {program.weeks.map((w) => (
          <button
            key={w.number}
            type="button"
            className="weeks__item"
            aria-pressed={w.number === week.number}
            data-current={w.number === current}
            onClick={() => {
              hapticSelection();
              setWeekNumber(w.number);
            }}
          >
            {w.number === lastWeek ? "Старт" : w.number}
          </button>
        ))}
      </div>
      <p className="weeks__caption">
        {week.number === current ? "Эта неделя. " : ""}
        {sentenceCase(week.title)}
      </p>

      {week.note && <blockquote className="coach-note">{week.note}</blockquote>}

      <div className="workouts">
        {week.workouts.map((w, i) => (
          <WorkoutPlan
            key={`${week.number}-${i}`}
            athleteId={athlete.id}
            week={week.number}
            index={i}
            workout={w}
            done={done}
            onToggle={onToggle}
          />
        ))}
      </div>

      <RankLadder sport={athlete.sport} maxes={maxes} standards={latestStandards(program)} />
      <PercentTable sport={athlete.sport} maxes={maxes} percents={week.percents} />

      {athlete.sourceUrl && (
        <div className="source">
          <a href={athlete.sourceUrl} target="_blank" rel="noopener noreferrer">
            Открыть таблицу тренера
          </a>
          {!athlete.demo && (
            <button
              type="button"
              className="source__delete"
              onClick={() => {
                if (window.confirm(`Убрать ${athlete.name} из списка? Таблица тренера останется как есть.`)) onDelete(athlete.id);
              }}
            >
              Убрать из списка
            </button>
          )}
        </div>
      )}
      <p className="form__hint">
        Отметки подходов пока сохраняются только на этом телефоне — общими для тренера и спортсмена они станут после подключения
        базы.
      </p>
    </main>
  );
}
