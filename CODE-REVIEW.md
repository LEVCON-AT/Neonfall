# NEONFALL — Code Review Report

**Datum:** S5c-final
**Reviewer:** Z.ai Code Agent
**Scope:** Vollständiger Codebase nach Sprints 1-6 + P1-P5 + Bug-Fixes

---

## Zusammenfassung

| Kategorie | Status |
|-----------|--------|
| Funktionalität | ✅ Sehr gut — alle Features arbeiten |
| Code-Qualität | ✅ Gut — saubere TypeScript-Typen, shadcn/ui Patterns |
| Architektur | ✅ Sehr gut — klare Trennung IIFE/React/Shell |
| Security | ✅ Gut — Rate-Limiting, Zod-Validation, Input-Sanitization |
| Performance | ✅ Gut — will-change, GPU-Layer, throttled updates |
| Wartbarkeit | ⚠️ Mittel — NeonfallApp.tsx ist 1358 Zeilen (zu groß) |
| IIFE-Preservation | ⚠️ Gelockert in P1 (gewollt, dokumentiert) |

**Gesamturteil:** Produktionsreif mit kleinen Verbesserungspotenzialen.

---

## ✅ Stärken

### 1. Architektur — IIFE/React-Bridge
Die Brücke zwischen dem IIFE und der React-Schicht ist elegant gelöst:
- `MutationObserver` spiegelt IIFE-DOM-State in `useGameStore` (Effect C)
- `syncGameSlider()` als einzige Schreib-Schnittstelle zum IIFE
- `__nfGetMode/__nfAddGarbage/__nfGetBoard/__nfRestart` Hooks sauber exponiert
- `nf-lines-cleared`/`nf-board-updated` CustomEvents für Multiplayer/Haptics
- `stripTypeAnnotations()` entfernt nur die 4 TS-Annotationen vor Injektion

### 2. Security
- **API Rate-Limiting:** 6 Score-Submissions/Minute/IP (in-memory)
- **Zod-Validation:** ScoreSchema mit `safeParse` für alle Felder
- **Input-Sanitization:** `sanitizePlayerName()` (1-16 chars), `isValidRoomId()` (4×A-Z)
- **SQL-Injection:** Prisma ORM mit parametrisierten Queries
- **CSP:** nginx config mit `connect-src 'self' wss: ws:` für WebSocket

### 3. Performance
- `will-change` hints auf Canvas, game-container, flash-overlay, glass
- `backdrop-filter` reduziert (blur(18px)→blur(12px))
- Drift-Animation pausiert während gameplay (`body.nf-playing`)
- Board-Updates throttled auf 10fps (Multiplayer)
- Standalone Next.js build für Production

### 4. UX-Polish
- Stat-Pulse Animation (color-coded per stat type)
- Mode-spezifische Game-Over-Screens ("40 LINIEN!" / "ZEIT ABGELAUFEN")
- Music-Overlay reveal-on-demand (long-press/dblclick, auto-hide)
- NameInputDialog mit auto-fill aus localStorage
- 12-Bag Randomizer (fair distribution)

---

## ⚠️ Verbesserungspotenziale

### 1. NeonfallApp.tsx ist zu groß (1358 Zeilen) — **MEDIUM**

**Problem:** 13 Effects (A-M) + CSS + Bootstrap in einer Datei. Schwer zu warten.

**Empfehlung:** Aufteilen in Custom Hooks:
- `useGameBootstrap()` (Effects A-B)
- `useGameSync()` (Effect C: MutationObserver)
- `useModeLogic()` (Effects F-G: Sprint/Ultra)
- `useKeyboardShortcuts()` (Effect H)
- `useGameFeel()` (Effects J-M: Haptics, Hint, Mode-Game-Over)
- CSS in separate Datei

**Aufwand:** Mittel (2-3 Stunden, kein Funktionsverlust)

### 2. `as any` / `as unknown as` Casts — **LOW**

**Problem:** 6× `window as any` in Shell, 8× `window as unknown as` in NeonfallApp.

**Empfehlung:** Zentrale Type-Declaration in `types.ts`:
```typescript
declare global {
  interface Window {
    __nfGetMode?: () => string;
    __nfAddGarbage?: (count: number) => void;
    __nfGetBoard?: () => number[][];
    __nfRestart?: () => void;
    __nfShellInit?: boolean;
    webkitAudioContext?: typeof AudioContext;
  }
}
```

### 3. MultiplayerDialog — Race Conditions möglich — **LOW**

**Problem:** Socket-Events setzen State ohne aktuelle MP-State zu prüfen.

**Empfehlung:** Guard mit `mpStateRef`:
```typescript
sock.on('opponent:board', (data) => {
  if (mpStateRef.current !== 'playing') return;
  setOpponentBoard(data.board);
});
```

### 4. Canvas aspect-ratio Fix (gerade gemacht) — **MEDIUM**

**Problem:** `#tetris-canvas { height: 100%; width: auto; }` führte zu vertikal gestreckten Blöcken.

**Fix:** `aspect-ratio: 12 / 20` + `object-fit: contain`.

### 5. `didSync` Ref in SettingsDialog — **LOW (dead code)**

```typescript
const didSync = useRef(false);
useEffect(() => {
  if (!open) return;
  didSync.current = true;  // wird gesetzt aber nie gelesen
  syncGameSlider(...)
}, [open]);
```
Kann entfernt werden.

### 6. `_origResetPlayer` Monkey-Patch im IIFE — **LOW**

```typescript
const _origResetPlayer = resetPlayer;
resetPlayer = function() {
  applyGarbage();
  _origResetPlayer();
};
```
Funktioniert, aber besser: `applyGarbage()` direkt in `resetPlayer()` einbauen (IIFE jetzt änderbar).

---

## 🔒 Security-Check

| Aspekt | Status |
|--------|--------|
| Rate-Limiting API | ✅ 6 req/min/IP |
| Input-Validation | ✅ Zod + sanitizePlayerName |
| SQL-Injection | ✅ Prisma parametrisiert |
| XSS | ✅ React auto-escaping |
| CORS | ✅ Same-origin via nginx |
| Secrets | ✅ Keine (PAT bereinigt) |
| Service Worker | ✅ API nicht gecacht |

---

## 📊 Metrics

| Datei | Zeilen |
|-------|--------|
| NeonfallApp.tsx | 1358 |
| neonfall-content.ts | 1665 |
| neonfall-shell.ts | 1423 |
| MultiplayerDialog.tsx | 381 |
| Total React | 3051 |
| Total IIFE+Shell | 3088 |

**Lint:** 0 errors, 1 warning (pre-existing)
**TypeScript:** Strict mode, keine `any` escapes außer IIFE-Bridge

---

## 🎯 Empfohlene nächste Schritte (Priorität)

1. ✅ **Canvas aspect-ratio fix** (gerade gemacht)
2. **NeonfallApp.tsx refactoren** — Effects in Custom Hooks
3. **`didSync` Ref entfernen** — dead code
4. **Multiplayer guards** — mpStateRef für veraltete Updates
5. **Flash opacity 0.25→0.35** — falls Feedback zu schwach

---

## ✅ Fazit

Der Codebase ist **produktionsreif**. Die Architektur ist sauber, Security gut abgedeckt, Performance optimiert. Hauptverschuldung ist die Größe von `NeonfallApp.tsx` — durch Custom-Hook-Extraktion behebbar. Keine kritischen Bugs. Die Canvas-Stretching wurde in diesem Review behoben.
