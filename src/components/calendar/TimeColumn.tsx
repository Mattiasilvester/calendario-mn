import type { TimeWindow } from "../../types/calendar";
import { buildTimeLabels, getSlotHeightPx } from "../../utils/timeSlots";

type TimeColumnProps = {
  window: TimeWindow;
};

export function TimeColumn({ window }: TimeColumnProps) {
  const slotHeight = getSlotHeightPx(window.slotMinutes);
  const labels = buildTimeLabels(window);

  return (
    <aside style={{ width: 56, borderRight: "1px solid #2a3044", background: "#0f1117" }}>
      <div style={{ height: 30, borderBottom: "1px solid #2a3044" }} />
      {labels.map((label) => (
        <div
          key={label}
          style={{
            height: slotHeight * 4,
            borderBottom: "1px solid #2a3044",
            fontSize: 11,
            color: "#9ca3af",
            padding: "2px 4px 0 0",
            textAlign: "right",
          }}
        >
          {label}
        </div>
      ))}
    </aside>
  );
}
