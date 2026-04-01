# DEVLOG — calendario-mn

Documento tecnico di contesto per riprendere il lavoro o iniziare una sessione con assistenza AI. Ultimo aggiornamento documentale: **aprile 2026** (allineato allo stato del repository locale).

---

## 1. Panoramica progetto

### Stack

| Layer | Tecnologia |
|--------|------------|
| Runtime UI | **React 18** (`react`, `react-dom`) |
| Linguaggio | **TypeScript** in modalità **strict** (`tsconfig.app.json`: `strict: true`, `noUnusedLocals`, `noUnusedParameters`) |
| Build | **Vite 5** (`vite`, `@vitejs/plugin-react`) |
| Persistenza remota | **Firebase** SDK (`firebase` package) — **Cloud Firestore** tramite adapter dedicato |
| Styling | CSS globale in `src/app/styles.css` + stili inline nei componenti calendario |

### Obiettivo prodotto

MVP di **calendario professionale** con pianificazione giornaliera/settimanale/mensile, creazione e modifica eventi, **drag** (spostamento verticale con conservazione durata) e **resize** (maniglie start/end), coerenza tra dati ISO e posizione visiva dei blocchi. Riferimento comportamentale: cartella `docs/` (in particolare `PRODUCT.md`, `CALENDAR_BEHAVIOR.md`, `DATA_MODEL.md`).

### URL pubblico e deploy

- **Base path Vite:** `base: "/calendario-mn/"` in `vite.config.ts` (righe 4–7). Tutti gli asset e il routing dell’app hosted devono essere serviti sotto quel prefisso.
- **GitHub Pages (previsto):** `https://Mattiasilvester.github.io/calendario-mn/`  
  *(Verificare che GitHub Pages sia configurato con source “GitHub Actions” e che il workflow di deploy sia verde.)*
- **Workflow:** `.github/workflows/deploy.yml` — su push a `main` (o `workflow_dispatch`): `npm ci`, `npm run build`, upload artefatto `dist/` verso Pages.

### Repository

- Remoto tipico: `https://github.com/Mattiasilvester/calendario-mn.git` (verificare con `git remote -v` sul clone).

---

## 2. Architettura

### Struttura cartelle (alto livello)

```text
calendario-mn/
├── .cursor/rules/          # Regole IDE/AI (obbligatorie da rispettare in sessione)
├── .github/workflows/      # deploy.yml → GitHub Pages
├── docs/                   # Source of truth prodotto e comportamento
├── src/
│   ├── app/                # entry: main.tsx, App.tsx, styles.css
│   ├── components/calendar/# UI calendario (Day, Week, Month, Toolbar, Modal, …)
│   ├── hooks/              # useMoveEventDrag, useResizeEdgeDrag, useDayViewSwipeNavigation
│   ├── logic/
│   │   ├── core/           # calendar.engine.ts, month.engine.ts (pure)
│   │   └── time/           # time.engine.ts — slot, layout px, date helpers
│   ├── mocks/              # MOCK_EVENTS (dati di esempio; non più usati come source of truth runtime)
│   ├── services/
│   │   ├── firebase.ts     # init app + export `db`
│   │   └── persistence/
│   │       └── firestoreAdapter.ts  # subscribeEvents, saveEvent, deleteEvent
│   ├── types/calendar.ts   # CalendarEvent, CalendarView, TimeWindow, …
│   └── utils/timeSlots.ts  # re-export di time.engine (barriera import unificata)
├── index.html              # entry Vite
├── vite.config.ts
├── package.json
└── DEVLOG.md               # questo file
```

### Pattern architetturali

1. **Separazione UI / logica pura** (regole `.cursor/rules/01-architecture.mdc`):
   - Componenti: rendering e wiring eventi.
   - `src/logic/core/calendar.engine.ts` e `src/logic/time/time.engine.ts`: funzioni pure (validazione, move/resize, summary, ecc.).
