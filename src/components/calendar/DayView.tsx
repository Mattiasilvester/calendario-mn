import type { CalendarEvent, TimeWindow, UserId } from "../../types/calendar";
import { eventToLayout, getGridHeightPx, isSameDay, parseIsoToDate } from "../../utils/timeSlots";
import { EventCard } from "./EventCard";
import { TimeColumn } from "./TimeColumn";
import { TimeGrid } from "./TimeGrid";

type DayViewProps = {
  date: Date;
  events: CalendarEvent[];
  window: TimeWindow;
  currentUser: UserId;
  onSelectSlot?: (date: Date, slotStartMinutes: number) => void;
  onOpenEvent?: (event: CalendarEvent) => void;
  onToggleTask?: (eventId: string, taskId: string, completed: boolean) => void;
};

export function DayView({
  date,
  events,
  window,
  currentUser,
  onSelectSlot,
  onOpenEvent,
  onToggleTask,
}: DayViewProps) {
  const dayEvents = events.filter((event) => isSameDay(parseIsoToDate(event.start), date));
  const gridHeight = getGridHeightPx(window);

  return (
    <section className="card" style={{ overflow: "hidden", maxHeight: 460, overflowY: "auto" }}>
      <div style={{ display: "flex", alignItems: "stretch" }}>
        <TimeColumn window={window} />

        <div style={{ position: "relative", flex: 1, minHeight: gridHeight }}>
          <TimeGrid
            window={window}
            onSelectSlot={(slotStartMinutes) => onSelectSlot?.(date, slotStartMinutes)}
          />
          <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
            {dayEvents.map((event) => (
              <div key={event.id} style={{ pointerEvents: "auto" }}>
                <EventCard
                  event={event}
                  layout={eventToLayout(event, window)}
                  currentUser={currentUser}
                  onClick={onOpenEvent}
                  onToggleTask={onToggleTask}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
