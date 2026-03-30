import type { TimeWindow } from "../../types/calendar";
import {
  getContentSlotCount,
  getGridHeightPx,
  getSlotHeightPx,
  getSlotVisualMeta,
} from "../../utils/timeSlots";

type TimeGridProps = {
  window: TimeWindow;
  onSelectSlot?: (slotStartMinutes: number) => void;
};

export function TimeGrid({ window, onSelectSlot }: TimeGridProps) {
  const slotHeight = getSlotHeightPx(window.slotMinutes);
  const contentSlots = getContentSlotCount(window);
  const gridHeight = getGridHeightPx(window);
  const tailVisual = getSlotVisualMeta(contentSlots, window.slotMinutes);

  return (
    <div style={{ position: "relative", height: gridHeight }}>
      {Array.from({ length: contentSlots }).map((_, index) => {
        const startMin = window.startHour * 60 + index * window.slotMinutes;
        const visual = getSlotVisualMeta(index, window.slotMinutes);
        return (
          <button
            key={startMin}
            type="button"
            onClick={() => onSelectSlot?.(startMin)}
            style={{
              all: "unset",
              display: "block",
              width: "100%",
              height: slotHeight,
              background: visual.background,
              cursor: onSelectSlot ? "pointer" : "default",
            }}
            aria-label={`Slot ${Math.floor(startMin / 60)}:${String(startMin % 60).padStart(2, "0")}`}
          />
        );
      })}
      <div
        aria-hidden
        style={{
          height: slotHeight,
          background: tailVisual.background,
          pointerEvents: "none",
        }}
      />
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        {Array.from({ length: contentSlots + 2 }).map((_, index) => {
          const metaIndex = index > contentSlots ? contentSlots : index;
          const visual = getSlotVisualMeta(metaIndex, window.slotMinutes);
          return (
            <div
              key={index}
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: Math.min(index * slotHeight, gridHeight - 1),
                borderTop: `1px solid ${visual.lineColor}`,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
