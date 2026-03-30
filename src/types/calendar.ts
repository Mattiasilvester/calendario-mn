export type CalendarView = "day" | "week";

export type EventStatus = "confirmed" | "tentative" | "cancelled";
export type UserId = "mattia" | "nicholas";

export type EventCategory =
  | "universita"
  | "lavoro_pc"
  | "lavoro"
  | "tempo_libero"
  | "allenamento"
  | "altro";

export type EventTask = {
  id: string;
  text: string;
  completed: boolean;
};

export const CATEGORY_COLORS: Record<EventCategory, string> = {
  universita: "#2563EB",
  lavoro_pc: "#D97706",
  lavoro: "#DC2626",
  tempo_libero: "#16A34A",
  allenamento: "#DB2777",
  altro: "#000000",
};

export type CalendarEvent = {
  id: string;
  userId: UserId;
  category: EventCategory;
  title: string;
  description: string;
  start: string; // ISO-8601 UTC
  end: string; // ISO-8601 UTC
  tasks: EventTask[];
  status: EventStatus;
};

export type TimeWindow = {
  startHour: number;
  endHour: number;
  slotMinutes: number;
};

export type EventLayout = {
  top: number;
  height: number;
};

export type EventDraft = {
  id?: string;
  userId: UserId;
  category: EventCategory;
  title: string;
  description: string;
  start: string;
  end: string;
  tasks: EventTask[];
  status: EventStatus;
};
