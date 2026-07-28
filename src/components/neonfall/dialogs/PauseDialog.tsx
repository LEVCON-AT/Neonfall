'use client';

import { useEffect, useState } from 'react';
import { Pause } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useGameStore } from '@/lib/store/game-store';

interface PauseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * S8.19: React-based Pause dialog — replaces the legacy IIFE #pause-overlay.
 *
 * The IIFE still manages pause state internally and toggles the 'visible'
 * class on #pause-overlay. useGameSync detects this and sets `pauseOpen` in
 * the game store. When the user clicks WEITER/NEUSTART, we call the IIFE
 * hooks (__nfResume / __nfRestart) so audio + game state stay in sync.
 *
 * Layout:
 *   - PAUSE title
 *   - Live score (read from IIFE via __nfGetScore on each open)
 *   - Startlevel stepper (compact, fixed 36x36 +/- buttons, NOT stretched)
 *   - WEITER + NEUSTART buttons (equal width, side-by-side on desktop,
 *     stacked on mobile via flex-wrap)
 */
export function PauseDialog({ open, onOpenChange }: PauseDialogProps) {
  const [displayScore, setDisplayScore] = useState(0);
  const [startLevel, setStartLevel] = useState(1);

  // Read live score + startLevel from IIFE when dialog opens.
  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => {
        const w = window as unknown as {
          __nfGetScore?: () => number;
          __nfGetStartLevel?: () => number;
        };
        if (w.__nfGetScore) setDisplayScore(w.__nfGetScore());
        if (w.__nfGetStartLevel) setStartLevel(w.__nfGetStartLevel());
      });
    }
  }, [open]);

  const handleLevelChange = (delta: number) => {
    const newLevel = Math.max(1, Math.min(10, startLevel + delta));
    setStartLevel(newLevel);
    const w = window as unknown as { __nfSetStartLevel?: (lv: number) => void };
    if (w.__nfSetStartLevel) w.__nfSetStartLevel(newLevel);
  };

  const handleResume = () => {
    const w = window as unknown as { __nfResume?: () => void };
    if (w.__nfResume) w.__nfResume();
    onOpenChange(false);
  };

  const handleRestart = () => {
    const w = window as unknown as { __nfRestart?: () => void };
    if (w.__nfRestart) w.__nfRestart();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleResume(); }}>
      <DialogContent className="nf-dialog-neon nf-pause-dialog">
        <DialogHeader>
          <DialogTitle className="nf-dialog-title">
            <Pause size={16} aria-hidden="true" className="nf-dialog-title-icon" style={{ color: '#22d3ee' }} />
            Pause
          </DialogTitle>
          <DialogDescription className="nf-dialog-desc">
            Spiel pausiert
          </DialogDescription>
        </DialogHeader>

        <div className="nf-pause-score">
          <span className="nf-pause-score-label">SCORE</span>
          <span className="nf-pause-score-value">{displayScore.toLocaleString('de-DE')}</span>
        </div>

        <div className="nf-level-stepper">
          <span className="nf-level-stepper-label">Startlevel</span>
          <div className="nf-level-stepper-controls">
            <button
              type="button"
              className="nf-stepper-btn"
              onClick={() => handleLevelChange(-1)}
              aria-label="Startlevel verringern"
            >
              −
            </button>
            <span className="nf-stepper-value">{startLevel}</span>
            <button
              type="button"
              className="nf-stepper-btn"
              onClick={() => handleLevelChange(1)}
              aria-label="Startlevel erhöhen"
            >
              +
            </button>
          </div>
        </div>

        <div className="nf-pause-actions">
          <Button onClick={handleResume} className="nf-action-btn nf-action-btn-primary">
            WEITER
          </Button>
          <Button onClick={handleRestart} className="nf-action-btn nf-action-btn-secondary">
            NEUSTART
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