2. **Stato eventi centralizzato** in `CalendarLayout.tsx`: array `events`, filtro utente `visibleEvents`, nessun duplicato della logica slot/orari fuori dai moduli tempo.
3. **Persistenza sostituibile:** accesso a Firestore **solo** tramite `src/services/persistence/firestoreAdapter.ts`; `CalendarLayout` non importa direttamente `firebase/firestore` oltre ciò che passa dall’adapter (in realtà importa le funzioni dall’adapter, non Firestore raw).
4. **Tempo:** slot **15 min**; finestra visibile **06:00–23:00** (`DEFAULT_TIME_WINDOW` in `time.engine.ts`); orari evento in **ISO UTC** (`toIsoUtc` / campi `start`/`end` stringa).

### File principali e responsabilità

| File | Ruolo |
|------|--------|
| `src/app/main.tsx` | Mount React su `#root` |
| `src/app/App.tsx` | Render `CalendarLayout` |
| `src/components/calendar/CalendarLayout.tsx` | Stato globale calendario: `view`, `anchorDate`, `events`, utente, modal, integrazione Firestore (subscribe + save/delete), summary |
| `src/components/calendar/DayView.tsx` | Colonna singola + TimeGrid + EventCard; swipe giorno |
| `src/components/calendar/WeekView.tsx` | 7 colonne (lun–dom), stessa scala oraria |
| `src/components/calendar/MonthView.tsx` | Griglia mese 6×7; no drag sulla griglia |
| `src/components/calendar/Toolbar.tsx` | Navigazione + viste Mese/Giorno/Settimana |
| `src/components/calendar/EventCard.tsx` | Card evento, drag area, resize tabs, task checkbox |
| `src/components/calendar/EventModal.tsx` | CRUD form |
| `src/logic/core/month.engine.ts` | `buildMonthGrid`, `eventsForDay` |
| `src/hooks/useDayViewSwipeNavigation.ts` | Pointer swipe + wheel trackpad per cambio giorno |
| `src/services/persistence/firestoreAdapter.ts` | `onSnapshot` su collection `events`, `setDoc`, `deleteDoc` |

---

## 3. Funzionalità implementate (cronologia cumulativa)

### 3.1 Viste

- **Giorno** (`DayView.tsx`): una timeline, slot cliccabili per nuovo evento, eventi posizionati con `eventToLayout`.
- **Settimana** (`WeekView.tsx`): 7 colonne, `startOfWeek` da `time.engine.ts` (lunedì come inizio settimana).
- **Mese** (`MonthView.tsx` + `month.engine.ts`):
  - Griglia **6×7**, etichette Lun–Dom.
  - Clic **cella giorno** → `CalendarLayout` imposta `anchorDate` e passa a vista **giorno** (`onGoToDay`).
  - Clic **su chip evento** → apertura modale modifica.
  - **Nessun** drag/resize sulla griglia mensile (solo giorno/settimana).
  - Ordine bottoni toolbar: **Mese | Giorno | Settimana** (`Toolbar.tsx`).
- **Navigazione ← / Oggi / →:** dipende da `view`: ±1 giorno, ±7 giorni, o ±1 mese (`CalendarLayout.tsx`, funzioni `goPrev` / `goNext`, circa righe 83–105).

### 3.2 Eventi (CRUD UI)

- Creazione: slot vuoto o `+ Evento` (`openNewEvent` in `CalendarLayout.tsx`, circa righe 109–120).
- Modifica / eliminazione: `EventModal.tsx` + `saveDraft` / `deleteEvent` in `CalendarLayout.tsx`.
- Validazione: `validateEvent` in `calendar.engine.ts` prima di commit stato.

### 3.3 Vista mese e “+ Evento”

- Stato `monthNewEventDate` + `useEffect` quando `view === "month"` per allineo con `anchorDate` (righe 43–49, 46–49).
- In vista mese, `+ Evento` usa `monthNewEventDate` se applicabile; altrimenti `anchorDate` (`Toolbar` `onCreate`, circa righe 236–238).
- Clic su evento in mese aggiorna anche il giorno target per nuovo evento tramite handler `MonthView` (righe ~248–251 nel file layout).

