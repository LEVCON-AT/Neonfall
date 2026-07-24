'use client';

/**
 * The #second-bar with HOLD / NEXT preview boxes.
 *
 * The IDs (`hold-box`, `hold-canvas`, `next-box`, `next-canvas`) and the
 * `disabled` class on the hold-box are required by the game IIFE — it draws
 * the next piece preview onto the canvases and toggles the hold-box disabled
 * state. Do NOT change them.
 */
export function HoldNextBar() {
  return (
    <div id="second-bar">
      <div id="hold-box" className="mini-box glass disabled">
        <h3>HOLD</h3>
        <canvas id="hold-canvas" width="46" height="46"></canvas>
      </div>
      <div id="next-box" className="mini-box glass">
        <h3>NEXT</h3>
        <canvas id="next-canvas" width="46" height="46"></canvas>
      </div>
    </div>
  );
}
