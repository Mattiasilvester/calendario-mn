import { useCallback, useEffect, useRef } from "react";

/** Distanza minima orizzontale (px) per considerare lo swipe valido. */
const MIN_SWIPE_PX = 52;
/** |dx| deve superare |dy| moltiplicato per questo fattore (evita conflitto con scroll verticale). */
const HORIZONTAL_DOMINANCE = 1.35;
/** Soglia (px) per considerare lo gesture “orizzontale” e poter chiamare preventDefault su touch. */
const HORIZONTAL_COMMIT_PX = 24;

/** Trackpad / mouse wheel: accumulo (px equivalenti) prima di cambiare giorno. */
const WHEEL_ACC_THRESHOLD = 85;
/** Se |deltaY| domina nettamente, è scroll verticale: azzera accumulo orizzontale. */
const WHEEL_VERTICAL_DOMINANCE = 1.45;
/** Dopo un cambio giorno via wheel, ignora altri wheel per evitare scatti multipli. */
const WHEEL_COOLDOWN_MS = 480;
/** Se non arrivano impulsi orizzontali, resetta l’accumulo (fine gesture trackpad). */
const WHEEL_RESET_IDLE_MS = 160;

type UseDayViewSwipeNavigationOptions = {
  onPrev: () => void;
  onNext: () => void;
  disabled?: boolean;
};

/**
 * Swipe orizzontale sulla vista giorno: sinistra → giorno dopo, destra → giorno prima.
 * Touch/penna/mouse: pointer. Trackpad a due dita: `wheel` con `deltaX`.
 * Ignora gesture che iniziano su `[data-calendar-event-card]`.
 */
export function useDayViewSwipeNavigation({
  onPrev,
  onNext,
  disabled = false,
}: UseDayViewSwipeNavigationOptions): {
  onPointerDownCapture: (e: React.PointerEvent) => void;
  onClickCapture: (e: React.MouseEvent) => void;
  onWheel: (e: React.WheelEvent) => void;
  touchActionStyle: "pan-y";
} {
  const onPrevRef = useRef(onPrev);
  const onNextRef = useRef(onNext);
  onPrevRef.current = onPrev;
  onNextRef.current = onNext;

  const wheelAccRef = useRef(0);
  const wheelCooldownUntilRef = useRef(0);
  const wheelResetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (wheelResetTimerRef.current !== null) {
        clearTimeout(wheelResetTimerRef.current);
        wheelResetTimerRef.current = null;
      }
    },
    [],
  );

  const sessionRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    horizontalCommitted: boolean;
  } | null>(null);

  const suppressClickRef = useRef(false);

  const onPointerDownCapture = useCallback(
    (e: React.PointerEvent) => {
      if (disabled || e.button !== 0) return;
      const el = e.target as HTMLElement | null;
      if (!el || el.closest("[data-calendar-event-card]")) return;
      if (sessionRef.current !== null) return;

      sessionRef.current = {
        pointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        horizontalCommitted: false,
      };

      const onMove = (ev: PointerEvent) => {
        const s = sessionRef.current;
        if (!s || ev.pointerId !== s.pointerId) return;
        const dx = ev.clientX - s.startX;
        const dy = ev.clientY - s.startY;
        if (!s.horizontalCommitted && Math.abs(dx) >= HORIZONTAL_COMMIT_PX && Math.abs(dx) >= Math.abs(dy) * HORIZONTAL_DOMINANCE) {
          s.horizontalCommitted = true;
        }
        if (s.horizontalCommitted) {
          ev.preventDefault();
        }
      };

      const finish = (ev: PointerEvent) => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", finish);
        window.removeEventListener("pointercancel", finish);

        const s = sessionRef.current;
        sessionRef.current = null;
        if (!s || ev.pointerId !== s.pointerId) return;

        const dx = ev.clientX - s.startX;
        const dy = ev.clientY - s.startY;
        if (Math.abs(dx) < MIN_SWIPE_PX) return;
        if (Math.abs(dx) < Math.abs(dy) * HORIZONTAL_DOMINANCE) return;

        suppressClickRef.current = true;
        if (dx < 0) {
          onNextRef.current();
        } else {
          onPrevRef.current();
        }
      };

      window.addEventListener("pointermove", onMove, { passive: false });
      window.addEventListener("pointerup", finish);
      window.addEventListener("pointercancel", finish);
    },
    [disabled],
  );

  const onClickCapture = useCallback((e: React.MouseEvent) => {
    if (!suppressClickRef.current) return;
    suppressClickRef.current = false;
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const onWheel = useCallback(
    (e: React.WheelEvent) => {
      if (disabled) return;
      const el = e.target as HTMLElement | null;
      if (!el || el.closest("[data-calendar-event-card]")) return;

      const now = performance.now();
      if (now < wheelCooldownUntilRef.current) {
        if (Math.abs(e.deltaX) >= Math.abs(e.deltaY)) {
          e.preventDefault();
        }
        return;
      }

      let dx = e.deltaX;
      let dy = e.deltaY;
      if (e.shiftKey && dy !== 0 && Math.abs(dx) < Math.abs(dy)) {
        dx = dy;
        dy = 0;
      }
      if (e.deltaMode === 1) {
        dx *= 16;
        dy *= 16;
      } else if (e.deltaMode === 2) {
        const w = typeof window !== "undefined" ? window.innerWidth : 800;
        const h = typeof window !== "undefined" ? window.innerHeight : 600;
        dx *= w;
        dy *= h;
      }

      if (Math.abs(dy) > Math.abs(dx) * WHEEL_VERTICAL_DOMINANCE) {
        wheelAccRef.current = 0;
        if (wheelResetTimerRef.current !== null) {
          clearTimeout(wheelResetTimerRef.current);
          wheelResetTimerRef.current = null;
        }
        return;
      }

      if (Math.abs(dx) < 0.25) return;

      if (wheelResetTimerRef.current !== null) {
        clearTimeout(wheelResetTimerRef.current);
      }
      wheelResetTimerRef.current = setTimeout(() => {
        wheelAccRef.current = 0;
        wheelResetTimerRef.current = null;
      }, WHEEL_RESET_IDLE_MS);

      wheelAccRef.current += dx;

      if (wheelAccRef.current >= WHEEL_ACC_THRESHOLD) {
        onNextRef.current();
        wheelAccRef.current = 0;
        wheelCooldownUntilRef.current = now + WHEEL_COOLDOWN_MS;
        e.preventDefault();
      } else if (wheelAccRef.current <= -WHEEL_ACC_THRESHOLD) {
        onPrevRef.current();
        wheelAccRef.current = 0;
        wheelCooldownUntilRef.current = now + WHEEL_COOLDOWN_MS;
        e.preventDefault();
      }
    },
    [disabled],
  );

  return {
    onPointerDownCapture,
    onClickCapture,
    onWheel,
    touchActionStyle: "pan-y",
  };
}
