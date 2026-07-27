# NEONFALL — Projekt-Worklog

## Projekt-Status (aktuell)

NEONFALL ist eine vollwertige, fertige Tetris-Web-App (Neon-Stil, deutsche UI,
Touch- + Tastatursteuerung, Hold/Next, Momentum-Drop, integrierte Musik +
synth. SFX). Das eigentliche Spiel stammt aus einer vom Nutzer gelieferten
einzelnen HTML-Datei (`upload/neonfall-10.html`) und ist **stilistisch und
spieltechnisch unverändert** belassen worden.

Die Aufgabe war ausschließlich, diese HTML in eine echte **installierbare
PWA-App** (Next.js) zu überführen und das **CORS/Musik-Problem am Handy** zu
lösen. Beides ist umgesetzt und verifiziert.

## Architektur / Key Decisions

- **Spiel-Code preservation**: CSS (16 KB), Body-HTML (4.4 KB) und JS-IIFE
  (34.5 KB) wurden 1:1 aus der Original-HTML extrahiert (`scripts/extract.js`)
  und als escapte Template-Literals in `src/app/neonfall-content.ts` abgelegt.
  So ist sichergestellt, dass keinerlei Spiellogik/Styling angefasst wird.
- **`src/app/page.tsx`** (Client-Komponente):
  - Injiziert die Original-CSS via `<style dangerouslySetInnerHTML>`.
  - Rendert den Original-Body als **JSX** (class→className, for→htmlFor,
    value→defaultValue bei Range-Slidern, um React-Warnungen zu vermeiden —
    verhaltenserhaltend). JSX statt Wrapper-Div, damit die `body`-Flex-Layout-
    Regeln der Original-CSS exakt greifen (Elemente sind direkte Body-Kinder).
  - Führt das Original-IIFE in `useEffect` per injected `<script>`-Tag aus
    (läuft einmal dank `initRef`-Guard; `reactStrictMode:false` im next.config
    verhindert Dev-Double-Invoke).
  - Registriert den Service Worker (`/sw.js`).
