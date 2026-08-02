'use client';

import { useEffect, useState } from 'react';
import { Gamepad2, Trophy } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useGameStore } from '@/lib/store/game-store';

interface GameOverDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GameOverDialog({ open, onOpenChange }: GameOverDialogProps) {
  const [displayScore, setDisplayScore] = useState(0);
  const [displayBest, setDisplayBest] = useState(0);
  const [isNewHighscore, setIsNewHighscore] = useState(false);
  const [startLevel, setStartLevel] = useState(1);

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => {
        const w = window as unknown as {
          __nfGetScore?: () => number;
          __nfGetHighscore?: () => number;
          __nfIsNewHighscore?: () => boolean;
          __nfGetStartLevel?: () => number;
        };
        if (w.__nfGetScore) setDisplayScore(w.__nfGetScore());
        if (w.__nfGetHighscore) setDisplayBest(w.__nfGetHighscore());
        if (w.__nfIsNewHighscore) setIsNewHighscore(w.__nfIsNewHighscore());
        if (w.__nfGetStartLevel) setStartLevel(w.__nfGetStartLevel());
      });
    }
  }, [open]);

  const handleLevelChange = (delta: number) => {
    const newLevel = Math.max(1, Math.min(20, startLevel + delta));
    setStartLevel(newLevel);
    const w = window as unknown as { __nfSetStartLevel?: (lv: number) => void };
    if (w.__nfSetStartLevel) w.__nfSetStartLevel(newLevel);
  };

  const handleRestart = () => {
    const w = window as unknown as { __nfRestart?: () => void };
    if (w.__nfRestart) w.__nfRestart();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleRestart(); }}>
      <DialogContent className="nf-dialog-neon nf-gameover-dialog">
        <DialogHeader>
          <DialogTitle className="nf-dialog-title">
            <Gamepad2 size={16} aria-hidden="true" className="nf-dialog-title-icon" style={{ color: '#22d3ee' }} />
            Game Over
          </DialogTitle>
          <DialogDescription className="nf-dialog-desc">
            Das Spiel ist vorbei
          </DialogDescription>
        </DialogHeader>

        {isNewHighscore && (
          <div className="nf-gameover-newhighscore">
            <Trophy size={18} aria-hidden="true" style={{ color: '#fbbf24' }} />
            <span>Neuer Highscore!</span>
          </div>
        )}

        <div className="nf-gameover-stats">
          <div className="nf-gameover-stat">
            <span className="nf-gameover-stat-label">SCORE</span>
            <span className="nf-gameover-stat-value">{displayScore.toLocaleString('de-DE')}</span>
          </div>
          <div className="nf-gameover-stat">
            <span className="nf-gameover-stat-label">BEST</span>
            <span className="nf-gameover-stat-value nf-gameover-stat-best">{displayBest.toLocaleString('de-DE')}</span>
          </div>
        </div>

        <div className="nf-level-stepper">
          <span className="nf-level-stepper-label">Startlevel</span>
          <div className="nf-level-stepper-controls">
            <button type="button" className="nf-stepper-btn" onClick={() => handleLevelChange(-1)} aria-label="Startlevel verringern">−</button>
            <span className="nf-stepper-value">{startLevel}</span>
            <button type="button" className="nf-stepper-btn" onClick={() => handleLevelChange(1)} aria-label="Startlevel erhöhen">+</button>
          </div>
        </div>

        <div className="nf-gameover-actions">
          <Button onClick={handleRestart} className="nf-action-btn nf-action-btn-primary nf-action-btn-single">NEUSTART</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
