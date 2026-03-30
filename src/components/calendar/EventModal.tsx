import { useEffect, useState } from "react";
import type { CalendarEvent, EventCategory, EventDraft, EventStatus, EventTask, UserId } from "../../types/calendar";
import { parseIsoToDate, toIsoUtc } from "../../utils/timeSlots";

type EventModalProps = {
  open: boolean;
  event?: CalendarEvent | null;
  initialStartIso?: string;
  initialEndIso?: string;
  currentUser: UserId;
  onClose: () => void;
  onSave: (draft: EventDraft) => { ok: true } | { ok: false; error: string };
  onDelete?: (eventId: string) => void;
};

function toInputDateTime(iso: string): string {
  const d = parseIsoToDate(iso);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

function fromInputDateTime(localValue: string): string {
  return toIsoUtc(new Date(localValue));
}

export function EventModal({
  open,
  event,
  initialStartIso,
  initialEndIso,
  currentUser,
  onClose,
  onSave,
  onDelete,
}: EventModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [category, setCategory] = useState<EventCategory>("altro");
  const [status, setStatus] = useState<EventStatus>("confirmed");
  const [tasksText, setTasksText] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    if (event) {
      setTitle(event.title);
      setDescription(event.description);
      setStart(toInputDateTime(event.start));
      setEnd(toInputDateTime(event.end));
      setCategory(event.category);
      setStatus(event.status);
      setTasksText(event.tasks.map((task) => task.text).join("\n"));
      setError(null);
      return;
    }
    setTitle("");
    setDescription("");
    setStart(initialStartIso ? toInputDateTime(initialStartIso) : "");
    setEnd(initialEndIso ? toInputDateTime(initialEndIso) : "");
    setCategory("altro");
    setStatus("confirmed");
    setTasksText("");
    setError(null);
  }, [open, event, initialStartIso, initialEndIso]);

  if (!open) return null;

  const onSubmit = () => {
    const tasks: EventTask[] = tasksText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((text, i) => {
        const existing = event?.tasks?.[i];
        return {
          id: existing?.id || `task-${Date.now()}-${i}`,
          text,
          completed: existing?.completed ?? false,
        };
      });
    const result = onSave({
      id: event?.id,
      userId: event?.userId ?? currentUser,
      category,
      title: title.trim(),
      description: description.trim(),
      start: fromInputDateTime(start),
      end: fromInputDateTime(end),
      tasks,
      status,
    });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setError(null);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", display: "grid", placeItems: "center", padding: 16, zIndex: 50 }}>
      <div style={{ width: "100%", maxWidth: 420, background: "#161922", border: "1px solid #1e2030", borderRadius: 12, padding: 16, display: "grid", gap: 10 }}>
        <h3 style={{ margin: 0 }}>{event ? "Modifica evento" : "Nuovo evento"}</h3>

        <label>
          Titolo
          <input value={title} onChange={(e) => setTitle(e.target.value)} />
        </label>

        <label>
          Descrizione
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
        </label>

        <label>
          Inizio
          <input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} />
        </label>

        <label>
          Fine
          <input type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} />
        </label>

        <label>
          Categoria
          <select value={category} onChange={(e) => setCategory(e.target.value as EventCategory)}>
            <option value="universita">università</option>
            <option value="lavoro_pc">lavoro pc</option>
            <option value="lavoro">lavoro</option>
            <option value="tempo_libero">tempo libero</option>
            <option value="allenamento">allenamento</option>
            <option value="altro">altro</option>
          </select>
        </label>

        <label>
          Stato
          <select value={status} onChange={(e) => setStatus(e.target.value as EventStatus)}>
            <option value="confirmed">confirmed</option>
            <option value="tentative">tentative</option>
            <option value="cancelled">cancelled</option>
          </select>
        </label>

        <label>
          Task (una per riga)
          <textarea value={tasksText} onChange={(e) => setTasksText(e.target.value)} />
        </label>

        {error ? <p style={{ color: "#f87171", margin: 0 }}>{error}</p> : null}

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", flexWrap: "wrap" }}>
          {event?.id && onDelete ? (
            <button
              type="button"
              onClick={() => onDelete(event.id)}
              style={{ background: "#991b1b", color: "#fff" }}
            >
              Elimina
            </button>
          ) : null}
          <button type="button" onClick={onClose}>
            Annulla
          </button>
          <button type="button" onClick={onSubmit} style={{ background: "#2563EB", color: "#fff" }}>
            Salva
          </button>
        </div>
      </div>
    </div>
  );
}
