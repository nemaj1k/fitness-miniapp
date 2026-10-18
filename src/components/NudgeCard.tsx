import { useEffect, useState } from "react";
import type { Client } from "../data/mockClients.ts";
import { nudgeDetails, nudgeHeadline, nudgeMessage } from "../domain/nudge.ts";
import { getWebApp } from "../telegram/webApp.ts";

type CopyState = "idle" | "copied" | "failed";

/** Красный флаг в карточке: почему пора написать и готовый текст сообщения. */
export function NudgeCard({ client, today }: { client: Client; today: string }) {
  const [copy, setCopy] = useState<CopyState>("idle");
  const firstName = client.name.trim().split(/\s+/)[0] ?? client.name;
  const message = nudgeMessage(firstName);
  const lastWorkout = client.workouts[0];

  useEffect(() => {
    if (copy === "idle") return;
    const timer = setTimeout(() => setCopy("idle"), 2500);
    return () => clearTimeout(timer);
  }, [copy]);

  async function send() {
    try {
      await navigator.clipboard.writeText(message);
      setCopy("copied");
    } catch {
      setCopy("failed");
    }
    // Чат открываем только по настоящему нику; Telegram не даёт подставить текст, поэтому он в буфере
    if (client.telegramUsername) getWebApp()?.openTelegramLink(`https://t.me/${client.telegramUsername}`);
  }

  const label = client.telegramUsername ? "Написать в Telegram" : "Скопировать текст";

  return (
    <section className="flag" aria-label="Кому написать">
      <div className="flag__title">{nudgeHeadline(client.daysSinceLastLog)}</div>
      {lastWorkout && (
        <div className="flag__details">{nudgeDetails(lastWorkout.date, today, client.missedSessions)}</div>
      )}
      <div className="flag__message">{message}</div>
      <button type="button" className="button" onClick={send}>
        {copy === "copied" ? "Текст скопирован" : label}
      </button>
      {copy === "failed" && <div className="flag__hint">Не удалось скопировать, выделите текст вручную</div>}
    </section>
  );
}
