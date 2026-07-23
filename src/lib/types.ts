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
  musicVolume: number;      // 0..1
  sfxVolume: number;        // 0..1
  hapticsEnabled: boolean;
  theme: 'dark' | 'light' | 'system';
  showHintOnStart: boolean;
  ghostPiece: boolean;
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
