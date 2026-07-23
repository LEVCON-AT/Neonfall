'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Settings } from '@/lib/types';

interface SettingsState extends Settings {
  setRattle: (v: number) => void;
  setImpact: (v: number) => void;
  setMusicVolume: (v: number) => void;
  setSfxVolume: (v: number) => void;
  toggleHaptics: () => void;
  setTheme: (t: Settings['theme']) => void;
  toggleHintOnStart: () => void;
  toggleGhostPiece: () => void;
  reset: () => void;
}

const DEFAULTS: Settings = {
  rattleStrength: 1,
  impactStrength: 1,
  musicVolume: 0.7,
  sfxVolume: 0.8,
  hapticsEnabled: true,
  theme: 'dark',
  showHintOnStart: true,
  ghostPiece: false,
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...DEFAULTS,
      setRattle: (v) => set({ rattleStrength: v }),
      setImpact: (v) => set({ impactStrength: v }),
      setMusicVolume: (v) => set({ musicVolume: v }),
      setSfxVolume: (v) => set({ sfxVolume: v }),
      toggleHaptics: () => set((s) => ({ hapticsEnabled: !s.hapticsEnabled })),
      setTheme: (t) => set({ theme: t }),
      toggleHintOnStart: () => set((s) => ({ showHintOnStart: !s.showHintOnStart })),
      toggleGhostPiece: () => set((s) => ({ ghostPiece: !s.ghostPiece })),
      reset: () => set(DEFAULTS),
    }),
    {
      name: 'neonfall-settings',
      storage: createJSONStorage(() => localStorage),
      version: 1,
    },
  ),
);
