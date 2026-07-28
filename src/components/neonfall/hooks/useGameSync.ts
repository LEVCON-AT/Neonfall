'use client';

import { useEffect } from 'react';
import { useGameStore } from '@/lib/store/game-store';
import { useSettingsStore } from '@/lib/store/settings-store';
import type { GameStatus } from '@/lib/types';

/** Read an integer from a DOM element's textContent, default 0. */
function readInt(id: string): number {
  const el = document.getElementById(id);
  if (!el) return 0;
  const m = el.textContent?.match(/-?\d+/);
  return m ? parseInt(m[0], 10) : 0;
}

/**
 * Mirrors the IIFE's overlay + stat DOM into useGameStore (Effect C),
 * and pushes persisted rattle/impact into the IIFE sliders on dialog open
 * (Effect E).
 */
export function useGameSync() {
  // Effect C: MutationObserver → useGameStore
  useEffect(() => {
    const ids = [
      'start-prompt',
      'pause-overlay',
      'game-over-screen',
      'hint-overlay',
      'score',
      'level',
      'lines',
      'best-score',
    ];

    const compute = () => {
      const hint = document.getElementById('hint-overlay');
      const sp = document.getElementById('start-prompt');
      const po = document.getElementById('pause-overlay');
      const go = document.getElementById('game-over-screen');

      const hintVisible = hint ? !hint.classList.contains('hidden') : false;
      const startVisible = sp ? sp.classList.contains('visible') : false;
      const pauseVisible = po ? po.classList.contains('visible') : false;
      const goVisible = go ? go.classList.contains('visible') : false;

      let status: GameStatus = 'playing';
      if (goVisible) status = 'gameover';
      else if (pauseVisible) status = 'paused';
      else if (hintVisible || startVisible) status = 'idle';

      const store = useGameStore.getState();
      store.setStatus(status);
      // S8.19: Drive React HintDialog + PauseDialog open state from IIFE overlay classes.
      store.setHintOpen(hintVisible);
      store.setPauseOpen(pauseVisible);
      // Stat-pulse: detect which stat changed and pulse that box.
      const prev = {
        score: store.score,
        level: store.level,
        lines: store.lines,
        best: store.best,
      };
      const next = {
        score: readInt('score'),
        level: readInt('level'),
        lines: readInt('lines'),
        best: readInt('best-score'),
      };
      store.setScore(next.score);
      store.setLevel(next.level);
      store.setLines(next.lines);
      store.setBest(next.best);
      (['score', 'level', 'lines', 'best'] as const).forEach((key) => {
        if (next[key] > prev[key]) {
          const id = key === 'best' ? 'best-score' : key;
          const el = document.getElementById(id);
          if (el) {
            el.classList.remove('nf-stat-pulse');
            void el.offsetWidth;
            el.classList.add('nf-stat-pulse');
          }
        }
      });
    };

    const obs = new MutationObserver(compute);
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      obs.observe(el, {
        attributes: true,
        attributeFilter: ['class', 'style'],
        childList: true,
        characterData: true,
        subtree: true,
      });
    });
    compute();
    return () => obs.disconnect();
  }, []);

  // Effect E: push persisted rattle/impact into IIFE sliders on mount.
  const rattle = useSettingsStore((s) => s.rattleStrength);
  const impact = useSettingsStore((s) => s.impactStrength);
  useEffect(() => {
    syncGameSlider('rattle-slider', rattle);
    syncGameSlider('impact-slider', impact);
  }, [rattle, impact]);

  const nextPreviewCount = useSettingsStore((s) => s.nextPreviewCount);
  const setNextPreviewCount = useSettingsStore((s) => s.setNextPreviewCount);
  useEffect(() => {
    const w = window as unknown as { __nfNextPreview?: (n: number) => void };
    if (w.__nfNextPreview) {
      w.__nfNextPreview(nextPreviewCount);
    }
  }, [nextPreviewCount]);

  // S8.18-P1: Click on #next-box cycles the preview count 3 -> 2 -> 1 -> 3.
  //   The existing effect above then syncs the new value to the IIFE via
  //   window.__nfNextPreview(), which redraws the next-box. A brief CSS pulse
  //   gives tactile feedback so the click doesn't feel "dead".
  useEffect(() => {
    const el = document.getElementById('next-box');
    if (!el) return;
    const handler = () => {
      const cur = useSettingsStore.getState().nextPreviewCount;
      const next = cur === 3 ? 2 : cur === 2 ? 1 : 3;
      setNextPreviewCount(next);
      // Visual pulse feedback.
      el.classList.remove('nf-next-pulse');
      void el.offsetWidth;
      el.classList.add('nf-next-pulse');
    };
    el.addEventListener('click', handler);
    return () => el.removeEventListener('click', handler);
  }, [setNextPreviewCount]);
}

/** Push a 0..2 strength value into one of the IIFE's range sliders. */
function syncGameSlider(id: string, value01to2: number): void {
  if (typeof document === 'undefined') return;
  const el = document.getElementById(id) as HTMLInputElement | null;
  if (!el) return;
  const pct = Math.max(0, Math.min(200, Math.round(value01to2 * 100)));
  el.value = String(pct);
  el.dispatchEvent(new Event('input', { bubbles: true }));
}
