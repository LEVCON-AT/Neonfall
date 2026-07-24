'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Copy, Check, Loader2, LogOut, RotateCcw, Trophy, Sword } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { io, Socket } from 'socket.io-client';

interface MultiplayerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type MPState = 'lobby' | 'waiting' | 'playing' | 'result';
type MPResult = 'win' | 'lose' | null;

/**
 * Multiplayer 1v1 dialog.
 *
 * States:
 *  - lobby:   create or join a room (4-char code A-Z)
 *  - waiting: room created, waiting for opponent to join
 *  - playing: match in progress, opponent board preview shown
 *  - result:  win/lose screen with revanche button
 *
 * Connects to the socket.io mini-service on port 3004 via the Caddy gateway
 * (path "/", XTransformPort=3004 query param). Garbage lines are exchanged
 * via the IIFE hooks (__nfAddGarbage / __nfGetBoard / __nfRestart) and the
 * nf-lines-cleared CustomEvent.
 */
export function MultiplayerDialog({ open, onOpenChange }: MultiplayerDialogProps) {
  const [mpState, setMpState] = useState<MPState>('lobby');
  const [roomCode, setRoomCode] = useState('');
  const [joinInput, setJoinInput] = useState('');
  const [opponentName, setOpponentName] = useState('');
  const [result, setResult] = useState<MPResult>(null);
  const [opponentBoard, setOpponentBoard] = useState<number[][] | null>(null);
  const [copied, setCopied] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const opponentCanvasRef = useRef<HTMLCanvasElement>(null);

  // S7.4: mpStateRef tracks the current MP state for socket event guards.
  //   Socket events fire asynchronously and may arrive after the user has
  //   already left the 'playing' state (e.g. clicked "Aufgeben" or closed
  //   the dialog). Without this ref, stale events would corrupt the UI.
  const mpStateRef = useRef<MPState>('lobby');
  const updateMpState = useCallback((next: MPState) => {
    mpStateRef.current = next;
    setMpState(next);
  }, []);

  // Connect to socket.io when dialog opens, disconnect on close.
  useEffect(() => {
    if (!open) return;
    const sock = io('/?XTransformPort=3004', {
      transports: ['websocket', 'polling'],
      timeout: 5000,
      reconnection: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 1000,
    });
    socketRef.current = sock;

    // S7.7: Connection error handling — show toast if socket can't connect.
    sock.on('connect_error', (err: Error) => {
      toast.error('Verbindung fehlgeschlagen', {
        description: 'Multiplayer-Service nicht erreichbar. Bitte später erneut versuchen.',
      });
      updateMpState('lobby');
    });

    sock.on('connect_timeout', () => {
      toast.error('Zeitüberschreitung', {
        description: 'Multiplayer-Service nicht erreichbar.',
      });
      updateMpState('lobby');
    });

    sock.on('opponent:joined', (data: { playerName: string }) => {
      setOpponentName(data.playerName);
      updateMpState('playing');
      try { window.__nfRestart?.(); } catch {}
    });

    sock.on('opponent:garbage', (data: { count: number }) => {
      // S7.4: Only apply garbage if we're actually playing.
      if (mpStateRef.current !== 'playing') return;
      try { window.__nfAddGarbage?.(data.count); } catch {}
    });

    sock.on('opponent:board', (data: { board: number[][] }) => {
      // S7.4: Only update board preview if we're still playing.
      if (mpStateRef.current !== 'playing') return;
      setOpponentBoard(data.board);
    });

    sock.on('opponent:win', () => {
      // S7.4: Only process win if we're still playing.
      if (mpStateRef.current !== 'playing') return;
      setResult('win');
      updateMpState('result');
    });

    sock.on('opponent:left', () => {
      // S7.4: Only show "left" toast if we were in an active match.
      if (mpStateRef.current === 'lobby') return;
      toast.error('Gegner hat verlassen', { description: 'Das Match wurde abgebrochen.' });
      updateMpState('lobby');
      setRoomCode('');
      setOpponentName('');
    });

    sock.on('opponent:restart', () => {
      // S7.4: Only restart if we're in result state (waiting for revanche).
      if (mpStateRef.current !== 'result') return;
      try { window.__nfRestart?.(); } catch {}
      updateMpState('playing');
      setResult(null);
    });

    sock.on('error', (msg: string) => {
      toast.error('Multiplayer-Fehler', { description: msg });
      updateMpState('lobby');
    });

    return () => {
      sock.disconnect();
      socketRef.current = null;
      // S7.4: Reset state ref on cleanup so stale events are ignored.
      mpStateRef.current = 'lobby';
    };
  }, [open, updateMpState]);

  // Listen for line clears → send garbage to opponent.
  useEffect(() => {
    if (mpState !== 'playing') return;
    const onLines = (e: Event) => {
      const ev = e as CustomEvent<{ cleared?: number }>;
      const cleared = ev.detail?.cleared ?? 0;
      if (cleared < 1) return;
      // Backend converts cleared lines to garbage via linesToGarbage().
      // It ignores singles (cleared < 2), so we just forward the raw count.
      socketRef.current?.emit('game:lines', { cleared });
    };
    window.addEventListener('nf-lines-cleared', onLines as EventListener);
    return () => window.removeEventListener('nf-lines-cleared', onLines as EventListener);
  }, [mpState]);

  // Listen for board updates → send board to opponent (throttled).
  useEffect(() => {
    if (mpState !== 'playing') return;
    let lastSend = 0;
    const onBoardUpdate = () => {
      const now = Date.now();
      if (now - lastSend < 100) return; // throttle to 10fps
      lastSend = now;
      try {
        const board = window.__nfGetBoard?.();
        if (board) socketRef.current?.emit('game:board', { board });
      } catch {}
    };
    window.addEventListener('nf-board-updated', onBoardUpdate);
    return () => window.removeEventListener('nf-board-updated', onBoardUpdate);
  }, [mpState]);

  // Listen for our own game-over → notify opponent.
  useEffect(() => {
    if (mpState !== 'playing') return;
    const goEl = document.getElementById('game-over-screen');
    if (!goEl) return;
    const observer = new MutationObserver(() => {
      if (goEl.classList.contains('visible')) {
        socketRef.current?.emit('game:over');
        updateMpState('result');
      }
    });
    observer.observe(goEl, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, [mpState]);

  // Render opponent board preview on canvas.
  useEffect(() => {
    if (!opponentBoard || !opponentCanvasRef.current) return;
    const canvas = opponentCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const cols = 12, rows = 20;
    const bs = Math.min(canvas.width / cols, canvas.height / rows);
    ctx.fillStyle = '#08080f';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    opponentBoard.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value !== 0) {
          const color = value === 9 ? '#4a4a6a' : '#22d3ee';
          ctx.fillStyle = color;
          ctx.fillRect(x * bs, y * bs, bs - 1, bs - 1);
        }
      });
    });
  }, [opponentBoard]);

  const handleCreateRoom = useCallback(() => {
    const name = localStorage.getItem('neonfall_player_name') || 'Player';
    if (!socketRef.current) {
      toast.error('Nicht verbunden', { description: 'Multiplayer-Service noch nicht bereit. Bitte erneut versuchen.' });
      return;
    }
    socketRef.current.emit('room:create', { playerName: name }, (res: { ok: boolean; roomId?: string; error?: string }) => {
      if (res.ok && res.roomId) {
        setRoomCode(res.roomId);
        updateMpState('waiting');
      } else {
        toast.error('Fehler beim Erstellen', { description: res.error || 'Unbekannter Fehler.' });
      }
    });
  }, []);

  const handleJoinRoom = useCallback(() => {
    const code = joinInput.trim().toUpperCase();
    if (code.length !== 4 || !/^[A-Z]{4}$/.test(code)) {
      toast.error('Ungültiger Code', { description: '4 Buchstaben (A-Z) erforderlich.' });
      return;
    }
    const name = localStorage.getItem('neonfall_player_name') || 'Player';
    socketRef.current?.emit('room:join', { roomId: code, playerName: name }, (res: { ok: boolean; roomId?: string; error?: string }) => {
      if (res.ok && res.roomId) {
        setRoomCode(res.roomId);
        updateMpState('playing');
        try { window.__nfRestart?.(); } catch {}
      } else {
        toast.error('Beitreten fehlgeschlagen', { description: res.error || 'Unbekannter Fehler.' });
      }
    });
  }, [joinInput]);

  const handleLeave = useCallback(() => {
    socketRef.current?.emit('room:leave');
    updateMpState('lobby');
    setRoomCode('');
    setOpponentName('');
    setResult(null);
  }, []);

  const handleRevanche = useCallback(() => {
    socketRef.current?.emit('game:restart');
    try { window.__nfRestart?.(); } catch {}
    updateMpState('playing');
    setResult(null);
  }, []);

  const handleCopyCode = useCallback(() => {
    navigator.clipboard.writeText(roomCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [roomCode]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="nf-dialog-neon nf-mp-dialog">
        <DialogHeader>
          <DialogTitle className="nf-dialog-title">
            <Users size={16} aria-hidden="true" className="nf-dialog-title-icon nf-dialog-title-icon-pink" />
            Multiplayer
          </DialogTitle>
          <DialogDescription className="nf-dialog-desc">
            Fordere einen Freund heraus — 1 gegen 1.
          </DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {/* ===== LOBBY ===== */}
          {mpState === 'lobby' && (
            <motion.div
              key="lobby"
              className="nf-mp-content"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
            >
              <Button
                type="button"
                onClick={handleCreateRoom}
                className="nf-mp-create-btn"
                size="lg"
              >
                <Sword size={16} aria-hidden="true" />
                Raum erstellen
              </Button>
              <div className="nf-mp-divider"><span>oder</span></div>
              <div className="nf-mp-join">
                <Input
                  type="text"
                  value={joinInput}
                  onChange={(e) => setJoinInput(e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4))}
                  placeholder="CODE"
                  className="nf-mp-code-input"
                  maxLength={4}
                  aria-label="Raum-Code"
                />
                <Button
                  type="button"
                  onClick={handleJoinRoom}
                  disabled={joinInput.length !== 4}
                  size="default"
                >
                  Beitreten
                </Button>
              </div>
            </motion.div>
          )}

          {/* ===== WAITING ===== */}
          {mpState === 'waiting' && (
            <motion.div
              key="waiting"
              className="nf-mp-content nf-mp-waiting"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
            >
              <Loader2 size={24} className="animate-spin nf-mp-spinner" aria-hidden="true" />
              <div className="nf-mp-waiting-label">Warte auf Gegner…</div>
              <div className="nf-mp-room-code">{roomCode}</div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleCopyCode}
                className="nf-mp-copy-btn"
              >
                {copied ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
                {copied ? 'Kopiert!' : 'Code kopieren'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleLeave}
                className="nf-mp-leave-btn"
              >
                <LogOut size={14} aria-hidden="true" />
                Verlassen
              </Button>
            </motion.div>
          )}

          {/* ===== PLAYING ===== */}
          {mpState === 'playing' && (
            <motion.div
              key="playing"
              className="nf-mp-content nf-mp-playing"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
            >
              <div className="nf-mp-vs">
                <span className="nf-mp-vs-label">GEGNER</span>
                <span className="nf-mp-vs-name">{opponentName || '?'}</span>
              </div>
              <canvas
                ref={opponentCanvasRef}
                width={120}
                height={200}
                className="nf-mp-opponent-canvas"
                aria-label="Gegner Spielfeld"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleLeave}
                className="nf-mp-leave-btn"
              >
                <LogOut size={14} aria-hidden="true" />
                Aufgeben
              </Button>
            </motion.div>
          )}

          {/* ===== RESULT ===== */}
          {mpState === 'result' && (
            <motion.div
              key="result"
              className="nf-mp-content nf-mp-result"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <div className={`nf-mp-result-icon ${result === 'win' ? 'nf-mp-win' : 'nf-mp-lose'}`}>
                {result === 'win' ? <Trophy size={48} aria-hidden="true" /> : <Sword size={48} aria-hidden="true" />}
              </div>
              <div className="nf-mp-result-text">
                {result === 'win' ? 'GEWONNEN!' : 'VERLOREN'}
              </div>
              <div className="nf-mp-result-sub">
                {result === 'win' ? 'Dein Gegner hat aufgegeben.' : 'Dein Feld ist voll.'}
              </div>
              <div className="nf-mp-result-actions">
                <Button type="button" onClick={handleRevanche} size="sm" className="nf-mp-revanche-btn">
                  <RotateCcw size={14} aria-hidden="true" />
                  Revanche
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={handleLeave}>
                  Verlassen
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
