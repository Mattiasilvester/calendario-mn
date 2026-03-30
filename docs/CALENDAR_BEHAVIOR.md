# Calendar Behavior

## Time System
- Slot: 15 minuti.
- Finestra visibile: 06:00-23:00.
- Ogni calcolo deve usare utility condivise (no formule duplicate nei componenti).

## Views

### Day View
- Mostra una singola colonna temporale.
- Eventi posizionati assolutamente su una griglia oraria.
- Click/tap su slot vuoto: crea evento precompilato.
- Swipe orizzontale sulla vista (timeline e colonna ore, non sulle card evento): verso sinistra → giorno successivo, verso destra → giorno precedente (stesso effetto delle frecce). Su **trackpad** il gesto è spesso mappato come scroll orizzontale (`wheel` / `deltaX`), non come pointer: è supportato insieme al trascinamento touch/mouse. Lo scroll verticale resta prioritario se il movimento è prevalentemente verticale; con **Shift + rotellina** si usa lo scroll verticale come orizzontale (comportamento tipico del desktop).

### Week View
- Mostra 7 colonne (lun-dom).
- Ogni colonna usa la stessa scala temporale della day view.
- Drag orizzontale cambia giorno, drag verticale cambia orario.

### Month View
- Griglia 6×7 con inizio settimana lunedì (stessa convenzione della week view).
- Frecce ← → spostano di un mese; "Oggi" imposta l’ancora sulla data corrente.
- Clic su una cella giorno: passa alla day view con quella data (nessun drag/resize in mese).
- Clic su un evento in cella: apre il modal di modifica.
- "+ Evento" usa il **giorno scelto in mese**: ultima cella giorno cliccata (anche se poi passi alla day view), oppure il giorno di un evento su cui hai cliccato, oppure — se non hai ancora cliccato — `anchorDate` aggiornato da frecce / Oggi (sincronizzato all’entrata in vista mese).
- Il riepilogo testuale sotto il calendario è nascosto in vista mese (evita ambiguità sul “giorno selezionato”).

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