- **`src/app/layout.tsx`**: Minimal, nur PWA-Metadaten (manifest, theme-color
  #0a0a14, apple-mobile-web-app-capable, viewport-fit=cover, user-scalable=no)
  + Google-Fonts (Space Grotesk, JetBrains Mono) als `<link>` (damit die
  Font-Namen aus der Original-CSS erhalten bleiben). Kein Geist-Font, keine
  Toaster, kein Wrapper — Body enthält direkt `{children}`.
- **Musik (CORS-Fix)**: `neonfall-music.mp3` liegt in `public/`. Das Spiel
  macht `fetch('neonfall-music.mp3')` → relativ zu `/` → `/neonfall-music.mp3`
  → same-origin (Next.js serviert `public/`), **kein CORS mehr**. Am Handy
  (wo die Datei vorher via `file://` oder falschem Host geladen wurde) lädt
  sie jetzt zuverlässig.
- **PWA**: `public/manifest.json` (name NEONFALL, standalone, portrait,
  icons 192/512 any+maskable). `public/sw.js` precacht App-Shell + Musik,
  cache-first für Same-Origin-Assets, SWR für Cross-Origin (Fonts). Dadurch
  installierbar (Android Chrome + iOS Add-to-Home-Screen) **und offline-
  fähig**.
- **Icons**: Via image-generation Skill ein 1024×1024 Neon-Tetris-Icon
  generiert, mit sharp auf 512/192/180/32 resized (`icon-512/192.png`,
  `apple-touch-icon.png`, `favicon.png`).

## Verifizierung (alle bestanden)

Getestet mit `agent-browser` (Server + Browser in einem Bash-Aufruf, da
Hintergrundprozesse im Sandbox beim Tool-Teardown gekillt werden):

- Static-Assets: `neonfall-music.mp3` HTTP 206 audio/mpeg ✓, `manifest.json`
  200 ✓, `sw.js` 200 ✓, `icon-192/512.png` + `apple-touch-icon.png` 200 ✓.
- Page: HTTP 200, `<title>NEONFALL</title>`, 41 KB.
- Accessibility-Snapshot: volle UI-Struktur (NEONFALL-Titel, SCORE/BEST/
  LEVEL/LINES, HOLD/NEXT-Canvas, ⓘ/⏸/🔊-Buttons, Hinweis-Overlay mit
  Touch-/Tastatur-Anleitung).
- Interaktion: Hint per „LOS GEHT'S" geschlossen → Start-Prompt sichtbar →
  Game-Container geklickt → Spiel läuft (rAF-Loop, Canvas wird gezeichnet).
  Tastatur (←/→/↑) bewegt/dreht den Stein.
- Musik: Nach `initAudio()` (Keyboard/Touch) wird `neonfall-music.mp3`
  geladen — `decodedBodySize: 16.802.515` (volle 16 MB), `transferBytes: 0`
  (= via Service-Worker-Cache ausgeliefert). Hauptanliegen des Nutzers
  gelöst.
- Service Worker: `navigator.serviceWorker.controller === true` ✓ (aktiv &
  controlling).
- PWA-Meta: `link[rel=manifest]=/manifest.json`, `theme-color=#0a0a14`,
  `apple-mobile-web-app-capable=yes` ✓.
- React-Warnungen: 0 (value→defaultValue-Fix greift).
- Fehler in `dev.log`: keine.
- **VLM-Visuell** (`z-ai vision`):
  - Initial: „NEONFALL"-Titel in Neon-Gradient, Stats, HOLD/NEXT, dunkles
    modernes Neon-Design, Hinweis-Overlay — vollständig gerendert.
  - Spielend: Spielfeld mit fallendem lila T-Tetromino, Next-Vorschau cyan
    I-Stein, „polished, dark-themed neon design, fully functional and
    visually appealing".

## Unresolved Issues / Risks / Next-Steps

- **Sandbox-Teardown**: Hintergrundprozesse (`bun run dev`) werden beim Ende
  eines Bash-Tool-Aufrufs gekillt (cgroup-basiert; setsid/nohup/systemd-run
  alles nicht verfügbar — PID 1 ist `tini`). Für Verifikation wird der Server
  darum immer innerhalb eines einzelnen Bash-Aufrufs gestartet. Die Preview-
  Panel-Infrastruktur der Plattform serviert Port 3000 für den Nutzer
  unabhängig davon.
- **Google Fonts extern**: Werden online geladen; offline via SW-Cache
  (Cross-Origin SWR). Für 100 % Offline-Crispness könnten Fonts gebündelt
  werden (aktuell graceful Fallback auf sans-serif).
- **Keine Spiel-Änderung gewünscht**: Der Nutzer hat das Spiel als fertig
  deklariert. Stil/Logik wurden nicht angetastet. Mögliche zukünftige
  Enhancements (nur wenn gewünscht): Highscore-Cloud-Sync, mehrere
  Musik-Tracks, Landscape-Modus, Pause-bei-Tab-Wechsel ist bereits
  implementiert.
- **Cron-Review-Job**: Es wurde ein `webDevReview`-Job alle 15 Min angelegt,
  der Status prüft, ggf. Bugs fixed oder neue Features vorschlägt.

---

## Cron-Review-Zyklus 1 (App-Shell-Erweiterungen)

**Task ID:** CR-1 · **Agent:** main (cron webDevReview)

### Ausgangslage / QA-Befund

Vor diesem Zyklus war die App stabil (Spiel + PWA + Musik alle funktionsfähig,
keine Bugs). Der Cron-Job forderte explizit neue Features + mehr Styling.
Da der Nutzer ursprünglich sagte, das **Spiel** solle nicht verändert werden,
wurden sämtliche Erweiterungen **außerhalb** des Spiel-IIFE vorgenommen
(position:fixed UI, MutationObserver auf Spiel-DOM, eigenes CSS — die
`neonfall-content.ts` mit dem Original-Spielcode blieb unangetastet).

### Umgesetzte Features (alle im neuen Modul `src/app/neonfall-shell.ts`)

1. **PWA-Install-Prompt** (`#nf-install-banner` + `#nf-ios-install`)
   - Android/Chrome: fängt `beforeinstallprompt` ab, zeigt neon-styled Banner
     am unteren Rand mit „Installieren"/„✕". Dismiss wird in localStorage
     gespeichert (`nf_install_dismissed`).
   - iOS: erkennt iPhone/iPad (auch iPadOS 13+ via `Macintosh`+touch), der
     Online-Dot wird klickbar und öffnet eine Schritt-für-Schritt-Anleitung
     (Teilen → Zum Startbildschirm hinzufügen).
   - **Bug gefixt**: Banner wurde anfangs über dem Hinweis-Overlay gezeigt und
     verdeckte den „LOS GEHT'S"-Button. Jetzt wird das Banner unterdrückt,
     solange ein Modal (Hinweis/Pause/Game-Over) sichtbar ist, und per
     MutationObserver nach Schließen des Hinweises nachgereicht.

2. **Karriere-Statistik** (`#nf-stats-btn` + `#nf-stats-panel`)
   - Neuer 📊-Button oben links (neben ⓘ, position:fixed, z-20).
   - Öffnet ein Glassmorphism-Panel (z-50) mit: Spiele, Bestes Level,
     Highscore, Linien gesamt, Punkte gesamt, Spielzeit + 12 Achievements.
   - Datenerhebung **berührungslos** via MutationObserver auf den Spiel-Elementen
     `#game-over-screen` (Klasse `visible` → Spiel gezählt), `#level`
     (laufendes Max-Level), `#lines` (Tetris-Erkennung, s.u.), `#final-score`
     (Punkte). Spielzeit via 1s-Interval, das nur zählt, wenn das Spiel aktiv
     läuft (Hinweis weg, gestartet, nicht pausiert, nicht Game-Over, Tab sichtbar).
   - Speicherung in localStorage (`nf_stats`).
   - **Bug gefixt**: Stats-Panel pausierte das Spiel anfangs nicht, weil die
     `isGameActive()`-Prüfung `document.hidden` enthielt (im Headless-Browser
     `true`). Aufgespalten in `isGameRunning()` (nur Spiel-Zustand, für die
     Pause-Entscheidung) und `isGameActive()` (zusätzlich `!document.hidden`,
     für die Spielzeit-Zählung).
   - **Bug gefixt**: `tetris_4`-Achievement löste anfangs schon bei ≥4 Linien
     *insgesamt* aus. Jetzt erkennt ein eigener `#lines`-MutationObserver einen
     Sprung von ≥4 in einer einzigen Mutation (= echter 4-Linien-Clear / Tetris).

3. **Service-Worker-Update-Toast** (`#nf-update-toast`)
   - Zeigt „✨ Neue Version verfügbar — Neuladen" oben, sobald ein neuer SW den
     Zustand `installed` erreicht (und bereits ein Controller aktiv ist).
     SW-Cache-Version auf `neonfall-v2` hochgezählt. Stündliches `reg.update()`.

4. **Online/Offline-Indikator** (`#nf-online-dot`)
   - Kleiner grüner Punkt neben dem 📊-Button; wird rot + blinkend bei Offline.
     Auf iOS (nicht installiert) klickbar → öffnet Install-Anleitung.

### Styling-Verbesserungen (Mandat erfüllt, ohne Spiel-CSS anzutasten)

Eigenes `SHELL_CSS` (separates `<style>`, nach `GAME_CSS` injiziert) mit:
- Neon-Glassmorphism (rgba-Weiß-Tints, `backdrop-filter: blur`, border-radius 18px)
- Gradient-Akzente passend zum Spiel (`#22d3ee → #a78bfa → #f472b6`)
- Space-Grotesk-/JetBrains-Mono-Fonts (konsistent mit dem Spiel)
- SlideUp-Animation für Panels, Blink-Animation für Offline-Dot
- Hover-/Active-States, Desktop-Mediaquery, Scrollbar-Styling
- Touch-Targets ≥34px, safe-area-inset unterstützt

### Verifikation (alle bestanden, via `agent-browser`)

- Shell-Elemente alle present (statsBtn, onlineDot, statsPanel, iosInstall,
  installBanner, updateToast) ✓
- Keine Console-Errors, keine dev.log-Errors ✓
- Spiel weiterhin voll funktionsfähig (Canvas gerendert, Tastatur-Steuerung) ✓
- Fix 1: Banner unterdrückt bei sichtbarem Hinweis (`bannerShown:false`),
  erscheint nach Hinweis-Schließen (`bannerShown:true`) ✓
- Fix 2: Stats-Panel pausiert das Spiel (`gamePaused:true`), Resume bei Close ✓
- Fix 3: 4-Linien-Sprung → `tetris_4` freigeschaltet; 2-Linien-Sprung → nicht ✓
- Stats-Recording: nach Game-Over → Spiele=1, Best=1.234, Linien=7,
  3 Achievements, Footer mit Datum ✓
- Install-Banner Dismiss persistiert in localStorage ✓
- Online-Dot reagiert auf navigator.onLine ✓
- **VLM-Visuell** (`z-ai vision`):
  - Banner: „neon-styled install banner... game UI fully visible and
    unobscured... styling perfectly matches the neon aesthetic... no visual
    problems or overlaps... cohesive and professional."
  - Stats-Panel: „glassmorphic neon-styled card titled STATISTIK... ERFOLGE
    section with achievement badges, some in color, others grayed... clean and
    highly readable... no clutter or alignment issues."

### Unresolved Issues / Risks / Empfehlungen für nächste Phase

- **Spiel-Code weiterhin unangetastet**: `neonfall-content.ts` (Original-CSS/
  HTML/JS) wurde in diesem Zyklus nicht verändert. Alle Erweiterungen sind im
  separaten `neonfall-shell.ts` gekapselt. Soll der Nutzer das Spiel selbst
  erweitern wollen, bleibt der Weg offen.
- **Achievements sind rein lokal** (localStorage). Für geräteübergreifende
  Synchronisation wäre ein Backend nötig (Prisma+SQLite vorhanden, NextAuth
  verfügbar) — nur bei Nutzerwunsch.
- **Google Fonts noch extern**: offline via SW-Cache; für 100% Offline könnten
  Fonts gebundelt werden (next/font/self-host).
- **Headless-QA-Artefakt**: `document.hidden` ist im Headless-Browser oft
  `true`, daher wird Spielzeit in agent-browser-Tests nicht akkumuliert — auf
  einem echten Gerät (Fokus) funktioniert es.
- **Cron-Review-Zyklen**: Der 15-Min-Job läuft weiter. Nächste sinnvolle
  Schwerpunkte: (a)„Stats zurücksetzen"-Button im Panel, (b) Soundeffekt-Lautstärke-
  Regelung (erfordert Hook ins AudioCtx — aktuell im IIFE-Closure, schwer ohne
  Spieländerung), (c) mehrere Musik-Tracks, (d) Landscape-Layout-Optimierung,
  (e) Cloud-Highscore-Liste.
- **Sandbox-Teardown** weiterhin: Dev-Server wird beim Bash-Tool-Teardown
  gekillt; QA läuft darum in einem einzigen Bash-Aufruf. Preview-Panel serviert
  Port 3000 für den Nutzer unabhängig.

---

## Cron-Review-Zyklus 2 (Stats-Reset, Recent Scores, Achievement-Toast, Landscape-Hint)

**Task ID:** CR-2 · **Agent:** main (cron webDevReview)

### Ausgangslage / QA-Befund

App war stabil (Spiel + alle Shell-Features aus Zyklus 1 funktionsfähig, keine
Console-/dev.log-Errors, Spiel spielbar). Der Stats-Reset-Button (aus Zyklus-1-
Empfehlung) fehlte noch; keine Landsacpe-Unterstützung vorhanden. Der Cron-Job
forderte erneut mehr Features + Styling. Auch hier wurde das Spiel-IIFE erneut
**nicht angetastet** — alle Erweiterungen im `neonfall-shell.ts`.

### Umgesetzte Features (alle in `src/app/neonfall-shell.ts` ergänzt)

1. **Stats-Reset-Button** (`#nf-stats-reset` + `#nf-reset-confirm`)
   - Roter „Statistik zurücksetzen"-Button am Ende des Stats-Panels.
   - Klick → Inline-Bestätigungs-Dialog („Wirklich alle Statistiken & Erfolge
     löschen?") mit „Löschen"/„Abbrechen". Löschen → `defaultStats()` + save +
     re-render. Abbrechen → Dialog verbergen, Button wiederherstellen.
   - **Bug gefixt**: Der Confirm-Dialog saß am Ende der scrollbaren Karte und
     war nach Klick außerhalb des Viewports → YES/NO-Buttons nicht klickbar.
     Fix: `scrollIntoView({block:'center'})` nach 50ms im Reset-Button-Handler.

2. **Letzte-Spiele-Liste** (`.nf-recent`)
   - Neue Sektion „Letzte Spiele" im Stats-Panel: zeigt die letzten 5 Spiele
     mit Level, Linien, Zeitstempel („gerade eben"/„vor X min"/Datum) + Score.
   - `recentScores: RecentScore[]` zum Stats-Interface hinzugefügt, beim
     Game-Over via `unshift` + Trim auf 5 Einträge gepflegt.

3. **Achievement-Unlock-Toast** (`#nf-ach-toast`)
   - Goldener/amberner Toast oben Mitte (z-47): „ERFOLG FREIGESCHALTET" + Icon
     + Name. Pop-Animation für Icon, auto-hide nach 3,2s.
   - `unlock()` ruft jetzt `showAchToast(id)` auf — erscheint nur bei NEU
     freigeschalteten Achievements (nicht bei bereits bestehenden).
   - 12 Achievements unverändert; Tetris-Erkennung via #lines-Sprung-Observer
     (aus Zyklus 1) bleibt erhalten.

4. **Landscape-Rotate-Hint** (`#nf-rotate-hint`)
   - Vollbild-Overlay (z-60) bei Landscape auf Phone-Klasse (min-Dimension
     <500px). Animiertes Handy-Icon (Wiggle-Rotation), „Drehe dein Gerät"-Text.
   - Tablets/Desktop (breit genug) werden nicht gestört. Reagiert auf
     `resize` + `orientationchange`.

### Styling-Verbesserungen

- Reset-Button + Confirm in dezentem Rot (`#fb7185`), passend zum Game-Over-Stil.
- Recent-Scores-Liste mit Meta-Text (cyan) + Score (JetBrains-Mono, weiß).
- Achievement-Toast mit amber-goldenem Gradient (`#fbbf24 → #f472b6`),
  Glow-Schatten, Pop-Keyframe-Animation.
- Rotate-Hint mit neon-outlined Handy-Icon, Wiggle-Animation, Gradient-Titel.
- Alles konsistent im Neon-Dark-Theme (Space Grotesk / JetBrains Mono).

### Verifikation (alle bestanden, via `agent-browser`)

- Keine Console-Errors, keine dev.log-Errors ✓
- Neue Elemente present (achToast, rotateHint, resetBtn, resetConfirm) ✓
- **Reset-Flow** (nach scrollIntoView-Fix):
  - Reset → Confirm sichtbar (rect y=415, im Viewport) ✓
  - NO → `confirmShow:false, resetBtnVisible:true` ✓
  - YES → `games:0, recentCount:0, achCount:0, recentEmpty:true,
    resetBtnBack:true, confirmHidden:true` (vollständig gelöscht) ✓
- **Recent-Scores**: nach Game-Over → 1 Eintrag „L1 · 12 Linien · gerade eben
  2.500" ✓
- **Achievement-Toast**: erster Game-Over → `achToastShown:true,
  achToastName:"Erstes Spiel", achToastLabel:"Erfolg freigeschaltet"` ✓;
  auto-hide nach 3,2s ✓
- **Landscape-Hint**: Phone-Landscape (740×360) → `rotateHintShown:true` ✓;
  Portrait → `rotateHintHidden:true` ✓
- Spiel weiterhin voll funktionsfähig (Canvas, Tastatur) ✓
- **VLM-Visuell**:
  - Toast: „golden/amber neon toast... ERFOLG FREIGESCHALTET... Erstes Spiel...
    perfectly matches the app's neon aesthetic."
  - Rotate: „full-screen overlay... neon-outlined phone icon... Drehe dein
    Gerät... perfectly matches the app's signature neon dark aesthetic."

### Unresolved Issues / Risks / Empfehlungen für nächste Phase

- **Spiel-Code weiterhin unangetastet**: `neonfall-content.ts` unchanged.
- **Achievement-Toast überlappt minimal BEST-Box** (laut VLM) — typisch für
  Overlay-Notifications, akzeptabel. Könnte bei Bedarf höher positioniert
  werden.
- **Stats nur lokal** (localStorage): Cloud-Sync erst bei Nutzerwunsch
  (Prisma+SQLite+NextAuth vorhanden).
- **Nächste sinnvolle Schwerpunkte**: (a) mehrere Musik-Tracks (erfordert
  Hook ins AudioCtx oder separates Audio-Element — aktuell im IIFE-Closure),
  (b) Daily-Challenge-Modus, (c) Cloud-Highscore-Liste, (d) Settings-Import/
  Export, (e) Tastatur-Shortcuts im Stats-Panel (S=Stats, Esc=Close).

---

## Nutzer-Feedback: 3 Probleme (Musik-Ladezeit, Hinweis-Layout, Desktop-Breite)

**Task ID:** UF-1 · **Agent:** main (Nutzer-Anfrage, Vorrang vor Cron)

### Problem 1: Musik dauert lange bis sie beginnt
**Ursache:** Das Spiel fetcht `neonfall-music.mp3` (16 MB) erst bei der ersten
Nutzer-Interaktion (`initAudio`), dann `decodeAudioData`. Auf dem Handy heißt
das: 16 MB Download über mobiles Netz + Decode = mehrere Sekunden Wartezeit.

**Fix:** `<link rel="preload" href="/neonfall-music.mp3" as="fetch" crossorigin>`
in `layout.tsx` head. Der Browser startet den Download sofort beim Seitenladen
(hohe Priorität), während der Nutzer den Hinweis liest. Beim ersten Tap ist die
Datei bereits im HTTP-Cache → `fetch()` im Spiel liefert sofort, nur noch
Decode (~100 ms).

**Verifiziert:** Resource-Timing zeigt `initiator:link, startTime:89ms,
duration:140ms, decodedMB:16.02` — Preload läuft sofort. Nach `initAudio`:
`musicTransferKB:0` (aus Cache) — Musik startet innerhalb ~100 ms. ✓

**Offen (6-Track-Crossfade):** Nutzer erwähnt 6 einzelne Musikdateien, die
gefadet werden sollen. Dateien noch nicht hochgeladen → kann noch nicht
implementiert werden. Wurde vom Nutzer angefragt; auf Upload wartend.

### Problem 2: Hinweis-Overlay zweispaltig (sieht schlecht aus)
**Ursache:** Original-Game-CSS hat `@media (min-width: 700px) {
.hint-cols-wrap { display: flex; gap: 24px; } }` → auf Desktop/Breitbild werden
Touch- und Tastatur-Anleitung nebeneinander gezeigt. Nutzer sagt: „war so auch
nicht" (soll einspaltig sein).

**Fix:** Shell-CSS-Override (injected nach Game-CSS):
`.hint-cols-wrap { display: flex !important; flex-direction: column !important;
gap: 16px !important; }` → Touch und Tastatur stapeln sich immer vertikal.

**Verifiziert:** `hintColsWrapDirection:column` ✓. VLM: „single vertical column
(stacked)... no longer split into two side-by-side columns... highly readable,
well-spaced... no significant layout problems."

### Problem 3: Desktop-App zu breit
**Ursache:** Original-Game-CSS setzt nur `#top-bar, #second-bar,
#game-container { max-width: 440px }` in der Desktop-Mediaquery, aber `body`
selbst ist voll-bildschirmbreit. Inhalt ist 440px zentriert, aber Body-
Hintergrund + Gradient-Blobs füllen den ganzen Viewport → App wirkt „zu breit".

**Fix:** Shell-CSS-Override in `@media (min-width: 700px)`:
- `html { background: #050509 }` (außen dunkler)
- `body { max-width: 460px; margin: 0 auto; border-left/right: 1px solid
  rgba(255,255,255,0.07); box-shadow: 0 0 80px rgba(0,0,0,0.7) }`
- `body::before, body::after { position: absolute !important }` → Gradient-Blobs
  werden auf die Body-Säule geclippt (body ist position:relative), außen bleibt
  flach-dunkel.

**Verifiziert:** `bodyW:460, bodyMaxW:460px, htmlBg:rgb(5,5,9), bodyBorderL:1px,
contentW:440` ✓. VLM: „narrow column centered on screen... empty dark space on
both sides... thin border/frame... content occupies most of that narrow width...
looks like a phone app centered on a desktop screen."

### Verifikation Gesamt
- Keine Console-Errors, keine dev.log-Errors ✓
- Spiel weiterhin voll funktionsfähig (Canvas, Tastatur) ✓
- Preload-Link im HTML bestätigt ✓
- SW-Cache-Version auf v4 hochgezählt ✓
- Lint: 0 Errors ✓

### Offen / Nächste Schritte
- **6-Track-Crossfade:** Warte auf Upload der 6 Musikdateien. Plan: separater
  Web-Audio-Crossfade-Player im Shell-Modul (6× AudioBuffer, nahtloses
  Überblenden). Herausforderung: Koexistenz mit dem Spiel-eigenen AudioCtx
  (IIFE-Closure). Option A: Spiel-Musik stummschalten und nur Shell-Player
  nutzen (erfordert Eingriff in `masterGain`/`musicGain` — nicht von außen
  zugänglich). Option B: `neonfall-music.mp3` durch eine leere/Stumm-Datei
  ersetzen + Shell-Player übernimmt. Wird mit Nutzer klären.
- Cron-Review-Job läuft weiter.

---

## 8-Track-Crossfade-Music-Player implementiert

**Task ID:** MUSIC-1 · **Agent:** main (Nutzer-Anfrage)

### Problem
Nutzer: „Die Musik dauert sehr lange bis sie beginnt" + „ich habe auch 6
einzelne Dateien, wenn das hilft. Diese müssten dann halt gefadet werden."
(Nutzer lud 8 MP3s hoch — 4 Track-Namen × 2 Versionen, alle verschieden, je
64–188 kbps, 48 kHz, 64–343 s Dauer.)

### Lösung: Option B (stumme Datei + Shell-Player)

1. **Stumme MP3** (16 KB, 2 s) ersetzt `public/neonfall-music.mp3` (vorher
   16 MB). Das Spiel-IIFE bleibt **unverändert** — es lädt/loopt weiterhin
   „neonfall-music.mp3", die aber jetzt stumm ist. Das alte Ladezeit-Problem
   ist damit komplett gelöst (16 KB statt 16 MB, Preload entfällt faktisch).
2. **8 Tracks** nach `public/music/track-1…8-*.mp3` kopiert (31 MB gesamt).
3. **Crossfade-Player** im Shell-Modul (`neonfall-shell.ts`):
   - Eigener `AudioContext` (separat vom Spiel-Closure).
   - Lädt Tracks on-demand (decode + cache als AudioBuffer), preloaded
     jeweils den nächsten Track.
   - 3 s Crossfade: FADE_DUR vor Track-Ende startet der nächste Track,
     aktueller faded aus.
   - Startet bei erster Nutzer-Interaktion (gleiche Trigger wie Spiel:
     touchstart/mousedown/keydown auf game-container, hint-close, start-prompt).
   - Start-Track zufällig (mehr Abwechslung bei App-Start).
   - UI: Music-Bar unten (z-48) mit ⏮/⏭-Buttons, animierten Equalizer-Bars,
     „♪ NOW PLAYING"-Label + Trackname.

### Sync mit dem Spiel (alles via MutationObserver, kein IIFE-Eingriff)
- **Pause:** `#pause-overlay .visible` → Player pausiert (gain→0 + ctx.suspend).
  Resume → gain→1 + ctx.resume.
- **Mute:** `#mute-btn` textContent 🔇/🔊 → Player muted/unmuted (master gain).
- **Tab-Hide:** visibilitychange → Player silences (wie das Spiel selbst).
- **Game-Over:** Musik läuft weiter (besserer Vibe).
- **Hinweis-Overlay / Game-Over-Screen sichtbar:** Music-Bar wird ausgeblendet
  (hidden-by-game), damit sie nicht über Modals ragt.
- **Install-Banner sichtbar:** Music-Bar rutscht hoch (shift-up, bottom 84px),
  damit das Banner die Skip-Buttons nicht überdeckt.

### Bug während QA gefunden & gefixt
Skip-Buttons (⏮/⏭) wurden vom Install-Banner überdeckt (beide am Boden,
Banner z-45 > Music-Bar z-22) → Skip funktionierte nicht. **Fix:** Music-Bar
z-index auf 48 erhöht + `shift-up`-Klasse (bottom +76px), die per
MutationObserver aktiviert wird, wenn das Banner `show` hat.

### Verifikation (alle bestanden, via `agent-browser`)
- Stumme MP3 + alle 8 Tracks servieren (HTTP 206) ✓
- Music-Bar initial hidden (hidden-by-game während Hinweis) ✓
- Nach Hinweis-Schließen + Spielstart: `barShow:true, trackName:"Neon Pixel
  Run (Alt)"`, 2 Tracks geladen (current + preload) ✓
- Skip next: Track wechselt korrekt (Neon Pixel Run (Alt) → Neon Pixel Rush
  → Neon Pixel Rush (Alt)) ✓
- Skip prev: Track wechselt zurück ✓
- Pause-Sync: `gamePaused:true → musicBarPaused:true` ✓; Resume → false ✓
- Mute-Sync: `muteBtn:🔇 → musicBarPaused:true` ✓; Unmute → false ✓
- Shift-Up: Banner show → `shiftUp:true, bottom:84px` ✓; Skip klickbar ✓;
  Banner hide → `shiftUp:false` ✓
- 3 vorherige Fixes noch intakt: `bodyMaxW:460px, hintDir:column` ✓
- Spiel voll spielbar (`boardDrawn:true`), keine Console-/dev.log-Errors ✓
- **VLM-Visuell:** „compact music player bar at the bottom... NOW PLAYING...
  Neon Pixel Rush... animated equalizer-bars icon... perfectly matches the
  neon dark theme... no overlap."

### Service Worker
- Cache-Version auf v5 hochgezählt.
- Alle 8 Tracks + stumme MP3 in PRECACHE_URLS → offline-fähig.

### Offen / Nächste Schritte
- Track-Reihenfolge ist fix (1→8, dann Loop). Ggf. Shuffle-Modus oder
  Nutzer-Sortierung als zukünftiges Feature.
- Musik-Lautstärke ist fix (0.5). Ein Volume-Slider wäre möglich (erfordert
  UI-Platz im Player).
- Cron-Review-Job läuft weiter.

---

## Nutzer-Feedback Runde 2: Music-Player kollabierbar, fancy Namen, Hintergrund-Fix

**Task ID:** UF-2 · **Agent:** main (Nutzer-Anfrage)

### Problem 1: Music-Player ist im Weg
**Lösung:** Player ist jetzt kollabierbar. Toggle-Geste wie vom Nutzer vorgeschlagen:
- **Mobil:** Long-Press (450 ms) auf den 🔊-Lautsprecher-Button oben rechts
- **Desktop:** Doppelklick auf den 🔊-Button
- Kollabiert → winzige Pille nur mit Equalizer-Bars-Icon (kein Trackname/Buttons)
- Expandiert → volle Music-Bar mit ⏮/⏭ + Trackname
- Zustand persistiert in localStorage (`nf_music_collapsed`)
- Einmaliger Hinweis-Puls (cyan-Ring) auf dem 🔊-Button beim ersten Besuch
- Einzelklick auf 🔊 mutet weiterhin (Spiel-Handler unberührt); der synthetische
  Klick nach einem Long-Press wird bewusst verschluckt (verhindert versehentliches
  Muten direkt nach dem Kollabieren)

### Problem 2: Tracks brauchen fancy Namen
**Lösung:** 8 Tracks umbenannt (Dateinamen unverändert, nur Anzeige):
- Neon Pulse → **Pulse Drive**
- Neon Pulse (Alt) → **Static Bloom**
- Neon Pixel Run → **Pixel Drift**
- Neon Pixel Run (Alt) → **Bitstream**
- Neon Pixel Rush → **Grid Runner**
- Neon Pixel Rush (Alt) → **Circuit Breaker**
- Block Rush → **Cascade**
- Block Rush (Alt) → **Freefall**

### Problem 3: Hintergrund außerhalb der App-Spalte ist schwarz
**Ursache:** Mein Issue-3-Fix aus UF-1 hatte `body::before/after` auf
`position: absolute !important` gesetzt → Gradient-Blobs wurden auf die 460px-
Spalte geclippt. Außen zeigte nur `html { background: #050509 }` (fast schwarz).

**Fix:** Override entfernt. `body::before/after` bleiben `position: fixed` (ihr
Originalwert) → Blobs bedecken den **ganzen Viewport**. `html`-Base auf `#0a0a14`
gesetzt (dunkles Navy, passend zur App). App-Content bleibt in der 460px-Spalte,
aber der Gradient + die animierten Blobs füllen die gesamte Bildschirmfläche.

### Verifikation (alle bestanden)
- **Issue 3:** `htmlBg:rgb(10,10,20)` (#0a0a14), `blobBeforePos:fixed`,
  `bodyMaxW:460px` ✓. VLM: „not pure black... dark navy/purple gradient with
  glowing colored blobs... flows seamlessly... no hard black edge."
- **Issue 2:** Track-Namen: Pixel Drift → Bitstream → Grid Runner ✓
- **Issue 1:** Doppelklick → `collapsed:true, persisted:"1"` ✓; erneut →
  `collapsed:false, persisted:"0"` ✓; Long-Press-Simulation → `collapsed:true` ✓;
  Einzelklick mutet weiterhin ✓. VLM: „tiny minimal pill with equalizer bars...
  significantly reduces obstruction... maintains neon aesthetic."
- Spiel voll spielbar, keine Console-/dev.log-Errors ✓
- SW-Cache-Version auf v6 hochgezählt.



---

## S8.16: Next-Box Bug-Fix + Eindeutige Spielstein-Farben

**Task ID:** S8.16 · **Agent:** main (Nutzer-Anfrage)

### Problem 1: Next-Box war komplett leer
**Ursache (gefunden via Code-Inspektion):** In `drawNext()` wurden
`offsetX`/`offsetY` in **Pixeln** berechnet (`centerX - pieceW/2` etc.),
aber dann an `drawCell(ctx, x + offsetX, y + offsetY, ...)` übergeben.
`drawCell` macht intern `px = x * size` — multipliziert also den Offset
nochmal mit der Zellgröße. Bei einem I-Stein (4 Zellen breit, size=9)
landeten die Zellen bei `px = (0 + 86) * 9 = 774px` in einem 120px-Canvas.
→ Alle Steine wurden weit außerhalb des Canvas gezeichnet → Next-Box leer.

**Fix:** Pixel-Offsets vor dem `drawCell`-Aufruf durch `size` teilen, um
sie in Zell-Einheiten zurückzuwandeln:
```js
const offsetX_cells = offsetX_px / size;
const offsetY_cells = offsetY_px / size;
drawCell(nextCtx, x + offsetX_cells, y + offsetY_cells, ...);
```
Außerdem: klarere Slot-Pitch-Konstanten (34px Abstand, 14px rechter Rand)
und leicht erhöhte Opacity für hintere Steine (0.5/0.3 statt 0.45/0.25)
für bessere Sichtbarkeit.

**Verifiziert:** `getImageData` auf next-canvas → 812 non-bg Pixel von
5520 (≈15% Coverage). VLM bestätigt sichtbare Steine (Cyan/Orange/Magenta
im Next-Box). ✓

### Problem 2: Spielstein-Farben teilweise fast ident
**Ursache:** Alte Palette nutzte für 16 Steine fast ausschließlich
Tailwind-400/500-Varianten derselben Hue-Familien:
- F (#06b6d4 cyan-500) ≈ I (#22d3ee cyan-400) — fast gleich
- F' (#0ea5e9 sky-500) ≈ F (#06b6d4) — fast gleich
- P (#ec4899 pink-500) ≈ P' (#f43f5e rose-500) — fast gleich
- Y (#f59e0b) ≈ Y' (#eab308) ≈ O (#fbbf24) — alle gelb/amber
- L5 (#8b5cf6) ≈ T (#a78bfa) — beide violet
- J5 (#d946ef) ≈ P (#ec4899) — beide magenta-pink

Besonders die Spiegel-Paare (F/F', P/P', Y/Y', L5/J5) waren kaum
unterscheidbar — das war genau die Nutzerbeschwerde.

**Fix — Neue 16-Farben-Palette mit Strategie „warm vs. cool" für Spiegel-Paare:**

| Stück  | Farbe (alt)        | Farbe (neu)   | Name            | Spiegel-Paar |
|--------|--------------------|---------------|-----------------|--------------|
| I      | #22d3ee cyan-400   | **#00f0ff**   | electric cyan   | —            |
| J      | #6366f1 indigo-500 | **#4d7dff**   | royal blue      | L (warm)     |
| L      | #fb923c orange-400 | **#ff8c1a**   | neon orange     | J (cool)     |
| O      | #fbbf24 amber-400  | **#ffd400**   | golden yellow   | —            |
| S      | #34d399 emerald-400| **#00e676**   | emerald green   | Z (warm)     |
| T      | #a78bfa violet-400 | **#b347ff**   | neon purple     | —            |
| Z      | #fb7185 rose-400   | **#ff2db4**   | hot pink        | S (cool)     |
| F      | #06b6d4 cyan-500   | **#00ffaa**   | mint (cool)     | F' (warm)    |
| F'     | #0ea5e9 sky-500    | **#ffaa00**   | amber (warm)    | F (cool)     |
| P      | #ec4899 pink-500   | **#ff5cb0**   | rose pink (warm)| P' (cool)    |
| P'     | #f43f5e rose-500   | **#c4ff3d**   | chartreuse(cool)| P (warm)     |
| T5     | #10b981 emerald-500| **#00b3a4**   | deep teal       | —            |
| Y      | #f59e0b amber-500  | **#d9b34d**   | mustard gold wm | Y' (cool)    |
| Y'     | #eab308 yellow-500 | **#5d9cff**   | sky blue (cool) | Y (warm)     |
| L5     | #8b5cf6 violet-500 | **#7a1aff**   | deep violet col | J5 (warm)    |
| J5     | #d946ef fuchsia-500| **#ff6e3d**   | coral (warm)    | L5 (cool)    |

Jeder Spiegel-Paar-Spartner sitzt am **gegenüberliegenden Ende des
warm/cool-Spektrums** → immer deutlich unterscheidbar. Keine zwei
Stücke teilen sich dieselbe Hue-Familie.

**Verifiziert:** VLM erkennt nach Several-drops 7+ distinct Farben
(yellow, cyan, purple, blue, orange, pink, green) plus ghost. ✓

### Lint & Build
- ESLint: 0 Errors (1 pre-existing warning zu custom-font in layout.tsx)
- Dev-Server: Ready in 292ms, GET / 200, keine Runtime-Errors. ✓
- Service Worker Cache: sollte bei nächstem Deploy inkrementiert werden.

### Offen / Nächste Schritte
- Upload-Ordner leeren (Nutzer-Anfrage aus vorheriger Runde — noch offen)
- Highscore localStorage vs. DB-Erklärung (vorherige Runde — noch offen)
- S8.14 Staging Pipeline (geplant)
