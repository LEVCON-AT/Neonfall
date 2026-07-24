# NEONFALL — Projektkontext

> **Zweck:** Dieses Dokument ermöglicht es einer neuen AI-Sitzung, nahtlos an
> das Projekt anzuschließen. Es enthält alle relevanten Informationen über
> Architektur, Stand, Deployment und bekannte Issues.

---

## 1. Projekt-Übersicht

**NEONFALL** ist ein Neon-Tetris-Spiel (12×20 Grid + 7 Tetrominos + 5 Pentominoes)
als Next.js 16 PWA mit:
- React-Komponenten-Hierarchie (über einem byte-identischen IIFE)
- 4 Game-Modes (Marathon/Sprint 40L/Ultra 3:00/Zen)
- Multiplayer 1v1 (socket.io)
- Leaderboard mit API + SQLite DB
- 16 Musik-Tracks mit Crossfade-Player
- PWA (installierbar, offline-fähig)

**Repo:** https://github.com/LEVCON-AT/Neonfall (public)
**Deploy-Ziel:** neonfall.levcon.ai
**VPS:** Siehe deploy/DEPLOYMENT.md

---

## 2. Technologie-Stack

- **Framework:** Next.js 16 (App Router) + TypeScript 5
- **Styling:** Tailwind CSS 4 + shadcn/ui (New York)
- **State:** Zustand (settings/game/shell stores)
- **Server-State:** TanStack Query (leaderboard)
- **Animation:** Framer Motion
- **DB:** Prisma ORM + SQLite (`db/neonfall.db`)
- **Icons:** lucide-react
- **Audio:** WebAudio (SFX im IIFE) + separater AudioContext (Musik)
- **Multiplayer:** socket.io (mini-service auf Port 3004)

---

## 3. Architektur

```
src/
├── app/
│   ├── page.tsx              ← 3 Zeilen: rendert <NeonfallApp />
│   ├── layout.tsx            ← PWA-Metadaten + <Providers> wrapper
│   ├── providers.tsx         ← ThemeProvider + QueryClientProvider
│   ├── neonfall-content.ts   ← GAME_CSS + GAME_SCRIPT (IIFE, MODIFIZIERT in P1)
│   └── neonfall-shell.ts     ← SHELL_CSS + initShell() (Stats, Musik, MP)
├── components/neonfall/
│   ├── NeonfallApp.tsx       ← Root: 96 Zeilen, nur Hook-Wiring + JSX
│   ├── neonfall-app.css.ts   ← CSS (843 Zeilen, aus Component extrahiert)
│   ├── hooks/                ← S7.5 Custom Hooks (Effects extrahiert)
│   │   ├── useGameBootstrap.ts  (Effects A+B: IIFE injection + __nfGetMode)
│   │   ├── useGameSync.ts       (Effects C+E: MutationObserver + slider sync)
│   │   ├── useModeLogic.ts      (Effects F+G+M: Sprint/Ultra/Mode-Game-Over)
│   │   └── useGameFeel.ts       (Effects H+J+K: shortcuts + haptics + hint)
│   ├── TopBar/HoldNextBar/ControlButtons/GameCanvas/Footer/ModeHud/ShellOverlays.tsx
│   └── dialogs/
│       ├── SettingsDialog.tsx     (3 Tabs: Feedback/Anzeige/Steuerung)
│       ├── GameModeDialog.tsx     (4 Modes)
│       ├── LeaderboardDialog.tsx  (4 Mode-Tabs, TanStack Query)
│       ├── NameInputDialog.tsx    (post-game-over Score-Eintragung)
│       └── MultiplayerDialog.tsx  (Lobby/Waiting/Playing/Result)
├── lib/
│   ├── types.ts              (GameMode, Settings, ScoreEntry, GAME_MODES)
│   ├── store/                (settings-store, game-store, shell-store)
│   └── api/leaderboard.ts    (useLeaderboard, useSubmitScore, getPlayerId/Name)
└── mini-services/multiplayer/ ← socket.io Backend (Port 3004, 1v1 Tetris)
```