### 3.4 Drag e resize (MVP core)

- **Move:** `useMoveEventDrag.ts` — snapshot a `pointerdown`, delta verticale, snap 15 min, `computeMovedEventTimes` (`calendar.engine.ts`). Solo proprietario (`actorUserId` / `currentUser`).
- **Resize:** `useResizeEdgeDrag.ts` — tab alto/basso su `EventCard.tsx`, `computeResizedEventTimes`.
- **Sessioni:** fasi `start` | `move` | `end` | `cancel`; su cancel ripristino snapshot in `CalendarLayout` (`handleMoveSession`, `handleResizeSession`).

### 3.5 Swipe / wheel vista giorno

- `useDayViewSwipeNavigation.ts`: gestione su wrapper `section` in `DayView.tsx`.
  - **Pointer:** swipe orizzontale (escluso `[data-calendar-event-card]` su `EventCard.tsx`).
  - **Trackpad:** accumulo `wheel` `deltaX` + dominanza su asse verticale; supporto **Shift+scroll** come orizzontale.
- Collegamento a `goPrev` / `goNext` solo in day view (`CalendarLayout.tsx`).

### 3.6 Task negli eventi

- Modello: `EventTask[]` su `CalendarEvent` (`types/calendar.ts`).
- Toggle checkbox: `EventCard` → `onToggleTask` → `toggleTaskCompleted` (`calendar.engine.ts`) → aggiornamento stato + **persistenza** (vedi sotto).

### 3.7 Riepilogo testuale (“Summary”)

- `generateDailySummary` in `calendar.engine.ts`, mostrato sotto la griglia **solo se** `view !== "month"` (`CalendarLayout.tsx`, blocco condizionale sul summary).

### 3.8 Persistenza Firestore

- **`src/services/firebase.ts`:** `initializeApp` + `getFirestore`, config progetto (apiKey, projectId, ecc.).
- **`src/services/persistence/firestoreAdapter.ts`:**
  - `subscribeEvents(onChange)` — `onSnapshot` sulla collection **`events`**, map documenti → `CalendarEvent` con type guard `isCalendarEvent`, ordinamento per `start`.
  - `saveEvent(event)` — `setDoc` con document id = `event.id`; payload **plain object** via `JSON.parse(JSON.stringify(event))` per evitare valori non serializzabili (es. campi complessi).
  - `deleteEvent(id)` — `deleteDoc`.
- **`CalendarLayout.tsx`:**
  - `useEffect` mount: `subscribeEvents` → `setEvents(remoteEvents)` (righe 51–56).
  - `eventsRef` + `useEffect` che sincronizza `eventsRef.current = events` (righe 37, 58–60) per calcoli deterministici senza stale closure.
  - Dopo create/update in modale: `saveEventPersisted(persistedEvent)` (righe 143–145; nota: vedi sezione problemi su pattern `setEvents` + variabile esterna).
  - Dopo delete: `deleteEventPersisted` (righe 154–157).
  - Dopo toggle task: `saveEventPersisted` (righe 160–167).
  - Dopo drag/resize **end**: `saveEventPersisted(persistedEvent)` nei handler (corpo `handleMoveSession` / `handleResizeSession`).

### 3.9 Multi-utente (UI)

- Due utenti fittizi: `mattia` | `nicholas` (`UserId`). Toolbar selezione utente; eventi altrui in sola lettura per drag e alcune azioni (vedi `calendar.engine.ts` e `EventCard`).

---

## 4. Problemi risolti (storia e soluzioni)

### 4.1 Eventi che “sparivano” al refresh (nessuna persistenza reale)

- **Problema:** In una fase iniziale del progetto gli eventi vivevano solo in React state inizializzato da `MOCK_EVENTS` — nessun backend.
- **Causa:** Assenza di layer di persistenza; ogni reload ripartiva dai mock.
- **Soluzione:** Integrazione **Firestore** + `subscribeEvents` al mount + `saveEvent` / `deleteEvent` sulle operazioni rilevanti.

