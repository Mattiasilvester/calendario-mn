# Calendar Behavior

## Time System
- Slot: 15 minuti.
- Finestra visibile: 06:00-22:00.
- Ogni calcolo deve usare utility condivise (no formule duplicate nei componenti).

## Views

### Day View
- Mostra una singola colonna temporale.
- Eventi posizionati assolutamente su una griglia oraria.
- Click/tap su slot vuoto: crea evento precompilato.

### Week View
- Mostra 7 colonne (lun-dom).
- Ogni colonna usa la stessa scala temporale della day view.
- Drag orizzontale cambia giorno, drag verticale cambia orario.

## Event Lifecycle

### Create
1. Utente clicca slot o pulsante "Nuovo evento".
2. Il sistema propone `start` allineato allo slot.
3. `end` iniziale = `start + durata default`.
4. Salvataggio consentito solo se range valido.

### Update
- Modifica da editor o via interazione diretta (drag/resize).
- Ogni modifica passa da validazione centralizzata.

### Delete
- Rimozione evento con conferma esplicita.

## Drag Behavior
- Move mantiene durata costante.
- Snap a 15 minuti.
- Clamp entro intervallo visibile quando applicabile.
- Update atomico dello stato (no parziali incoerenti).

## Resize Behavior
- Resize top modifica `start`.
- Resize bottom modifica `end`.
- Durata minima: 15 minuti.
- `end` non può mai precedere `start`.

## Rendering Rules
- Posizione e altezza evento derivano unicamente da `start` e `end`.
- Nessun offset visivo arbitrario non tracciato nella logica.
- Eventi sovrapposti devono mantenere leggibilità e consistenza.

## Determinism Rules
- Stessi eventi, stessa view, stessa data => stesso layout.
- Nessuna dipendenza da ordine casuale o mutazioni implicite.

## Error Handling UX
- Range invalido: messaggio chiaro e blocco salvataggio.
- Azioni non consentite: feedback non distruttivo.
- Dati corrotti in storage: fallback sicuro + log diagnostico.
