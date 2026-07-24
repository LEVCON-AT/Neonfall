'use client';

import { useEffect, useRef } from 'react';
import { GAME_SCRIPT } from '@/app/neonfall-content';
import { initShell } from '@/app/neonfall-shell';
import { useGameStore } from '@/lib/store/game-store';

/**
 * Bootstraps the game IIFE and the legacy shell (once).
 *
 * Effect A: injects the IIFE script + runs initShell()
 * Effect B: exposes __nfGetMode so the legacy shell submits the correct
 *           mode per score.
 */
export function useGameBootstrap() {
  const initRef = useRef(false);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    // Execute the game script exactly as authored. It is a self-contained IIFE
    // that grabs its DOM elements via getElementById, so it must run after the
    // markup below has been committed to the DOM (which it has, in useEffect).
    const script = document.createElement('script');
    script.textContent = stripTypeAnnotations(GAME_SCRIPT);
    document.body.appendChild(script);

    // Shell enhancements (install prompt, stats, leaderboard, multiplayer)
    // are best-effort — never let them white-screen the game.
    try {
      initShell();
    } catch (e) {
      console.error('[initShell] FAILED:', e);
    }
  }, []);

  // Expose __nfGetMode for the legacy shell's score submission.
  useEffect(() => {
    window.__nfGetMode = () => useGameStore.getState().mode;
    return () => {
      delete window.__nfGetMode;
    };
  }, []);
}

/**
 * The GAME_SCRIPT in neonfall-content.ts contains a handful of TypeScript
 * annotations that were added when the multiplayer window hooks were exposed.
 * Those annotations are invalid inside a browser `<script>` tag and would
 * prevent the IIFE from running. We strip them at runtime before injection.
 */
function stripTypeAnnotations(script: string): string {
  return script
    .replace(/\(window as any\)/g, 'window')
    .replace(/\(count: number\)/g, '(count)')
    .replace(/\(row: any\[\]\)/g, '(row)');
}
