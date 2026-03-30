import type { CalendarEvent } from "../../types/calendar";
import { buildMonthGrid, eventsForDay } from "../../logic/core/month.engine";
import { parseIsoToDate } from "../../utils/timeSlots";

const WEEKDAY_LABELS = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"] as const;

type MonthViewProps = {
  anchorDate: Date;
  events: CalendarEvent[];
  onOpenEvent?: (event: CalendarEvent) => void;
  onGoToDay?: (date: Date) => void;
};

export function MonthView({ anchorDate, events, onOpenEvent, onGoToDay }: MonthViewProps) {
  const cells = buildMonthGrid(anchorDate);

  return (
    <section className="card" style={{ overflow: "auto" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
          borderBottom: "1px solid #2a3044",
        }}
      >
        {WEEKDAY_LABELS.map((label) => (
          <div
            key={label}
            style={{
              padding: "8px 6px",
              fontSize: 11,
              fontWeight: 700,
              textAlign: "center",
              color: "#94a3b8",
              borderRight: "1px solid #2a3044",
              background: "#151a28",
            }}
          >
            {label}
          </div>
        ))}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
          gridAutoRows: "minmax(100px, auto)",
        }}
      >
        {cells.map(({ date, inCurrentMonth }) => {
          const dayEvents = eventsForDay(events, date).sort((a, b) => a.start.localeCompare(b.start));
          const visible = dayEvents.slice(0, 3);
          const extra = dayEvents.length - visible.length;

          return (
            <div
              key={date.toISOString()}
              onClick={() => onGoToDay?.(date)}
              style={{
                borderRight: "1px solid #2a3044",
                borderBottom: "1px solid #2a3044",
                padding: 6,
                background: inCurrentMonth ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.2)",
                cursor: onGoToDay ? "pointer" : "default",
                minHeight: 100,
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  marginBottom: 6,
                  color: inCurrentMonth ? "#e2e8f0" : "#64748b",
                }}
              >
                {date.getDate()}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {visible.map((event) => (
                  <button
                    key={event.id}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenEvent?.(event);
                    }}
                    style={{
                      textAlign: "left",
                      fontSize: 10,
                      lineHeight: 1.25,
                      padding: "4px 6px",
                      borderRadius: 4,
                      border: "1px solid #2a3044",
                      background: "#1e293b",
                      color: "#f1f5f9",
                      cursor: "pointer",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                    title={event.title}
                  >
                    {parseIsoToDate(event.start).toLocaleTimeString("it-IT", {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: false,
                    })}{" "}
                    {event.title}
                  </button>
                ))}
                {extra > 0 ? (
                  <span style={{ fontSize: 10, color: "#94a3b8" }}>+{extra} altri</span>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
