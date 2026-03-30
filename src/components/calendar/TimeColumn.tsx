import type { TimeWindow } from "../../types/calendar";
import {
  getContentSlotCount,
  getGridHeightPx,
  getSlotHeightPx,
  getSlotVisualMeta,
} from "../../utils/timeSlots";

type TimeColumnProps = {
  window: TimeWindow;
};

export function TimeColumn({ window }: TimeColumnProps) {
  const slotHeight = getSlotHeightPx(window.slotMinutes);
  const gridHeight = getGridHeightPx(window);
  const contentSlots = getContentSlotCount(window);
  const displayRows = contentSlots + 1;

  return (
    <aside style={{ width: 56, borderRight: "1px solid #2a3044", background: "#0f1117", height: gridHeight }}>
      {Array.from({ length: displayRows }).map((_, index) => {
        const isEndLabelRow = index === contentSlots;
        const visual = getSlotVisualMeta(
          isEndLabelRow ? contentSlots : index,
          window.slotMinutes,
        );

        if (isEndLabelRow) {
          return (
            <div
              key="end-hour"
              style={{
                height: slotHeight,
                borderBottom: `1px solid ${visual.lineColor}`,
                background: visual.background,
                fontSize: 12,
                color: "#9ca3af",
                fontWeight: 700,
                paddingRight: 4,
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "flex-end",
                lineHeight: 1,
                paddingTop: 2,
              }}
            >
              {String(window.endHour).padStart(2, "0")}:00
            </div>
          );
        }

        const slotStartMinutes = window.startHour * 60 + index * window.slotMinutes;
        const hour = Math.floor(slotStartMinutes / 60);
        const minuteInHour = slotStartMinutes % 60;
        const label =
          minuteInHour === 0
            ? `${String(hour).padStart(2, "0")}:00`
            : `:${String(minuteInHour).padStart(2, "0")}`;
        const color = minuteInHour === 30 ? "#8fa0c9" : minuteInHour === 0 ? "#9ca3af" : "#657292";
        const fontSize = minuteInHour === 0 ? 12 : 9;
        const fontWeight = minuteInHour === 0 ? 700 : 500;

        const isFullHour = minuteInHour === 0;

        return (
        <div
          key={slotStartMinutes}
          style={{
            height: slotHeight,
            borderBottom: `1px solid ${visual.lineColor}`,
            background: visual.background,
            fontSize,
            color,
            fontWeight,
            paddingRight: 4,
            display: "flex",
            alignItems: isFullHour ? "flex-start" : "center",
            justifyContent: "flex-end",
            lineHeight: 1,
            paddingTop: isFullHour ? 2 : 0,
          }}
        >
          {label}
        </div>
        );
      })}
    </aside>
  );
}
