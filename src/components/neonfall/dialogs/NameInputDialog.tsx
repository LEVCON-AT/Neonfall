'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Loader2, Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useSubmitScore, getPlayerName, setPlayerName, getPlayerId } from '@/lib/api/leaderboard';
import { useGameStore } from '@/lib/store/game-store';
import { GAME_MODES } from '@/lib/types';
import { toast } from 'sonner';

interface NameInputDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Post-game-over dialog that invites the player to enter their name and
 * submit their score to the leaderboard.
 *
 * Triggered by NeonfallApp when `status` transitions to 'gameover'. Reads
 * the final score/lines/level/mode from useGameStore, pre-fills the name
 * input with the last-used name (localStorage), and POSTs to /api/scores
 * via the useSubmitScore hook.
 *
 * On success: shows a toast, closes this dialog, and opens the
 * LeaderboardDialog (caller handles the open-leaderboard side effect).
 */
export function NameInputDialog({ open, onOpenChange }: NameInputDialogProps) {
  const score = useGameStore((s) => s.score);
  const lines = useGameStore((s) => s.lines);
  const level = useGameStore((s) => s.level);
  const mode = useGameStore((s) => s.mode);
  const submit = useSubmitScore();

  const [name, setName] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Pre-fill name from localStorage when dialog opens.
  // We use a ref to track the previous open-state so we only reset on the
  // closed→open transition (not on every re-render while open).
  const prevOpenRef = useRef(false);
  useEffect(() => {
    if (open && !prevOpenRef.current) {
      // Just transitioned from closed to open.
      requestAnimationFrame(() => {
        setName(getPlayerName());
        setSubmitted(false);
      });
      setTimeout(() => inputRef.current?.focus(), 100);
    }
    prevOpenRef.current = open;
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      inputRef.current?.focus();
      return;
    }
    setPlayerName(trimmed);
    submit.mutate(
      {
        playerId: getPlayerId(),
        name: trimmed,
        score,
        lines,
        level,
        mode,
        duration: 0,
      },
      {
        onSuccess: () => {
          setSubmitted(true);
          toast.success('Score eingetragen!', {
            description: `${trimmed} · ${score.toLocaleString('de-DE')} Punkte · ${GAME_MODES[mode].label}`,
          });
          // Close after a brief confirmation pause.
          setTimeout(() => onOpenChange(false), 900);
        },
        onError: (err) => {
          toast.error('Eintragen fehlgeschlagen', {
            description: err.message || 'Bitte versuche es später erneut.',
          });
        },
      },
    );
  };

  const handleSkip = () => {
    onOpenChange(false);
  };

  const modeLabel = GAME_MODES[mode].label;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="nf-dialog-neon nf-name-input-dialog">
        <DialogHeader>
          <DialogTitle className="nf-dialog-title">
            <Trophy size={16} aria-hidden="true" className="nf-dialog-title-icon nf-dialog-title-icon-gold" />
            {submitted ? 'Eingetragen!' : 'Score eintragen'}
          </DialogTitle>
          <DialogDescription className="nf-dialog-desc">
            {submitted
              ? 'Dein Ergebnis ist jetzt in der Bestenliste.'
              : 'Trage deinen Namen ein, um in der Bestenliste zu erschenen.'}
          </DialogDescription>
        </DialogHeader>

        {/* Final stats summary */}
        <div className="nf-name-stats">
          <div className="nf-name-stat">
            <span className="nf-name-stat-label">SCORE</span>
            <span className="nf-name-stat-value nf-name-stat-score">
              {score.toLocaleString('de-DE')}
            </span>
          </div>
          <div className="nf-name-stat">
            <span className="nf-name-stat-label">LINIEN</span>
            <span className="nf-name-stat-value">{lines}</span>
          </div>
          <div className="nf-name-stat">
            <span className="nf-name-stat-label">LEVEL</span>
            <span className="nf-name-stat-value">{level}</span>
          </div>
          <div className="nf-name-stat">
            <span className="nf-name-stat-label">MODUS</span>
            <span className="nf-name-stat-value nf-name-stat-mode">{modeLabel}</span>
          </div>
        </div>

        {submitted ? (
          <motion.div
            className="nf-name-success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            <Check size={32} aria-hidden="true" style={{ color: '#34d399' }} />
            <span>Bestenliste aktualisiert</span>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="nf-name-form">
            <Input
              ref={inputRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={16}
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
              placeholder="Dein Name"
              aria-label="Spielername"
              className="nf-name-input"
              disabled={submit.isPending}
            />
            <div className="nf-name-actions">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleSkip}
                disabled={submit.isPending}
              >
                Überspringen
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={submit.isPending || !name.trim()}
                className="nf-name-submit-btn"
              >
                {submit.isPending ? (
                  <>
                    <Loader2 size={14} className="animate-spin" aria-hidden="true" />
                    Eintragen…
                  </>
                ) : (
                  'Eintragen'
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
