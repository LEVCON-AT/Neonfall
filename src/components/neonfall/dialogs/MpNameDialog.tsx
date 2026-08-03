'use client';

import { useEffect, useRef, useState } from 'react';
import { Users } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface MpNameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNameSet: () => void;
}

/**
 * S8.24.4-fix: Simple name-input dialog for Multiplayer.
 * Not the Score-eintragen dialog (which has Trophy icon + score context).
 * This is just "Wie heißt du?" with Users icon — fits the Multiplayer context.
 */
export function MpNameDialog({ open, onOpenChange, onNameSet }: MpNameDialogProps) {
  const [name, setName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => {
        const existing = localStorage.getItem('neonfall_player_name') || '';
        setName(existing);
        setTimeout(() => inputRef.current?.focus(), 100);
      });
    }
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      inputRef.current?.focus();
      return;
    }
    localStorage.setItem('neonfall_player_name', trimmed);
    onOpenChange(false);
    onNameSet();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="nf-dialog-neon nf-mp-name-dialog">
        <DialogHeader>
          <DialogTitle className="nf-dialog-title">
            <Users size={16} aria-hidden="true" className="nf-dialog-title-icon" style={{ color: '#22d3ee' }} />
            Spielername
          </DialogTitle>
          <DialogDescription className="nf-dialog-desc">
            Wie heißt du? Dein Name wird deinem Gegner angezeigt.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="nf-mp-name-form">
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
            className="nf-mp-code-input"
          />
          <Button
            type="submit"
            disabled={!name.trim()}
            className="nf-action-btn nf-action-btn-primary nf-action-btn-single"
          >
            Bestätigen
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
