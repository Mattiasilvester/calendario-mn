# Edge Cases

## Time Boundaries
- Evento con `start == end` -> invalido.
- Evento con `end < start` -> invalido.
- Evento che inizia prima di 06:00 o finisce dopo 23:00:
  - comportamento definito (clamp o render parziale) ma sempre coerente.

## Slot Alignment
- Drag/resize su minuti non allineati -> snap a multipli di 15.
- Conversioni pixel->tempo e tempo->pixel devono essere inverse coerenti.

## Overlaps
- Eventi sovrapposti nello stesso intervallo:
  - nessuna perdita di evento.
  - layout stabile e leggibile.

## Interaction Races
- Drag rapido + resize immediato.
- Open editor durante drag in corso.
- Click ripetuti su delete.
- Tutti i casi devono lasciare stato consistente.

## Persistence Faults
- Storage non disponibile.
- Record parzialmente corrotti.
- JSON malformato.
- Fallback: dataset vuoto + warning non bloccante.

## DST / Clock Changes
- Cambio ora legale (giorni da 23 o 25 ore) non deve corrompere range.
- Persistenza UTC per minimizzare ambiguità.

## Determinism Risks
- Ordinamento eventi non stabile.
- Mutazioni in place dell'array eventi.
- Uso di `Date.now()` dentro funzioni di layout.
- Questi pattern sono vietati nella logica di rendering.

## UX Edge Cases
- Nessun evento: mostrare empty state chiaro.
- Evento con titolo molto lungo: truncation sicura.
- Eventi molto corti: altezza minima visiva ma durata reale preservata.
