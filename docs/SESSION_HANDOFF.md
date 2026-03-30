# Handoff sessione (stop fino al prossimo «buongiorno»)

**Istruzione per chi lavora sul repo:** non apportare modifiche al codice o alla configurazione finché il proprietario del progetto non invia un nuovo messaggio che inizia con **«buongiorno»**.

---

## Stato del progetto

- **Stack:** React 18 + TypeScript (strict) + **Vite** (non è un’app fatta di un solo file HTML; `index.html` è l’entry Vite che monta `src/app/main.tsx`).
- **Repository remoto:** GitHub (`calendario-mn`).
- **Deploy:** Workflow **GitHub Actions** `.github/workflows/deploy.yml` → artefatto da `dist` su **GitHub Pages**. `vite.config.ts` usa `base: "/calendario-mn/"` → URL tipo `https://<username>.github.io/calendario-mn/`. Attivare **Settings → Pages → Source: GitHub Actions** se non già fatto.
- **Finestra temporale documentata:** 06:00–23:00; slot **15 minuti**; eventi in **ISO UTC**.

---

## Funzionalità calendario (MVP) implementate in questa sessione

### Spostamento evento (drag verticale)

- **Handle UI:** solo la striscia **titolo + fascia orario** (non le task, non i metadati in basso).
- **Solo proprietario:** `moveEvent` in `calendar.engine.ts` riceve `actorUserId`; eventi altrui non si spostano.
- **Hook:** `src/hooks/useMoveEventDrag.ts` — snapshot a `pointerdown`, `pointermove` con delta cumulativo, `deltaPxToRoundedSlotMinutes`, fasi `start` | `move` | `end` | `cancel`; sotto ~6px → cancel; durata conservata + clamp finestra.
- **Logica pura:** `computeMovedEventTimes` in `calendar.engine.ts`; `moveEvent` la riusa.
- **Guida visiva:** linea + etichetta orario dell’**inizio** previsto (`ResizeGuideOverlay`, `dateTimeToLayoutTopPx`).

### Ridimensionamento durata (resize)

- **Tab** bordo superiore (start) e inferiore (end): larghezza **25%** della card, angoli arrotondati, **solo verso l’interno** della card.
- **Hook:** `src/hooks/useResizeEdgeDrag.ts` — stesso schema session + snapshot; guida sull’orario del **bordo** trascinato.
- **Logica pura:** `computeResizedEventTimes`; `resizeEvent` la riusa.

### Layout / stato

- `CalendarLayout.tsx`: `handleMoveSession`, `handleResizeSession` — su `cancel` ripristinano `payload.snapshot`; altrimenti applicano le funzioni pure sullo snapshot e delta cumulativo.
- `EventCard.tsx`: `onMoveSession`, `onResizeSession`, **`onDragGuide`** condivisa tra move e resize.
- `DayView.tsx` / `WeekView.tsx`: stato guida (`timeDragGuide`); in settimana include `dayIso` per la colonna corretta.
- **Componente:** `src/components/calendar/ResizeGuideOverlay.tsx`.

### Altri file rilevanti

- `src/logic/time/time.engine.ts` — `deltaPxToRoundedSlotMinutes`, `dateTimeToLayoutTopPx`, `eventToLayout`, ecc.
- `src/hooks/useVerticalDragCommit.ts` — ancora presente (commit solo a `pointerup`); il move usa `useMoveEventDrag`.

---

## Commit Git citati in sessione

- `ff45c03` — feat: live drag/resize + guida timeline.
- `951b29d` — chore: docs 06:00–23:00 + aggiornamenti UI (styles, EventModal, TimeColumn, TimeGrid).

*(Verificare con `git log` sul clone locale per lo stato attuale.)*

---

## UX da ricordare (per utenti / test)

- **Spostare:** trascinare dalla **striscia titolo + orario**.
- **Allungare/accorciare:** tab **in alto** (inizio) e **in basso** (fine).
- **Click** sulla card (owner): apre modale; dopo un drag valido il click viene soppresso come prima.

---

## Richiesta icona mobile (decisione)

È stata discussa un’icona “tenere premuto” per avviare il drag su mobile; **non implementata**: l’utente ha confermato che va bene sapere che il drag parte dal **titolo/orario**. Eventuale evoluzione futura: icona handle dedicata, riusando la stessa sessione `useMoveEventDrag`.

---

## Fine documento

Salvato come unico punto di riferimento per chiudere la sessione. **Nessuna modifica al repository fino al prossimo «buongiorno».**
