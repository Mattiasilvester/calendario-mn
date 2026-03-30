# Test Cases (MVP)

## 1. Time Math

### T1 - Snap Quarter Hour
- Input: minuto 08:07
- Expected: 08:00 (round down) o regola definita in progetto

### T2 - Pixel to Time Determinism
- Input: stesso `y` pixel ripetuto
- Expected: stesso timestamp sempre

### T3 - Time to Pixel Determinism
- Input: stesso `start/end`
- Expected: stesso `top/height`

## 2. Validation

### V1 - Invalid Range
- Input: `end <= start`
- Expected: blocco salvataggio + errore UI

### V2 - Empty Title
- Input: `title = ""`
- Expected: blocco salvataggio + errore UI

## 3. CRUD

### C1 - Create Event
- Action: crea evento su slot libero
- Expected: evento visibile in posizione corretta e persistito

### C2 - Edit Event
- Action: cambia titolo e orario da editor
- Expected: update coerente su stato e UI

### C3 - Delete Event
- Action: elimina evento
- Expected: rimozione da UI e storage

## 4. Drag

### D1 - Move Vertical
- Action: drag su stessa colonna
- Expected: nuovo start/end con durata invariata

### D2 - Move Horizontal (Week)
- Action: drag su colonna giorno diversa
- Expected: giorno aggiornato + orario coerente

### D3 - Snap
- Action: rilascio tra due slot
- Expected: allineamento a 15 minuti

## 5. Resize

### R1 - Resize Bottom
- Action: estendi evento verso il basso
- Expected: `end` aumenta con snap corretto

### R2 - Resize Top
- Action: riduci/alza inizio evento
- Expected: `start` cambia, `end` invariato

### R3 - Min Duration
- Action: resize sotto soglia
- Expected: clamp a 15 minuti

## 6. Overlap

### O1 - Two Overlapping Events
- Input: due eventi con overlap parziale
- Expected: entrambi renderizzati, nessuno perso

## 7. Persistence

### P1 - Reload
- Action: refresh pagina
- Expected: stessi eventi caricati

### P2 - Corrupted Storage
- Input: payload invalido
- Expected: fallback sicuro, app non crasha
