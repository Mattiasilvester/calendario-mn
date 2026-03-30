import type { CalendarView, UserId } from "../../types/calendar";

type ToolbarProps = {
  view: CalendarView;
  title: string;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onChangeView: (view: CalendarView) => void;
  onCreate: () => void;
  currentUser: UserId;
  onChangeUser: (userId: UserId) => void;
};

export function Toolbar({
  view,
  title,
  onPrev,
  onNext,
  onToday,
  onChangeView,
  onCreate,
  currentUser,
  onChangeUser,
}: ToolbarProps) {
  return (
    <header style={{ borderBottom: "1px solid #2a3044", background: "#111522" }}>
      <div className="container" style={{ display: "grid", gap: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <strong style={{ fontSize: 16, textTransform: "capitalize" }}>{title}</strong>
        <button onClick={onCreate} type="button" style={{ background: "#2563eb", borderColor: "#2563eb", color: "#fff", fontWeight: 700 }}>
          + Evento
        </button>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button type="button" onClick={() => onChangeUser("mattia")} aria-pressed={currentUser === "mattia"}>
          Mattia
        </button>
        <button type="button" onClick={() => onChangeUser("nicholas")} aria-pressed={currentUser === "nicholas"}>
          Nicholas
        </button>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <button onClick={onPrev} type="button" aria-label="Periodo precedente">
          ←
        </button>
        <button onClick={onToday} type="button">
          Oggi
        </button>
        <button onClick={onNext} type="button" aria-label="Periodo successivo">
          →
        </button>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <button
            type="button"
            onClick={() => onChangeView("day")}
            aria-pressed={view === "day"}
          >
            Giorno
          </button>
          <button
            type="button"
            onClick={() => onChangeView("week")}
            aria-pressed={view === "week"}
          >
            Settimana
          </button>
        </div>
      </div>
      </div>
    </header>
  );
}
