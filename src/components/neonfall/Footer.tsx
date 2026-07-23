'use client';

import { motion } from 'framer-motion';
import { Settings, Gamepad2, Sparkles, Trophy, Users } from 'lucide-react';
import { useGameStore } from '@/lib/store/game-store';
import { GAME_MODES } from '@/lib/types';

interface FooterProps {
  onOpenSettings: () => void;
  onOpenModeSelect: () => void;
  onOpenLeaderboard: () => void;
  onOpenMultiplayer: () => void;
}

/**
 * Thin (~32px) glass footer fixed to the bottom of the viewport.
 *
 * The game IIFE pins `body { overflow: hidden; height: 100vh }`, so a normal
 * sticky footer would never be scrollable into view. We use `position: fixed`
 * instead and hide the bar entirely while a game is actively running so it
 * never covers the playfield. When the game is idle / paused / over, the bar
 * slides back up with a subtle fade.
 */
export function Footer({
  onOpenSettings,
  onOpenModeSelect,
  onOpenLeaderboard,
  onOpenMultiplayer,
}: FooterProps) {
  const status = useGameStore((s) => s.status);
  const mode = useGameStore((s) => s.mode);
  const modeLabel = GAME_MODES[mode].label;

  const hidden = status === 'playing';

  return (
    <motion.footer
      id="nf-app-footer"
      initial={false}
      animate={{
        opacity: hidden ? 0 : 1,
        y: hidden ? 24 : 0,
      }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      aria-hidden={hidden}
    >
      <div className="nf-footer-inner">
        <div className="nf-footer-brand">
          <Sparkles size={12} aria-hidden="true" />
          <span>NEONFALL</span>
        </div>

        <div className="nf-footer-mode" data-mode={mode}>
          {modeLabel}
        </div>

        <div className="nf-footer-actions">
          <motion.button
            type="button"
            className="nf-footer-btn"
            onClick={onOpenMultiplayer}
            aria-label="Multiplayer öffnen"
            title="Multiplayer"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Users size={15} aria-hidden="true" />
          </motion.button>
          <motion.button
            type="button"
            className="nf-footer-btn"
            onClick={onOpenModeSelect}
            aria-label="Spielmodus wählen"
            title="Spielmodus"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Gamepad2 size={15} aria-hidden="true" />
          </motion.button>
          <motion.button
            type="button"
            className="nf-footer-btn"
            onClick={onOpenSettings}
            aria-label="Einstellungen öffnen"
            title="Einstellungen"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Settings size={15} aria-hidden="true" />
          </motion.button>
        </div>
      </div>
    </motion.footer>
  );
}
