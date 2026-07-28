'use client';

import { useEffect, useState } from 'react';
import { Info } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useGameStore } from '@/lib/store/game-store';

interface HintDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * S8.19: React-based Hint/Info dialog — replaces the legacy IIFE #hint-overlay.
 *
 * The IIFE still manages hintVisible internally and toggles the 'hidden' class
 * on #hint-overlay. useGameSync detects this and sets `hintOpen` in the game
 * store. When the user closes this dialog, we call window.__nfCloseHint() to
 * sync the IIFE's internal state.
 *
 * Content: Touch + Tastatur sections, each item on its own line (no flowing
 * text). The "Wischen nach unten" description is shortened to one line.
 */
export function HintDialog({ open, onOpenChange }: HintDialogProps) {
  const [hideHint, setHideHint] = useState(false);

  // Initialize checkbox from localStorage when dialog opens.
  // Using requestAnimationFrame to avoid setState-during-effect lint warning
  // (same pattern as NameInputDialog).
  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => {
        try {
          setHideHint(localStorage.getItem('neonfall_hide_hint') === '1');
        } catch {
          setHideHint(false);
        }
      });
    }
  }, [open]);

  const handleClose = () => {
    // Save checkbox preference.
    try {
      if (hideHint) {
        localStorage.setItem('neonfall_hide_hint', '1');
      } else {
        localStorage.removeItem('neonfall_hide_hint');
      }
    } catch {
      // localStorage not available — no-op.
    }
    // Sync IIFE internal state.
    const w = window as unknown as { __nfCloseHint?: () => void };
    if (w.__nfCloseHint) w.__nfCloseHint();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="nf-dialog-neon nf-hint-dialog">
        <DialogHeader>
          <DialogTitle className="nf-dialog-title">
            <Info size={16} aria-hidden="true" className="nf-dialog-title-icon" style={{ color: '#22d3ee' }} />
            Steuerung
          </DialogTitle>
          <DialogDescription className="nf-dialog-desc">
            So spielst du NEONFALL
          </DialogDescription>
        </DialogHeader>

        <div className="nf-hint-sections">
          {/* --- Touch --- */}
          <div className="nf-hint-section">
            <h3 className="nf-hint-section-title">Touch</h3>
            <ul className="nf-hint-list">
              <li className="nf-hint-item">
                <span className="nf-hint-gesture">Wischen ◀ ▶</span>
                <span className="nf-hint-desc">Stein bewegen</span>
              </li>
              <li className="nf-hint-item">
                <span className="nf-hint-gesture">Tippen links / rechts</span>
                <span className="nf-hint-desc">Drehung links / rechts</span>
              </li>
              <li className="nf-hint-item">
                <span className="nf-hint-gesture">Wischen ↓</span>
                <span className="nf-hint-desc">Absenken — schneller Wisch = Sofort-Drop</span>
              </li>
              <li className="nf-hint-item">
                <span className="nf-hint-gesture">Wischen ↑</span>
                <span className="nf-hint-desc">Stein tauschen (Hold)</span>
              </li>
            </ul>
          </div>

          {/* --- Tastatur --- */}
          <div className="nf-hint-section">
            <h3 className="nf-hint-section-title">Tastatur</h3>
            <ul className="nf-hint-list">
              <li className="nf-hint-item">
                <span className="nf-hint-keys"><kbd>◀</kbd> <kbd>▶</kbd></span>
                <span className="nf-hint-desc">Bewegen</span>
              </li>
              <li className="nf-hint-item">
                <span className="nf-hint-keys"><kbd>▲</kbd> <kbd>X</kbd></span>
                <span className="nf-hint-desc">Drehung rechts</span>
              </li>
              <li className="nf-hint-item">
                <span className="nf-hint-keys"><kbd>Z</kbd></span>
                <span className="nf-hint-desc">Drehung links</span>
              </li>
              <li className="nf-hint-item">
                <span className="nf-hint-keys"><kbd>▼</kbd></span>
                <span className="nf-hint-desc">Absenken</span>
              </li>
              <li className="nf-hint-item">
                <span className="nf-hint-keys"><kbd>Leertaste</kbd></span>
                <span className="nf-hint-desc">Sofort-Drop</span>
              </li>
              <li className="nf-hint-item">
                <span className="nf-hint-keys"><kbd>Shift</kbd> <kbd>C</kbd></span>
                <span className="nf-hint-desc">Stein tauschen (Hold)</span>
              </li>
              <li className="nf-hint-item">
                <span className="nf-hint-keys"><kbd>P</kbd></span>
                <span className="nf-hint-desc">Pause</span>
              </li>
              <li className="nf-hint-item">
                <span className="nf-hint-keys"><kbd>M</kbd></span>
                <span className="nf-hint-desc">Ton an/aus</span>
              </li>
              <li className="nf-hint-item">
                <span className="nf-hint-keys"><kbd>I</kbd></span>
                <span className="nf-hint-desc">Hinweis anzeigen</span>
              </li>
            </ul>
          </div>
        </div>

        <label className="nf-hint-checkbox-row">
          <input
            type="checkbox"
            checked={hideHint}
            onChange={(e) => setHideHint(e.target.checked)}
            className="nf-hint-checkbox"
          />
          <span>Beim Start nicht mehr anzeigen</span>
        </label>

        <Button onClick={handleClose} className="nf-hint-close-btn">
          LOS GEHT&apos;S
        </Button>

        <p className="nf-hint-footer">
          Über das <b>Info</b>-Symbol oben links jederzeit wieder aufrufbar ·{' '}
          <a
            href="https://github.com/LEVCON-AT/Neonfall"
            target="_blank"
            rel="noopener noreferrer"
            className="nf-hint-link"
          >
            GitHub
          </a>
        </p>
      </DialogContent>
    </Dialog>
  );
}
