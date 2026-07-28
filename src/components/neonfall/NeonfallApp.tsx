'use client';

import { useState, useCallback } from 'react';
import { Toaster } from '@/components/ui/sonner';
import { GAME_CSS } from '@/app/neonfall-content';
import { SHELL_CSS } from '@/app/neonfall-shell';
import { NEONFALL_APP_CSS } from './neonfall-app.css';
import { useGameBootstrap } from './hooks/useGameBootstrap';
import { useGameSync } from './hooks/useGameSync';
import { useModeLogic, useStatusTransitions } from './hooks/useModeLogic';
import { useGameFeel } from './hooks/useGameFeel';
import { useGameStore } from '@/lib/store/game-store';
import { TopBar } from './TopBar';
import { HoldNextBar } from './HoldNextBar';
import { ControlButtons } from './ControlButtons';
import { GameCanvas } from './GameCanvas';
import { Footer } from './Footer';
import { ModeHud } from './ModeHud';
import { ShellOverlays } from './ShellOverlays';
import { SettingsDialog } from './dialogs/SettingsDialog';
import { GameModeDialog } from './dialogs/GameModeDialog';
import { LeaderboardDialog } from './dialogs/LeaderboardDialog';
import { NameInputDialog } from './dialogs/NameInputDialog';
import { MultiplayerDialog } from './dialogs/MultiplayerDialog';
import { HintDialog } from './dialogs/HintDialog';
import { PauseDialog } from './dialogs/PauseDialog';

/**
 * Root client component for the NEONFALL experience.
 *
 * S7.5 refactor: all Effects extracted into Custom Hooks:
 *  - useGameBootstrap (Effects A+B: IIFE injection + __nfGetMode)
 *  - useGameSync (Effects C+E: MutationObserver + slider sync)
 *  - useModeLogic (Effects F+G+M: Sprint/Ultra/Mode-Game-Over)
 *  - useStatusTransitions (status tracking + body class + name-input trigger)
 *  - useGameFeel (Effects H+J+K: shortcuts + haptics + hint sync)
 */
export function NeonfallApp() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [modeDialogOpen, setModeDialogOpen] = useState(false);
  const [leaderboardOpen, setLeaderboardOpen] = useState(false);
  const [nameInputOpen, setNameInputOpen] = useState(false);
  const [multiplayerOpen, setMultiplayerOpen] = useState(false);

  const mode = useGameStore((s) => s.mode);
  const hintOpen = useGameStore((s) => s.hintOpen);
  const setHintOpen = useGameStore((s) => s.setHintOpen);
  const pauseOpen = useGameStore((s) => s.pauseOpen);
  const setPauseOpen = useGameStore((s) => s.setPauseOpen);

  // Custom hooks — each encapsulates a group of related effects.
  useGameBootstrap();
  useGameSync();
  const gameStartTsRef = useStatusTransitions(() => setNameInputOpen(true));
  useModeLogic(gameStartTsRef);
  useGameFeel(
    useCallback(() => setSettingsOpen(v => !v), []),
    useCallback(() => setModeDialogOpen(v => !v), []),
    useCallback(() => setLeaderboardOpen(v => !v), []),
    settingsOpen,
    modeDialogOpen,
    leaderboardOpen,
  );

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: GAME_CSS }} />
      <style dangerouslySetInnerHTML={{ __html: SHELL_CSS }} />
      <style dangerouslySetInnerHTML={{ __html: NEONFALL_APP_CSS }} />

      <h1 id="title" aria-label="NEONFALL">
        <svg className="nf-logo-icon" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
          <rect x="2" y="2" width="8" height="8" rx="2" fill="#22d3ee" />
          <rect x="12" y="8" width="8" height="8" rx="2" fill="#a78bfa" />
          <rect x="7" y="14" width="8" height="8" rx="2" fill="#f472b6" />
        </svg>
        <span className="sr-only">NEONFALL</span>
      </h1>

      <TopBar />
      <ModeHud />
      <HoldNextBar />
      <ControlButtons />

      <GameCanvas />

      <ShellOverlays />

      <Footer
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenModeSelect={() => setModeDialogOpen(true)}
        onOpenLeaderboard={() => setLeaderboardOpen(true)}
        onOpenMultiplayer={() => setMultiplayerOpen(true)}
      />

      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
      <GameModeDialog open={modeDialogOpen} onOpenChange={setModeDialogOpen} />
      <LeaderboardDialog
        open={leaderboardOpen}
        onOpenChange={setLeaderboardOpen}
        initialMode={mode}
      />
      <NameInputDialog open={nameInputOpen} onOpenChange={setNameInputOpen} />
      <MultiplayerDialog open={multiplayerOpen} onOpenChange={setMultiplayerOpen} />
      <HintDialog open={hintOpen} onOpenChange={setHintOpen} />
      <PauseDialog open={pauseOpen} onOpenChange={setPauseOpen} />

      <Toaster position="top-center" closeButton richColors />
    </>
  );
}
