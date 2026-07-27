'use client';

export function HoldNextBar() {
  return (
    <div id="second-bar">
      <div id="hold-box" className="mini-box glass disabled">
        <h3>HOLD</h3>
        <canvas id="hold-canvas" width="46" height="46"></canvas>
      </div>
      <div id="next-box" className="mini-box glass">
        <h3>NEXT</h3>
        <canvas id="next-canvas" width="120" height="46"></canvas>
      </div>
    </div>
  );
}
