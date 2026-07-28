'use client';

export function HoldNextBar() {
  return (
    <div id="second-bar">
      <div id="hold-box" className="mini-box glass disabled">
        <h3>HOLD</h3>
        <canvas id="hold-canvas" width="46" height="46"></canvas>
      </div>
      <div id="next-box" className="mini-box glass" title="Klicken: Vorschau-Anzahl ändern (3 → 2 → 1)">
        <h3>NEXT</h3>
        {/* S8.17: Canvas enlarged 120->160 wide / 46->52 tall for a more
            professional 3-slot layout with subtle slot separators. */}
        <canvas id="next-canvas" width="160" height="52"></canvas>
      </div>
    </div>
  );
}
