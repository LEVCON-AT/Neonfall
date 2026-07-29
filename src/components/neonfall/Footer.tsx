'use client';

import { Settings, Gamepad2, Sparkles, Trophy, Users } from 'lucide-react';
import { useGameStore } from '@/lib/store/game-store';
import { GAME_MODES } from '@/lib/types';

interface FooterProps {
  onOpenSettings: () => void;
  onOpenModeSelect: () => void;
  onOpenLeaderboard: () => void;
  onOpenMultiplayer: () => void;
}

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
    <footer
      id="nf-app-footer"
      className={hidden ? 'nf-footer-hidden' : 'nf-footer-visible'}
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
          <button
            type="button"
            className="nf-footer-btn"
            onClick={onOpenMultiplayer}
            aria-label="Multiplayer öffnen"
            title="Multiplayer"
          >
            <Users size={15} aria-hidden="true" />
          </button>
          <button
            type="button"
            className="nf-footer-btn"
            onClick={onOpenModeSelect}
            aria-label="Spielmodus wählen"
            title="Spielmodus"
          >
            <Gamepad2 size={15} aria-hidden="true" />
          </button>
          <button
            type="button"
            className="nf-footer-btn"
            onClick={onOpenLeaderboard}
            aria-label="Bestenliste öffnen"
            title="Bestenliste"
          >
            <Trophy size={15} aria-hidden="true" />
          </button>
          <button
            type="button"
            className="nf-footer-btn"
            onClick={onOpenSettings}
            aria-label="Einstellungen öffnen"
            title="Einstellungen"
          >
            <Settings size={15} aria-hidden="true" />
          </button>
        </div>
      </div>
    </footer>
  );
}
