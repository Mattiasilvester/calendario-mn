import { useCallback, useEffect, useRef } from "react";
import type { CalendarEvent, TimeWindow, UserId } from "../types/calendar";
import { computeMovedEventTimes } from "../logic/core/calendar.engine";
import { dateTimeToLayoutTopPx, deltaPxToRoundedSlotMinutes, parseIsoToDate } from "../logic/time/time.engine";

const DRAG_THRESHOLD_PX = 6;

export type MoveSessionPhase = "start" | "move" | "end" | "cancel";

export type MoveSessionPayload = {
  eventId: string;
  snapshot: CalendarEvent;
  deltaMinutes: number;
};

function cloneEventSnapshot(e: CalendarEvent): CalendarEvent {
  return { ...e, tasks: e.tasks.map((t) => ({ ...t })) };
}

function applyMoveGuide(
  snapshot: CalendarEvent,
  deltaMinutes: number,
  window: TimeWindow,
  actorUserId: UserId,
  onGuide: (g: { topPx: number; label: string } | null) => void,
): void {
  const times = computeMovedEventTimes(snapshot, deltaMinutes, window, actorUserId);
  const startDate = parseIsoToDate(times.start);
  onGuide({
    topPx: dateTimeToLayoutTopPx(startDate, window),
    label: startDate.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit", hour12: false }),
  });
}

type UseMoveEventDragOptions = {
  window: TimeWindow;
  actorUserId: UserId;
  disabled: boolean;
  event: CalendarEvent;
  onSession: (phase: MoveSessionPhase, payload: MoveSessionPayload) => void;
  onGuide: (guide: { topPx: number; label: string } | null) => void;
};

/**
 * Drag verticale spostamento evento: live update, guida sull’orario di inizio, cancel sotto soglia o pointercancel.
 */
export function useMoveEventDrag({
  window,
  actorUserId,
  disabled,
  event,
  onSession,
  onGuide,
}: UseMoveEventDragOptions): {
  onMovePointerDown: (e: import("react").PointerEvent) => void;
  consumeSuppressNextClick: () => boolean;
} {
  const onSessionRef = useRef(onSession);
  const onGuideRef = useRef(onGuide);
  const suppressNextClickRef = useRef(false);

  useEffect(() => {
    onSessionRef.current = onSession;
    onGuideRef.current = onGuide;
  }, [onSession, onGuide]);

  const consumeSuppressNextClick = useCallback((): boolean => {
    if (!suppressNextClickRef.current) return false;
    suppressNextClickRef.current = false;
    return true;
  }, []);

  const onMovePointerDown = useCallback(
    (e: import("react").PointerEvent) => {
      if (disabled || e.button !== 0) return;
      const startY = e.clientY;
      const snapshot = cloneEventSnapshot(event);
      const target = e.currentTarget;
      if (!(target instanceof HTMLElement)) return;
      target.setPointerCapture(e.pointerId);

      onSessionRef.current("start", { eventId: snapshot.id, snapshot, deltaMinutes: 0 });
      applyMoveGuide(snapshot, 0, window, actorUserId, onGuideRef.current);

      let onMove: (ev: PointerEvent) => void;
      let onUp: (ev: PointerEvent) => void;
      let onCancel: (ev: PointerEvent) => void;

      const detach = () => {
        target.removeEventListener("pointermove", onMove);
        target.removeEventListener("pointerup", onUp);
        target.removeEventListener("pointercancel", onCancel);
      };

      const release = (ev: PointerEvent) => {
        if (target.hasPointerCapture(ev.pointerId)) {
          target.releasePointerCapture(ev.pointerId);
        }
        detach();
      };

      onMove = (ev: PointerEvent) => {
        const deltaMinutes = deltaPxToRoundedSlotMinutes(ev.clientY - startY, window);
        onSessionRef.current("move", { eventId: snapshot.id, snapshot, deltaMinutes });
        applyMoveGuide(snapshot, deltaMinutes, window, actorUserId, onGuideRef.current);
      };

      onCancel = (ev: PointerEvent) => {
        release(ev);
        onGuideRef.current(null);
        onSessionRef.current("cancel", { eventId: snapshot.id, snapshot, deltaMinutes: 0 });
      };

      onUp = (ev: PointerEvent) => {
        release(ev);
        onGuideRef.current(null);
        const deltaY = ev.clientY - startY;
        if (Math.abs(deltaY) < DRAG_THRESHOLD_PX) {
          onSessionRef.current("cancel", { eventId: snapshot.id, snapshot, deltaMinutes: 0 });
          return;
        }
        suppressNextClickRef.current = true;
        const deltaMinutes = deltaPxToRoundedSlotMinutes(deltaY, window);
        onSessionRef.current("end", { eventId: snapshot.id, snapshot, deltaMinutes });
      };

      target.addEventListener("pointermove", onMove);
      target.addEventListener("pointerup", onUp);
      target.addEventListener("pointercancel", onCancel);
    },
    [disabled, event, window, actorUserId],
  );

  return { onMovePointerDown, consumeSuppressNextClick };
}
