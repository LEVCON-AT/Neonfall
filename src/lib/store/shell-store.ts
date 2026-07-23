'use client';

import { create } from 'zustand';

export type DialogId =
  | 'stats'
  | 'name'
  | 'multiplayer'
  | 'ios-install'
  | 'settings'
  | 'mode-select'
  | 'info'
  | null;

interface ShellState {
  /** currently open dialog (only one at a time) */
  openDialog: DialogId;
  /** pending score to submit (set when name dialog opens after game over) */
  pendingScore: { score: number; lines: number; level: number; mode: string } | null;
  /** install banner visibility (android beforeinstallprompt) */
  installBannerVisible: boolean;
  /** update toast visibility */
  updateToastVisible: boolean;
  /** achievement toast */
  achievementToast: { name: string; ts: number } | null;
  /** online indicator */
  online: boolean;
  /** rotate hint visible (portrait-required on landscape phones) */
  rotateHintVisible: boolean;

  openDialog_: (id: DialogId) => void;
  closeDialog: () => void;
  setPendingScore: (s: ShellState['pendingScore']) => void;
  showInstallBanner: (v: boolean) => void;
  showUpdateToast: (v: boolean) => void;
  showAchievement: (name: string) => void;
  clearAchievement: () => void;
  setOnline: (v: boolean) => void;
  setRotateHint: (v: boolean) => void;
}

export const useShellStore = create<ShellState>((set) => ({
  openDialog: null,
  pendingScore: null,
  installBannerVisible: false,
  updateToastVisible: false,
  achievementToast: null,
  online: typeof navigator !== 'undefined' ? navigator.onLine : true,
  rotateHintVisible: false,

  openDialog_: (id) => set({ openDialog: id }),
  closeDialog: () => set({ openDialog: null }),
  setPendingScore: (s) => set({ pendingScore: s }),
  showInstallBanner: (v) => set({ installBannerVisible: v }),
  showUpdateToast: (v) => set({ updateToastVisible: v }),
  showAchievement: (name) => set({ achievementToast: { name, ts: Date.now() } }),
  clearAchievement: () => set({ achievementToast: null }),
  setOnline: (v) => set({ online: v }),
  setRotateHint: (v) => set({ rotateHintVisible: v }),
}));