### 4.2 Expectation “Firestore” vs codice senza Firebase (analisi sessione)

- **Problema:** Pare persistenza Firestore ma in repo non c’era SDK né adapter.
- **Causa:** Confusione tra obiettivo prodotto (“persistenza sostituibile”) e implementazione effettiva al momento dell’analisi.
- **Soluzione:** Implementato adapter e wiring in `CalendarLayout` come da specifiche successive.

### 4.3 Swipe cambio giorno su computer (trackpad) non funzionante

- **Problema:** Solo listener pointer; trackpad a due dita emette prevalentemente **`wheel`** con `deltaX`.
- **Causa:** Gesto non mappato a pointer.
- **Soluzione:** Estensione `useDayViewSwipeNavigation.ts` con handler `wheel`, soglie e dominanza verticale/orizzontale.

### 4.4 Toggle task: dubbio su `saveEvent` e stato `persistedEvent`

- **Problema percepito:** “Dopo toggle, React si aggiorna ma Firestore no” o “persistedEvent sempre null”.
- **Analisi:** In una versione intermedia, lettura di `persistedEvent` **dopo** `setEvents` con assegnazione **dentro** il callback poteva generare confusione in debug; in React 18 l’updater di `setState` spesso esegue subito, ma **non è un’API garantita** per “leggere il risultato dopo” dal codice immediatamente successivo in tutti i contesti.
- **Soluzione applicata (definitiva per toggle):**
  - Calcolo **`nextEvents = toggleTaskCompleted(eventsRef.current, ...)` prima** di `setEvents(nextEvents)`.
  - **`eventsRef`** tenuto allineato a `events` tramite `useEffect` (righe 58–60) per evitare **stale state** rispetto al prompt naive che usava `events` direttamente.

### 4.5 Serializzazione Firestore (tasks / oggetti non plain)

- **Problema potenziale:** `setDoc` rifiuta dati non serializzabili.
- **Soluzione:** In `saveEvent`, clonazione plain via `JSON.parse(JSON.stringify(event))` prima di `setDoc` (`firestoreAdapter.ts`, righe 47–50).

### 4.6 Log di debug rumore in produzione

- **Problema:** `console.log` numerati per trace toggle/Firestore.
- **Soluzione:** Rimossi; lasciato almeno `console.error` sul fallimento save dopo toggle task (`CalendarLayout.tsx`, riga 165).

---

## 5. Stato attuale

### Cosa funziona (verificato a livello architetturale / build)

- Build TypeScript + Vite: `npm run build`.
- Viste giorno / settimana / mese, CRUD, drag, resize, swipe/wheel giorno, summary (fuori mese).
- Sync real-time lato client: **`onSnapshot`** popola `events`.
- Scritture: **`setDoc`** per intero documento evento; **`deleteDoc`** su delete.

### LACUNE / rischi noti

1. **`docs/PRODUCT.md`** menziona ancora “Persistenza locale” nello scope MVP (riga ~21) mentre l’implementazione attuale è **Firestore**; andrebbe allineato il testo quando si conferma il modello definitivo.
2. **Error handling persistenza:** diversi `catch` usano ancora `() => undefined` (es. `saveDraft` dopo save, `deleteEvent`, move/resize) — errori **silenziosi** tranne toggle task (che ha `console.error`). Miglioramento: logging uniforme o toast/UI.
3. **Pattern `persistedEvent` in `saveDraft`:** calcolo ancora **dentro** callback `setEvents` (righe 129–142). Per coerenza con il fix del toggle, si potrebbe refactorare a calcolo da `eventsRef.current` + `setEvents(next)` (non fatto per non divergere dalla richiesta “solo layer persistenza” salvo nuova issue).
4. **Regole Firestore / sicurezza:** non versionate in questo repo; errori permesso rete apparirebbero come promise rejected (oggi spesso ingoiati).
5. **Test automatici:** assenza di Vitest/Jest; regressioni solo manuali o CI build.
6. **Bundle size:** warning Vite su JS > ~500 KB post-Firebase.

