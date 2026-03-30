import { useCallback, useRef } from "react";
import type { TimeWindow } from "../types/calendar";
import { deltaPxToRoundedSlotMinutes } from "../logic/time/time.engine";

const DEFAULT_THRESHOLD_PX = 6;

type UseVerticalDragCommitOptions = {
  window: TimeWindow;
  onCommit: (deltaMinutes: number) => void;
  disabled?: boolean;
  thresholdPx?: number;
};

/**
 * Pointer verticale: soglia vs click, pointercancel, un solo commit a pointerup.
 */
export function useVerticalDragCommit({
  window,
  onCommit,
  disabled = false,
  thresholdPx = DEFAULT_THRESHOLD_PX,
}: UseVerticalDragCommitOptions): {
  onDragHandlePointerDown: (e: React.PointerEvent) => void;
  consumeSuppressNextClick: () => boolean;
} {
  const suppressNextClickRef = useRef(false);

  const consumeSuppressNextClick = useCallback((): boolean => {
    if (!suppressNextClickRef.current) return false;
    suppressNextClickRef.current = false;
    return true;
  }, []);

  const onDragHandlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (disabled || e.button !== 0) return;
      const startY = e.clientY;
      const target = e.currentTarget;
      if (!(target instanceof HTMLElement)) return;
      target.setPointerCapture(e.pointerId);

      let onUp: (ev: PointerEvent) => void;
      let onCancel: (ev: PointerEvent) => void;

      const detach = () => {
        target.removeEventListener("pointerup", onUp);
        target.removeEventListener("pointercancel", onCancel);
      };

      const release = (ev: PointerEvent) => {
        if (target.hasPointerCapture(ev.pointerId)) {
          target.releasePointerCapture(ev.pointerId);
        }
        detach();
      };

      onCancel = (ev: PointerEvent) => {
        release(ev);
      };

      onUp = (ev: PointerEvent) => {
        release(ev);
        const deltaY = ev.clientY - startY;
        if (Math.abs(deltaY) < thresholdPx) return;
        suppressNextClickRef.current = true;
        const deltaMinutes = deltaPxToRoundedSlotMinutes(deltaY, window);
        if (deltaMinutes !== 0) onCommit(deltaMinutes);
      };

      target.addEventListener("pointerup", onUp);
      target.addEventListener("pointercancel", onCancel);
    },
    [disabled, onCommit, thresholdPx, window],
  );

  return { onDragHandlePointerDown, consumeSuppressNextClick };
}
