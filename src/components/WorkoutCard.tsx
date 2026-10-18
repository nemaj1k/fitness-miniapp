import { daysBetween, formatDaysAgoShort, formatSet, formatWorkoutDate } from "../domain/format.ts";
import type { Workout } from "../domain/training.ts";

export function WorkoutCard({ workout, today }: { workout: Workout; today: string }) {
  const hasRpe = workout.exercises.some((e) => e.sets.some((s) => s.rpe !== undefined));
  return (
    <article className="workout">
      <header className="workout__head">
        <span>
          <b>{workout.title}</b>
          <span className="workout__date">{formatWorkoutDate(workout.date)}</span>
        </span>
        <span className="muted">{formatDaysAgoShort(daysBetween(workout.date, today))}</span>
      </header>
      {workout.exercises.map((exercise) => (
        <div key={exercise.name} className="workout__exercise">
          <div className="workout__name">{exercise.name}</div>
          <div className="workout__sets">
            {exercise.sets.map((set, i) => {
              const [main, rpe] = formatSet(set).split(" ");
              return (
                <span key={i}>
                  {main}
                  {rpe && <span className="muted"> {rpe}</span>}
                </span>
              );
            })}
          </div>
        </div>
      ))}
      {!hasRpe && <div className="workout__note">RPE клиент не указал</div>}
    </article>
  );
}
