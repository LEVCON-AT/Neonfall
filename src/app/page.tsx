'use client';

import { useEffect, useRef } from 'react';
import { GAME_CSS, GAME_SCRIPT } from './neonfall-content';
import { SHELL_CSS, initShell } from './neonfall-shell';

export default function Page() {
  const initRef = useRef(false);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    // Execute the game script exactly as authored. It is a self-contained IIFE
    // that grabs its DOM elements via getElementById, so it must run after the
    // markup below has been committed to the DOM (which it has, in useEffect).
    const script = document.createElement('script');
    script.textContent = GAME_SCRIPT;
    document.body.appendChild(script);

    // Initialise the app-shell enhancements (install prompt, stats, SW update,
    // online indicator). These observe the game's DOM and never modify the IIFE.
    try {
      initShell();
    } catch {
      /* shell is best-effort; the game must keep working regardless */
    }
  }, []);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: GAME_CSS }} />
      <style dangerouslySetInnerHTML={{ __html: SHELL_CSS }} />

      <h1 id="title">NEONFALL</h1>

      <div id="top-bar" className="glass">
        <div className="stat-box">
          <h3>SCORE</h3>
          <p id="score">0</p>
        </div>
        <div className="stat-box">
          <h3>BEST</h3>
          <p id="best-score">0</p>
        </div>
        <div className="stat-box">
          <h3>LEVEL</h3>
          <p id="level">1</p>
        </div>
        <div className="stat-box">
          <h3>LINES</h3>
          <p id="lines">0</p>
        </div>
      </div>

      <div id="second-bar">
        <div id="hold-box" className="mini-box glass disabled">
          <h3>HOLD</h3>
          <canvas id="hold-canvas" width="46" height="46"></canvas>
        </div>
        <div id="next-box" className="mini-box glass">
          <h3>NEXT</h3>
          <canvas id="next-canvas" width="46" height="46"></canvas>
        </div>
      </div>

      <button id="info-btn">ⓘ</button>
      <button id="pause-btn">⏸</button>
      <button id="mute-btn">🔊</button>

      {/* ===== App-shell enhancements (do not touch the game IIFE) ===== */}
      <button id="nf-stats-btn" aria-label="Statistik öffnen" title="Statistik">
        📊
      </button>
      <div id="nf-online-dot" aria-hidden="true" title="Online"></div>

      <div id="nf-stats-panel" role="dialog" aria-modal="true" aria-label="Statistik">
        <div id="nf-stats-card"></div>
      </div>

      <div id="nf-ios-install" role="dialog" aria-modal="true" aria-label="Auf dem iPhone installieren">
        <div id="nf-ios-card">
          <h2>Als App installieren</h2>
          <div className="nf-ios-sub">So legst du NEONFALL aufs Startbildschirm:</div>
          <ol className="nf-ios-steps">
            <li>Tippe unten auf das <b>Teilen-Symbol</b> (Quadrat mit Pfeil nach oben).</li>
            <li>Wähle <b>„Zum Startbildschirm hinzufügen“</b>.</li>
            <li>Bestätige mit <b>„Hinzufügen“</b> — fertig!</li>
          </ol>
          <button className="nf-btn-primary" id="nf-ios-close">Verstanden</button>
        </div>
      </div>

      <div id="nf-install-banner" role="dialog" aria-label="App installieren">
        <div className="nf-install-icon">📱</div>
        <div className="nf-install-text">
          <div className="nf-install-title">NEONFALL installieren</div>
          <div className="nf-install-sub">Schneller Start · offline spielbar · kein Browser-Rand</div>
        </div>
        <div className="nf-install-actions">
          <button className="nf-btn-primary" id="nf-install-accept">Installieren</button>
          <button className="nf-btn-ghost" id="nf-install-dismiss" aria-label="Schließen">✕</button>
        </div>
      </div>

      <div id="nf-update-toast" role="status" aria-live="polite">
        <span>✨ Neue Version verfügbar</span>
        <button className="nf-btn-primary" id="nf-update-reload">Neuladen</button>
      </div>

      <div id="nf-ach-toast" role="status" aria-live="polite">
        <span className="nf-ach-toast-icon">🏆</span>
        <div className="nf-ach-toast-body">
          <div className="nf-ach-toast-label">Erfolg freigeschaltet</div>
          <div className="nf-ach-toast-name">—</div>
        </div>
      </div>

      <div id="nf-rotate-hint" aria-hidden="true">
        <div className="nf-rotate-inner">
          <div className="nf-rotate-phone"></div>
          <div className="nf-rotate-title">Drehe dein Gerät</div>
          <div className="nf-rotate-sub">
            NEONFALL wird im Hochformat gespielt. Bitte drehe dein Handy aufrecht für das beste Spielerlebnis.
          </div>
        </div>
      </div>

      <div id="game-container">
        <canvas id="tetris-canvas"></canvas>
        <div id="flash-overlay"></div>
        <div id="combo-popup"></div>
        <div id="hint-overlay">
          <div id="hint-content">
            <div className="hint-cols-wrap">
              <div className="hint-col">
                <h3>Touch</h3>
                <p>
                  <b>Wischen</b> links/rechts: Stein bewegen
                </p>
                <p>
                  <b>Tippen</b> linke/rechte Bildschirmhälfte: Drehung
                  links/rechts
                </p>
                <p>
                  <b>Wischen</b> nach unten: Falltempo richtet sich nach der
                  Wischgeschwindigkeit — langsam lässt den Stein gleiten, ein
                  kräftiger Schwung beschleunigt Fall und Aufprall, ein sehr
                  schneller Wisch lässt ihn sofort einschlagen
                </p>
                <p>
                  <b>Wischen</b> nach oben: Stein tauschen (Hold)
                </p>
              </div>
              <div className="hint-col">
                <h3>Tastatur</h3>
                <p>
                  <kbd>◀</kbd> <kbd>▶</kbd> Bewegen
                </p>
                <p>
                  <kbd>▲</kbd> / <kbd>X</kbd> Drehung rechts · <kbd>Z</kbd>{' '}
                  Drehung links
                </p>
                <p>
                  <kbd>▼</kbd> Absenken · <kbd>Leertaste</kbd> Sofort-Drop
                </p>
                <p>
                  <kbd>Shift</kbd> / <kbd>C</kbd> Stein tauschen (Hold)
                </p>
                <p>
                  <kbd>P</kbd> Pause · <kbd>M</kbd> Ton · <kbd>I</kbd> Hinweis
                </p>
              </div>
            </div>
            <label id="hide-hint-label">
              <input type="checkbox" id="hide-hint-checkbox" /> Beim Start nicht
              mehr anzeigen
            </label>
            <button id="hint-close-button">LOS GEHT&apos;S</button>
            <small>
              über das Symbol <b>ⓘ</b> oben links jederzeit wieder aufrufbar
            </small>
          </div>
        </div>
        <div id="start-prompt">
          <div className="start-prompt-inner">
            <div id="start-prompt-icon">▶</div>
            Tippen zum Start
          </div>
        </div>
        <div id="pause-overlay">
          <h1>PAUSE</h1>
          <p id="pause-score">Score: 0</p>
          <div className="level-select">
            <span>Startlevel</span>
            <button className="level-minus">−</button>
            <b className="level-select-value">1</b>
            <button className="level-plus">+</button>
          </div>
          <div id="settings-panel">
            <h2>Feedback-Stärke</h2>
            <div className="settings-row">
              <label htmlFor="rattle-slider">
                Ratterbewegung beim Schieben
              </label>
              <div className="slider-line">
                <input
                  type="range"
                  id="rattle-slider"
                  min="0"
                  max="200"
                  defaultValue="100"
                  step="10"
                />
                <span id="rattle-value">100%</span>
              </div>
            </div>
            <div className="settings-row">
              <label htmlFor="impact-slider">Stärke des Aufpralls</label>
              <div className="slider-line">
                <input
                  type="range"
                  id="impact-slider"
                  min="0"
                  max="200"
                  defaultValue="100"
                  step="10"
                />
                <span id="impact-value">100%</span>
              </div>
            </div>
          </div>
          <div id="pause-buttons">
            <button id="resume-button">WEITER</button>
            <button id="restart-from-pause-button">NEUSTART</button>
          </div>
        </div>
        <div id="game-over-screen">
          <h1>GAME OVER</h1>
          <p id="new-highscore-badge" style={{ display: 'none' }}>
            🏆 Neuer Highscore!
          </p>
          <p id="final-score">Score: 0</p>
          <p id="final-highscore">Best: 0</p>
          <div className="level-select">
            <span>Startlevel</span>
            <button className="level-minus">−</button>
            <b className="level-select-value">1</b>
            <button className="level-plus">+</button>
          </div>
          <button id="restart-button">NEUSTART</button>
        </div>
      </div>
    </>
  );
}
