'use client';

import { BarChart3, Users, Music } from 'lucide-react';

/**
 * Inline SVG strings for the game-controlled buttons.
 *
 * The game IIFE has its own ICON map and overwrites the innerHTML of
 * #info-btn, #pause-btn and #mute-btn on every state change (pause↔play,
 * mute↔unmute). We render an initial icon via dangerouslySetInnerHTML so the
 * button is non-empty before the IIFE runs, but the IIFE owns the contents
 * from then on. These must stay as raw SVG strings — using lucide components
 * here would be overwritten and also conflicts with React's virtual DOM.
 */
const GAME_SVG = {
  info:
    '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
  pause:
    '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>',
  volOn:
    '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>',
} as const;

/**
 * The four fixed-position top-bar control buttons plus the online indicator.
 *
 * - #info-btn, #pause-btn, #mute-btn → game-controlled (raw SVG, IIFE owns them)
 * - #nf-music-btn, #nf-stats-btn, #nf-mp-btn → shell-controlled (lucide icons)
 * - #nf-online-dot → status indicator (no icon, just a coloured dot)
 *
 * The shell wires up click handlers on the nf-* buttons in `initShell()`.
 */
export function ControlButtons() {
  return (
    <>
      {/* Game-controlled buttons (IIFE overwrites innerHTML on state change) */}
      <button
        id="info-btn"
        aria-label="Info / Steuerung"
        dangerouslySetInnerHTML={{ __html: GAME_SVG.info }}
      />
      <button
        id="pause-btn"
        aria-label="Pause"
        data-state="pause"
        dangerouslySetInnerHTML={{ __html: GAME_SVG.pause }}
      />
      <button
        id="mute-btn"
        aria-label="Ton an/aus"
        data-muted="0"
        dangerouslySetInnerHTML={{ __html: GAME_SVG.volOn }}
      />

      {/* Shell-controlled buttons (lucide icons, wired by initShell) */}
      <button id="nf-music-btn" aria-label="Musik-Player" title="Musik">
        <Music size={18} aria-hidden="true" />
      </button>
      <button id="nf-stats-btn" aria-label="Statistik öffnen" title="Statistik">
        <BarChart3 size={18} aria-hidden="true" />
      </button>
      <button id="nf-mp-btn" aria-label="Multiplayer" title="Multiplayer">
        <Users size={18} aria-hidden="true" />
      </button>
      <div id="nf-online-dot" aria-hidden="true" title="Online" />
    </>
  );
}
