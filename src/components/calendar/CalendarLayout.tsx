import { useMemo, useState } from "react";
import { MOCK_EVENTS } from "../../mocks/events";
import type { CalendarEvent, CalendarView, EventDraft, UserId } from "../../types/calendar";
import { DEFAULT_TIME_WINDOW, addMinutes, floorToSlot, toIsoUtc } from "../../utils/timeSlots";
import {
  createEvent,
  generateDailySummary,
  moveEvent,
  resizeEvent,
  toggleTaskCompleted,
  updateEvent,
  validateEvent,
} from "../../logic/core/calendar.engine";
import { DayView } from "./DayView";
import { EventModal } from "./EventModal";
import { Toolbar } from "./Toolbar";
import { WeekView } from "./WeekView";

export function CalendarLayout() {
  const [view, setView] = useState<CalendarView>("week");
  const [anchorDate, setAnchorDate] = useState<Date>(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>(MOCK_EVENTS);
  const [currentUser, setCurrentUser] = useState<UserId>("mattia");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CalendarEvent | null>(null);
  const [draftStart, setDraftStart] = useState<string | undefined>(undefined);
  const [draftEnd, setDraftEnd] = useState<string | undefined>(undefined);

  const pageTitle = useMemo(() => {
    if (view === "day") {
      return anchorDate.toLocaleDateString("it-IT", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
    }
    return "Settimana " + anchorDate.toLocaleDateString("it-IT");
  }, [view, anchorDate]);

  const visibleEvents = useMemo(
    () => events.filter((event) => event.userId === currentUser),
    [events, currentUser],
  );

  const goPrev = () => {
    const next = new Date(anchorDate);
    next.setDate(anchorDate.getDate() + (view === "day" ? -1 : -7));
    setAnchorDate(next);
  };

  const goNext = () => {
    const next = new Date(anchorDate);
    next.setDate(anchorDate.getDate() + (view === "day" ? 1 : 7));
    setAnchorDate(next);
  };

  const goToday = () => setAnchorDate(new Date());

  const openNewEvent = (date: Date, slotStartMinutes: number) => {
    const base = new Date(date);
    base.setHours(0, 0, 0, 0);
    const start = new Date(base);
    start.setMinutes(slotStartMinutes);
    const snappedStart = floorToSlot(start, DEFAULT_TIME_WINDOW.slotMinutes);
    const end = addMinutes(snappedStart, 60);
    setDraftStart(toIsoUtc(snappedStart));
    setDraftEnd(toIsoUtc(end));
    setEditing(null);
    setModalOpen(true);
  };

  const saveDraft = (draft: EventDraft): { ok: true } | { ok: false; error: string } => {
    const validation = validateEvent(draft);
    if (!validation.valid) {
      return { ok: false, error: validation.errors[0] || "Dati evento non validi." };
    }

    try {
      setEvents((prev) => {
        if (draft.id) {
          const target = prev.find((event) => event.id === draft.id);
          if (!target) return prev;
          if (target.userId !== currentUser) return prev; // read-only su eventi altrui
          return updateEvent(prev, draft.id, draft);
        }
        return createEvent(prev, { ...draft, userId: currentUser });
      });
      setModalOpen(false);
      return { ok: true };
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Errore salvataggio evento.";
      return { ok: false, error: msg };
    }
  };

  const deleteEvent = (eventId: string) => {
    setEvents((prev) => prev.filter((event) => event.id !== eventId || event.userId !== currentUser));
    setModalOpen(false);
  };

  const onToggleTask = (eventId: string, taskId: string, completed: boolean) => {
    setEvents((prev) => toggleTaskCompleted(prev, eventId, taskId, completed, currentUser));
  };

  // Queste funzioni sono il punto unico per drag/resize.
  // I prossimi hook di interazione (useDragSession/useResizeSession) dovranno usare solo queste API.
  const applyMoveEvent = (eventId: string, deltaMinutes: number) => {
    setEvents((prev) => moveEvent(prev, eventId, deltaMinutes, DEFAULT_TIME_WINDOW));
  };

  const applyResizeEvent = (
    eventId: string,
    edge: "start" | "end",
    deltaMinutes: number,
  ) => {
    setEvents((prev) => resizeEvent(prev, eventId, edge, deltaMinutes, DEFAULT_TIME_WINDOW));
  };
  void applyMoveEvent;
  void applyResizeEvent;

  return (
    <div style={{ background: "#0f1117", color: "#e5e7eb", minHeight: "100vh" }}>
      <Toolbar
        view={view}
        title={pageTitle}
        onPrev={goPrev}
        onNext={goNext}
        onToday={goToday}
        onChangeView={setView}
        onCreate={() => openNewEvent(anchorDate, 8 * 60)}
        currentUser={currentUser}
        onChangeUser={setCurrentUser}
      />

      <main style={{ padding: 12 }}>
        {view === "day" ? (
          <DayView
            date={anchorDate}
            events={visibleEvents}
            window={DEFAULT_TIME_WINDOW}
            currentUser={currentUser}
            onSelectSlot={openNewEvent}
            onOpenEvent={(event) => {
              setEditing(event);
              setModalOpen(true);
            }}
            onToggleTask={onToggleTask}
          />
        ) : (
          <WeekView
            anchorDate={anchorDate}
            events={visibleEvents}
            window={DEFAULT_TIME_WINDOW}
            currentUser={currentUser}
            onSelectSlot={openNewEvent}
            onOpenEvent={(event) => {
              setEditing(event);
              setModalOpen(true);
            }}
            onToggleTask={onToggleTask}
          />
        )}
        <section style={{ marginTop: 12, border: "1px solid #1e2030", borderRadius: 12, padding: 12 }}>
          <strong>Summary giorno selezionato</strong>
          <pre style={{ whiteSpace: "pre-wrap", margin: "8px 0 0", fontSize: 12 }}>
            {generateDailySummary(anchorDate, events)}
          </pre>
        </section>
      </main>

      <EventModal
        open={modalOpen}
        event={editing}
        initialStartIso={draftStart}
        initialEndIso={draftEnd}
        currentUser={currentUser}
        onClose={() => setModalOpen(false)}
        onSave={saveDraft}
        onDelete={deleteEvent}
      />

      {/* Drag & drop + resize non ancora collegati alla UI.
          Quando verranno cablati, devono chiamare applyMoveEvent/applyResizeEvent (calendar.engine). */}
    </div>
  );
}
