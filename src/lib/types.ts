// Shared NEONFALL types — used across components, stores, and API routes.

export type GameMode = 'marathon' | 'sprint' | 'ultra' | 'zen';

export type GameStatus =
  | 'idle'         // hint visible, waiting for first tap
  | 'playing'
  | 'paused'
  | 'gameover';

export type MultiplayerState =
  | 'idle'
  | 'lobby'
  | 'waiting'
  | 'playing'
  | 'result';

export interface GameSnapshot {
  score: number;
  best: number;
  level: number;
  lines: number;
  status: GameStatus;
  mode: GameMode;
  /** seconds elapsed in the current game */
  elapsedSec: number;
  /** for sprint mode: lines remaining to goal */
  sprintRemaining?: number;
  /** for ultra mode: seconds remaining */
  ultraRemaining?: number;
}

export interface Player {
  id: string;
  name: string;
}

export interface ScoreEntry {
  id: string;
  playerId: string;
  playerName: string;
  score: number;
  lines: number;
  level: number;
  mode: GameMode;
  duration: number;
  createdAt: string;
  /** true if this entry belongs to the local player (for "me" highlighting) */
  isMe?: boolean;
}

export interface CareerStats {
  gamesPlayed: number;
  totalLines: number;
  totalScore: number;
  bestLevel: number;
  totalPlayTimeSec: number;
  achievements: string[];
}

export interface Settings {
  rattleStrength: number;   // 0..2 (slider 0..200 %)
  impactStrength: number;   // 0..2
  hapticsEnabled: boolean;
  theme: 'dark' | 'light' | 'system';
  showHintOnStart: boolean;
}

export const GAME_MODES: Record<
  GameMode,
  {
    label: string;
    description: string;
    icon: string; // lucide icon name
    /** termination condition — null means endless */
    goal: string;
  }
> = {
  marathon: {
    label: 'Marathon',
    description: 'Klassischer Endlos-Modus. Spiel, bis das Feld voll ist.',
    icon: 'Infinity',
    goal: 'Endlos',
  },
  sprint: {
    label: 'Sprint 40L',
    description: 'Räume 40 Linien so schnell wie möglich ab.',
    icon: 'Zap',
    goal: '40 Linien',
  },
  ultra: {
    label: 'Ultra 3:00',
    description: 'Erziele in 3 Minuten den höchsten Score.',
    icon: 'Timer',
    goal: '3 Minuten',
  },
  zen: {
    label: 'Zen',
    description: 'Entspanntes Spiel ohne Game Over — perfekt zum Üben.',
    icon: 'Sparkles',
    goal: 'Ohne Ende',
  },
};

// ═══════════════════════════════════════════════════════════════
// Global Window interface augmentation (S7.3)
// ═══════════════════════════════════════════════════════════════
// The IIFE in neonfall-content.ts exposes several hooks on window for the
// React layer to call. Previously each call site used `as unknown as { ... }`
// casts — now they're typed globally here.

declare global {
  interface Window {
    /** Returns the currently selected game mode ('marathon'|'sprint'|'ultra'|'zen'). */
    __nfGetMode?: () => string;
    /** Adds garbage rows (from multiplayer opponent) to the pending queue. */
    __nfAddGarbage?: (count: number) => void;
    /** Resets the pending garbage queue to zero. */
    __nfResetGarbage?: () => void;
    /** Returns a deep copy of the current board (2D number array). */
    __nfGetBoard?: () => number[][];
    /** Restarts the game (new board, new piece, reset score). */
    __nfRestart?: () => void;
    /** Internal: guards against double-init of the legacy shell. */
    __nfShellInit?: boolean;
    /** iOS Safari webkitAudioContext fallback. */
    webkitAudioContext?: typeof AudioContext;
  }

  interface Navigator {
    /** iOS Safari standalone mode (PWA launched from home screen). */
    standalone?: boolean;
  }
}
