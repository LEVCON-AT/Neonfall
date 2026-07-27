'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Settings } from '@/lib/types';

interface SettingsState extends Settings {
  setRattle: (v: number) => void;
  setImpact: (v: number) => void;
  toggleHaptics: () => void;
  setTheme: (t: Settings['theme']) => void;
  toggleHintOnStart: () => void;
  setNextPreviewCount: (n: 1 | 2 | 3) => void;
  reset: () => void;
}

const DEFAULTS: Settings = {
  rattleStrength: 1,
  impactStrength: 1,
  hapticsEnabled: true,
  theme: 'dark',
  showHintOnStart: true,
  nextPreviewCount: 3,
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...DEFAULTS,
      setRattle: (v) => set({ rattleStrength: v }),
      setImpact: (v) => set({ impactStrength: v }),
      toggleHaptics: () => set((s) => ({ hapticsEnabled: !s.hapticsEnabled })),
      setTheme: (t) => set({ theme: t }),
      toggleHintOnStart: () => set((s) => ({ showHintOnStart: !s.showHintOnStart })),
      setNextPreviewCount: (n) => set({ nextPreviewCount: n }),
      reset: () => set(DEFAULTS),
    }),
    {
      name: 'neonfall-settings',
      storage: createJSONStorage(() => localStorage),
      version: 2,
      // v1 stored musicVolume/sfxVolume/ghostPiece which were removed in S2.2.
      // Drop those keys silently; everything else carries over.
      migrate: (persisted: unknown) => {
        if (persisted && typeof persisted === 'object') {
          const p = persisted as Record<string, unknown>;
          delete p.musicVolume;
          delete p.sfxVolume;
          delete p.ghostPiece;
          return p;
        }
        return persisted;
      },
    },
  ),
);
