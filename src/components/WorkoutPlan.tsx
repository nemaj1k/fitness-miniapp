import { setKey, type DoneMap } from "../data/athletes.ts";
import { formatNumber } from "../domain/format.ts";
import { expandSets, type Prescription } from "../domain/prescription.ts";
import type { ProgramExercise, ProgramWorkout } from "../domain/program.ts";

interface Props {
  athleteId: string;
  week: number;
  index: number;
  workout: ProgramWorkout;
  done: DoneMap;
  onToggle: (key: string) => void;
}

/** Для строк разминки, где отмечать нечего: «15×10+10», без веса — «×10», кардио — «3,5 км». */
function compact(p: Prescription): string {
  if (p.distanceKm !== undefined) return `${formatNumber(p.distanceKm)} км`;
  if (p.sets.length === 0) return p.raw;
  return p.sets
    .map((s) => `${s.kg !== undefined ? `${formatNumber(s.kg)}×` : "×"}${s.reps}${s.times > 1 ? ` в ${s.times}` : ""}`)
    .join(", ");
}

/** Тренировка из программы: разминка одной строкой, основные упражнения — подходами, которые можно отметить. */
export function WorkoutPlan({ athleteId, week, index, workout, done, onToggle }: Props) {
  const cardio = workout.exercises.filter((e) => e.kind === "cardio");
  const circuit = workout.exercises.filter((e) => e.kind === "circuit");
  const ownCount = workout.exercises.filter((e) => e.kind === "own").length;
  const rounds = circuit.find((e) => e.rounds)?.rounds;

  const keysOf = (ei: number) =>
    expandSets(workout.exercises[ei]!.prescription).map((_, si) => setKey(athleteId, week, index, ei, si));
  const allKeys = workout.exercises.flatMap((e, ei) => (e.kind === "main" ? keysOf(ei) : []));
  const doneCount = allKeys.filter((k) => done[k]).length;

  return (
    <article className="workout">
      <header className="workout__head">
        <b>{workout.title}</b>
        {allKeys.length > 0 && (
          <span className="muted">
            {doneCount} из {allKeys.length}
          </span>
        )}
      </header>

      {(cardio.length > 0 || circuit.length > 0) && (
        <div className="warmup">
          <div className="warmup__title">Разминка</div>
          {cardio.map((e, i) => (
            <div key={i}>
              {e.name.trim()} {compact(e.prescription)}
            </div>
          ))}
          {circuit.length > 0 && (
            <div>
              {rounds ? `Круг ×${rounds}: ` : ""}
              {circuit.map((e) => `${e.name.trim()} ${compact(e.prescription)}`).join("; ")}
            </div>
          )}
        </div>
      )}

      {workout.exercises.map((e, ei) =>
        e.kind === "main" ? <MainExercise key={ei} exercise={e} setKeys={keysOf(ei)} done={done} onToggle={onToggle} /> : null,
      )}

      {ownCount > 0 && (
        <div className="workout__note">
          {ownCount === 1 ? "Одно своё упражнение" : `Своих упражнений: ${ownCount}`} — не на те же мышцы, что в программе
        </div>
      )}
    </article>
  );
}

interface ExerciseProps {
  exercise: ProgramExercise;
  setKeys: string[];
  done: DoneMap;
  onToggle: (key: string) => void;
}

function MainExercise({ exercise, setKeys, done, onToggle }: ExerciseProps) {
  const p = exercise.prescription;
  const sets = expandSets(p);
  return (
    <div className="workout__exercise">
      <div className="workout__name">{exercise.name.trim()}</div>
      {sets.length > 0 ? (
        <div className="sets">
          {sets.map((s, si) => {
            const key = setKeys[si]!;
            const isDone = Boolean(done[key]);
            const label = s.kg !== undefined ? `${formatNumber(s.kg)}×${s.reps}` : `×${s.reps}`;
            return (
              <button
                key={si}
                type="button"
                className="set"
                aria-pressed={isDone}
                aria-label={`${s.kg !== undefined ? `${formatNumber(s.kg)} кг` : "без веса"} на ${s.reps}${isDone ? ", сделано" : ""}`}
                onClick={() => onToggle(key)}
              >
                {label}
              </button>
            );
          })}
          {p.platformKg !== undefined && <span className="set set--platform">Помост {formatNumber(p.platformKg)}</span>}
        </div>
      ) : (
        <div className="workout__raw">{p.raw}</div>
      )}
      {p.optional && <div className="workout__note">Последний подход — по самочувствию</div>}
    </div>
  );
}
