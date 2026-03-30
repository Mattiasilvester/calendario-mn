import { CATEGORY_COLORS, type CalendarEvent, type EventLayout, type UserId } from "../../types/calendar";
import { parseIsoToDate } from "../../utils/timeSlots";

type EventCardProps = {
  event: CalendarEvent;
  layout: EventLayout;
  currentUser: UserId;
  onClick?: (event: CalendarEvent) => void;
  onToggleTask?: (eventId: string, taskId: string, completed: boolean) => void;
};

export function EventCard({ event, layout, currentUser, onClick, onToggleTask }: EventCardProps) {
  const start = parseIsoToDate(event.start);
  const end = parseIsoToDate(event.end);
  const isOwner = event.userId === currentUser;
  const timeLabel =
    start.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit", hour12: false }) +
    " - " +
    end.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit", hour12: false });

  return (
    <article
      role={isOwner ? "button" : "article"}
      tabIndex={isOwner ? 0 : -1}
      onClick={() => {
        if (!isOwner) return;
        onClick?.(event);
      }}
      onKeyDown={(e) => {
        if (!isOwner) return;
        if (e.key === "Enter" || e.key === " ") onClick?.(event);
      }}
      style={{
        position: "absolute",
        left: 48,
        right: 8,
        top: layout.top,
        height: layout.height,
        borderRadius: 8,
        padding: "6px 8px",
        background: CATEGORY_COLORS[event.category],
        color: "#fff",
        overflow: "auto",
        boxShadow: "0 2px 10px rgba(0,0,0,0.35)",
        fontSize: 12,
        cursor: isOwner ? "pointer" : "default",
      }}
    >
      <div style={{ fontWeight: 700, fontSize: 13, lineHeight: 1.2 }}>{event.title}</div>
      <div style={{ fontSize: 11, opacity: 0.9 }}>{timeLabel}</div>
      <div style={{ fontSize: 10, opacity: 0.9, marginTop: 4 }}>
        {event.userId} · {event.category} · {event.status}
      </div>
      <div style={{ marginTop: 6, borderTop: "1px solid rgba(255,255,255,0.22)", paddingTop: 6 }}>
        {event.tasks.map((task) => (
          <label key={task.id} style={{ display: "flex", gap: 6, alignItems: "flex-start", marginBottom: 4, fontSize: 11 }}>
            <input
              type="checkbox"
              checked={task.completed}
              disabled={!isOwner}
              onChange={(e) => onToggleTask?.(event.id, task.id, e.currentTarget.checked)}
            />
            <span style={{ textDecoration: task.completed ? "line-through" : "none", opacity: task.completed ? 0.8 : 1 }}>
              {task.text}
            </span>
          </label>
        ))}
      </div>
    </article>
  );
}
