import type { ClientActivity } from "../domain/status.ts";

export interface Client extends ClientActivity {
  id: string;
  name: string;
  /** Главное упражнение, по которому тренер смотрит прогресс */
  mainLift: { name: string; kg: number };
}

// Вымышленные данные. Заменим на данные из базы, когда подключим Supabase.
export const MOCK_CLIENTS: Client[] = [
  { id: "c1", name: "Екатерина Власова", mainLift: { name: "Присед", kg: 62.5 }, daysSinceLastLog: 12, missedSessions: 4 },
  { id: "c2", name: "Артём Беляев", mainLift: { name: "Присед", kg: 107.5 }, daysSinceLastLog: 9, missedSessions: 3 },
  { id: "c3", name: "Дмитрий Орлов", mainLift: { name: "Присед", kg: 87.5 }, daysSinceLastLog: 5, missedSessions: 2 },
  { id: "c4", name: "Павел Новиков", mainLift: { name: "Присед", kg: 77.5 }, daysSinceLastLog: 4, missedSessions: 2 },
  { id: "c5", name: "Мария Козлова", mainLift: { name: "Присед", kg: 50 }, daysSinceLastLog: 3, missedSessions: 0 },
  { id: "c6", name: "Игорь Лебедев", mainLift: { name: "Присед", kg: 105 }, daysSinceLastLog: 2, missedSessions: 0 },
  { id: "c7", name: "Анна Смирнова", mainLift: { name: "Присед", kg: 67.5 }, daysSinceLastLog: 1, missedSessions: 0 },
  { id: "c8", name: "Олеся Романова", mainLift: { name: "Присед", kg: 60 }, daysSinceLastLog: 1, missedSessions: 0 },
];
