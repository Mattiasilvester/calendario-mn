import { useCallback, useEffect, useRef } from "react";
import type { CalendarEvent, TimeWindow } from "../types/calendar";
import { computeResizedEventTimes } from "../logic/core/calendar.engine";
import { dateTimeToLayoutTopPx, deltaPxToRoundedSlotMinutes, parseIsoToDate } from "../logic/time/time.engine";

export type ResizeSessionPhase = "start" | "move" | "end" | "cancel";

export type ResizeSessionPayload = {
  eventId: string;
  edge: "start" | "end";
  snapshot: CalendarEvent;
  deltaMinutes: number;
};

function cloneEventSnapshot(e: CalendarEvent): CalendarEvent {
  return { ...e, tasks: e.tasks.map((t) => ({ ...t })) };
}

function applyGuide(
  snapshot: CalendarEvent,
  edge: "start" | "end",
  deltaMinutes: number,
  window: TimeWindow,
  onGuide: (g: { topPx: number; label: string } | null) => void,
): void {
  const times = computeResizedEventTimes(snapshot, edge, deltaMinutes, window);
  const edgeDate = edge === "start" ? parseIsoToDate(times.start) : parseIsoToDate(times.end);
  onGuide({
    topPx: dateTimeToLayoutTopPx(edgeDate, window),
    label: edgeDate.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit", hour12: false }),
  });
}

type UseResizeEdgeDragOptions = {
  window: TimeWindow;
  edge: "start" | "end";
  disabled: boolean;
  event: CalendarEvent;
  onSession: (phase: ResizeSessionPhase, payload: ResizeSessionPayload) => void;
  onGuide: (guide: { topPx: number; label: string } | null) => void;
};

/**
 * Resize bordo start/end: pointermove con delta cumulativo, guida orario, cancel ripristina snapshot.
 */
export function useResizeEdgeDrag({
  window,
  edge,
  disabled,
  event,
  onSession,
  onGuide,
}: UseResizeEdgeDragOptions): { onResizePointerDown: (e: import("react").PointerEvent) => void } {
  const onSessionRef = useRef(onSession);
  const onGuideRef = useRef(onGuide);

  useEffect(() => {
    onSessionRef.current = onSession;
    onGuideRef.current = onGuide;
  }, [onSession, onGuide]);

  const onResizePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (disabled || e.button !== 0) return;
      const startY = e.clientY;
      const snapshot = cloneEventSnapshot(event);
      const target = e.currentTarget;
      if (!(target instanceof HTMLElement)) return;
      target.setPointerCapture(e.pointerId);

      onSessionRef.current("start", {
        eventId: snapshot.id,
        edge,
        snapshot,
        deltaMinutes: 0,
      });
      applyGuide(snapshot, edge, 0, window, onGuideRef.current);

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
        onSessionRef.current("move", { eventId: snapshot.id, edge, snapshot, deltaMinutes });
        applyGuide(snapshot, edge, deltaMinutes, window, onGuideRef.current);
      };

      onCancel = (ev: PointerEvent) => {
        release(ev);
        onGuideRef.current(null);
        onSessionRef.current("cancel", {
          eventId: snapshot.id,
          edge,
          snapshot,
          deltaMinutes: 0,
        });
      };

      onUp = (ev: PointerEvent) => {
        release(ev);
        const deltaMinutes = deltaPxToRoundedSlotMinutes(ev.clientY - startY, window);
        onGuideRef.current(null);
        onSessionRef.current("end", { eventId: snapshot.id, edge, snapshot, deltaMinutes });
      };

      target.addEventListener("pointermove", onMove);
      target.addEventListener("pointerup", onUp);
      target.addEventListener("pointercancel", onCancel);
    },
    [disabled, edge, event, window],
  );

  return { onResizePointerDown };
}
