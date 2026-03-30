import type { CalendarEvent, EventDraft, TimeWindow, UserId } from "../../types/calendar";
import {
  addMinutes,
  clampToWindow,
  isValidRange,
  parseIsoToDate,
  roundDeltaToSlot,
  toIsoUtc,
} from "../time/time.engine";

export type ValidationResult = { valid: true } | { valid: false; errors: string[] };

function normalizeDraft(draft: EventDraft): EventDraft {
  return {
    ...draft,
    title: draft.title.trim(),
    description: draft.description.trim(),
    tasks: (draft.tasks || []).map((task, i) => ({
      id: task.id || `task-${i + 1}`,
      text: task.text.trim(),
      completed: Boolean(task.completed),
    })),
    status: draft.status || "confirmed",
  };
}

export function validateEvent(draft: EventDraft): ValidationResult {
  const errors: string[] = [];
  const normalized = normalizeDraft(draft);
  if (normalized.userId !== "mattia" && normalized.userId !== "nicholas") errors.push("userId non valido.");
  if (!normalized.category) errors.push("Categoria obbligatoria.");
  if (!normalized.title) errors.push("Titolo obbligatorio.");
  if (!isValidRange(normalized.start, normalized.end)) errors.push("Intervallo orario non valido.");
  if (normalized.tasks.some((t) => !t.text)) errors.push("Task non valida.");
  return errors.length ? { valid: false, errors } : { valid: true };
}

export function createEvent(events: CalendarEvent[], draft: EventDraft): CalendarEvent[] {
  const normalized = normalizeDraft(draft);
  const validation = validateEvent(normalized);
  if (!validation.valid) throw new Error(validation.errors.join(" "));
  const id = normalized.id || (crypto.randomUUID ? crypto.randomUUID() : "evt-" + Date.now());
  const event: CalendarEvent = { ...normalized, id };
  return [...events, event];
}

export function updateEvent(events: CalendarEvent[], eventId: string, draft: EventDraft): CalendarEvent[] {
  const normalized = normalizeDraft({ ...draft, id: eventId });
  const validation = validateEvent(normalized);
  if (!validation.valid) throw new Error(validation.errors.join(" "));
  return events.map((event) => (event.id === eventId ? { ...event, ...normalized, id: eventId } : event));
}

export function toggleTaskCompleted(
  events: CalendarEvent[],
  eventId: string,
  taskId: string,
  completed: boolean,
  currentUser: UserId,
): CalendarEvent[] {
  return events.map((event) => {
    if (event.id !== eventId) return event;
    if (event.userId !== currentUser) return event; // read-only su eventi altrui
    return {
      ...event,
      tasks: event.tasks.map((task) => (task.id === taskId ? { ...task, completed } : task)),
    };
  });
}

export function moveEvent(
  events: CalendarEvent[],
  eventId: string,
  deltaMinutes: number,
  window: TimeWindow,
): CalendarEvent[] {
  const snappedDelta = roundDeltaToSlot(deltaMinutes, window.slotMinutes);
  return events.map((event) => {
    if (event.id !== eventId) return event;
    const start = parseIsoToDate(event.start);
    const end = parseIsoToDate(event.end);
    const duration = end.getTime() - start.getTime();
    let nextStart = addMinutes(start, snappedDelta);
    nextStart = clampToWindow(nextStart, window);
    let nextEnd = new Date(nextStart.getTime() + duration);
    const maxEnd = clampToWindow(nextEnd, window);
    if (maxEnd.getTime() < nextEnd.getTime()) {
      nextEnd = maxEnd;
      nextStart = new Date(nextEnd.getTime() - duration);
    }
    return { ...event, start: toIsoUtc(nextStart), end: toIsoUtc(nextEnd) };
  });
}

export function resizeEvent(
  events: CalendarEvent[],
  eventId: string,
  edge: "start" | "end",
  deltaMinutes: number,
  window: TimeWindow,
): CalendarEvent[] {
  const snappedDelta = roundDeltaToSlot(deltaMinutes, window.slotMinutes);
  return events.map((event) => {
    if (event.id !== eventId) return event;
    const start = parseIsoToDate(event.start);
    const end = parseIsoToDate(event.end);

    if (edge === "start") {
      let nextStart = addMinutes(start, snappedDelta);
      nextStart = clampToWindow(nextStart, window);
      const maxStart = addMinutes(end, -window.slotMinutes);
      if (nextStart > maxStart) nextStart = maxStart;
      return { ...event, start: toIsoUtc(nextStart) };
    }

    let nextEnd = addMinutes(end, snappedDelta);
    nextEnd = clampToWindow(nextEnd, window);
    const minEnd = addMinutes(start, window.slotMinutes);
    if (nextEnd < minEnd) nextEnd = minEnd;
    return { ...event, end: toIsoUtc(nextEnd) };
  });
}

export function generateDailySummary(date: Date, events: CalendarEvent[]): string {
  const isSameDay = (iso: string): boolean => {
    const d = parseIsoToDate(iso);
    return (
      d.getFullYear() === date.getFullYear() &&
      d.getMonth() === date.getMonth() &&
      d.getDate() === date.getDate()
    );
  };

  const dayEvents = events.filter((event) => isSameDay(event.start));
  const byUser: Record<UserId, CalendarEvent[]> = {
    mattia: dayEvents.filter((e) => e.userId === "mattia").sort((a, b) => a.start.localeCompare(b.start)),
    nicholas: dayEvents.filter((e) => e.userId === "nicholas").sort((a, b) => a.start.localeCompare(b.start)),
  };

  const allTasks = dayEvents.flatMap((e) => e.tasks);
  const doneCount = allTasks.filter((t) => t.completed).length;
  const totalCount = allTasks.length;

  const lines: string[] = [];
  lines.push(`Resoconto ${date.toLocaleDateString("it-IT")}`);
  lines.push("");

  (["mattia", "nicholas"] as const).forEach((userId) => {
    lines.push(`${userId.toUpperCase()}:`);
    if (!byUser[userId].length) {
      lines.push("- Nessun evento");
      lines.push("");
      return;
    }
    byUser[userId].forEach((event) => {
      const start = parseIsoToDate(event.start).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit", hour12: false });
      const end = parseIsoToDate(event.end).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit", hour12: false });
      lines.push(`- ${start}-${end} ${event.title} [${event.category}]`);
      if (!event.tasks.length) {
        lines.push("  - Nessuna task");
      } else {
        event.tasks.forEach((task) => {
          lines.push(`  - [${task.completed ? "x" : " "}] ${task.text}`);
        });
      }
    });
    lines.push("");
  });

  lines.push(`Task completate: ${doneCount}/${totalCount}`);
  return lines.join("\n");
}
