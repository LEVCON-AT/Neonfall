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
  onMpStateChange?: (state: MPState) => void;
  onOpponentData?: (data: { name: string; board: number[][] | null }) => void;
  /** S8.24.3: Shared socket ref — Dialog writes to it, NeonfallApp reads from it */
  socketRef?: React.MutableRefObject<Socket | null>;
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
export function MultiplayerDialog({ open, onOpenChange, onMpStateChange, onOpponentData, socketRef: sharedSocketRef }: MultiplayerDialogProps) {
  // S8.24.3a: Socket is owned by NeonfallApp (sharedSocketRef).
  // This dialog only uses it for lobby/waiting/result actions.
  const [mpState, setMpState] = useState<MPState>('lobby');
  const [roomCode, setRoomCode] = useState('');
  const [joinInput, setJoinInput] = useState('');
  const [opponentName, setOpponentName] = useState('');
  const [result, setResult] = useState<MPResult>(null);
  const [opponentBoard, setOpponentBoard] = useState<number[][] | null>(null);
  const [copied, setCopied] = useState(false);
  const opponentCanvasRef = useRef<HTMLCanvasElement>(null);

  // S7.4: mpStateRef tracks the current MP state for socket event guards.
  //   Socket events fire asynchronously and may arrive after the user has
  //   already left the 'playing' state (e.g. clicked "Aufgeben" or closed
  //   the dialog). Without this ref, stale events would corrupt the UI.
  const mpStateRef = useRef<MPState>('lobby');
  const updateMpState = useCallback((next: MPState) => {
    mpStateRef.current = next;
    setMpState(next);
    onMpStateChange?.(next);
  }, [onMpStateChange]);

  // S8.24.3a: Socket is now created and owned by NeonfallApp (sharedSocketRef).
  //   This dialog only registers lobby/waiting/result event handlers.
  //   Previously the socket was created here — but when dialog closes
  //   (open=false), cleanup disconnected it → no events during playing.
  useEffect(() => {
    if (!open) return;

    // S8.24.3a-fix: Wait for socket to be ready (NeonfallApp creates it
    //   asynchronously in its own useEffect). Retry up to 10 times with
    //   100ms delay = 1 second max wait.
    let attempts = 0;
    let timer: ReturnType<typeof setTimeout>;

    const tryConnect = () => {
      const sock = sharedSocketRef?.current;
      if (sock) {
        setupListeners(sock);
        return;
      }
      attempts++;
      if (attempts < 10) {
        timer = setTimeout(tryConnect, 100);
      } else {
        toast.error('Nicht verbunden', { description: 'Multiplayer-Service nicht erreichbar.' });
        updateMpState('lobby');
      }
    };

    const setupListeners = (sock: Socket) => {

    // S7.7: Connection error handling
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
      onOpponentData?.({ name: data.playerName, board: null });
      updateMpState('playing');
      try { window.__nfRestart?.(); } catch {}
    });

    // S8.24.3a: opponent:garbage, opponent:board, opponent:win,
    //   opponent:left, opponent:restart are now handled in NeonfallApp
    //   (they need to stay active after the dialog closes).

    sock.on('error', (msg: string) => {
      toast.error('Multiplayer-Fehler', { description: msg });
      updateMpState('lobby');
    });
    }; // end setupListeners

    tryConnect();

    return () => {
      if (timer) clearTimeout(timer);
      const sock = sharedSocketRef?.current;
      if (sock) {
        sock.off('connect_error');
        sock.off('connect_timeout');
        sock.off('opponent:joined');
        sock.off('error');
      }
      mpStateRef.current = 'lobby';
    };
  }, [open, updateMpState, sharedSocketRef]);

  // S8.24.3a: All playing-phase effects (garbage-send, board-send,
  // game-over, opponent event listeners) moved to NeonfallApp. The dialog
  // closes when playing starts — these effects would be cleaned up.

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
    const sock = sharedSocketRef?.current;
    if (!sock) {
      toast.error('Nicht verbunden', { description: 'Multiplayer-Service noch nicht bereit.' });
      return;
    }
    sock.emit('room:create', { playerName: name }, (res: { ok: boolean; roomId?: string; error?: string }) => {
      if (res.ok && res.roomId) {
        setRoomCode(res.roomId);
        updateMpState('waiting');
      } else {
        toast.error('Fehler beim Erstellen', { description: res.error || 'Unbekannter Fehler.' });
      }
    });
  }, [updateMpState, sharedSocketRef]);

  const handleJoinRoom = useCallback(() => {
    const code = joinInput.trim().toUpperCase();
    if (code.length !== 4 || !/^[A-Z]{4}$/.test(code)) {
      toast.error('Ungültiger Code', { description: '4 Buchstaben (A-Z) erforderlich.' });
      return;
    }
    const name = localStorage.getItem('neonfall_player_name') || 'Player';
    sharedSocketRef?.current?.emit('room:join', { roomId: code, playerName: name }, (res: { ok: boolean; roomId?: string; error?: string }) => {
      if (res.ok && res.roomId) {
        setRoomCode(res.roomId);
        // S8.24.3a-fix: Don't go to 'playing' yet. The backend will send
        //   opponent:joined with the host's name. That event handler calls
        //   updateMpState('playing'). If we set 'playing' here, the dialog
        //   closes and the opponent:joined listener is cleaned up before
        //   the event arrives → joiner never gets the host's name.
        //   Just set roomCode and wait for opponent:joined.
      } else {
        toast.error('Beitreten fehlgeschlagen', { description: res.error || 'Unbekannter Fehler.' });
      }
    });
  }, [joinInput, updateMpState, sharedSocketRef]);

  const handleLeave = useCallback(() => {
    sharedSocketRef?.current?.emit('room:leave');
    updateMpState('lobby');
    setRoomCode('');
    setOpponentName('');
    setResult(null);
  }, [updateMpState, sharedSocketRef]);

  const handleRevanche = useCallback(() => {
    sharedSocketRef?.current?.emit('game:restart');
    try { window.__nfRestart?.(); } catch {}
    updateMpState('playing');
    setResult(null);
  }, [updateMpState, sharedSocketRef]);

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
            <Users size={16} aria-hidden="true" className="nf-dialog-title-icon" style={{ color: '#22d3ee' }} />
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
                className="nf-action-btn nf-action-btn-primary nf-action-btn-single"
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
                  className="nf-action-btn nf-action-btn-primary nf-action-btn-single"
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
