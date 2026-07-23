'use client';

import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Infinity as InfinityIcon, Zap, Timer, Sparkles } from 'lucide-react';
import { useGameStore } from '@/lib/store/game-store';
import { GAME_MODES, type GameMode } from '@/lib/types';

interface GameModeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Lucide icon component per mode (looked up from GAME_MODES.icon name). */
const MODE_ICONS: Record<GameMode, typeof InfinityIcon> = {
  marathon: InfinityIcon,
  sprint: Zap,
  ultra: Timer,
  zen: Sparkles,
};

const MODE_ORDER: GameMode[] = ['marathon', 'sprint', 'ultra', 'zen'];

export function GameModeDialog({ open, onOpenChange }: GameModeDialogProps) {
  const currentMode = useGameStore((s) => s.mode);
  const setMode = useGameStore((s) => s.setMode);

  function pick(mode: GameMode) {
    setMode(mode);
    onOpenChange(false);
    toast.success(`Modus: ${GAME_MODES[mode].label}`, {
      description: GAME_MODES[mode].goal,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="nf-dialog-neon nf-mode-dialog">
        <DialogHeader>
          <DialogTitle className="nf-dialog-title">Spielmodus</DialogTitle>
          <DialogDescription className="nf-dialog-desc">
            Wähle, wie du spielen willst. Wechselt sofort — der aktuelle Lauf
            startet beim nächsten Neustart mit dem neuen Modus.
          </DialogDescription>
        </DialogHeader>

        <div className="nf-mode-grid">
          {MODE_ORDER.map((mode) => {
            const info = GAME_MODES[mode];
            const Icon = MODE_ICONS[mode];
            const active = mode === currentMode;
            return (
              <motion.button
                key={mode}
                type="button"
                className={`nf-mode-card${active ? ' nf-mode-card-active' : ''}`}
                onClick={() => pick(mode)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                aria-pressed={active}
              >
                <div className="nf-mode-card-icon">
                  <Icon size={22} aria-hidden="true" />
                </div>
                <div className="nf-mode-card-body">
                  <div className="nf-mode-card-label">{info.label}</div>
                  <div className="nf-mode-card-desc">{info.description}</div>
                  <div className="nf-mode-card-goal">Ziel: {info.goal}</div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
