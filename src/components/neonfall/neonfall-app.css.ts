export const NEONFALL_APP_CSS = `
/* Inline icons in stat-box headers */
.stat-box h3 { display: flex; align-items: center; justify-content: center; gap: 3px; }
.nf-stat-icon { opacity: 0.55; flex-shrink: 0; }

/* Gradient border accent on the top-bar (cyan → purple → pink) */
#top-bar { position: relative; }
#top-bar::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 1px;
  background: linear-gradient(90deg, rgba(34,211,238,0.5), rgba(167,139,250,0.5), rgba(244,114,182,0.5));
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
          mask-composite: exclude;
  pointer-events: none;
  opacity: 0.7;
}

/* Sprint 1: The IIFE's #settings-panel duplicates the Settings-Dialog's
   rattle/impact sliders. We hide it via CSS (display:none) instead of removing
   the DOM nodes, because the IIFE calls getElementById('rattle-slider') and
   attaches an input listener at init — removing the node would crash the
   IIFE. The hidden sliders stay functional and are driven by the
   Settings-Dialog via the syncGameSlider() helper. */
#settings-panel { display: none !important; }

/* ===== Sprint 3: GPU & Game-Feel Optimizations =====
   These rules layer ON TOP of the IIFE's GAME_CSS to promote expensive
   elements onto their own GPU composite layers. The IIFE's own CSS stays
   byte-identical; we only add hints the browser uses for layer promotion.

   - body::before/::after: 60vmax blurred radial gradients animated via
     the drift 16s keyframes. Without will-change the browser re-rasterizes
     the blur on every composite. With will-change: transform it caches the layer.
   - #game-container: shaken via shakeScreen() which writes transform on
     every frame. will-change: transform reserves the layer up-front so the
     shake doesn't trigger a re-raster.
   - #flash-overlay: opacity animated by flash(). will-change: opacity.
   - #combo-popup: transform/opacity animated by comboPop keyframes.
   - #tetris-canvas: re-drawn every frame by the IIFE's draw(). Promoting
     it onto its own layer avoids compositing it with the container's
     background gradient on every frame.
   - .glass elements (top-bar, second-bar, mini-boxes): backdrop-filter is
     expensive; will-change keeps the blur cached. */
body::before, body::after { will-change: transform; }
#game-container { will-change: transform; }
#flash-overlay { will-change: opacity; }
#combo-popup { will-change: transform, opacity; }
#tetris-canvas { will-change: transform; }
.glass { will-change: backdrop-filter; }

/* Backdrop-filter on .glass is expensive when the underlying content
   changes (e.g. canvas redraw behind top-bar). Since the top-bar/second-bar
   are above the canvas and don't need to blur it (they're opaque-ish
   already), we can reduce the blur radius slightly without visual change.
   Original: blur(18px) saturate(160%) → blur(12px) saturate(150%).
   !important needed because the IIFE's .glass rule has equal specificity
   and is loaded first. */
.glass { backdrop-filter: blur(12px) saturate(150%) !important; -webkit-backdrop-filter: blur(12px) saturate(150%) !important; }

/* The body::before/::after drift animation runs continuously even during
   gameplay, causing constant composite work. Pause the animation while a
   game is actively running (body gets .nf-playing class via NeonfallApp's
   status sync) to save GPU cycles for the game canvas. The blobs freeze
   in place — visually identical during fast play. */
body.nf-playing::before,
body.nf-playing::after { animation-play-state: paused !important; }

/* Inline trophy in the new-highscore badge */
.nf-trophy-inline { vertical-align: -3px; color: #fbbf24; }

/* ===== Sprint 3: Game-Feel — stat-box pulse on value increase =====
   When the IIFE updates #score/#level/#lines/#best-score, the MutationObserver
   in Effect C adds .nf-stat-pulse to that <p> element. The animation flashes
   a cyan glow + subtle scale-up, then fades. GPU-friendly (transform+opacity
   +filter only). 600ms total, doesn't interfere with the IIFE's own stat
   rendering (it only writes textContent). */
.stat-box p.nf-stat-pulse {
  animation: nfStatPulse 0.6s ease-out;
}
@keyframes nfStatPulse {
  0% {
    transform: scale(1);
    filter: drop-shadow(0 0 0 rgba(34,211,238,0));
  }
  20% {
    transform: scale(1.08);
    filter: drop-shadow(0 0 8px rgba(34,211,238,0.7));
  }
  100% {
    transform: scale(1);
    filter: drop-shadow(0 0 0 rgba(34,211,238,0));
  }
}
/* Color-code the pulse by stat type for instant readability */
#score.nf-stat-pulse { animation-name: nfStatPulseCyan; }
#best-score.nf-stat-pulse { animation-name: nfStatPulseGold; }
#level.nf-stat-pulse { animation-name: nfStatPulsePurple; }
#lines.nf-stat-pulse { animation-name: nfStatPulsePink; }
@keyframes nfStatPulseCyan {
  0% { transform: scale(1); filter: drop-shadow(0 0 0 rgba(34,211,238,0)); }
  20% { transform: scale(1.08); filter: drop-shadow(0 0 8px rgba(34,211,238,0.7)); }
  100% { transform: scale(1); filter: drop-shadow(0 0 0 rgba(34,211,238,0)); }
}
@keyframes nfStatPulseGold {
  0% { transform: scale(1); filter: drop-shadow(0 0 0 rgba(251,191,36,0)); }
  20% { transform: scale(1.1); filter: drop-shadow(0 0 10px rgba(251,191,36,0.8)); }
  100% { transform: scale(1); filter: drop-shadow(0 0 0 rgba(251,191,36,0)); }
}
@keyframes nfStatPulsePurple {
  0% { transform: scale(1); filter: drop-shadow(0 0 0 rgba(167,139,250,0)); }
  20% { transform: scale(1.08); filter: drop-shadow(0 0 8px rgba(167,139,250,0.7)); }
  100% { transform: scale(1); filter: drop-shadow(0 0 0 rgba(167,139,250,0)); }
}
@keyframes nfStatPulsePink {
  0% { transform: scale(1); filter: drop-shadow(0 0 0 rgba(244,114,182,0)); }
  20% { transform: scale(1.08); filter: drop-shadow(0 0 8px rgba(244,114,182,0.7)); }
  100% { transform: scale(1); filter: drop-shadow(0 0 0 rgba(244,114,182,0)); }
}

/* ===== Sprint 5b: Name-Input Dialog (post-game-over score submission) ===== */
.nf-name-input-dialog { max-width: 380px !important; }
.nf-name-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  margin: 4px 0 12px;
}
.nf-name-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 6px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 10px;
}
.nf-name-stat-label {
  font-size: 0.6em;
  letter-spacing: 1.5px;
  color: #9ca3ff;
  font-weight: 600;
  margin-bottom: 2px;
}
.nf-name-stat-value {
  font-family: 'JetBrains Mono', monospace;
  font-size: 1.05em;
  font-weight: 700;
  color: #e8e8f5;
}
.nf-name-stat-score {
  background: linear-gradient(90deg, #22d3ee, #f472b6);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  font-size: 1.2em;
}
.nf-name-stat-mode {
  font-size: 0.8em;
  color: #22d3ee;
  text-transform: uppercase;
  letter-spacing: 1px;
}
.nf-name-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.nf-name-input {
  background: rgba(255,255,255,0.05) !important;
  border: 1px solid rgba(34,211,238,0.3) !important;
  color: #e8e8f5 !important;
  font-family: 'Space Grotesk', sans-serif !important;
  font-size: 1em !important;
  height: 40px !important;
  border-radius: 10px !important;
}
.nf-name-input:focus {
  border-color: rgba(34,211,238,0.6) !important;
  box-shadow: 0 0 0 2px rgba(34,211,238,0.15) !important;
}
.nf-name-input::placeholder { color: #6b6b8a !important; }
.nf-name-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}
.nf-name-submit-btn {
  background: linear-gradient(90deg, rgba(34,211,238,0.2), rgba(167,139,250,0.2)) !important;
  border: 1px solid rgba(34,211,238,0.4) !important;
  color: #22d3ee !important;
  font-weight: 600;
}
.nf-name-submit-btn:hover:not(:disabled) {
  background: linear-gradient(90deg, rgba(34,211,238,0.3), rgba(167,139,250,0.3)) !important;
}
.nf-name-success {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px;
  color: #34d399;
  font-family: 'Space Grotesk', sans-serif;
  font-weight: 600;
}

/* ===== Sprint 5c: Multiplayer Dialog ===== */
.nf-mp-dialog { max-width: 380px !important; }
.nf-mp-content { display: flex; flex-direction: column; align-items: center; gap: 14px; padding: 8px 0; }
.nf-mp-create-btn {
  width: 100%;
  background: linear-gradient(90deg, rgba(244,114,182,0.2), rgba(167,139,250,0.2)) !important;
  border: 1px solid rgba(244,114,182,0.4) !important;
  color: #f472b6 !important;
  font-weight: 600;
  font-size: 1.05em !important;
  height: 48px !important;
  gap: 8px;
}
.nf-mp-create-btn:hover:not(:disabled) {
  background: linear-gradient(90deg, rgba(244,114,182,0.3), rgba(167,139,250,0.3)) !important;
}
.nf-mp-divider {
  width: 100%;
  text-align: center;
  color: #6b6b8a;
  font-size: 0.75em;
  position: relative;
  margin: 4px 0;
}
.nf-mp-divider::before, .nf-mp-divider::after {
  content: '';
  position: absolute;
  top: 50%;
  width: calc(50% - 24px);
  height: 1px;
  background: rgba(255,255,255,0.1);
}
.nf-mp-divider::before { left: 0; }
.nf-mp-divider::after { right: 0; }
.nf-mp-join { display: flex; gap: 8px; width: 100%; }
.nf-mp-code-input {
  flex: 1;
  text-align: center;
  font-family: 'JetBrains Mono', monospace !important;
  font-size: 1.3em !important;
  font-weight: 700 !important;
  letter-spacing: 4px;
  text-transform: uppercase;
  background: rgba(255,255,255,0.05) !important;
  border: 1px solid rgba(244,114,182,0.3) !important;
  color: #f472b6 !important;
  height: 48px !important;
  border-radius: 10px !important;
}
.nf-mp-code-input:focus {
  border-color: rgba(244,114,182,0.6) !important;
  box-shadow: 0 0 0 2px rgba(244,114,182,0.15) !important;
}
.nf-mp-code-input::placeholder { color: #4a4a6a !important; letter-spacing: 2px; }
.nf-mp-waiting { gap: 10px; }
.nf-mp-spinner { color: #f472b6; }
.nf-mp-waiting-label { color: #c7c7f0; font-size: 0.9em; }
.nf-mp-room-code {
  font-family: 'JetBrains Mono', monospace;
  font-size: 2.2em;
  font-weight: 700;
  letter-spacing: 8px;
  background: linear-gradient(90deg, #22d3ee, #a78bfa, #f472b6);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  padding: 8px 16px;
  border: 1px solid rgba(244,114,182,0.2);
  border-radius: 12px;
}
.nf-mp-copy-btn { color: #9ca3ff !important; gap: 6px; }
.nf-mp-leave-btn { color: #fb7185 !important; gap: 6px; margin-top: 4px; }
.nf-mp-playing { gap: 10px; }
.nf-mp-vs {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}
.nf-mp-vs-label { font-size: 0.6em; letter-spacing: 2px; color: #9ca3ff; }
.nf-mp-vs-name { font-family: 'Space Grotesk', sans-serif; font-weight: 700; color: #f472b6; font-size: 1.1em; }
.nf-mp-opponent-canvas {
  border: 1px solid rgba(244,114,182,0.2);
  border-radius: 8px;
  background: #08080f;
  /* Responsive: small on mobile, larger on desktop */
  width: 120px;
  height: 200px;
}
@media (min-width: 768px) {
  .nf-mp-dialog { max-width: 520px !important; }
  .nf-mp-opponent-canvas { width: 180px; height: 300px; }
  .nf-mp-playing { flex-direction: row; align-items: flex-start; gap: 20px; }
  .nf-mp-vs { margin-bottom: 8px; }
}
.nf-mp-result { gap: 8px; padding: 16px 0; }
.nf-mp-result-icon { display: flex; justify-content: center; margin-bottom: 4px; }
.nf-mp-win { color: #fbbf24; filter: drop-shadow(0 0 12px rgba(251,191,36,0.4)); }
.nf-mp-lose { color: #fb7185; filter: drop-shadow(0 0 12px rgba(251,113,133,0.3)); }
.nf-mp-result-text {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 1.6em;
  font-weight: 700;
  letter-spacing: 2px;
}
.nf-mp-win + .nf-mp-result-text { color: #fbbf24; }
.nf-mp-result-sub { color: #9ca3ff; font-size: 0.8em; }
.nf-mp-result-actions { display: flex; gap: 8px; margin-top: 8px; }
.nf-mp-revanche-btn {
  background: linear-gradient(90deg, rgba(34,211,238,0.2), rgba(244,114,182,0.2)) !important;
  border: 1px solid rgba(34,211,238,0.4) !important;
  color: #22d3ee !important;
  font-weight: 600;
  gap: 6px;
}

/* ===== Footer (fixed, glass, hidden during active play) ===== */
#nf-app-footer {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 30;
  height: 32px;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  pointer-events: none;
  padding-bottom: env(safe-area-inset-bottom, 0);
}
.nf-footer-inner {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 12px;
  height: 30px;
  border-radius: 14px 14px 0 0;
  background: rgba(10,10,20,0.62);
  backdrop-filter: blur(16px) saturate(160%);
  -webkit-backdrop-filter: blur(16px) saturate(160%);
  border: 1px solid rgba(255,255,255,0.1);
  border-bottom: none;
  box-shadow: 0 -6px 24px rgba(0,0,0,0.45);
  pointer-events: auto;
  font-family: 'Space Grotesk', sans-serif;
  font-size: 11px;
  color: #c7c7f0;
  max-width: calc(100vw - 12px);
}
.nf-footer-brand {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-weight: 700;
  letter-spacing: 1.5px;
  background: linear-gradient(90deg, #22d3ee, #a78bfa, #f472b6);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
.nf-footer-mode {
  padding: 2px 8px;
  border-radius: 8px;
  background: rgba(34,211,238,0.12);
  border: 1px solid rgba(34,211,238,0.3);
  color: #22d3ee;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 1px;
  text-transform: uppercase;
}
.nf-footer-mode[data-mode="sprint"] { background: rgba(244,114,182,0.12); border-color: rgba(244,114,182,0.3); color: #f472b6; }
.nf-footer-mode[data-mode="ultra"] { background: rgba(167,139,250,0.12); border-color: rgba(167,139,250,0.3); color: #a78bfa; }
.nf-footer-mode[data-mode="zen"] { background: rgba(52,211,153,0.12); border-color: rgba(52,211,153,0.3); color: #34d399; }
.nf-footer-actions { display: inline-flex; gap: 4px; margin-left: auto; }
.nf-footer-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 8px;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.08);
  color: #c7c7f0;
  cursor: pointer;
  transition: background .15s, color .15s, transform .1s, border-color .15s;
}
.nf-footer-btn:hover {
  background: rgba(34,211,238,0.15);
  color: #22d3ee;
  border-color: rgba(34,211,238,0.35);
}
.nf-footer-btn:active { transform: scale(0.92); }

/* ===== shadcn Dialog neon override ===== */
/* S5c: Dialog-Overlay (Backdrop) verstärkt — statt das Spielfeld nach links
   zu verschieben (scrollbar-gutter Effekt), überblenden wir es mit einem
   dunklen, stark geblurrten Overlay. Das Spielfeld bleibt an Ort und Stelle. */
[data-slot="dialog-overlay"] {
  background: rgba(6,6,14,0.78) !important;
  backdrop-filter: blur(14px) saturate(140%);
  -webkit-backdrop-filter: blur(14px) saturate(140%);
}
.nf-dialog-neon {
  background: rgba(14,14,26,0.96) !important;
  backdrop-filter: blur(20px) saturate(160%);
  -webkit-backdrop-filter: blur(20px) saturate(160%);
  border: 1px solid rgba(34,211,238,0.25) !important;
  box-shadow: 0 0 0 1px rgba(167,139,250,0.15), 0 24px 60px rgba(0,0,0,0.6), 0 0 40px rgba(34,211,238,0.1) !important;
  color: #e8e8f5 !important;
  border-radius: 18px !important;
  max-height: calc(100vh - 32px) !important;
  overflow-y: auto;
}
.nf-dialog-neon [data-slot="dialog-close"] { color: #9ca3ff; }
.nf-dialog-neon [data-slot="dialog-close"]:hover { color: #f472b6; }
.nf-dialog-title {
  background: linear-gradient(90deg, #22d3ee, #a78bfa, #f472b6);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent !important;
  font-family: 'Space Grotesk', sans-serif;
  letter-spacing: 1px;
  font-size: 1.1em;
}
/* S7.9: Dialog-Titel-Icon — statt inline style in jeder Komponente. */
.nf-dialog-title-icon {
  vertical-align: -3px;
  margin-right: 6px;
}
.nf-dialog-title-icon-pink { color: #f472b6; }
.nf-dialog-title-icon-gold { color: #fbbf24; }
.nf-dialog-desc { color: #9ca3ff !important; font-size: 0.85em; }

/* Settings tabs */
.nf-settings-tabs { width: 100%; }
.nf-settings-tabslist {
  background: rgba(255,255,255,0.05) !important;
  border: 1px solid rgba(255,255,255,0.08);
  width: 100%;
  height: auto;
  flex-wrap: wrap;
  gap: 2px;
  padding: 3px;
}
.nf-settings-tabslist [data-slot="tabs-trigger"] {
  color: #9ca3ff;
  font-size: 0.78em;
  height: 32px;
  border-radius: 8px;
}
.nf-settings-tabslist [data-slot="tabs-trigger"]:hover { color: #c7c7f0; }
.nf-settings-tabslist [data-slot="tabs-trigger"][data-state="active"] {
  background: rgba(34,211,238,0.15) !important;
  color: #22d3ee !important;
}
.nf-tab-content {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 8px 2px;
  max-height: 42vh;
  overflow-y: auto;
}
.nf-tab-content::-webkit-scrollbar { width: 6px; }
.nf-tab-content::-webkit-scrollbar-thumb { background: rgba(34,211,238,0.3); border-radius: 3px; }
.nf-setting-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 10px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 10px;
}
.nf-setting-label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #c7c7f0;
  font-size: 0.85em;
  font-family: 'Space Grotesk', sans-serif;
}
.nf-setting-control {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 140px;
  flex: 1;
  justify-content: flex-end;
}
.nf-setting-control [data-slot="slider"] { max-width: 140px; }
.nf-setting-control [data-slot="slider"] [data-slot="slider-track"] { background: rgba(255,255,255,0.1); }
.nf-setting-control [data-slot="slider"] [data-slot="slider-range"] { background: linear-gradient(90deg, #22d3ee, #a78bfa); }
.nf-setting-control [data-slot="slider"] [data-slot="slider-thumb"] { border-color: #22d3ee; background: #0a0a14; }
.nf-setting-value {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.72em;
  color: #22d3ee;
  min-width: 38px;
  text-align: right;
}
.nf-setting-hint { font-size: 0.7em; color: #71718a; padding: 0 10px; line-height: 1.4; }
.nf-settings-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding-top: 8px;
  border-top: 1px solid rgba(255,255,255,0.06);
  margin-top: 4px;
}
.nf-settings-footer [data-slot="button"] { height: 30px; }
.nf-settings-footer [data-slot="button"][data-variant="default"] {
  background: linear-gradient(90deg, #22d3ee, #a78bfa);
  color: #0a0a14;
}
.nf-settings-footer [data-slot="button"][data-variant="ghost"] { color: #9ca3ff; }

/* Keybind list (Controls tab) */
.nf-keybind-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 6px; }
.nf-keybind-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 7px 10px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 8px;
  font-size: 0.8em;
}
.nf-keybind-keys { display: inline-flex; gap: 4px; flex-wrap: wrap; }
.nf-keybind-kbd {
  display: inline-block;
  padding: 2px 7px;
  background: rgba(34,211,238,0.1);
  border: 1px solid rgba(34,211,238,0.3);
  border-radius: 5px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.85em;
  color: #22d3ee;
  min-width: 22px;
  text-align: center;
}
.nf-keybind-action { color: #c7c7f0; text-align: right; }

/* Mode selector dialog */
.nf-mode-dialog { max-width: 460px !important; }
.nf-mode-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
  margin-top: 4px;
}
@media (min-width: 440px) {
  .nf-mode-grid { grid-template-columns: 1fr 1fr; }
}
.nf-mode-card {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 14px;
  cursor: pointer;
  text-align: left;
  color: #e8e8f5;
  font-family: 'Space Grotesk', sans-serif;
  transition: border-color .15s, background .15s, box-shadow .15s;
}
.nf-mode-card:hover {
  background: rgba(255,255,255,0.06);
  border-color: rgba(34,211,238,0.3);
}
.nf-mode-card-active {
  border-color: rgba(34,211,238,0.6) !important;
  background: rgba(34,211,238,0.08) !important;
  box-shadow: 0 0 0 1px rgba(34,211,238,0.3), 0 0 24px rgba(34,211,238,0.15);
}
.nf-mode-card-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: linear-gradient(135deg, rgba(34,211,238,0.15), rgba(167,139,250,0.15));
  border: 1px solid rgba(255,255,255,0.08);
  color: #22d3ee;
  flex-shrink: 0;
}
.nf-mode-card-active .nf-mode-card-icon { color: #22d3ee; border-color: rgba(34,211,238,0.4); }
.nf-mode-card-body { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.nf-mode-card-label { font-size: 0.95em; font-weight: 700; color: #e8e8f5; }
.nf-mode-card-desc { font-size: 0.74em; color: #9ca3ff; line-height: 1.35; }
.nf-mode-card-goal { font-size: 0.68em; color: #71718a; margin-top: 3px; font-family: 'JetBrains Mono', monospace; }
.nf-mode-card-active .nf-mode-card-label { color: #22d3ee; }

/* Sonner toaster neon theme */
[data-sonner-toaster] { font-family: 'Space Grotesk', sans-serif !important; }
[data-sonner-toast] {
  background: rgba(14,14,26,0.94) !important;
  border: 1px solid rgba(34,211,238,0.25) !important;
  color: #e8e8f5 !important;
  backdrop-filter: blur(20px) saturate(160%);
  -webkit-backdrop-filter: blur(20px) saturate(160%);
  box-shadow: 0 8px 30px rgba(0,0,0,0.5) !important;
}
[data-sonner-toast] [data-description] { color: #9ca3ff !important; }

/* ===== Mode-aware HUD (Sprint progress / Ultra countdown) ===== */
#nf-mode-hud {
  width: 100%;
  max-width: 320px;
  display: flex;
  justify-content: center;
  flex: 0 0 auto;
  pointer-events: none;
}
.nf-mode-hud-inner {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 10px;
  border-radius: 10px;
  background: rgba(14,14,26,0.72);
  backdrop-filter: blur(12px) saturate(150%);
  -webkit-backdrop-filter: blur(12px) saturate(150%);
  border: 1px solid rgba(255,255,255,0.08);
  font-family: 'Space Grotesk', sans-serif;
  font-size: 0.65em;
  letter-spacing: 1px;
  color: #c7c7f0;
  pointer-events: auto;
  box-shadow: 0 4px 16px rgba(0,0,0,0.35);
}
.nf-mode-hud-inner[data-mode="sprint"] {
  border-color: rgba(244,114,182,0.3);
  color: #f472b6;
}
.nf-mode-hud-inner[data-mode="sprint"] .nf-mode-hud-fill {
  background: linear-gradient(90deg, #f472b6, #a78bfa);
}
.nf-mode-hud-inner[data-mode="ultra"] {
  border-color: rgba(167,139,250,0.3);
  color: #a78bfa;
}
.nf-mode-hud-inner[data-mode="ultra"][data-urgent] {
  border-color: rgba(251,113,133,0.5);
  color: #fb7185;
  animation: nfHudPulse 0.9s ease-in-out infinite;
}
@keyframes nfHudPulse {
  0%, 100% { box-shadow: 0 4px 16px rgba(0,0,0,0.35), 0 0 0 0 rgba(251,113,133,0.5); }
  50% { box-shadow: 0 4px 16px rgba(0,0,0,0.35), 0 0 0 6px rgba(251,113,133,0); }
}
.nf-mode-hud-label { font-weight: 700; }
.nf-mode-hud-bar {
  width: 60px;
  height: 4px;
  border-radius: 2px;
  background: rgba(255,255,255,0.1);
  overflow: hidden;
}
.nf-mode-hud-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.3s ease-out;
}
.nf-mode-hud-value {
  font-family: 'JetBrains Mono', monospace;
  font-weight: 700;
  min-width: 36px;
  text-align: right;
}
.nf-mode-hud-time { font-size: 1.05em; min-width: 42px; }

/* S5c: Share button CSS removed — the button itself was removed (Effect I).
   Nobody shares Tetris scores and it was too prominent on game-over. */

/* ===== React Bestenliste (TanStack Query + shadcn Dialog) ===== */
.nf-leaderboard-dialog { max-width: 460px !important; }
.nf-leaderboard-tabs { width: 100%; }
.nf-leaderboard-tabslist {
  background: rgba(255,255,255,0.05) !important;
  border: 1px solid rgba(255,255,255,0.08);
  width: 100%;
  height: auto;
  flex-wrap: wrap;
  gap: 2px;
  padding: 3px;
}
.nf-leaderboard-tab {
  color: #9ca3ff !important;
  font-size: 0.72em !important;
  height: 30px;
  border-radius: 8px;
  flex: 1;
}
.nf-leaderboard-tab:hover { color: #c7c7f0 !important; }
.nf-leaderboard-tab[data-state="active"] {
  background: rgba(34,211,238,0.15) !important;
  color: #22d3ee !important;
}
.nf-leaderboard-body {
  max-height: 52vh;
  overflow-y: auto;
  margin-top: 4px;
  padding-right: 2px;
}
.nf-leaderboard-body::-webkit-scrollbar { width: 6px; }
.nf-leaderboard-body::-webkit-scrollbar-thumb { background: rgba(34,211,238,0.3); border-radius: 3px; }
.nf-leaderboard-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 4px; }
.nf-leaderboard-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 10px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 9px;
  font-family: 'Space Grotesk', sans-serif;
  font-size: 0.8em;
  transition: background .15s, border-color .15s, transform .1s;
}
.nf-leaderboard-row:hover { background: rgba(255,255,255,0.06); }
.nf-leaderboard-row:active { transform: scale(0.99); }
.nf-leaderboard-me {
  background: linear-gradient(90deg, rgba(34,211,238,0.12), rgba(167,139,250,0.12)) !important;
  border-color: rgba(34,211,238,0.4) !important;
  box-shadow: 0 0 0 1px rgba(34,211,238,0.2), 0 0 16px rgba(34,211,238,0.1);
}
.nf-leaderboard-rank {
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.nf-leaderboard-rank-num {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.85em;
  font-weight: 700;
  color: #71718a;
}
.nf-leaderboard-name {
  flex: 1;
  min-width: 0;
  color: #e8e8f5;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.nf-leaderboard-you {
  display: inline-block;
  padding: 1px 6px;
  border-radius: 5px;
  background: rgba(34,211,238,0.2);
  border: 1px solid rgba(34,211,238,0.4);
  color: #22d3ee;
  font-size: 0.7em;
  font-weight: 700;
  letter-spacing: 0.5px;
}
.nf-leaderboard-score {
  font-family: 'JetBrains Mono', monospace;
  font-weight: 700;
  color: #22d3ee;
  font-size: 0.95em;
  min-width: 60px;
  text-align: right;
}
.nf-leaderboard-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 1px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.65em;
  color: #71718a;
  min-width: 50px;
  text-align: right;
}
.nf-leaderboard-date { opacity: 0.7; }

.nf-leaderboard-empty {
  text-align: center;
  padding: 32px 16px;
  color: #9ca3ff;
  font-size: 0.85em;
  line-height: 1.5;
}

.nf-leaderboard-skeleton {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  background: rgba(255,255,255,0.02);
  border-radius: 9px;
}
.nf-leaderboard-sk-rank, .nf-leaderboard-sk-name, .nf-leaderboard-sk-score, .nf-leaderboard-sk-meta {
  background: linear-gradient(90deg, rgba(255,255,255,0.04), rgba(255,255,255,0.08), rgba(255,255,255,0.04));
  background-size: 200% 100%;
  animation: nfSkShimmer 1.4s ease-in-out infinite;
  border-radius: 4px;
}
.nf-leaderboard-sk-rank { width: 22px; height: 22px; border-radius: 50%; flex-shrink: 0; }
.nf-leaderboard-sk-name { flex: 1; height: 14px; }
.nf-leaderboard-sk-score { width: 60px; height: 14px; }
.nf-leaderboard-sk-meta { width: 50px; height: 14px; }
@keyframes nfSkShimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
.nf-leaderboard-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 12px;
  color: #9ca3ff;
  font-size: 0.75em;
}
`;