### Miglioramenti possibili (non implementati)

- Code-splitting Firebase (dynamic import).
- Adapter interface esplicita (tipo `PersistenceAdapter`) per mock in test.
- Allineare summary utente vs `visibleEvents` (oggi summary può includere entrambi gli utenti — comportamento storico).

---

## 6. Regole da rispettare

### Convenzioni (`.cursor/rules/`)

- **Strict TypeScript;** evitare `any` salvo giustificazione documentata (`02-code-style.mdc`).
- **Logica calendario in moduli dedicati;** non duplicare conversioni px↔tempo fuori da `time.engine` / helper centralizzati (`03-calendar-logic.mdc`, `01-architecture.mdc`).
- **Slot 15 min;** finestra 06:00–23:00; `end > start`; durata minima 15 min; eventi in ISO UTC.
- **Drag/resize:** snap 15 min; move conserva durata; resize top=start, bottom=end; vietati intervalli invalidi (`04-drag-drop.mdc`).
- **Stato immutabile;** validazione prima di commit; adapter persistenza sostituibile (`05-state.mdc`).
- **Prima di nuove feature:** confrontare `docs/`; passi incrementali; test dove ha senso (`06-workflow.mdc`).

### Cosa non toccare senza necessità diretta

- **Non riscrivere** `calendar.engine.ts` / `time.engine.ts` per esigenze UI marginali.
- **Non spostare** la matematica di layout eventi fuori dai moduli tempo.
- **Non** rendere la vista mese drag-and-drop senza aggiornare `docs/` e accettare complessità.

### Pattern obbligatori

- Import tempo da `src/utils/timeSlots.ts` (re-export) nei componenti, salvo eccezioni già stabilite nel modulo core.
- Nuova persistenza: estendere **adapter** (`firestoreAdapter.ts` o successore), non spargere Firestore nei componenti.

---

## 7. Come iniziare una nuova sessione

### Setup locale

```bash
git clone <url-repo>
cd calendario-mn
npm ci
npm run dev
```

Aprire il dev server (tipicamente `http://localhost:5173/calendario-mn/` — verificare path base da `vite.config.ts`).

### Prima di modificare

1. Leggere **`docs/PRODUCT.md`** e **`docs/CALENDAR_BEHAVIOR.md`** per il comportamento atteso.
2. Rileggere **questo `DEVLOG.md`** e, se presente, `docs/SESSION_HANDOFF.md` (note sessione / deploy).
3. Eseguire **`npm run build`** dopo modifiche sostanziali.

### File “punto di ingresso” debug

- Stato UI e persistenza: `src/components/calendar/CalendarLayout.tsx`
- Firestore: `src/services/persistence/firestoreAdapter.ts`, `src/services/firebase.ts`
- Tempo/layout: `src/logic/time/time.engine.ts`
- Regole business eventi: `src/logic/core/calendar.engine.ts`

### Convenzione messaggio utente (storica sessione HANDOFF)

In una sessione passata era stata richiesta di non modificare il repo fino a un nuovo messaggio che iniziasse con **«buongiorno»** — da considerare convenzione del proprietario, non vincolo tecnico del codice.

---

## 8. Riferimenti rapidi (linee indicativi — possono shiftare con edit)

| Area | File | Note |
|------|------|------|
| Subscribe Firestore + stato events | `CalendarLayout.tsx` | ~righe 51–56, 36–37, 58–60 |
| Toggle task + save | `CalendarLayout.tsx` | ~righe 160–167 |
| saveEvent plain JSON | `firestoreAdapter.ts` | ~righe 47–50 |
| Config firebase | `firebase.ts` | intero file |
| Collection name | `firestoreAdapter.ts` | `EVENTS_COLLECTION = "events"` |
| Base URL app | `vite.config.ts` | `base: "/calendario-mn/"` |

---

*Fine DEVLOG.*
