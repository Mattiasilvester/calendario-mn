import type { CalendarEvent } from "../types/calendar";

export const MOCK_EVENTS: CalendarEvent[] = [
  {
    id: "evt-1",
    userId: "mattia",
    category: "universita",
    title: "Planning Sprint",
    description: "Allineamento backlog e priorità",
    start: "2026-03-30T07:00:00.000Z",
    end: "2026-03-30T08:30:00.000Z",
    tasks: [
      { id: "t-1-1", text: "Definire obiettivi giornata", completed: true },
      { id: "t-1-2", text: "Rivedere calendario", completed: false },
    ],
    status: "confirmed",
  },
  {
    id: "evt-2",
    userId: "nicholas",
    category: "lavoro",
    title: "Lavoro focus",
    description: "Implementazione task core",
    start: "2026-03-30T09:00:00.000Z",
    end: "2026-03-30T11:00:00.000Z",
    tasks: [
      { id: "t-2-1", text: "Fix bug calendario", completed: true },
      { id: "t-2-2", text: "Push branch", completed: false },
    ],
    status: "confirmed",
  },
  {
    id: "evt-3",
    userId: "mattia",
    category: "lavoro_pc",
    title: "Deep Work PC",
    description: "Refactoring modulo calendario",
    start: "2026-03-31T12:15:00.000Z",
    end: "2026-03-31T14:00:00.000Z",
    tasks: [
      { id: "t-3-1", text: "Estrarre time engine", completed: false },
    ],
    status: "tentative",
  },
  {
    id: "evt-4",
    userId: "nicholas",
    category: "allenamento",
    title: "Allenamento",
    description: "Sessione forza + mobilità",
    start: "2026-04-01T16:30:00.000Z",
    end: "2026-04-01T17:30:00.000Z",
    tasks: [
      { id: "t-4-1", text: "Warmup", completed: true },
      { id: "t-4-2", text: "Stretching", completed: false },
    ],
    status: "confirmed",
  },
];
