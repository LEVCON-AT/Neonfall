'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
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
import { OpponentPanel } from './OpponentPanel';
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
import { GameOverDialog } from './dialogs/GameOverDialog';
import type { Socket } from 'socket.io-client';

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
  const [mpPlaying, setMpPlaying] = useState(false);
  const [opponentData, setOpponentData] = useState<{ name: string; board: number[][] | null }>({ name: '', board: null });
  // S8.24.3: Shared socket ref — Dialog creates it, NeonfallApp uses it for
  // board-send during playing (when Dialog is closed/unmounted).
  const mpSocketRef = useRef<Socket | null>(null);

  const mode = useGameStore((s) => s.mode);
  const hintOpen = useGameStore((s) => s.hintOpen);
  const setHintOpen = useGameStore((s) => s.setHintOpen);
  const pauseOpen = useGameStore((s) => s.pauseOpen);
  const setPauseOpen = useGameStore((s) => s.setPauseOpen);
  const gameOverOpen = useGameStore((s) => s.gameOverOpen);
  const setGameOverOpen = useGameStore((s) => s.setGameOverOpen);

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

  // S8.24.3: Send board updates to opponent while playing.
  useEffect(() => {
    if (!mpPlaying) return;
    let lastSend = 0;
    const onBoardUpdate = () => {
      const now = Date.now();
      if (now - lastSend < 100) return;
      lastSend = now;
      try {
        const board = (window as unknown as { __nfGetBoard?: () => number[][] }).__nfGetBoard?.();
        if (board && mpSocketRef.current) {
          mpSocketRef.current.emit('game:board', { board });
        }
      } catch {}
    };
    window.addEventListener('nf-board-updated', onBoardUpdate);
    return () => window.removeEventListener('nf-board-updated', onBoardUpdate);
  }, [mpPlaying]);

  // S8.24.3a: Receive opponent events while playing. These were previously
  // in MultiplayerDialog but the dialog closes when playing starts → socket
  // disconnects → events lost. Now NeonfallApp handles them via shared socket.
  useEffect(() => {
    if (!mpPlaying || !mpSocketRef.current) return;
    const sock = mpSocketRef.current;

    const onGarbage = (data: { count: number }) => {
      try { (window as unknown as { __nfAddGarbage?: (n: number) => void }).__nfAddGarbage?.(data.count); } catch {}
    };

    const onBoard = (data: { board: number[][] }) => {
      setOpponentData(prev => ({ name: prev.name, board: data.board }));
    };

    const onWin = () => {
      setMpPlaying(false);
      setMultiplayerOpen(true);
    };

    const onLeft = () => {
      setMpPlaying(false);
      setMultiplayerOpen(true);
    };

    const onRestart = () => {
      try { (window as unknown as { __nfRestart?: () => void }).__nfRestart?.(); } catch {}
    };

    sock.on('opponent:garbage', onGarbage);
    sock.on('opponent:board', onBoard);
    sock.on('opponent:win', onWin);
    sock.on('opponent:left', onLeft);
    sock.on('opponent:restart', onRestart);

    return () => {
      sock.off('opponent:garbage', onGarbage);
      sock.off('opponent:board', onBoard);
      sock.off('opponent:win', onWin);
      sock.off('opponent:left', onLeft);
      sock.off('opponent:restart', onRestart);
    };
  }, [mpPlaying]);

  // S8.24.3a: Send garbage to opponent on line clears.
  useEffect(() => {
    if (!mpPlaying) return;
    const onLines = (e: Event) => {
      const ev = e as CustomEvent<{ cleared?: number }>;
      const cleared = ev.detail?.cleared ?? 0;
      if (cleared < 1) return;
      mpSocketRef.current?.emit('game:lines', { cleared });
    };
    window.addEventListener('nf-lines-cleared', onLines as EventListener);
    return () => window.removeEventListener('nf-lines-cleared', onLines as EventListener);
  }, [mpPlaying]);

  // S8.24.3a: Notify opponent on game over.
  useEffect(() => {
    if (!mpPlaying) return;
    const goEl = document.getElementById('game-over-screen');
    if (!goEl) return;
    const observer = new MutationObserver(() => {
      if (goEl.classList.contains('visible')) {
        mpSocketRef.current?.emit('game:over');
        setMpPlaying(false);
        setMultiplayerOpen(true);
      }
    });
    observer.observe(goEl, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, [mpPlaying]);

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

      {/* S8.24.2: GameCanvas stays direct child of body (IIFE expects this).
          OpponentPanel is position:fixed (like footer/topbar) so it doesn't
          disturb the game's flex layout. */}
      <GameCanvas />
      {mpPlaying && (
        <OpponentPanel
          opponentName={opponentData.name}
          opponentBoard={opponentData.board}
          onLeave={() => {
            setMpPlaying(false);
            setMultiplayerOpen(true);
          }}
        />
      )}

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
      <MultiplayerDialog
        open={multiplayerOpen}
        onOpenChange={setMultiplayerOpen}
        onMpStateChange={(state) => {
          setMpPlaying(state === 'playing');
          if (state === 'playing') setMultiplayerOpen(false);
          if (state === 'lobby' || state === 'result') setMultiplayerOpen(true);
        }}
        onOpponentData={setOpponentData}
        socketRef={mpSocketRef}
      />
      <HintDialog open={hintOpen} onOpenChange={setHintOpen} />
      <PauseDialog open={pauseOpen} onOpenChange={setPauseOpen} />
      <GameOverDialog open={gameOverOpen} onOpenChange={setGameOverOpen} />

      <Toaster position="top-center" closeButton richColors />
    </>
  );
}
