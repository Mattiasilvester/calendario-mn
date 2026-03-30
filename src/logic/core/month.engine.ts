import { isSameDay, parseIsoToDate, startOfWeek } from "../time/time.engine";

export type MonthGridCell = {
  date: Date;
  inCurrentMonth: boolean;
};

/** Griglia 6×7 (lun–dom), con `inCurrentMonth` per stile e interazione. */
export function buildMonthGrid(anchorDate: Date): MonthGridCell[] {
  const year = anchorDate.getFullYear();
  const month = anchorDate.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  firstOfMonth.setHours(0, 0, 0, 0);
  const gridStart = startOfWeek(firstOfMonth);
  gridStart.setHours(0, 0, 0, 0);

  const cells: MonthGridCell[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    d.setHours(0, 0, 0, 0);
    cells.push({
      date: d,
      inCurrentMonth: d.getMonth() === month && d.getFullYear() === year,
    });
  }
  return cells;
}

export function eventsForDay<T extends { start: string }>(events: T[], day: Date): T[] {
  return events.filter((e) => isSameDay(parseIsoToDate(e.start), day));
}
