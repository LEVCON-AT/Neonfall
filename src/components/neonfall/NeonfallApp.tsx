'use client';

import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';
import { GAME_CSS, GAME_SCRIPT } from '@/app/neonfall-content';
import { SHELL_CSS, initShell } from '@/app/neonfall-shell';
import { useSettingsStore } from '@/lib/store/settings-store';
import { useGameStore } from '@/lib/store/game-store';
import type { GameStatus } from '@/lib/types';
import { GAME_MODES } from '@/lib/types';
import { TopBar } from './TopBar';
import { HoldNextBar } from './HoldNextBar';
import { ControlButtons } from './ControlButtons';
import { GameCanvas } from './GameCanvas';
import { Footer } from './Footer';
import { ModeHud } from './ModeHud';
import { ShellOverlays } from './ShellOverlays';
import { SettingsDialog } from './dialogs/SettingsDialog';
import { GameModeDialog } from './dialogs/GameModeDialog';
import { LeaderboardDialog } from './dialogs/LeaderboardDialog';

/**
 * Supplemental CSS layered on top of GAME_CSS and SHELL_CSS.
 *
 * GAME_CSS pins `body { overflow: hidden; height: 100vh }`, so the footer
 * uses `position: fixed` (not sticky) and hides itself while a game is in
 * progress. shadcn dialogs are themed neon via `.nf-dialog-neon`.
 */
