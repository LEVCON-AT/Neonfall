'use client';

import { useEffect } from 'react';
import { useSettingsStore } from '@/lib/store/settings-store';

/**
 * Game-feel effects: haptics (J), hint-on-start sync (K), and keyboard
 * shortcuts (H).
 */
export function useGameFeel(
  onOpenSettings: () => void,
  onOpenModeSelect: () => void,
  onOpenLeaderboard: () => void,
  isSettingsOpen: boolean,
  isModeDialogOpen: boolean,
  isLeaderboardOpen: boolean,
) {
  // J: Haptics — vibrate on line clears.
  //   Note: navigator.vibrate only works on Android. iOS Safari/PWA does
  //   not support the Vibration API. The toggle is still useful for Android
  //   users. No error is thrown on iOS — vibrate() is simply a no-op.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onLines = (e: Event) => {
      const ev = e as CustomEvent<{ cleared?: number }>;
      const cleared = ev.detail?.cleared ?? 0;
      if (cleared < 1) return;
      if (!useSettingsStore.getState().hapticsEnabled) return;
      // navigator.vibrate is only available on Android Chrome/PWA.
      // iOS does not support it — the call silently does nothing.
      const nav = navigator as Navigator & { vibrate?: (p: number | number[]) => boolean };
      if (typeof nav.vibrate !== 'function') return;
      const patterns: Record<number, number[]> = {
        1: [18],
        2: [18, 35, 18],
        3: [20, 40, 20, 40, 25],
        4: [25, 45, 25, 45, 25, 45, 60],
      };
      try {
        nav.vibrate(patterns[cleared] ?? patterns[1]);
      } catch {
        /* iOS may throw — silently ignore */
      }
    };
    window.addEventListener('nf-lines-cleared', onLines as EventListener);
    return () => window.removeEventListener('nf-lines-cleared', onLines as EventListener);
  }, []);

  // K: Hint-on-start sync — mirror settings toggle into localStorage key.
  const showHintOnStart = useSettingsStore((s) => s.showHintOnStart);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      if (showHintOnStart) {
        window.localStorage.removeItem('neonfall_hide_hint');
      } else {
        window.localStorage.setItem('neonfall_hide_hint', '1');
      }
    } catch {}
  }, [showHintOnStart]);

  // H: Keyboard shortcuts: S=Settings, G=Mode, L=Leaderboard, Esc=close.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) {
        return;
      }
      if (e.key === 'Escape') {
        if (isSettingsOpen) onOpenSettings();
        else if (isModeDialogOpen) onOpenModeSelect();
        else if (isLeaderboardOpen) onOpenLeaderboard();
        return;
      }
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        onOpenSettings();
      } else if (e.key === 'g' || e.key === 'G') {
        e.preventDefault();
        onOpenModeSelect();
      } else if (e.key === 'l' || e.key === 'L') {
        e.preventDefault();
        onOpenLeaderboard();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onOpenSettings, onOpenModeSelect, onOpenLeaderboard, isSettingsOpen, isModeDialogOpen, isLeaderboardOpen]);
}
