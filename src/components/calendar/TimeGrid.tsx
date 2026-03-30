import type { TimeWindow } from "../../types/calendar";
import { getGridHeightPx, getSlotHeightPx, getVisibleMinutes } from "../../utils/timeSlots";

type TimeGridProps = {
  window: TimeWindow;
  onSelectSlot?: (slotStartMinutes: number) => void;
};

export function TimeGrid({ window, onSelectSlot }: TimeGridProps) {
  const slotHeight = getSlotHeightPx(window.slotMinutes);
  const totalSlots = getVisibleMinutes(window) / window.slotMinutes;
  const gridHeight = getGridHeightPx(window);

  return (
    <div style={{ position: "relative", height: gridHeight }}>
      {Array.from({ length: totalSlots }).map((_, index) => {
        const startMin = window.startHour * 60 + index * window.slotMinutes;
        const isHourLine = index % (60 / window.slotMinutes) === 0;
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
              borderBottom: `1px solid ${isHourLine ? "#313549" : "#1e2030"}`,
              background: index % 2 === 0 ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.04)",
              cursor: onSelectSlot ? "pointer" : "default",
            }}
            aria-label={`Slot ${Math.floor(startMin / 60)}:${String(startMin % 60).padStart(2, "0")}`}
          />
        );
      })}
    </div>
  );
}
