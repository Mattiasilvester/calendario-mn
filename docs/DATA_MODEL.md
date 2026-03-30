# Data Model

## Event Entity

```ts
type EventStatus = "confirmed" | "tentative" | "cancelled";

type CalendarEvent = {
  id: string;
  title: string;
  description: string;
  start: string; // ISO-8601 UTC
  end: string;   // ISO-8601 UTC
  color: string; // hex color
  status: EventStatus;
};
```

## Constraints
- `id` obbligatorio, univoco.
- `title` obbligatorio, trim non vuoto.
- `start` e `end` obbligatori, ISO validi.
- `end > start` sempre.
- Durata minima: 15 minuti.
- `color` in formato hex valido (`#RRGGBB` o equivalente supportato).

## Temporal Conventions
- Persistenza: ISO UTC.
- Rendering: conversione locale.
- Calcoli interni: epoch milliseconds o minuti normalizzati.

## Calendar State (MVP)

```ts
type CalendarView = "day" | "week";

type CalendarState = {
  view: CalendarView;
  selectedDate: string; // YYYY-MM-DD
  events: CalendarEvent[];
  ui: {
    isEditorOpen: boolean;
    editingEventId: string | null;
    draftStart: string | null;
    draftEnd: string | null;
  };
};
```

## Storage Contract

```ts
interface CalendarStorageAdapter {
  loadEvents(): Promise<CalendarEvent[]>;
  saveEvents(events: CalendarEvent[]): Promise<void>;
}
```

## Validation Contract
- Validazione input in ingresso (create/update/import).
- Eventuali record invalidi non devono rompere il rendering.
- Gli errori devono essere gestiti con fallback sicuri.
