'use client';

import { create } from 'zustand';
import type { GameMode, GameStatus } from '@/lib/types';

interface GameUiState {
  score: number;
  best: number;
  level: number;
  lines: number;
  status: GameStatus;
  mode: GameMode;
  startLevel: number;
  elapsedSec: number;
  /** sprint mode: lines remaining to 40 */
  sprintRemaining: number;
  /** ultra mode: seconds remaining to 0 */
  ultraRemaining: number;
  /** S8.19: React dialog open states, driven by IIFE overlay class changes */
  hintOpen: boolean;
  pauseOpen: boolean;
  gameOverOpen: boolean;

  setScore: (v: number) => void;
  setBest: (v: number) => void;
  setLevel: (v: number) => void;
  setLines: (v: number) => void;
  setStatus: (s: GameStatus) => void;
  setMode: (m: GameMode) => void;
  setStartLevel: (v: number) => void;
  setElapsed: (s: number) => void;
  setSprintRemaining: (n: number) => void;
  setUltraRemaining: (s: number) => void;
  setHintOpen: (v: boolean) => void;
  setPauseOpen: (v: boolean) => void;
  setGameOverOpen: (v: boolean) => void;
  reset: () => void;
}

const INITIAL = {
  score: 0,
  best: 0,
  level: 1,
  lines: 0,
  status: 'idle' as GameStatus,
  mode: 'marathon' as GameMode,
  startLevel: 1,
  elapsedSec: 0,
  sprintRemaining: 40,
  ultraRemaining: 180,
  hintOpen: false,
  pauseOpen: false,
  gameOverOpen: false,
};

export const useGameStore = create<GameUiState>((set) => ({
  ...INITIAL,
  setScore: (v) => set({ score: v }),
  setBest: (v) => set({ best: v }),
  setLevel: (v) => set({ level: v }),
  setLines: (v) => set({ lines: v }),
  setStatus: (s) => set({ status: s }),
  setMode: (m) => set({ mode: m }),
  setStartLevel: (v) => set({ startLevel: v }),
  setElapsed: (s) => set({ elapsedSec: s }),
  setSprintRemaining: (n) => set({ sprintRemaining: n }),
  setUltraRemaining: (s) => set({ ultraRemaining: s }),
  setHintOpen: (v) => set({ hintOpen: v }),
  setPauseOpen: (v) => set({ pauseOpen: v }),
  setGameOverOpen: (v) => set({ gameOverOpen: v }),
  reset: () => set({ ...INITIAL, mode: useGameStore.getState().mode }),
}));
