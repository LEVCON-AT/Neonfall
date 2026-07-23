'use client';

import {
  Smartphone,
  Sparkles,
  X,
  SkipBack,
  SkipForward,
  Music,
} from 'lucide-react';

/**
 * All position:fixed overlay containers that the legacy shell (`initShell()`
 * in neonfall-shell.ts) owns. The shell looks these up by ID and either:
 *   - toggles a `.show` class on the container (display transition), and/or
 *   - overwrites a child's innerHTML/textContent (stats card, mp content,
 *     achievement toast icon/name, music track name).
 *
 * Elements whose contents the shell overwrites at runtime are rendered empty
 * or with a placeholder, so React never fights the shell for ownership.
 * Elements the shell only attaches listeners to (install banner icon, update
 * toast icon, music prev/next buttons, close buttons) use lucide icons.
 *
 * The wrapper containers themselves are plain divs (not motion.div) because
 * the shell toggles their `.show` class and we must not interfere.
 */
export function ShellOverlays() {
  return (
    <>
      {/* Career stats panel — shell fills #nf-stats-card via innerHTML */}
      <div id="nf-stats-panel" role="dialog" aria-modal="true" aria-label="Statistik">
        <div id="nf-stats-card"></div>
      </div>

      {/* Name-input modal — REMOVED in S5: the shell never wired up show/hide
          logic for #nf-name-modal, so it was always visible (shadcn's
          [role=dialog] default is display:block) and blocked S/G/L shortcuts.
          Score submission now happens via the React LeaderboardDialog which
          has its own name-input flow. The dead DOM node is gone. */}

      {/* Multiplayer lobby — shell fills #nf-mp-content via innerHTML */}
      <div id="nf-mp-modal" role="dialog" aria-modal="true" aria-label="Multiplayer">
        <div id="nf-mp-card">
          <div className="nf-mp-header">
            <div className="nf-mp-title">MULTIPLAYER</div>
            <button
              className="nf-stats-close"
              id="nf-mp-close"
              aria-label="Schließen"
            >
              <X size={14} aria-hidden="true" />
            </button>
          </div>
          <div id="nf-mp-content"></div>
        </div>
      </div>

      {/* iOS install instructions */}
      <div
        id="nf-ios-install"
        role="dialog"
        aria-modal="true"
        aria-label="Auf dem iPhone installieren"
      >
        <div id="nf-ios-card">
          <h2>Als App installieren</h2>
          <div className="nf-ios-sub">
            So legst du NEONFALL aufs Startbildschirm:
          </div>
          <ol className="nf-ios-steps">
            <li>
              Tippe unten auf das <b>Teilen-Symbol</b> (Quadrat mit Pfeil nach
              oben).
            </li>
            <li>Wähle <b>„Zum Startbildschirm hinzufügen“</b>.</li>
            <li>
              Bestätige mit <b>„Hinzufügen“</b> — fertig!
            </li>
          </ol>
          <button className="nf-btn-primary" id="nf-ios-close">
            Verstanden
          </button>
        </div>
      </div>

      {/* Android install banner */}
      <div id="nf-install-banner" role="dialog" aria-label="App installieren">
        <div className="nf-install-icon">
          <Smartphone size={22} aria-hidden="true" />
        </div>
        <div className="nf-install-text">
          <div className="nf-install-title">NEONFALL installieren</div>
          <div className="nf-install-sub">
            Schneller Start · offline spielbar · kein Browser-Rand
          </div>
        </div>
        <div className="nf-install-actions">
          <button className="nf-btn-primary" id="nf-install-accept">
            Installieren
          </button>
          <button
            className="nf-btn-ghost"
            id="nf-install-dismiss"
            aria-label="Schließen"
          >
            <X size={14} aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Service-worker update toast */}
      <div id="nf-update-toast" role="status" aria-live="polite">
        <span className="nf-update-icon">
          <Sparkles size={16} aria-hidden="true" />
        </span>
        <span>Neue Version verfügbar</span>
        <button className="nf-btn-primary" id="nf-update-reload">
          Neuladen
        </button>
      </div>

      {/* Achievement unlock toast — shell sets icon + name via textContent */}
      <div id="nf-ach-toast" role="status" aria-live="polite">
        <span className="nf-ach-toast-icon" />
        <div className="nf-ach-toast-body">
          <div className="nf-ach-toast-label">Erfolg freigeschaltet</div>
          <div className="nf-ach-toast-name">—</div>
        </div>
      </div>

      {/* Rotate-to-portrait hint */}
      <div id="nf-rotate-hint" aria-hidden="true">
        <div className="nf-rotate-inner">
          <div className="nf-rotate-phone"></div>
          <div className="nf-rotate-title">Drehe dein Gerät</div>
          <div className="nf-rotate-sub">
            NEONFALL wird im Hochformat gespielt. Bitte drehe dein Handy
            aufrecht für das beste Spielerlebnis.
          </div>
        </div>
      </div>

      {/* Music player bar — shell sets #nf-music-track textContent */}
      <div id="nf-music-bar" role="region" aria-label="Musikplayer">
        <button
          className="nf-music-btn"
          id="nf-music-prev"
          aria-label="Vorheriger Track"
        >
          <SkipBack size={16} aria-hidden="true" />
        </button>
        <div className="nf-music-bars" aria-hidden="true">
          <span></span>
          <span></span>
          <span></span>
          <span></span>
        </div>
        <div className="nf-music-info">
          <div className="nf-music-label">
            <Music size={11} aria-hidden="true" />
            NOW PLAYING
          </div>
          <div className="nf-music-track" id="nf-music-track">
            —
          </div>
        </div>
        <button
          className="nf-music-btn"
          id="nf-music-next"
          aria-label="Nächster Track"
        >
          <SkipForward size={16} aria-hidden="true" />
        </button>
      </div>
    </>
  );
}