### IIFE-Preservation-Regel
Das `GAME_SCRIPT` in `neonfall-content.ts` war ursprünglich **byte-identisch**
zu halten. In **P1 (S5b)** wurde diese Constraint **vom Nutzer gelockert** um
rechtliche Abhebung zu erreichen:
- Grid: 10×20 → **12×20**
- Formen: 7 Tetrominos → **7 Tetrominos + 5 Pentominoes** (F, P, T5, Y, L5)
- PIECE_TYPES: String → Array (für 2-Char-Typen wie 'T5')
- 7-Bag → 12-Bag Randomizer

**Seither darf das IIFE geändert werden** — aber nur mit gutem Grund und
dokumentiert im Worklog.

### React-IIFE-Bridge
- `stripTypeAnnotations()` entfernt 4 TS-Annotationen vor Injektion
- `syncGameSlider()` synchronisiert Settings-Store ↔ IIFE-Range-Slider
- `__nfGetMode()`, `__nfAddGarbage()`, `__nfGetBoard()`, `__nfRestart()` Hooks
  (S7.3: zentrale `Window` Type-Declaration in `types.ts`, keine `as any` casts mehr)
- `nf-lines-cleared` + `nf-board-updated` CustomEvents für Multiplayer/Haptics
- MutationObserver spiegelt IIFE-DOM-State in useGameStore
- S7.4: `mpStateRef` Guards verhindern veraltete Socket-Events in MultiplayerDialog
- S7.5: Custom Hooks (`useGameBootstrap`, `useGameSync`, `useModeLogic`, `useGameFeel`)
  extrahiert aus NeonfallApp.tsx (1366→96 Zeilen)

---

## 4. Ports & Services

| Port | Service | Beschreibung |
|------|---------|-------------|
| 3000 | Dev-Server (Sandbox) | Next.js dev |
| 3001 | levcon.at | (belegt) |
| 3002 | levcon.ai | (belegt, official) |
| **3003** | **neonfall.service** | Next.js standalone (Production) |
| **3004** | **neonfall-multiplayer.service** | socket.io Backend |
| 80/443 | nginx | Reverse Proxy + SSL |

**Wichtig:** 3003/3004 sind die Neonfall-Ports. `deploy/scripts/port-check.sh`
prüft vorab welche Ports frei sind, `deploy.sh` hat Auto-Detection.

---

## 5. Sprint-Historie (abgeschlossen)

| Sprint | Inhalt | Status |
|--------|--------|--------|
| S1 | Slider-Dedup, Theme-Removal, Pause-Cleanup | ✅ |
| S2.1 | Haptik + Hint-Start live schalten | ✅ |
| S2.2 | Dead-Settings entfernt (Musik/SFX/Geisterstein) | ✅ |
| S2.3 | Dead-Top-Bar-Buttons entfernt (nf-music-btn, nf-mp-btn) | ✅ |
| S3 | GPU-Audit: will-change, drift-pause, stat-pulse | ✅ |
| S4.1-4.4 | Full Feature Verification | ✅ |
| S5 | Bug Fixes: Name-Dialog, SW-Cache + 8 neue Audio-Files | ✅ |
| S5b | Musik-Bug (AudioContext.resume), Music-Overlay UX-Redesign | ✅ |
| P1 | 12×20 Grid + 5 Pentominoes (rechtliche Abhebung) | ✅ |
| S5c | Name-Input Flow, Multiplayer UI + Backend, Achievement-Toast Fix | ✅ |
| S6 | Touch-Verify, Mode-Game-Over, Desktop MP | ✅ |
| S5c-final | Share-Button entfernt, Flash reduziert, Deployment-Workflow | ✅ |
| S7.1-S7.9 | Code-Quality: Dead code, Monkey-Patch, Type-Safety, Race Conditions, Bug fixes, Inline styles | ✅ |
| S7.5 | NeonfallApp.tsx Refactor: 1366→96 Zeilen, Custom Hooks, CSS extraction | ✅ |
| S7-nginx | nginx WebSocket-Proxy: map statt if, saubere Routing | ✅ |
| Code-Review | Vollständiges Review, Canvas-Fix, CODE-REVIEW.md | ✅ |
| **S8** | **IT-Security-Konzept (geplant)** | ⏳ |

