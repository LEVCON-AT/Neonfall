'use client';

import { Trophy, Zap, BarChart3, Hash } from 'lucide-react';

/**
 * The #top-bar with SCORE / BEST / LEVEL / LINES stat boxes.
 *
 * The numeric <p> elements keep their exact IDs (`score`, `best-score`,
 * `level`, `lines`) because the game IIFE writes to them directly via
 * `document.getElementById`. Do NOT rename or remove them.
 *
 * The tiny lucide icons inside the <h3> labels are pure decoration — they
 * don't affect the IIFE which only ever reads the <p> text content.
 */
export function TopBar() {
  return (
    <div id="top-bar" className="glass">
      <div className="stat-box">
        <h3>
          <Hash size={9} aria-hidden="true" className="nf-stat-icon" />
          SCORE
        </h3>
        <p id="score">0</p>
      </div>
      <div className="stat-box">
        <h3>
          <Trophy size={9} aria-hidden="true" className="nf-stat-icon" />
          BEST
        </h3>
        <p id="best-score">0</p>
      </div>
      <div className="stat-box">
        <h3>
          <BarChart3 size={9} aria-hidden="true" className="nf-stat-icon" />
          LEVEL
        </h3>
        <p id="level">1</p>
      </div>
      <div className="stat-box">
        <h3>
          <Zap size={9} aria-hidden="true" className="nf-stat-icon" />
          LINES
        </h3>
        <p id="lines">0</p>
      </div>
    </div>
  );
}
