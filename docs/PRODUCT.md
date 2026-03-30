# Product Overview

## Vision
Calendario drag-and-drop interno, veloce e affidabile, pensato per pianificare attività quotidiane senza complessità superflua.

## Product Goals
- Gestire eventi in vista giorno e settimana.
- Modificare eventi in modo naturale (drag, resize, edit form).
- Garantire coerenza tra dato e UI (nessuna discrepanza tra orario reale e blocco visivo).
- Offrire UX chiara, professionale e semplice.

## MVP Scope
- Day view
- Week view
- Create event
- Update event
- Delete event
- Drag event (move)
- Resize event (duration)
- Persistenza locale con possibilità di sostituzione adapter in seguito

## Non-Goals (MVP)
- Ricorrenze complesse
- Timezone multi-utente avanzate
- Notifiche push
- Permessi granulari multi-ruolo
- Ottimizzazioni premature

## Primary Users
- Team interno che pianifica attività operative giornaliere e settimanali.

## UX Principles
- Ogni azione deve avere feedback immediato.
- Drag/resize sempre snap a slot regolari.
- Layout pulito con focus sui contenuti.
- Accessibilità minima garantita (focus visibile, bottoni chiari, target touch adeguati).

## Quality Bar
- Determinismo: stessi input => stesso risultato.
- Validazioni forti su range temporali.
- Funzioni tempo centralizzate.
- Componenti piccoli e manutenibili.