---

## 6. Deployment

### Voraussetzungen
- VPS mit Ubuntu (root-Zugriff)
- DNS-Eintrag: `neonfall.levcon.ai A → VPS-IP`
- SSH-Key für GitHub (`~/.ssh/github_deploy` authentifiziert als LEVCON-AT)
- **Status: LIVE** — neonfall.levcon.ai erreichbar, GitHub Actions Auto-Deploy aktiv

### Initial-Setup
```bash
# Auf dem VPS:
cd /tmp
git clone git@github.com:LEVCON-AT/Neonfall.git neonfall-deploy
cd neonfall-deploy
sudo bash deploy/scripts/deploy.sh
```

Das Skript installiert automatisch:
- Node.js 20, Bun, nginx, certbot, sqlite3
- UFW Firewall (ssh/80/443), Fail2ban, unattended-upgrades
- Let's Encrypt SSL (auto-renewal)
- systemd-Services (neonfall + neonfall-multiplayer)
- DB-Backup-Cron (täglich 03:00)

### Auto-Deploy via GitHub Actions
Push auf `main` triggert `.github/workflows/deploy.yml`:
1. SSH auf VPS
2. Kopiert `deploy/scripts/vps-update.sh` nach `/tmp/`
3. Führt es aus (git pull, bun install, db:push, build, restart)
4. Health-Check (HTTP 200 auf neonfall.levcon.ai)

**GitHub Secrets** (repo → Settings → Secrets):
- `VPS_HOST`: VPS-IP
- `VPS_USER`: root (oder deploy-User)
- `VPS_SSH_KEY`: Private SSH-Key (vollständiger Inhalt)
- `VPS_PORT`: 22 (oder abweichend)

### Manuelle Wartung
```bash
# Logs
journalctl -u neonfall -f
journalctl -u neonfall-multiplayer -f
tail -f /var/log/nginx/neonfall.levcon.ai.error.log

# Restart
sudo systemctl restart neonfall
sudo systemctl restart neonfall-multiplayer
sudo systemctl reload nginx

# Manuelles Update
cd /var/www/neonfall && git pull && bash deploy/scripts/vps-update.sh
```

---

## 7. Bekannte Issues & Design-Entscheidungen

### Sandbox-Spezifika (nicht auf Production)
- Dev-Server stirbt bei Tool-Teardown → `npx next dev --hostname 0.0.0.0 -p 3000`
- `agent-browser` verbindet direkt zu Port 3000 (bypassed Caddy) → socket.io
  Multiplayer im Headless-Test nicht verifizierbar. Für echte Nutzer via
  Preview → Caddy → XTransformPort funktioniert es.

### Rechtliche Abhebung (P1)
- 12×20 Grid (statt Tetris-Standard 10×20)
- 7 Tetrominos + 5 Pentominoes (F, P, T5, Y, L5) — Pentominoes sind prä-Tetris
  (Solomon Golomb 1953), öffentliches Gut
- Eigene Neon-Farbpalette, Momentum-Drop-Mechanik, eigener Name
- **Tetris Holding LLC v. Xio (2012)**: look&feel-Kombination geschützt,
  unsere Abhebungen machen Klagebasis extrem schwach

### IIFE-Änderungen (dokumentiert)
Alle IIFE-Änderungen seit P1 sind im `GAME_SCRIPT` Template-Literal in
`neonfall-content.ts` mit `// S5c:` oder `// P1:` Kommentaren markiert.

### Audio-Architektur
- **SFX** (playBeep, playThud, playLineClearSound): IIFE-AudioContext, sfxGain=0.9
- **Musik**: Shell-Player (eigener AudioContext), 16 Tracks mit Crossfade
- `neonfall-music.mp3` ist ein **silent stub** (16KB) — IIFE lädt ihn als Loop
  aber er ist unhörbar (-91 dB). Echte Musik kommt vom Shell-Player.
