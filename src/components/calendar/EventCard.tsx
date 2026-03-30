import type { CSSProperties } from "react";
import { CATEGORY_COLORS, type CalendarEvent, type EventLayout, type TimeWindow, type UserId } from "../../types/calendar";
import type { MoveSessionPayload, MoveSessionPhase } from "../../hooks/useMoveEventDrag";
import { useMoveEventDrag } from "../../hooks/useMoveEventDrag";
import type { ResizeSessionPayload, ResizeSessionPhase } from "../../hooks/useResizeEdgeDrag";
import { useResizeEdgeDrag } from "../../hooks/useResizeEdgeDrag";
import { parseIsoToDate } from "../../utils/timeSlots";

const RESIZE_TAB_HEIGHT_PX = 10;
const RESIZE_TAB_RADIUS_PX = 6;

const noopResizeSession = (_phase: ResizeSessionPhase, _payload: ResizeSessionPayload): void => {};
const noopMoveSession = (_phase: MoveSessionPhase, _payload: MoveSessionPayload): void => {};
const noopDragGuide = (_guide: { topPx: number; label: string } | null): void => {};

type EventCardProps = {
  event: CalendarEvent;
  layout: EventLayout;
  window: TimeWindow;
  currentUser: UserId;
  onClick?: (event: CalendarEvent) => void;
  onMoveSession?: (phase: MoveSessionPhase, payload: MoveSessionPayload) => void;
  onResizeSession?: (phase: ResizeSessionPhase, payload: ResizeSessionPayload) => void;
  /** Linea guida orario: condivisa tra spostamento e resize */
  onDragGuide?: (guide: { topPx: number; label: string } | null) => void;
  onToggleTask?: (eventId: string, taskId: string, completed: boolean) => void;
};

export function EventCard({
  event,
  layout,
  window,
  currentUser,
  onClick,
  onMoveSession,
  onResizeSession,
  onDragGuide,
  onToggleTask,
}: EventCardProps) {
  const start = parseIsoToDate(event.start);
  const end = parseIsoToDate(event.end);
  const isOwner = event.userId === currentUser;
  const canDrag = Boolean(isOwner && onMoveSession && onDragGuide);
  const canResize = Boolean(isOwner && onResizeSession && onDragGuide);
  const { onMovePointerDown, consumeSuppressNextClick } = useMoveEventDrag({
    window,
    actorUserId: currentUser,
    disabled: !canDrag,
    event,
    onSession: onMoveSession ?? noopMoveSession,
    onGuide: onDragGuide ?? noopDragGuide,
  });
  const resizeTop = useResizeEdgeDrag({
    window,
    edge: "start",
    disabled: !canResize,
    event,
    onSession: onResizeSession ?? noopResizeSession,
    onGuide: onDragGuide ?? noopDragGuide,
  });
  const resizeBottom = useResizeEdgeDrag({
    window,
    edge: "end",
    disabled: !canResize,
    event,
    onSession: onResizeSession ?? noopResizeSession,
    onGuide: onDragGuide ?? noopDragGuide,
  });
  const timeLabel =
    start.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit", hour12: false }) +
    " - " +
    end.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit", hour12: false });

  const tabBaseStyle: CSSProperties = {
    position: "absolute",
    left: "50%",
    width: "25%",
    height: RESIZE_TAB_HEIGHT_PX,
    borderRadius: RESIZE_TAB_RADIUS_PX,
    transform: "translateX(-50%)",
    background: "rgba(255,255,255,0.42)",
    boxShadow: "0 0 0 1px rgba(0,0,0,0.12)",
    zIndex: 3,
    touchAction: "none",
    cursor: canResize ? "ns-resize" : undefined,
    pointerEvents: canResize ? "auto" : "none",
  };

  return (
    <article
      data-calendar-event-card
      role={isOwner ? "button" : "article"}
      tabIndex={isOwner ? 0 : -1}
      onClick={() => {
        if (!isOwner) return;
        if (consumeSuppressNextClick()) return;
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
        borderRadius: 10,
        padding: "8px 10px",
        background: CATEGORY_COLORS[event.category],
        color: "#fff",
        overflow: "visible",
        boxShadow: "0 2px 10px rgba(0,0,0,0.35)",
        border: "1px solid rgba(255,255,255,0.18)",
        fontSize: 12,
        cursor: isOwner ? "pointer" : "default",
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
      }}
    >
      {canResize ? (
        <>
          <div
            role="presentation"
            aria-hidden
            onPointerDown={(e) => {
              e.stopPropagation();
              resizeTop.onResizePointerDown(e);
            }}
            onClick={(e) => e.stopPropagation()}
            style={{
              ...tabBaseStyle,
              top: 0,
            }}
          />
          <div
            role="presentation"
            aria-hidden
            onPointerDown={(e) => {
              e.stopPropagation();
              resizeBottom.onResizePointerDown(e);
            }}
            onClick={(e) => e.stopPropagation()}
            style={{
              ...tabBaseStyle,
              bottom: 0,
            }}
          />
        </>
      ) : null}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflow: "auto",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          onPointerDown={onMovePointerDown}
          style={{
            cursor: canDrag ? "grab" : undefined,
            touchAction: canDrag ? "none" : undefined,
            userSelect: canDrag ? "none" : undefined,
          }}
        >
          <div style={{ fontWeight: 700, fontSize: 13, lineHeight: 1.25 }}>{event.title}</div>
          <div style={{ fontSize: 11, opacity: 0.9 }}>{timeLabel}</div>
        </div>
        <div style={{ fontSize: 10, opacity: 0.9, marginTop: 6 }}>
          {event.userId} · {event.category} · {event.status}
        </div>
        <div
          style={{
            marginTop: 8,
            borderTop: "1px solid rgba(255,255,255,0.22)",
            paddingTop: 6,
            display: "flex",
            flexDirection: "column",
            gap: 6,
          }}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          {event.tasks.map((task) => (
            <label
              key={task.id}
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                fontSize: 11,
                lineHeight: 1.3,
                margin: 0,
                cursor: isOwner ? "pointer" : "default",
              }}
            >
              <input
                type="checkbox"
                checked={task.completed}
                disabled={!isOwner}
                onChange={(e) => onToggleTask?.(event.id, task.id, e.currentTarget.checked)}
                style={{
                  width: 14,
                  height: 14,
                  margin: 0,
                  flexShrink: 0,
                  accentColor: task.completed ? "#22c55e" : "#ffffff",
                  cursor: isOwner ? "pointer" : "default",
                }}
              />
              <span
                style={{
                  flex: 1,
                  minWidth: 0,
                  textDecoration: task.completed ? "line-through" : "none",
                  opacity: task.completed ? 0.85 : 1,
                }}
              >
                {task.text}
              </span>
            </label>
          ))}
        </div>
      </div>
    </article>
  );
}
