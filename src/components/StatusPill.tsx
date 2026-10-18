import { type ClientStatus } from "../domain/status.ts";

interface Props {
  status: ClientStatus;
  missedSessions: number;
}

function label(status: ClientStatus, missedSessions: number): string {
  if (status === "risk") return "Риск ухода";
  if (status === "warning") return `Пропусков: ${missedSessions}`;
  return "Активен";
}

export function StatusPill({ status, missedSessions }: Props) {
  return (
    <span className={`pill pill--${status}`}>
      <span className="pill__dot" aria-hidden="true" />
      {label(status, missedSessions)}
    </span>
  );
}
