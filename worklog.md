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
