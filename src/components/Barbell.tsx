import { platesPerSide } from "../domain/plates.ts";

/** Одна сторона грифа с блинами в цветах олимпийских блинов — рабочий вес «как в зале». */
export function Barbell({ kg }: { kg: number }) {
  const { plates } = platesPerSide(kg);
  return (
    <span className="barbell" aria-hidden="true">
      <span className="barbell__shaft" />
      {plates.map((p, i) => (
        <span key={i} className="plate" data-kg={p} />
      ))}
      <span className="barbell__collar" />
      <span className="barbell__sleeve" />
    </span>
  );
}