const NEONFALL_APP_CSS = `
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
.nf-dialog-neon {
  background: rgba(14,14,26,0.94) !important;
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

/* ===== Game-over share button (added by React into the IIFE's overlay) ===== */
#nf-share-btn {
  display: block;
  width: 100%;
  margin-top: 8px;
  padding: 9px 14px;
  font-family: 'Space Grotesk', sans-serif;
  font-size: 0.85em;
  font-weight: 600;
  letter-spacing: 1px;
  color: #0a0a14;
  background: linear-gradient(90deg, #22d3ee, #a78bfa);
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: transform .1s, box-shadow .15s, opacity .15s;
  box-shadow: 0 4px 14px rgba(34,211,238,0.25);
}
#nf-share-btn:hover { box-shadow: 0 6px 22px rgba(34,211,238,0.4); transform: translateY(-1px); }
#nf-share-btn:active { transform: translateY(0) scale(0.97); }
#nf-share-btn:disabled { opacity: 0.5; cursor: default; }
#nf-share-btn .nf-share-icon { vertical-align: -3px; margin-right: 6px; }

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

/** Read an integer from a DOM element's textContent (defaults to 0). */
function readInt(id: string): number {
  if (typeof document === 'undefined') return 0;
  const el = document.getElementById(id);
  if (!el) return 0;
  const m = (el.textContent || '').replace(/[^\d-]/g, '');
  return m ? parseInt(m, 10) || 0 : 0;
}

/**
 * The GAME_SCRIPT template literal in neonfall-content.ts contains a handful
 * of TypeScript annotations (`(window as any)`, `(count: number)`,
 * `(row: any[])`) that were added when the multiplayer window hooks were
 * exposed. Those annotations are invalid inside a browser `<script>` tag and
 * would prevent the IIFE from executing. We strip them at runtime — the file
 * itself stays byte-identical, but the injected script is valid JavaScript.
 *
 * Only the four known annotation patterns are touched; the game logic is
 * preserved exactly.
 */
function stripTypeAnnotations(script: string): string {
  return script
    .replace(/\(window as any\)/g, 'window')
    .replace(/\(count: number\)/g, '(count)')
    .replace(/\(row: any\[\]\)/g, '(row)');
}

/** Push a 0..2 strength value into one of the IIFE's range sliders. */
function syncGameSlider(id: string, value01to2: number): void {
  if (typeof document === 'undefined') return;
  const el = document.getElementById(id) as HTMLInputElement | null;
  if (!el) return;
  const pct = Math.max(0, Math.min(200, Math.round(value01to2 * 100)));
  el.value = String(pct);
  el.dispatchEvent(new Event('input', { bubbles: true }));
}

/**
 * Root client component for the NEONFALL experience.
 *
 * It owns:
 *  - the IIFE bootstrap (injected <script> tag + initShell())
 *  - the `__nfGetMode` window hook the shell uses for per-mode score submission
 *  - a MutationObserver that mirrors the game's overlay/DOM state into the
 *    `useGameStore` (status, score, level, lines, best) so React components
 *    like the Footer can react to gameplay without touching the IIFE
 *  - mode-aware game behaviour (Sprint 40-line finish, Ultra 3:00 countdown)
 *  - theme + persisted-settings sync into the IIFE's range sliders
 *  - the SettingsDialog + GameModeDialog (Sprint 4 + 6 features)
 */
export function NeonfallApp() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [modeDialogOpen, setModeDialogOpen] = useState(false);
  const [leaderboardOpen, setLeaderboardOpen] = useState(false);

  const initRef = useRef(false);

  // Refs used by the mode-aware effects below.
  const prevStatusRef = useRef<GameStatus>('idle');
  const sprintDoneRef = useRef(false);
  const ultraDoneRef = useRef(false);
  const gameStartTsRef = useRef<number | null>(null);

  // ===== Effect A: bootstrap the game IIFE + the legacy shell (once) =====
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    // Execute the game script exactly as authored. It is a self-contained
    // IIFE that grabs its DOM elements via getElementById, so it must run
    // after the markup below has been committed (which it has, in useEffect).
    try {
      const script = document.createElement('script');
      script.textContent = stripTypeAnnotations(GAME_SCRIPT);
      document.body.appendChild(script);
    } catch (err) {
      console.error('[NEONFALL] game script failed to initialise:', err);
      const gc = document.getElementById('game-container');
      if (gc) {
        const notice = document.createElement('div');
        notice.style.cssText =
          'position:absolute;inset:0;display:flex;align-items:center;justify-content:center;text-align:center;padding:24px;color:#fda4af;font-family:sans-serif;font-size:0.9em;';
        notice.textContent =
          'Das Spiel konnte nicht geladen werden. Bitte lade die Seite neu.';
        gc.appendChild(notice);
      }
    }

    // Shell enhancements (install prompt, stats, leaderboard, multiplayer)
    // are best-effort — never let them white-screen the game.
    try {
      initShell();
    } catch (e) {
      /* shell is best-effort */
    }
  }, []);

  // ===== Effect B: expose __nfGetMode so the legacy shell submits the
  //       correct mode per score. Set once after the IIFE has mounted. =====
  useEffect(() => {
    (window as unknown as { __nfGetMode?: () => string }).__nfGetMode = () =>
      useGameStore.getState().mode;
    return () => {
      delete (window as unknown as { __nfGetMode?: () => string }).__nfGetMode;
    };
  }, []);

  // ===== Effect C: mirror the IIFE's overlay + stat DOM into useGameStore.
  //       The Footer (and any other React UI) subscribes to the store. =====
  useEffect(() => {
    const ids = [
      'start-prompt',
      'pause-overlay',
      'game-over-screen',
      'hint-overlay',
      'score',
      'level',
      'lines',
      'best-score',
    ];

    const compute = () => {
      const hint = document.getElementById('hint-overlay');
      const sp = document.getElementById('start-prompt');
      const po = document.getElementById('pause-overlay');
      const go = document.getElementById('game-over-screen');

      const hintVisible = hint ? !hint.classList.contains('hidden') : false;
      const startVisible = sp ? sp.classList.contains('visible') : false;
      const pauseVisible = po ? po.classList.contains('visible') : false;
      const goVisible = go ? go.classList.contains('visible') : false;

      let status: GameStatus = 'playing';
      if (goVisible) status = 'gameover';
      else if (pauseVisible) status = 'paused';
      else if (hintVisible || startVisible) status = 'idle';

      const store = useGameStore.getState();
      store.setStatus(status);
      // Sprint 3 Game-Feel: detect which stat actually changed and pulse
      // only that box. This gives subtle visual feedback on score/level/line
      // gains without touching the IIFE — we just add+remove a CSS class.
      const prev = {
        score: store.score,
        level: store.level,
        lines: store.lines,
        best: store.best,
      };
      const next = {
        score: readInt('score'),
        level: readInt('level'),
        lines: readInt('lines'),
        best: readInt('best-score'),
      };
      store.setScore(next.score);
      store.setLevel(next.level);
      store.setLines(next.lines);
      store.setBest(next.best);
      // Pulse the stat-box <p> element whose value just increased.
      (['score', 'level', 'lines', 'best'] as const).forEach((key) => {
        if (next[key] > prev[key]) {
          const id = key === 'best' ? 'best-score' : key;
          const el = document.getElementById(id);
          if (el) {
            el.classList.remove('nf-stat-pulse');
            // force reflow so the animation restarts cleanly
            void el.offsetWidth;
            el.classList.add('nf-stat-pulse');
          }
        }
      });
    };

    const obs = new MutationObserver(compute);
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      obs.observe(el, {
        attributes: true,
        attributeFilter: ['class', 'style'],
        childList: true,
        characterData: true,
        subtree: true,
      });
    });
    compute();

    return () => obs.disconnect();
  }, []);

  // ===== Effect D: REMOVED in Sprint 1. The theme switcher was dead UI — the
  //       IIFE ships 500+ hardcoded neon-dark colors that can't be overridden
  //       by a `class="light"` on <html>. The app is neon-dark by design.
  //       Settings-Dialog no longer exposes a theme toggle.

  // ===== Effect E: push persisted rattle/impact into the IIFE sliders on
  //       first mount (the SettingsDialog also syncs on every change). =====
  const rattle = useSettingsStore((s) => s.rattleStrength);
  const impact = useSettingsStore((s) => s.impactStrength);
  const didInitialSync = useRef(false);
  useEffect(() => {
    if (didInitialSync.current) return;
    didInitialSync.current = true;
    // Defer one tick so the IIFE's slider listeners are guaranteed wired.
    const id = window.setTimeout(() => {
      syncGameSlider('rattle-slider', rattle);
      syncGameSlider('impact-slider', impact);
    }, 0);
    return () => window.clearTimeout(id);
    // Intentionally run only once on mount — we want the *persisted* settings
    // applied to the IIFE sliders a single time, not on every value change.
  }, []);

  // ===== Effect F: Sprint mode — finish the run the moment 40 lines are
  //       cleared. Re-binds the listener whenever mode changes so the
  //       sprintDoneRef guard resets cleanly. =====
  const mode = useGameStore((s) => s.mode);
  useEffect(() => {
    if (mode !== 'sprint') return;
    sprintDoneRef.current = false;

    const onLines = () => {
      if (sprintDoneRef.current) return;
      const total = readInt('lines');
      if (total < 40) return;
      sprintDoneRef.current = true;

      const elapsedMs = gameStartTsRef.current
        ? Date.now() - gameStartTsRef.current
        : 0;
      const secs = elapsedMs / 1000;
      const mm = Math.floor(secs / 60);
      const ss = (secs % 60).toFixed(1);
      const timeStr = mm > 0 ? `${mm}:${ss.padStart(4, '0')}` : `${ss}s`;

      toast.success('Sprint 40L geschafft!', {
        description: `Zeit: ${timeStr}`,
      });

      // End the run + revert to marathon for the next game.
      try {
        (window as unknown as { __nfRestart?: () => void }).__nfRestart?.();
      } catch {
        /* noop */
      }
      useGameStore.getState().setMode('marathon');
    };

    window.addEventListener('nf-lines-cleared', onLines as EventListener);
    return () =>
      window.removeEventListener('nf-lines-cleared', onLines as EventListener);
  }, [mode]);

  // ===== Effect G: Ultra mode — 180s countdown while playing. =====
  const status = useGameStore((s) => s.status);
  useEffect(() => {
    // Reset guard + timer whenever ultra is (re)selected.
    if (mode === 'ultra') {
      if (status === 'idle') {
        ultraDoneRef.current = false;
        useGameStore.getState().setUltraRemaining(180);
      }
    }

    if (mode !== 'ultra' || status !== 'playing') return;
    // If the timer already ran out for this run, don't restart it.
    if (ultraDoneRef.current) return;

    const id = window.setInterval(() => {
      const cur = useGameStore.getState().ultraRemaining;
      if (cur <= 1) {
        window.clearInterval(id);
        ultraDoneRef.current = true;
        const finalScore = readInt('score');
        toast.success('Ultra beendet', {
          description: `Finaler Score: ${finalScore.toLocaleString('de-DE')}`,
        });
        try {
          (window as unknown as { __nfRestart?: () => void }).__nfRestart?.();
        } catch {
          /* noop */
        }
        useGameStore.getState().setMode('marathon');
      } else {
        useGameStore.getState().setUltraRemaining(cur - 1);
      }
    }, 1000);

    return () => window.clearInterval(id);
  }, [mode, status]);

  // Track game-start timestamps (for the Sprint toast) on status transitions.
  useEffect(() => {
    const prev = prevStatusRef.current;
    prevStatusRef.current = status;
    if (status === 'playing' && prev !== 'playing') {
      gameStartTsRef.current = Date.now();
    }
    if (status !== 'playing') {
      gameStartTsRef.current = null;
    }
    // Sprint 3: toggle body.nf-playing to pause the expensive background
    // drift animation while a game is actively running (saves GPU cycles
    // for the canvas). The blobs freeze in place — visually identical.
    if (typeof document !== 'undefined') {
      document.body.classList.toggle('nf-playing', status === 'playing');
    }
  }, [status]);

  // ===== Effect H: keyboard shortcuts for the new React-controlled dialogs.
  //       S = Settings, G = Game mode, L = Leaderboard, Escape = close.
  //       The IIFE already handles P (pause), M (mute), I (info) — we don't
  //       touch those. Shortcuts are ignored while typing in an input. =====
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) {
        return;
      }
      if (e.key === 'Escape') {
        if (settingsOpen) setSettingsOpen(false);
        else if (modeDialogOpen) setModeDialogOpen(false);
        else if (leaderboardOpen) setLeaderboardOpen(false);
        return;
      }
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        setSettingsOpen((v) => !v);
      } else if (e.key === 'g' || e.key === 'G') {
        e.preventDefault();
        setModeDialogOpen((v) => !v);
      } else if (e.key === 'l' || e.key === 'L') {
        e.preventDefault();
        setLeaderboardOpen((v) => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [settingsOpen, modeDialogOpen, leaderboardOpen]);

  // ===== Effect I: inject a "Teilen" (Share) button into the IIFE's
  //       game-over overlay. The button reads live state at click time so it
  //       never needs rebinding — it always reflects the current score/mode. =====
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const goScreen = document.getElementById('game-over-screen');
    if (!goScreen) return;

    // Idempotent: skip if already injected (React StrictMode / re-renders).
    if (document.getElementById('nf-share-btn')) return;

    const btn = document.createElement('button');
    btn.id = 'nf-share-btn';
    btn.type = 'button';
    btn.innerHTML = `<svg class="nf-share-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>ERGEBNIS TEILEN`;

    btn.addEventListener('click', async () => {
      const scoreEl = document.getElementById('final-score');
      const scoreText = scoreEl?.textContent ?? 'Score: 0';
      const lines = readInt('lines');
      const level = readInt('level');
      const modeLabel =
        GAME_MODES[useGameStore.getState().mode]?.label ?? 'Marathon';

      const shareText = `NEONFALL · ${modeLabel}\n${scoreText} · ${lines} Linien · Level ${level}\nKannst du mich schlagen?`;

      try {
        if (navigator.share) {
          await navigator.share({ title: 'NEONFALL', text: shareText });
        } else {
          await navigator.clipboard.writeText(shareText);
          toast.success('In die Zwischenablage kopiert!', {
            description: 'Teile deinen NEONFALL-Score mit Freund:innen.',
          });
        }
      } catch {
        /* user cancelled share — noop */
      }
    });

    // Insert after the restart-button.
    const restart = document.getElementById('restart-button');
    if (restart?.parentElement) {
      restart.parentElement.insertBefore(btn, restart.nextSibling);
    } else {
      goScreen.appendChild(btn);
    }
  }, []);

  // ===== Effect J: Haptics — vibrate the device when lines are cleared.
  //       The game IIFE dispatches `nf-lines-cleared` with `detail.cleared`
  //       (1-4). We map the count to a vibration pattern: single / double /
  //       triple / TETRIS. Guarded by `hapticsEnabled` from the settings store
  //       (read non-reactively via getState so the listener never needs to be
  //       re-bound). No-op on browsers without navigator.vibrate. =====
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onLines = (e: Event) => {
      const ev = e as CustomEvent<{ cleared?: number }>;
      const cleared = ev.detail?.cleared ?? 0;
      if (cleared < 1) return;
      if (!useSettingsStore.getState().hapticsEnabled) return;
      const nav = navigator as Navigator & { vibrate?: (p: number | number[]) => boolean };
      if (typeof nav.vibrate !== 'function') return;
      // Patterns (ms): Single=short blip, Double/Triple escalate, Tetris=fanfare.
      const patterns: Record<number, number[]> = {
        1: [18],
        2: [18, 35, 18],
        3: [20, 40, 20, 40, 25],
        4: [25, 45, 25, 45, 25, 45, 60],
      };
      nav.vibrate(patterns[cleared] ?? patterns[1]);
    };
    window.addEventListener('nf-lines-cleared', onLines as EventListener);
    return () => window.removeEventListener('nf-lines-cleared', onLines as EventListener);
  }, []);

  // ===== Effect K: Hint-on-start sync — the game IIFE reads
  //       `localStorage['neonfall_hide_hint']` exactly once at boot to decide
  //       whether to show the hint overlay on first launch. We mirror the
  //       React settings toggle into that legacy key so the IIFE respects the
  //       user's choice on the next reload. (Live toggling mid-game isn't
  //       possible without touching the IIFE, but "on next start" matches the
  //       setting's semantics.) =====
  const showHintOnStart = useSettingsStore((s) => s.showHintOnStart);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      if (showHintOnStart) {
        window.localStorage.removeItem('neonfall_hide_hint');
      } else {
        window.localStorage.setItem('neonfall_hide_hint', '1');
      }
    } catch {
      /* localStorage unavailable — noop */
    }
  }, [showHintOnStart]);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: GAME_CSS }} />
      <style dangerouslySetInnerHTML={{ __html: SHELL_CSS }} />
      <style dangerouslySetInnerHTML={{ __html: NEONFALL_APP_CSS }} />

      <h1 id="title">NEONFALL</h1>

      <TopBar />
      <ModeHud />
      <HoldNextBar />
      <ControlButtons />

      <GameCanvas />

      <ShellOverlays />

      <Footer
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenModeSelect={() => setModeDialogOpen(true)}
        onOpenLeaderboard={() => setLeaderboardOpen(true)}
      />

      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
      <GameModeDialog
        open={modeDialogOpen}
        onOpenChange={setModeDialogOpen}
      />
      <LeaderboardDialog
        open={leaderboardOpen}
        onOpenChange={setLeaderboardOpen}
        initialMode={mode}
      />

      <Toaster position="top-center" closeButton richColors />
    </>
  );
}
