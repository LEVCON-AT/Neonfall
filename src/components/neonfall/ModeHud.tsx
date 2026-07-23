'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Timer } from 'lucide-react';
import { useGameStore } from '@/lib/store/game-store';

/**
 * Mode-aware HUD chip — appears below the top-bar during Sprint and Ultra
 * modes. Shows either:
 *  - Sprint: progress towards 40 lines (e.g. "12 / 40") with a neon bar
 *  - Ultra:  a live 3:00 countdown (e.g. "2:47") that turns red under 30s
 *
 * Marathon and Zen don't show a chip — the LINES stat in the top bar already
 * conveys progress and there's no time pressure.
 */
export function ModeHud() {
  const mode = useGameStore((s) => s.mode);
  const status = useGameStore((s) => s.status);
  const lines = useGameStore((s) => s.lines);
  const ultraRemaining = useGameStore((s) => s.ultraRemaining);

  const visible =
    (mode === 'sprint' || mode === 'ultra') && status !== 'gameover';

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          id="nf-mode-hud"
          initial={{ opacity: 0, y: -8, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.96 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          aria-live="polite"
        >
          {mode === 'sprint' && (
            <SprintChip lines={lines} />
          )}
          {mode === 'ultra' && (
            <UltraChip seconds={ultraRemaining} />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function SprintChip({ lines }: { lines: number }) {
  const goal = 40;
  const pct = Math.min(100, (lines / goal) * 100);
  return (
    <div className="nf-mode-hud-inner" data-mode="sprint">
      <Zap size={12} aria-hidden="true" />
      <span className="nf-mode-hud-label">SPRINT</span>
      <div className="nf-mode-hud-bar" aria-hidden="true">
        <div
          className="nf-mode-hud-fill"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="nf-mode-hud-value">
        {lines} / {goal}
      </span>
    </div>
  );
}

function UltraChip({ seconds }: { seconds: number }) {
  const mm = Math.floor(seconds / 60);
  const ss = seconds % 60;
  const timeStr = `${mm}:${ss.toString().padStart(2, '0')}`;
  const urgent = seconds <= 30;
  return (
    <div className="nf-mode-hud-inner" data-mode="ultra" data-urgent={urgent || undefined}>
      <Timer size={12} aria-hidden="true" />
      <span className="nf-mode-hud-label">ULTRA</span>
      <span className="nf-mode-hud-value nf-mode-hud-time">{timeStr}</span>
    </div>
  );
}
