'use client';

import { useEffect, useRef } from 'react';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface OpponentPanelProps {
  opponentName: string;
  opponentBoard: number[][] | null;
  onLeave: () => void;
}

/**
 * S8.24.1: OpponentPanel — zeigt das gegnerische Spielfeld live neben dem
 * eigenen. Kein Dialog/Overlay, sondern ein normales DOM-Element das im
 * Flex-Layout neben dem GameCanvas platziert wird.
 *
 * Das Canvas rendert das gegnerische Board (12×24 Grid, 8px pro Zelle).
 * Die Farben kommen aus dem board-Array (jeder Wert ist eine Color-Hex
 * oder 0 für leer, 9 für garbage).
 */
export function OpponentPanel({ opponentName, opponentBoard, onLeave }: OpponentPanelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !opponentBoard) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const COLS = 12;
    const ROWS = 24;
    const blockSize = canvas.width / COLS;

    // Background
    ctx.fillStyle = '#08080f';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw board
    for (let y = 0; y < opponentBoard.length && y < ROWS; y++) {
      for (let x = 0; x < opponentBoard[y].length && x < COLS; x++) {
        const val = opponentBoard[y][x];
        if (val === 0) continue;
        const px = x * blockSize;
        const py = y * blockSize;
        const color = val === 9 ? '#4a4a6a' : String(val);
        ctx.fillStyle = color;
        ctx.fillRect(px, py, blockSize - 1, blockSize - 1);
      }
    }
  }, [opponentBoard]);

  return (
    <div id="nf-opponent-panel" className="nf-opponent-panel">
      <div className="nf-opponent-header">
        <span className="nf-opponent-label">GEGNER</span>
        <span className="nf-opponent-name">{opponentName || '?'}</span>
      </div>
      <canvas
        ref={canvasRef}
        width={96}
        height={192}
        className="nf-opponent-canvas"
        aria-label="Gegner Spielfeld"
      />
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onLeave}
        className="nf-opponent-leave-btn"
      >
        <LogOut size={12} aria-hidden="true" />
        Aufgeben
      </Button>
    </div>
  );
}