- **Bug 1 (S5c-final) gefixt:** `initAudio()` jetzt auch bei gameContainer.click

### Musik-Overlay UX (S5b)
- Default: hidden (reveal-on-demand)
- Long-press (450ms) oder double-click auf mute-btn → öffnet
- Position: top-right unter mute-btn
- Auto-hide nach 4s, oder click-outside, oder Escape
- `startMusic()` ruft `mCtx.resume()` auf (iOS AudioContext fix)

---

## 8. File-Struktur — Wichtige Dateien

```
prisma/schema.prisma        ← Player + Score models
public/sw.js                ← Service Worker (v9-s5-audio-bugfix)
public/music/track-1..16    ← 16 MP3 Tracks
public/neonfall-music.mp3   ← Silent stub (16KB, IIFE lädt ihn)
public/manifest.json        ← PWA Manifest

deploy/
├── DEPLOYMENT.md           ← Vollständige Deploy-Doku
├── nginx/neonfall.levcon.ai.conf
├── scripts/
│   ├── deploy.sh           ← Initial-Setup (auto-port-detection)
│   ├── vps-update.sh       ← Update (git pull, build, restart)
│   └── port-check.sh       ← Diagnose-Tool
└── systemd/
    ├── neonfall.service          ← Next.js (Port 3003)
    └── neonfall-multiplayer.service ← socket.io (Port 3004)

.github/workflows/deploy.yml ← GitHub Actions

mini-services/multiplayer/
├── index.ts                ← socket.io Backend (Port 3004)
└── package.json

src/app/neonfall-content.ts ← GAME_CSS + GAME_SCRIPT (IIFE)
src/app/neonfall-shell.ts   ← SHELL_CSS + initShell()
src/components/neonfall/    ← React-Komponenten
src/lib/                    ← types, stores, api
```

---

## 9. Entwicklung in dieser Sandbox

### Dev-Server starten
```bash
cd /home/z/my-project
pkill -9 -f 'next-server|next dev' 2>/dev/null; sleep 1
rm -f dev.log
nohup npx next dev --hostname 0.0.0.0 -p 3000 > dev.log 2>&1 & disown
sleep 14
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:3000/
```

### Multiplayer-Service starten
```bash
cd /home/z/my-project/mini-services/multiplayer
nohup bun run dev > /tmp/mp-service.log 2>&1 & disown
sleep 3
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:3004/
```

### Lint
```bash
cd /home/z/my-project && bun run lint
```

### Commit + Push
```bash
cd /home/z/my-project
git add -A
git commit -m "..."
git remote set-url origin "https://PAT_TOKEN@github.com/LEVCON-AT/Neonfall.git"
git push origin main
git remote set-url origin https://github.com/LEVCON-AT/Neonfall.git
```

**WICHTIG:** Nach Push Token aus URL entfernen (letzte Zeile). Der PAT
Der PAT sollte vom Nutzer bei GitHub revoked werden (Sicherheitsbest-practice).

### Agent-Browser-Verifikation
```bash
agent-browser set viewport 390 844  # iPhone 14
agent-browser open http://127.0.0.1:3000/
agent-browser wait --load networkidle
agent-browser eval "JSON.stringify({...})"
agent-browser screenshot /home/z/my-project/analysis-shots/test.png
```

**Server-Teardown-Problem:** `agent-browser` blockiert manchmal den Shell.
Workaround: Server-Start + Browser-Operationen in EINEM Bash-Befehl.

---

## 10. Offene Aufgaben / Nächste Schritte

### Potentielle nächste Features
- Touch-Controls ausführlicher auf echtem Mobile testen
- Daily Challenge (Seed-basiertes Random für alle gleich)
- Profil-Seite (Spielerstatistiken)
- Sound-Einstellungen wiederbeleben (AudioContext-Hook für Musik-Volume)
- Achievement-System Polish (UI-Verbesserung im Stats-Panel)
- Spectator-Mode für Multiplayer
- Ranked-Matches / Matchmaking-Queue

