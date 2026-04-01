import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  setDoc,
} from "firebase/firestore";
import type { CalendarEvent } from "../../types/calendar";
import { db } from "../firebase";

const EVENTS_COLLECTION = "events";

function isCalendarEvent(value: unknown): value is CalendarEvent {
  if (!value || typeof value !== "object") return false;
  const v = value as Partial<CalendarEvent>;
  return (
    typeof v.id === "string" &&
    typeof v.userId === "string" &&
    typeof v.category === "string" &&
    typeof v.title === "string" &&
    typeof v.description === "string" &&
    typeof v.start === "string" &&
    typeof v.end === "string" &&
    typeof v.status === "string" &&
    Array.isArray(v.tasks)
  );
}

export function subscribeEvents(onChange: (events: CalendarEvent[]) => void): () => void {
  const eventsRef = collection(db, EVENTS_COLLECTION);
  const eventsQuery = query(eventsRef);

  return onSnapshot(eventsQuery, (snapshot) => {
    const events = snapshot.docs
      .map((item) => {
        const data = { id: item.id, ...item.data() };
        return isCalendarEvent(data) ? data : null;
      })
      .filter((event): event is CalendarEvent => event !== null)
      .sort((a, b) => a.start.localeCompare(b.start));

    onChange(events);
  });
}

export async function saveEvent(event: CalendarEvent): Promise<void> {
  const eventRef = doc(db, EVENTS_COLLECTION, event.id);
  const plainEvent = JSON.parse(JSON.stringify(event)) as CalendarEvent;
  console.log("5. firestoreAdapter.saveEvent chiamato con id:", event.id, "tasks:", event.tasks);
  await setDoc(eventRef, plainEvent);
  console.log("6. setDoc completato");
}

export async function deleteEvent(id: string): Promise<void> {
  const eventRef = doc(db, EVENTS_COLLECTION, id);
  await deleteDoc(eventRef);
}
