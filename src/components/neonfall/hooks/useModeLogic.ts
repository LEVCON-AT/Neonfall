'use client';

import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { useGameStore } from '@/lib/store/game-store';
import type { GameStatus } from '@/lib/types';

/** Read an integer from a DOM element's textContent, default 0. */
function readInt(id: string): number {
  const el = document.getElementById(id);
  if (!el) return 0;
  const m = el.textContent?.match(/-?\d+/);
  return m ? parseInt(m[0], 10) : 0;
}

/**
 * Mode-aware game logic: Sprint finish, Ultra countdown, and mode-specific
 * game-over titles.
 *
 * Effect F: Sprint mode — finish the run when 40 lines are cleared.
 * Effect G: Ultra mode — 180s countdown while playing.
 * Effect M: Mode-specific game-over title override.
 */
export function useModeLogic(gameStartTsRef: React.RefObject<number | null>) {
  const mode = useGameStore((s) => s.mode);
  const status = useGameStore((s) => s.status);
  const sprintDoneRef = useRef(false);
  const ultraDoneRef = useRef(false);

  // Track game-start timestamps + body class + name-input trigger.
  useEffect(() => {
    // Sprint F: finish at 40 lines
    if (mode === 'sprint') {
      sprintDoneRef.current = false;
      const onLines = () => {
        if (sprintDoneRef.current) return;
        if (readInt('lines') < 40) return;
        sprintDoneRef.current = true;
        const secs = gameStartTsRef.current ? (Date.now() - gameStartTsRef.current) / 1000 : 0;
        const mm = Math.floor(secs / 60);
        const ss = (secs % 60).toFixed(1);
        toast.success('Sprint 40L geschafft!', {
          description: `Zeit: ${mm > 0 ? `${mm}:${ss.padStart(4, '0')}` : `${ss}s`}`,
        });
        try { window.__nfRestart?.(); } catch {}
        useGameStore.getState().setMode('marathon');
      };
      window.addEventListener('nf-lines-cleared', onLines as EventListener);
      return () => window.removeEventListener('nf-lines-cleared', onLines as EventListener);
    }
  }, [mode, gameStartTsRef]);

  // Ultra G: countdown
  useEffect(() => {
    if (mode === 'ultra' && status === 'idle') {
      ultraDoneRef.current = false;
      useGameStore.getState().setUltraRemaining(180);
    }
    if (mode !== 'ultra' || status !== 'playing' || ultraDoneRef.current) return;

    const id = window.setInterval(() => {
      const cur = useGameStore.getState().ultraRemaining;
      if (cur <= 1) {
        window.clearInterval(id);
        ultraDoneRef.current = true;
        toast.success('Ultra beendet', {
          description: `Finaler Score: ${readInt('score').toLocaleString('de-DE')}`,
        });
        try { window.__nfRestart?.(); } catch {}
        useGameStore.getState().setMode('marathon');
      } else {
        useGameStore.getState().setUltraRemaining(cur - 1);
      }
    }, 1000);
    return () => window.clearInterval(id);
  }, [mode, status]);

  // M: Mode-specific game-over title
  useEffect(() => {
    const goScreen = document.getElementById('game-over-screen');
    if (!goScreen) return;
    const h1 = goScreen.querySelector('h1');
    if (!h1) return;

    const updateTitle = () => {
      if (!goScreen.classList.contains('visible')) return;
      const m = useGameStore.getState().mode;
      if (m === 'sprint') {
        h1.textContent = '40 LINIEN!';
        h1.style.background = 'linear-gradient(90deg, #f472b6, #a78bfa)';
        h1.style.webkitBackgroundClip = 'text';
        h1.style.backgroundClip = 'text';
        h1.style.color = 'transparent';
      } else if (m === 'ultra') {
        h1.textContent = 'ZEIT ABGELAUFEN';
        h1.style.background = 'linear-gradient(90deg, #a78bfa, #22d3ee)';
        h1.style.webkitBackgroundClip = 'text';
        h1.style.backgroundClip = 'text';
        h1.style.color = 'transparent';
      } else {
        h1.textContent = 'GAME OVER';
        h1.style.background = '';
        h1.style.webkitBackgroundClip = '';
        h1.style.backgroundClip = '';
        h1.style.color = '';
      }
    };

    const obs = new MutationObserver(updateTitle);
    obs.observe(goScreen, { attributes: true, attributeFilter: ['class'] });
    updateTitle();
    return () => obs.disconnect();
  }, []);
}

/** Status transition tracker: game-start timestamps, body class, name-input. */
export function useStatusTransitions(
  onGameOver: () => void,
) {
  const prevStatusRef = useRef<GameStatus>('idle');
  const gameStartTsRef = useRef<number | null>(null);
  const status = useGameStore((s) => s.status);

  useEffect(() => {
    const prev = prevStatusRef.current;
    prevStatusRef.current = status;
    if (status === 'playing' && prev !== 'playing') {
      gameStartTsRef.current = Date.now();
    }
    if (status !== 'playing') {
      gameStartTsRef.current = null;
    }
    if (typeof document !== 'undefined') {
      document.body.classList.toggle('nf-playing', status === 'playing');
    }
    if (status === 'gameover' && prev !== 'gameover') {
      const finalScore = readInt('score');
      if (finalScore > 0) {
        setTimeout(onGameOver, 600);
      }
    }
  }, [status, onGameOver]);

  return gameStartTsRef;
}
