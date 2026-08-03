'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { LogOut, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface OpponentPanelProps {
  opponentName: string;
  opponentBoard: number[][] | null;
  onLeave: () => void;
}

/**
 * S8.24.1: OpponentPanel — zeigt das gegnerische Spielfeld live.
 * S8.24.3b: Drag-and-Drop — Panel kann verschoben werden.
 *   position:fixed mit veränderbarem top/left.
 *   Touch + Mouse Support. Position in localStorage gespeichert.
 *   Dezentes Grip-Symbol erscheint beim Drag-Versuch.
 */
export function OpponentPanel({ opponentName, opponentBoard, onLeave }: OpponentPanelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showGrip, setShowGrip] = useState(false);
  const dragStart = useRef<{ x: number; y: number; left: number; top: number } | null>(null);

  // Load saved position from localStorage
  const [position, setPosition] = useState<{ left: number | null; top: number | null }>(() => {
    try {
      const saved = localStorage.getItem('nf_opponent_pos');
      if (saved) return JSON.parse(saved);
    } catch {}
    return { left: null, top: null };
  });

  // Draw opponent board
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !opponentBoard) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const COLS = 12;
    const ROWS = 24;
    const blockSize = canvas.width / COLS;

    ctx.fillStyle = '#08080f';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

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

  // Drag handlers
  const handleDragStart = useCallback((clientX: number, clientY: number) => {
    const panel = panelRef.current;
    if (!panel) return;
    const rect = panel.getBoundingClientRect();
    dragStart.current = {
      x: clientX,
      y: clientY,
      left: rect.left,
      top: rect.top,
    };
    setIsDragging(true);
  }, []);

  const handleDragMove = useCallback((clientX: number, clientY: number) => {
    if (!dragStart.current) return;
    const dx = clientX - dragStart.current.x;
    const dy = clientY - dragStart.current.y;
    const newLeft = Math.max(0, Math.min(window.innerWidth - 100, dragStart.current.left + dx));
    const newTop = Math.max(0, Math.min(window.innerHeight - 100, dragStart.current.top + dy));
    setPosition({ left: newLeft, top: newTop });
  }, []);

  const handleDragEnd = useCallback(() => {
    if (!isDragging) return;
    dragStart.current = null;
    setIsDragging(false);
    // Save position
    try {
      localStorage.setItem('nf_opponent_pos', JSON.stringify(position));
    } catch {}
  }, [isDragging, position]);

  // Mouse events
  useEffect(() => {
    if (!isDragging) return;
    const onMouseMove = (e: MouseEvent) => handleDragMove(e.clientX, e.clientY);
    const onMouseUp = () => handleDragEnd();
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
  }, [isDragging, handleDragMove, handleDragEnd]);

  // Touch events
  useEffect(() => {
    if (!isDragging) return;
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches[0]) handleDragMove(e.touches[0].clientX, e.touches[0].clientY);
    };
    const onTouchEnd = () => handleDragEnd();
    document.addEventListener('touchmove', onTouchMove, { passive: true });
    document.addEventListener('touchend', onTouchEnd);
    return () => {
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', onTouchEnd);
    };
  }, [isDragging, handleDragMove, handleDragEnd]);

  const panelStyle: React.CSSProperties = {
    position: 'fixed',
    zIndex: 25,
  };
  if (position.left !== null) panelStyle.left = position.left;
  if (position.top !== null) panelStyle.top = position.top;
  // Default position (when no saved position): right side, vertically centered
  if (position.left === null) panelStyle.right = 'max(8px, env(safe-area-inset-right))';
  if (position.top === null) {
    panelStyle.top = '50%';
    panelStyle.transform = 'translateY(-50%)';
  }

  return (
    <div
      ref={panelRef}
      className="nf-opponent-panel"
      style={panelStyle}
      onMouseEnter={() => setShowGrip(true)}
      onMouseLeave={() => setShowGrip(false)}
    >
      {/* Drag handle */}
      <div
        className="nf-opponent-drag-handle"
        style={{ opacity: showGrip || isDragging ? 1 : 0 }}
        onMouseDown={(e) => { e.preventDefault(); handleDragStart(e.clientX, e.clientY); }}
        onTouchStart={(e) => { if (e.touches[0]) handleDragStart(e.touches[0].clientX, e.touches[0].clientY); }}
      >
        <GripVertical size={14} aria-hidden="true" />
      </div>

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
