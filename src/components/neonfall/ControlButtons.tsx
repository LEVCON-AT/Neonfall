'use client';

import { BarChart3, Swords } from 'lucide-react';
import { useGameStore } from '@/lib/store/game-store';

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
 * The top-bar control buttons plus the online indicator.
 *
 * Layout (top of viewport, safe-area aware):
 *   top-left:  #info-btn (IIFE) → #nf-stats-btn (shell)
 *   top-right: #pause-btn (IIFE) → #mute-btn (IIFE)
 * - #info-btn, #pause-btn, #mute-btn → game-controlled (raw SVG, IIFE owns them)
 * - #nf-stats-btn → shell-controlled (lucide icon, opens stats panel via initShell)
 * S8.21.1: #nf-online-dot removed (green status indicator, no value).
 *
 * S2.3 cleanup: removed #nf-music-btn and #nf-mp-btn — they were dead DOM
 * nodes with no CSS positioning and no shell click-handler, floating over the
 * game field at viewport center. Music is controlled via #nf-music-bar; the
 * multiplayer button was never wired in the current shell.
 */
export function ControlButtons() {
  const mode = useGameStore((s) => s.mode);

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

      {/* S8.24.5: 1v1 indicator — only visible in multiplayer mode.
          Placed in the control button bar so it doesn't take extra space. */}
      {mode === 'multiplayer' && (
        <div id="nf-mp-indicator" aria-label="Multiplayer 1v1" title="1v1 Multiplayer">
          <Swords size={14} aria-hidden="true" />
        </div>
      )}

      {/* Shell-controlled button (lucide icon, wired by initShell) */}
      <button id="nf-stats-btn" aria-label="Statistik öffnen" title="Statistik">
        <BarChart3 size={18} aria-hidden="true" />
      </button>
    </>
  );
}
