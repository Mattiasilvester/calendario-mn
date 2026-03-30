import { useState } from "react";
import type { CalendarEvent, TimeWindow, UserId } from "../../types/calendar";
import type { MoveSessionPayload, MoveSessionPhase } from "../../hooks/useMoveEventDrag";
import type { ResizeSessionPayload, ResizeSessionPhase } from "../../hooks/useResizeEdgeDrag";
import { eventToLayout, getGridHeightPx, isSameDay, parseIsoToDate, startOfWeek } from "../../utils/timeSlots";
import { EventCard } from "./EventCard";
import { ResizeGuideOverlay } from "./ResizeGuideOverlay";
import { TimeGrid } from "./TimeGrid";

type WeekViewProps = {
  anchorDate: Date;
  events: CalendarEvent[];
  window: TimeWindow;
  currentUser: UserId;
  onSelectSlot?: (date: Date, slotStartMinutes: number) => void;
  onOpenEvent?: (event: CalendarEvent) => void;
  onMoveSession?: (phase: MoveSessionPhase, payload: MoveSessionPayload) => void;
  onResizeSession?: (phase: ResizeSessionPhase, payload: ResizeSessionPayload) => void;
  onToggleTask?: (eventId: string, taskId: string, completed: boolean) => void;
};

type ColumnGuide = { dayIso: string; topPx: number; label: string };

export function WeekView({
  anchorDate,
  events,
  window,
  currentUser,
  onSelectSlot,
  onOpenEvent,
  onMoveSession,
  onResizeSession,
  onToggleTask,
}: WeekViewProps) {
  const [timeDragGuide, setTimeDragGuide] = useState<ColumnGuide | null>(null);
  const start = startOfWeek(anchorDate);
  const days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });

  const gridHeight = getGridHeightPx(window);

  return (
    <section className="card" style={{ overflow: "auto", maxHeight: 560 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(240px, 1fr))", minWidth: 1080 }}>
        {days.map((day) => {
          const key = day.toISOString();
          const dayEvents = events.filter((event) => isSameDay(parseIsoToDate(event.start), day));
          return (
            <div key={key} style={{ borderRight: "1px solid #2a3044" }}>
              <div style={{ padding: "10px 10px", borderBottom: "1px solid #2a3044", fontSize: 12, fontWeight: 700, background: "#151a28" }}>
                {day.toLocaleDateString("it-IT", { weekday: "short", day: "2-digit", month: "2-digit" })}
              </div>

              <div style={{ position: "relative", minHeight: gridHeight }}>
                <TimeGrid
                  window={window}
                  onSelectSlot={(slotStartMinutes) => onSelectSlot?.(day, slotStartMinutes)}
                />
                <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
                  {dayEvents.map((event) => (
                    <div key={event.id} style={{ pointerEvents: "auto" }}>
                      <EventCard
                        event={event}
                        layout={eventToLayout(event, window)}
                        window={window}
                        currentUser={currentUser}
                        onClick={onOpenEvent}
                        onMoveSession={onMoveSession}
                        onResizeSession={onResizeSession}
                        onDragGuide={(g) => setTimeDragGuide(g ? { ...g, dayIso: key } : null)}
                        onToggleTask={onToggleTask}
                      />
                    </div>
                  ))}
                  {timeDragGuide?.dayIso === key ? (
                    <ResizeGuideOverlay topPx={timeDragGuide.topPx} label={timeDragGuide.label} />
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
