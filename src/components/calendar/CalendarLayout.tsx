import { useCallback, useEffect, useMemo, useState } from "react";
import type { CalendarEvent, CalendarView, EventDraft, UserId } from "../../types/calendar";
import {
  DEFAULT_TIME_WINDOW,
  addMinutes,
  floorToSlot,
  parseIsoToDate,
  startOfLocalDay,
  toIsoUtc,
} from "../../utils/timeSlots";
import {
  computeMovedEventTimes,
  computeResizedEventTimes,
  createEvent,
  generateDailySummary,
  toggleTaskCompleted,
  updateEvent,
  validateEvent,
} from "../../logic/core/calendar.engine";
import type { MoveSessionPayload, MoveSessionPhase } from "../../hooks/useMoveEventDrag";
import type { ResizeSessionPayload, ResizeSessionPhase } from "../../hooks/useResizeEdgeDrag";
import { DayView } from "./DayView";
import { EventModal } from "./EventModal";
import { MonthView } from "./MonthView";
import { Toolbar } from "./Toolbar";
import { WeekView } from "./WeekView";
import {
  deleteEvent as deleteEventPersisted,
  saveEvent as saveEventPersisted,
  subscribeEvents,
} from "../../services/persistence/firestoreAdapter";

export function CalendarLayout() {
  const [view, setView] = useState<CalendarView>("week");
  const [anchorDate, setAnchorDate] = useState<Date>(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [currentUser, setCurrentUser] = useState<UserId>("mattia");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CalendarEvent | null>(null);
  const [draftStart, setDraftStart] = useState<string | undefined>(undefined);
  const [draftEnd, setDraftEnd] = useState<string | undefined>(undefined);
  /** In vista mese: giorno usato da "+ Evento" (cella cliccata, evento aperto, o sync con anchor). */
  const [monthNewEventDate, setMonthNewEventDate] = useState<Date>(() => startOfLocalDay(new Date()));

  useEffect(() => {
    if (view !== "month") return;
    setMonthNewEventDate(startOfLocalDay(anchorDate));
  }, [view, anchorDate]);

  useEffect(() => {
    const unsubscribe = subscribeEvents((remoteEvents) => {
      setEvents(remoteEvents);
    });
    return unsubscribe;
  }, []);

  const pageTitle = useMemo(() => {
    if (view === "day") {
      return anchorDate.toLocaleDateString("it-IT", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
    }
    if (view === "month") {
      const t = anchorDate.toLocaleDateString("it-IT", { month: "long", year: "numeric" });
      return t.charAt(0).toUpperCase() + t.slice(1);
    }
    return "Settimana " + anchorDate.toLocaleDateString("it-IT");
  }, [view, anchorDate]);

  const visibleEvents = useMemo(
    () => events.filter((event) => event.userId === currentUser),
    [events, currentUser],
  );

  const goPrev = () => {
    const next = new Date(anchorDate);
    if (view === "day") {
      next.setDate(anchorDate.getDate() - 1);
    } else if (view === "week") {
      next.setDate(anchorDate.getDate() - 7);
    } else {
      next.setMonth(anchorDate.getMonth() - 1);
    }
    setAnchorDate(next);
  };

  const goNext = () => {
    const next = new Date(anchorDate);
    if (view === "day") {
      next.setDate(anchorDate.getDate() + 1);
    } else if (view === "week") {
      next.setDate(anchorDate.getDate() + 7);
    } else {
      next.setMonth(anchorDate.getMonth() + 1);
    }
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
      let persistedEvent: CalendarEvent | null = null;
      setEvents((prev) => {
        if (draft.id) {
          const target = prev.find((event) => event.id === draft.id);
          if (!target) return prev;
          if (target.userId !== currentUser) return prev; // read-only su eventi altrui
          const next = updateEvent(prev, draft.id, draft);
          persistedEvent = next.find((event) => event.id === draft.id) ?? null;
          return next;
        }
        const next = createEvent(prev, { ...draft, userId: currentUser });
        persistedEvent = next[next.length - 1] ?? null;
        return next;
      });
      if (persistedEvent) {
        void saveEventPersisted(persistedEvent).catch(() => undefined);
      }
      setModalOpen(false);
      return { ok: true };
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Errore salvataggio evento.";
      return { ok: false, error: msg };
    }
  };

  const deleteEvent = (eventId: string) => {
    setEvents((prev) => prev.filter((event) => event.id !== eventId || event.userId !== currentUser));
    void deleteEventPersisted(eventId).catch(() => undefined);
    setModalOpen(false);
  };

  const onToggleTask = (eventId: string, taskId: string, completed: boolean) => {
    console.log("1. onToggleTask chiamato", { eventId, taskId, completed });
    let persistedEvent: CalendarEvent | null = null;
    setEvents((prev) => {
      const next = toggleTaskCompleted(prev, eventId, taskId, completed, currentUser);
      persistedEvent = next.find((event) => event.id === eventId) ?? null;
      return next;
    });
    console.log("2. persistedEvent trovato:", persistedEvent);
    if (persistedEvent) {
      console.log("3. chiamando saveEvent con:", persistedEvent);
      void saveEventPersisted(persistedEvent)
        .then(() => {
          console.log("4. saveEvent completato con successo");
        })
        .catch((err) => console.error("saveEvent task failed:", err));
    }
  };

  const handleMoveSession = useCallback(
    (phase: MoveSessionPhase, payload: MoveSessionPayload) => {
      if (payload.snapshot.userId !== currentUser) return;
      if (phase === "cancel") {
        setEvents((prev) => prev.map((e) => (e.id === payload.eventId ? payload.snapshot : e)));
        return;
      }
      let persistedEvent: CalendarEvent | null = null;
      setEvents((prev) =>
        prev.map((e) => {
          if (e.id !== payload.eventId) return e;
          if (e.userId !== currentUser) return e;
          const { start, end } = computeMovedEventTimes(
            payload.snapshot,
            payload.deltaMinutes,
            DEFAULT_TIME_WINDOW,
            currentUser,
          );
          const updated = { ...e, start, end };
          if (phase === "end") persistedEvent = updated;
          return updated;
        }),
      );
      if (phase === "end" && persistedEvent) {
        void saveEventPersisted(persistedEvent).catch(() => undefined);
      }
    },
    [currentUser],
  );

  const handleResizeSession = useCallback(
    (phase: ResizeSessionPhase, payload: ResizeSessionPayload) => {
      if (payload.snapshot.userId !== currentUser) return;
      if (phase === "cancel") {
        setEvents((prev) => prev.map((e) => (e.id === payload.eventId ? payload.snapshot : e)));
        return;
      }
      let persistedEvent: CalendarEvent | null = null;
      setEvents((prev) =>
        prev.map((e) => {
          if (e.id !== payload.eventId) return e;
          if (e.userId !== currentUser) return e;
          const { start, end } = computeResizedEventTimes(
            payload.snapshot,
            payload.edge,
            payload.deltaMinutes,
            DEFAULT_TIME_WINDOW,
          );
          const updated = { ...e, start, end };
          if (phase === "end") persistedEvent = updated;
          return updated;
        }),
      );
      if (phase === "end" && persistedEvent) {
        void saveEventPersisted(persistedEvent).catch(() => undefined);
      }
    },
    [currentUser],
  );

  return (
    <div className="app-shell">
      <Toolbar
        view={view}
        title={pageTitle}
        onPrev={goPrev}
        onNext={goNext}
        onToday={goToday}
        onChangeView={setView}
        onCreate={() =>
          openNewEvent(view === "month" ? monthNewEventDate : anchorDate, 8 * 60)
        }
        currentUser={currentUser}
        onChangeUser={setCurrentUser}
      />

      <main className="container">
        {view === "month" ? (
          <MonthView
            anchorDate={anchorDate}
            events={visibleEvents}
            onOpenEvent={(event) => {
              setMonthNewEventDate(startOfLocalDay(parseIsoToDate(event.start)));
              setEditing(event);
              setModalOpen(true);
            }}
            onGoToDay={(date) => {
              setMonthNewEventDate(startOfLocalDay(date));
              setAnchorDate(date);
              setView("day");
            }}
          />
        ) : view === "day" ? (
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
            onMoveSession={handleMoveSession}
            onResizeSession={handleResizeSession}
            onSwipePrev={goPrev}
            onSwipeNext={goNext}
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
            onMoveSession={handleMoveSession}
            onResizeSession={handleResizeSession}
          />
        )}
        {view !== "month" ? (
          <section className="card" style={{ marginTop: 12, padding: 12 }}>
            <strong>Summary giorno selezionato</strong>
            <pre className="summary-pre">
              {generateDailySummary(anchorDate, events)}
            </pre>
          </section>
        ) : null}
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

    </div>
  );
}
