'use client';

import { motion } from 'framer-motion';
import { Trophy } from 'lucide-react';

/**
 * Inline SVG strings for elements the IIFE controls by innerHTML.
 *
 * #start-prompt-icon is rewritten by the IIFE (it swaps between a play arrow
 * and a tap icon depending on state), so the initial value must be a raw SVG
 * string — using a lucide component here would be clobbered and also clash
 * with React's ownership of the node.
 */
const START_PROMPT_SVG =
  '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true"><path d="M7 4.5v15a1 1 0 0 0 1.52.85l12-7.5a1 1 0 0 0 0-1.7l-12-7.5A1 1 0 0 0 7 4.5Z"/></svg>';

/**
 * The #game-container holds the playfield canvas and every overlay the game
 * IIFE toggles (hint, start-prompt, pause, game-over). All element IDs and
 * the nested structure must stay byte-compatible with what the IIFE expects.
 *
 * Sprint 1: The two React-controlled pause-overlay buttons (Einstellungen +
 * Modus) have been REMOVED. They duplicated the footer buttons and made the
 * pause overlay feel cluttered. The footer (visible whenever the game is
 * paused) is now the single entry point to Settings/Mode/Leaderboard.
 *
 * The overlay wrappers are rendered as `motion.div` (framer-motion). Because
 * the IIFE caches references to these nodes at init and toggles their
 * `.visible` class itself, we do NOT use AnimatePresence here — React must
 * not mount/unmount them. motion.div is used purely as a styled div; the
 * fade/scale transitions for React-controlled dialogs live in the dialog
 * components themselves.
 */
export function GameCanvas() {
  return (
    <div id="game-container">
      <canvas id="tetris-canvas"></canvas>
      <div id="flash-overlay"></div>
      <div id="combo-popup"></div>

      <motion.div id="hint-overlay" initial={false}>
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
            über das <b>Info</b>-Symbol oben links jederzeit wieder aufrufbar ·{' '}
            <a href="https://github.com/LEVCON-AT/Neonfall" target="_blank" rel="noopener noreferrer" style={{ color: '#22d3ee', textDecoration: 'none' }}>
              GitHub
            </a>
          </small>
        </div>
      </motion.div>

      <motion.div id="start-prompt" initial={false}>
        <div className="start-prompt-inner">
          <div
            id="start-prompt-icon"
            dangerouslySetInnerHTML={{ __html: START_PROMPT_SVG }}
          />
          Tippen zum Start
        </div>
      </motion.div>

      <motion.div id="pause-overlay" initial={false}>
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
      </motion.div>

      <motion.div id="game-over-screen" initial={false}>
        <h1>GAME OVER</h1>
        <p id="new-highscore-badge" style={{ display: 'none' }}>
          <Trophy size={16} aria-hidden="true" className="nf-trophy-inline" />{' '}
          Neuer Highscore!
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
      </motion.div>
    </div>
  );
}