### Bekannte Limitationen
- Multiplayer E2E im Headless-Browser nicht testbar (Caddy-bypass)
- `neonfall-music.mp3` ist silent stub (gewollt — Shell-Player übernimmt)
- Sandbox-Resets können Code verlieren → regelmäßig commit+push!

---

## 11. Quick-Reference

### IIFE-Hooks (window-Global)
- `__nfGetMode()` → aktueller GameMode ('marathon'|'sprint'|'ultra'|'zen')
- `__nfAddGarbage(count)` → fügt garbage-rows hinzu (Multiplayer)
- `__nfResetGarbage()` → setzt garbage-queue zurück
- `__nfGetBoard()` → gibt board als 2D-Array zurück
- `__nfRestart()` → ruft restartGame() auf

### CustomEvents
- `nf-lines-cleared` (detail.cleared 1-4) → Multiplayer garbage + Haptics
- `nf-board-updated` → Multiplayer opponent preview

### Keybinds
- **S** Settings, **G** Mode, **L** Leaderboard, **Esc** Close
- **P** Pause, **M** Mute, **I** Info (IIFE)
- Pfeiltasten, Leertaste (Hard Drop), Shift/C (Hold), Z (Rotate CCW)

### Settings-Store (Zustand + persist)
```typescript
{
  rattleStrength: number,    // 0..2 (slider 0..200%)
  impactStrength: number,    // 0..2
  hapticsEnabled: boolean,
  theme: 'dark',             // nur dark verfügbar
  showHintOnStart: boolean
}
// Version 2 (S2.2 migriert: musicVolume/sfxVolume/ghostPiece entfernt)
```

### DB Schema (Prisma)
```prisma
model Player { id, name @unique, lastSeen, scores[] }
model Score { id, playerId, player, score, lines, level, mode, duration, createdAt }
```

---

## 12. Lessons Learned

1. **Sandbox-Resets** können Arbeit verlieren — immer sofort commit+push
2. **VLM (Vision)** ist exzellent für Screenshot-Analyse von UI-Bugs
3. **IIFE-Constraint** kann gelockert werden wenn rechtlich nötig (P1)
4. **Shell-Dialoge** mit `role="dialog"` sind default sichtbar (shadcn) →
   Legacy-Elemente entfernen oder `display:none` CSS hinzufügen
5. **AudioContext.resume()** ist Pflicht auf Mobile (iOS) — sonst keine Audio
6. **agent-browser** + Dev-Server in EINEM Bash-Befehl (Teardown-Death vermeiden)
7. **SW-Caching** für API-Routes ausschließen (`/api/*` nie cachen)
8. **Port-Auto-Detection** verhindert Konflikte mit anderen Services auf VPS
9. **TDZ (Temporal Dead Zone)** — `let` Variablen vor Funktionen definieren die sie nutzen
10. **nginx "if is evil"** — `map` Direktiven statt `if` für bedingtes Routing
11. **GitHub Push Protection** — niemals PATs in Dokumentation schreiben
12. **Custom Hooks** — große Component-Dateien (>1000 Zeilen) in Hooks aufteilen

---

## 13. IT-Security-Konzept (S8 — geplant)

Siehe `SECURITY-CONCEPT.md` für den vollständigen Plan (32 Punkte in Sprints).
Aktueller Stand: Plan erstellt, Sprints warten auf GO.

**Wichtige Dokumente:**
- `PROJECT-CONTEXT.md` — dieses Dokument
- `CODE-REVIEW.md` — vollständiger Code-Review Report
- `SECURITY-CONCEPT.md` — IT-Security-Konzept + Sprint-Plan
- `deploy/DEPLOYMENT.md` — Deployment-Dokumentation

---

*Zuletzt aktualisiert: S7.5 (Custom Hooks Refactor, nginx map fix, Code Review, Security Concept Plan)*
