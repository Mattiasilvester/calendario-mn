import type { CalendarEvent, TimeWindow } from "../../types/calendar";

export const DEFAULT_TIME_WINDOW: TimeWindow = {
  startHour: 6,
  endHour: 23,
  slotMinutes: 15,
};

export const HOUR_HEIGHT_PX = 80;
const LINE_COLOR_HOUR = "#4a5a86";
const LINE_COLOR_HALF = "#394665";
const LINE_COLOR_QUARTER = "#2a3044";

export function getSlotsPerHour(slotMinutes: number): number {
  return 60 / slotMinutes;
}

export function getSlotHeightPx(slotMinutes: number): number {
  return HOUR_HEIGHT_PX / getSlotsPerHour(slotMinutes);
}

export function getVisibleMinutes(window: TimeWindow): number {
  return (window.endHour - window.startHour) * 60;
}

/** Slot da 15 min con inizio nel range [startHour, endHour), es. ultimo 22:45–23:00. */
export function getContentSlotCount(window: TimeWindow): number {
  return getVisibleMinutes(window) / window.slotMinutes;
}

/** Righe disegnate nella timeline: slot contenuto + una riga finale solo etichetta fine (endHour:00). */
export function getDisplayRowCount(window: TimeWindow): number {
  return getContentSlotCount(window) + 1;
}

export function getGridHeightPx(window: TimeWindow): number {
  const slotHeight = getSlotHeightPx(window.slotMinutes);
  return getDisplayRowCount(window) * slotHeight;
}

export function getSlotVisualMeta(index: number, slotMinutes: number): {
  minuteInHour: number;
  isHourLine: boolean;
  isHalfHourLine: boolean;
  lineColor: string;
  background: string;
} {
  const slotsPerHour = 60 / slotMinutes;
  const hourSlotIndex = index % slotsPerHour;
  const minuteInHour = hourSlotIndex * slotMinutes;
  const isHourLine = minuteInHour === 0;
  const isHalfHourLine = minuteInHour === 30;
  const lineColor = isHourLine
    ? LINE_COLOR_HOUR
    : isHalfHourLine
      ? LINE_COLOR_HALF
      : LINE_COLOR_QUARTER;
  const background = isHourLine
    ? "rgba(255,255,255,0.05)"
    : isHalfHourLine
      ? "rgba(255,255,255,0.035)"
      : index % 2 === 0
        ? "rgba(255,255,255,0.02)"
        : "rgba(255,255,255,0.028)";

  return {
    minuteInHour,
    isHourLine,
    isHalfHourLine,
    lineColor,
    background,
  };
}

export function parseIsoToDate(iso: string): Date {
  return new Date(iso);
}

export function toIsoUtc(date: Date): string {
  return date.toISOString();
}

export function addMinutes(date: Date, minutes: number): Date {
  const copy = new Date(date);
  copy.setMinutes(copy.getMinutes() + minutes);
  return copy;
}

export function minutesBetween(start: Date, end: Date): number {
  return Math.round((end.getTime() - start.getTime()) / 60000);
}

export function floorToSlot(date: Date, slotMinutes: number): Date {
  const copy = new Date(date);
  copy.setSeconds(0, 0);
  const minutes = copy.getMinutes();
  const snapped = Math.floor(minutes / slotMinutes) * slotMinutes;
  copy.setMinutes(snapped);
  return copy;
}

export function roundDeltaToSlot(deltaMinutes: number, slotMinutes: number): number {
  return Math.round(deltaMinutes / slotMinutes) * slotMinutes;
}

/**
 * Spostamento verticale sulla timeline → delta minuti allineato allo slot.
 * Delta positivo = verso il basso (ora successiva nella griglia).
 */
export function deltaPxToRoundedSlotMinutes(deltaPx: number, window: TimeWindow): number {
  const slotHeight = getSlotHeightPx(window.slotMinutes);
  if (slotHeight <= 0) return 0;
  const rawMinutes = (deltaPx / slotHeight) * window.slotMinutes;
  return roundDeltaToSlot(rawMinutes, window.slotMinutes);
}

export function minutesFromWindowStart(date: Date, window: TimeWindow): number {
  const start = new Date(date);
  start.setHours(window.startHour, 0, 0, 0);
  return minutesBetween(start, date);
}

export function clampToWindow(date: Date, window: TimeWindow): Date {
  const base = new Date(date);
  const min = new Date(base);
  min.setHours(window.startHour, 0, 0, 0);
  const max = new Date(base);
  max.setHours(window.endHour, 0, 0, 0);
  return new Date(Math.min(Math.max(date.getTime(), min.getTime()), max.getTime()));
}

export function eventToLayout(event: CalendarEvent, window: TimeWindow): { top: number; height: number } {
  const slotHeight = getSlotHeightPx(window.slotMinutes);
  const start = parseIsoToDate(event.start);
  const end = parseIsoToDate(event.end);
  const startMin = minutesFromWindowStart(start, window);
  const durationMin = Math.max(window.slotMinutes, minutesBetween(start, end));
  return {
    top: (startMin / window.slotMinutes) * slotHeight,
    height: (durationMin / window.slotMinutes) * slotHeight,
  };
}

/** Posizione Y nella griglia (come `eventToLayout.top`) per un istante di calendario. */
export function dateTimeToLayoutTopPx(date: Date, window: TimeWindow): number {
  const slotHeight = getSlotHeightPx(window.slotMinutes);
  const startMin = minutesFromWindowStart(date, window);
  return (startMin / window.slotMinutes) * slotHeight;
}

export function buildTimeLabels(window: TimeWindow): string[] {
  const labels: string[] = [];
  for (let h = window.startHour; h < window.endHour; h++) {
    labels.push(String(h).padStart(2, "0") + ":00");
  }
  return labels;
}

export function isValidRange(startIso: string, endIso: string): boolean {
  return parseIsoToDate(endIso).getTime() > parseIsoToDate(startIso).getTime();
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function startOfWeek(date: Date): Date {
  const copy = new Date(date);
  const day = copy.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + diff);
  copy.setHours(0, 0, 0, 0);
  return copy;
}
