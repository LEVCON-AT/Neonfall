// NEONFALL app-shell enhancements.
//
// This module adds features AROUND the game without modifying the game IIFE:
//  - PWA install prompt (Android/Chrome beforeinstallprompt + iOS instructions)
//  - Career stats panel (games / lines / score / level / play time / achievements)
//    tracked via MutationObservers on the game's own DOM elements + localStorage
//  - Service-worker update toast + online/offline indicator
//
// All new UI is position:fixed so it never disturbs the game's body flex layout.

export const SHELL_CSS = `
/* ===== NEONFALL app-shell (stats, install, update, online) — does NOT touch game ===== */

#nf-stats-btn {
    position: fixed;
    top: max(8px, env(safe-area-inset-top));
    left: calc(max(8px, env(safe-area-inset-left)) + 42px);
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.08);
    color: rgba(199,199,240,0.65);
    border-radius: 50%;
    width: 34px;
    height: 34px;
    font-size: 0.95em;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 20;
    opacity: 0.6;
    font-family: var(--font-space-grotesk), sans-serif;
    transition: opacity .15s, transform .1s, background .15s;
}
#nf-stats-btn:active { transform: scale(0.9); opacity: 1; }

#nf-online-dot {
    position: fixed;
    top: calc(max(8px, env(safe-area-inset-top)) + 30px);
    left: calc(max(8px, env(safe-area-inset-left)) + 38px);
    width: 7px; height: 7px;
    border-radius: 50%;
    background: #34d399;
    box-shadow: 0 0 6px #34d399;
    z-index: 21;
    pointer-events: none;
    transition: opacity .2s;
    opacity: 0.85;
}
#nf-online-dot.offline {
    background: #fb7185;
    box-shadow: 0 0 6px #fb7185;
    animation: nfBlink 1.4s ease-in-out infinite;
}
@keyframes nfBlink { 0%,100%{opacity:.85} 50%{opacity:.3} }

/* ---- Generic overlay backdrop for shell panels ---- */
#nf-stats-panel, #nf-ios-install {
    position: fixed;
    inset: 0;
    background: rgba(6,6,14,0.86);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    display: none;
    align-items: center;
    justify-content: center;
    z-index: 50;
    padding: 16px;
    box-sizing: border-box;
}
#nf-stats-panel.show, #nf-ios-install.show { display: flex; }

/* ---- Stats panel card ---- */
#nf-stats-card {
    width: 100%;
    max-width: 380px;
    max-height: 86vh;
    overflow-y: auto;
    background: linear-gradient(160deg, rgba(34,211,238,0.06), rgba(167,139,250,0.05));
    border: 1px solid rgba(167,139,250,0.22);
    border-radius: 18px;
    padding: 20px 18px 16px;
    box-shadow: 0 12px 48px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05);
    color: #e8e8f5;
    font-family: var(--font-space-grotesk), sans-serif;
    box-sizing: border-box;
    animation: nfSlideUp .28s cubic-bezier(.2,.8,.2,1);
}
@keyframes nfSlideUp { from{opacity:0; transform: translateY(18px) scale(.97)} to{opacity:1; transform:none} }

#nf-stats-card::-webkit-scrollbar { width: 6px; }
#nf-stats-card::-webkit-scrollbar-thumb { background: rgba(167,139,250,0.3); border-radius: 3px; }

.nf-stats-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 14px;
}
.nf-stats-title {
    font-size: 1.15em;
    font-weight: 700;
    letter-spacing: 2px;
    background: linear-gradient(90deg, #22d3ee, #a78bfa, #f472b6);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
}
.nf-stats-close {
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.1);
    color: #c7c7f0;
    width: 28px; height: 28px;
    border-radius: 50%;
    cursor: pointer;
    font-size: 1em;
    line-height: 1;
    display: flex; align-items: center; justify-content: center;
}
.nf-stats-close:active { transform: scale(0.9); }

.nf-stats-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    margin-bottom: 16px;
}
.nf-stat-cell {
    background: rgba(255,255,255,0.035);
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 10px;
    padding: 10px 12px;
}
.nf-stat-cell.wide { grid-column: 1 / -1; }
.nf-stat-label {
    font-size: 0.62em;
    letter-spacing: 1.4px;
    text-transform: uppercase;
    color: #9ca3ff;
    margin-bottom: 4px;
    font-weight: 600;
}
.nf-stat-value {
    font-family: var(--font-jetbrains-mono), monospace;
    font-size: 1.25em;
    font-weight: 700;
    color: #e8e8f5;
}
.nf-stat-value.accent {
    background: linear-gradient(90deg, #22d3ee, #a78bfa);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
}

.nf-section-label {
    font-size: 0.66em;
    letter-spacing: 1.6px;
    text-transform: uppercase;
    color: #9ca3ff;
    font-weight: 600;
    margin: 14px 0 8px;
}
.nf-achievements {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 7px;
}
.nf-ach {
    display: flex;
    align-items: center;
    gap: 8px;
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 9px;
    padding: 8px 9px;
    font-size: 0.74em;
    color: #6b6b8a;
    transition: all .2s;
}
.nf-ach.unlocked {
    color: #e8e8f5;
    border-color: rgba(167,139,250,0.3);
    background: rgba(167,139,250,0.08);
}
.nf-ach-icon {
    font-size: 1.15em;
    filter: grayscale(1) opacity(0.5);
    transition: filter .2s;
}
.nf-ach.unlocked .nf-ach-icon {
    filter: none;
}
.nf-ach-name { line-height: 1.2; }

.nf-stats-footer {
    margin-top: 14px;
    font-size: 0.68em;
    color: #6b6b8a;
    text-align: center;
    font-family: var(--font-jetbrains-mono), monospace;
}

/* ---- Recent scores list ---- */
.nf-recent {
    margin-top: 4px;
}
.nf-recent-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 7px 10px;
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.05);
    border-radius: 8px;
    margin-bottom: 5px;
    font-size: 0.78em;
}
.nf-recent-item:last-child { margin-bottom: 0; }
.nf-recent-meta { color: #9ca3ff; font-size: 0.92em; }
.nf-recent-score {
    font-family: var(--font-jetbrains-mono), monospace;
    font-weight: 700;
    color: #e8e8f5;
}
.nf-recent-empty {
    color: #6b6b8a;
    font-size: 0.76em;
    text-align: center;
    padding: 10px;
    font-style: italic;
}

/* ---- Reset button + confirm ---- */
.nf-reset-row {
    display: flex;
    justify-content: center;
    margin-top: 14px;
}
.nf-reset-btn {
    background: rgba(251,113,133,0.08);
    border: 1px solid rgba(251,113,133,0.25);
    color: #fb7185;
    border-radius: 8px;
    padding: 8px 16px;
    font-size: 0.74em;
    cursor: pointer;
    font-family: var(--font-space-grotesk), sans-serif;
    font-weight: 600;
    letter-spacing: .5px;
    transition: all .15s;
}
.nf-reset-btn:active { transform: scale(0.95); }
.nf-reset-confirm {
    display: none;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    margin-top: 14px;
    padding: 12px;
    background: rgba(251,113,133,0.08);
    border: 1px solid rgba(251,113,133,0.25);
    border-radius: 10px;
}
.nf-reset-confirm.show { display: flex; }
.nf-reset-confirm-text {
    font-size: 0.78em;
    color: #fda4af;
    text-align: center;
    line-height: 1.4;
}
.nf-reset-confirm-actions { display: flex; gap: 8px; }
.nf-reset-yes {
    background: rgba(251,113,133,0.25);
    border: 1px solid rgba(251,113,133,0.4);
    color: #fff;
    border-radius: 7px;
    padding: 7px 14px;
    font-size: 0.76em;
    cursor: pointer;
    font-weight: 600;
    font-family: var(--font-space-grotesk), sans-serif;
}
.nf-reset-no {
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.1);
    color: #c7c7f0;
    border-radius: 7px;
    padding: 7px 14px;
    font-size: 0.76em;
    cursor: pointer;
    font-family: var(--font-space-grotesk), sans-serif;
}
.nf-reset-yes:active, .nf-reset-no:active { transform: scale(0.94); }

/* ---- Achievement unlock toast ---- */
#nf-ach-toast {
    position: fixed;
    /* S5c fix: moved below the top-bar (which is ~80px tall on mobile) so it
       no longer overlaps the BEST/LEVEL stat boxes. Positioned at the
       left edge instead of centered to avoid covering the playfield. */
    top: calc(max(8px, env(safe-area-inset-top)) + 92px);
    left: max(8px, env(safe-area-inset-left));
    transform: translateX(-160%);
    background: linear-gradient(135deg, rgba(251,191,36,0.16), rgba(244,114,182,0.16));
    border: 1px solid rgba(251,191,36,0.4);
    border-radius: 12px;
    padding: 10px 14px 10px 12px;
    display: flex;
    align-items: center;
    gap: 10px;
    z-index: 47;
    color: #e8e8f5;
    font-family: var(--font-space-grotesk), sans-serif;
    box-shadow: 0 8px 28px rgba(0,0,0,0.5), 0 0 24px rgba(251,191,36,0.15);
    transition: transform .4s cubic-bezier(.2,.8,.2,1), opacity .4s;
    max-width: calc(100% - 24px);
    opacity: 0;
}
#nf-ach-toast.show {
    /* Slide in from the left edge instead of dropping down from center. */
    transform: translateX(0);
    opacity: 1;
}
.nf-ach-toast-icon {
    font-size: 1.6em;
    filter: drop-shadow(0 0 8px rgba(251,191,36,0.5));
    animation: nfAchPop .5s cubic-bezier(.2,1.4,.4,1);
}
@keyframes nfAchPop {
    0% { transform: scale(0); }
    60% { transform: scale(1.25); }
    100% { transform: scale(1); }
}
.nf-ach-toast-body { line-height: 1.25; }
.nf-ach-toast-label {
    font-size: 0.62em;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: #fbbf24;
    font-weight: 700;
}
.nf-ach-toast-name {
    font-size: 0.9em;
    font-weight: 600;
    color: #e8e8f5;
}

/* ---- Landscape rotate hint ---- */
#nf-rotate-hint {
    position: fixed;
    inset: 0;
    background: rgba(6,6,14,0.96);
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
    display: none;
    align-items: center;
    justify-content: center;
    z-index: 60;
    color: #e8e8f5;
    font-family: var(--font-space-grotesk), sans-serif;
    text-align: center;
    padding: 24px;
}
#nf-rotate-hint.show { display: flex; }
.nf-rotate-inner {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 18px;
}
.nf-rotate-phone {
    width: 52px;
    height: 92px;
    border: 3px solid rgba(167,139,250,0.5);
    border-radius: 10px;
    position: relative;
    animation: nfRotateWiggle 2s ease-in-out infinite;
}
.nf-rotate-phone::after {
    content: '';
    position: absolute;
    top: 6px; left: 50%;
    transform: translateX(-50%);
    width: 14px; height: 3px;
    background: rgba(167,139,250,0.5);
    border-radius: 2px;
}
@keyframes nfRotateWiggle {
    0%, 100% { transform: rotate(0deg); }
    50% { transform: rotate(-90deg); }
}
.nf-rotate-title {
    font-size: 1.1em;
    font-weight: 700;
    letter-spacing: 1.5px;
    background: linear-gradient(90deg, #22d3ee, #a78bfa, #f472b6);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
}
.nf-rotate-sub {
    font-size: 0.82em;
    color: #9ca3ff;
    max-width: 240px;
    line-height: 1.5;
}

/* ---- Install banner (Android/Chrome) ---- */
#nf-install-banner {
    position: fixed;
    left: 50%;
    transform: translateX(-50%) translateY(140%);
    bottom: calc(max(12px, env(safe-area-inset-bottom)) + 4px);
    width: calc(100% - 24px);
    max-width: 380px;
    background: linear-gradient(135deg, rgba(34,211,238,0.12), rgba(167,139,250,0.12));
    border: 1px solid rgba(167,139,250,0.3);
    border-radius: 14px;
    padding: 12px 14px;
    display: flex;
    align-items: center;
    gap: 12px;
    z-index: 45;
    box-shadow: 0 8px 32px rgba(0,0,0,0.5);
    transition: transform .35s cubic-bezier(.2,.8,.2,1);
    color: #e8e8f5;
    font-family: var(--font-space-grotesk), sans-serif;
}
#nf-install-banner.show { transform: translateX(-50%) translateY(0); }
.nf-install-icon {
    font-size: 1.5em;
    flex-shrink: 0;
}
.nf-install-text { flex: 1; min-width: 0; }
.nf-install-title { font-weight: 600; font-size: 0.92em; letter-spacing: .3px; }
.nf-install-sub { font-size: 0.72em; color: #9ca3ff; margin-top: 2px; }
.nf-install-actions { display: flex; gap: 6px; flex-shrink: 0; }
.nf-btn-primary {
    background: linear-gradient(90deg, #22d3ee, #a78bfa);
    color: #0a0a14;
    border: none;
    border-radius: 8px;
    padding: 8px 14px;
    font-weight: 700;
    font-size: 0.8em;
    cursor: pointer;
    font-family: var(--font-space-grotesk), sans-serif;
    letter-spacing: .5px;
}
.nf-btn-primary:active { transform: scale(0.94); }
.nf-btn-ghost {
    background: transparent;
    border: none;
    color: #6b6b8a;
    padding: 8px 6px;
    font-size: 1.1em;
    cursor: pointer;
}
.nf-btn-ghost:active { transform: scale(0.9); }

/* ---- iOS install instructions ---- */
#nf-ios-card {
    width: 100%;
    max-width: 340px;
    background: linear-gradient(160deg, rgba(34,211,238,0.06), rgba(167,139,250,0.05));
    border: 1px solid rgba(167,139,250,0.22);
    border-radius: 18px;
    padding: 22px 20px;
    color: #e8e8f5;
    font-family: var(--font-space-grotesk), sans-serif;
    text-align: center;
    animation: nfSlideUp .28s cubic-bezier(.2,.8,.2,1);
    box-shadow: 0 12px 48px rgba(0,0,0,0.5);
}
#nf-ios-card h2 {
    margin: 0 0 6px;
    font-size: 1.2em;
    background: linear-gradient(90deg, #22d3ee, #a78bfa, #f472b6);
    -webkit-background-clip: text; background-clip: text; color: transparent;
    letter-spacing: 1.5px;
}
#nf-ios-card .nf-ios-sub { color: #9ca3ff; font-size: 0.82em; margin-bottom: 18px; }
.nf-ios-steps { text-align: left; margin: 0 0 18px; padding: 0; list-style: none; counter-reset: step; }
.nf-ios-steps li {
    counter-increment: step;
    padding: 10px 10px 10px 40px;
    position: relative;
    font-size: 0.86em;
    color: #c7c7f0;
    border-radius: 8px;
    margin-bottom: 6px;
    background: rgba(255,255,255,0.03);
}
.nf-ios-steps li::before {
    content: counter(step);
    position: absolute;
    left: 12px; top: 50%; transform: translateY(-50%);
    width: 20px; height: 20px;
    background: linear-gradient(90deg, #22d3ee, #a78bfa);
    color: #0a0a14;
    border-radius: 50%;
    font-size: 0.8em; font-weight: 700;
    display: flex; align-items: center; justify-content: center;
}
.nf-ios-steps b { color: #e8e8f5; }

/* ---- Update toast ---- */
#nf-update-toast {
    position: fixed;
    top: max(8px, env(safe-area-inset-top));
    left: 50%;
    transform: translateX(-50%) translateY(-120%);
    background: linear-gradient(135deg, rgba(34,211,238,0.18), rgba(167,139,250,0.18));
    border: 1px solid rgba(34,211,238,0.4);
    border-radius: 12px;
    padding: 9px 12px 9px 14px;
    display: flex;
    align-items: center;
    gap: 10px;
    z-index: 46;
    color: #e8e8f5;
    font-family: var(--font-space-grotesk), sans-serif;
    font-size: 0.82em;
    box-shadow: 0 8px 24px rgba(0,0,0,0.45);
    transition: transform .35s cubic-bezier(.2,.8,.2,1);
    max-width: calc(100% - 100px);
}
#nf-update-toast.show { transform: translateX(-50%) translateY(0); }

@media (hover: hover) and (pointer: fine) {
    #nf-stats-btn:hover { opacity: 1; background: rgba(255,255,255,0.12); }
    .nf-stats-close:hover, .nf-btn-ghost:hover { background: rgba(255,255,255,0.1); }
    .nf-btn-primary:hover { filter: brightness(1.1); }
    .nf-ach.unlocked:hover { background: rgba(167,139,250,0.14); }
}
@media (min-width: 700px) {
    #nf-stats-card { max-width: 420px; }
}

/* ===== User-requested fixes (override game CSS, injected AFTER game CSS) ===== */

/* Issue 2: Hint overlay — always single column (stacked), never two columns.
   The game's @media(min-width:700px) sets .hint-cols-wrap to flex row; we override
   to flex-column so Touch and Tastatur stack vertically on every screen. */
.hint-cols-wrap {
    display: flex !important;
    flex-direction: column !important;
    gap: 16px !important;
}

/* Issue 3: Desktop — constrain the app CONTENT to a phone-width column with a
   thin frame, but let the animated gradient background cover the WHOLE screen.
   body::before/after (the gradient blobs) stay position:fixed (their original
   value) so they fill the viewport; only the app content sits in the 460px column. */
@media (min-width: 700px) {
    html {
        background: #0a0a14;
    }
    body {
        max-width: 460px;
        margin: 0 auto;
        border-left: 1px solid rgba(255,255,255,0.07);
        border-right: 1px solid rgba(255,255,255,0.07);
        box-shadow: 0 0 80px rgba(0,0,0,0.7);
    }
}

/* ===== Music crossfade player (8-track playlist) ===== */
#nf-music-bar {
    position: fixed;
    /* Positioned under the mute button (top-right). The mute button sits at
       right: max(8px, safe-area-right), top: max(8px, safe-area-top), 34px
       tall. We anchor below it, right-aligned. */
    top: calc(max(8px, env(safe-area-inset-top)) + 38px);
    right: max(8px, env(safe-area-inset-right));
    transform: translateX(0);
    display: flex;
    align-items: center;
    gap: 8px;
    background: rgba(10,10,20,0.88);
    border: 1px solid rgba(34,211,238,0.25);
    border-radius: 14px;
    padding: 6px 10px 6px 8px;
    z-index: 48;
    color: #c7c7f0;
    font-family: var(--font-space-grotesk), sans-serif;
    font-size: 0.72em;
    backdrop-filter: blur(16px) saturate(160%);
    -webkit-backdrop-filter: blur(16px) saturate(160%);
    max-width: calc(100vw - 16px);
    box-shadow: 0 8px 24px rgba(0,0,0,0.5), 0 0 16px rgba(34,211,238,0.08);
    opacity: 0;
    pointer-events: none;
    transform: translateY(-6px);
    transition: opacity .25s ease, transform .25s ease;
}
/* S5: The music bar is now reveal-on-demand. It only shows after a long-press
   or double-click on the mute button, and auto-hides after 4s or when focus
   leaves (click outside / Escape). This keeps it from overlaying game
   controls during play. The .show class is toggled by the new reveal logic. */
#nf-music-bar.show {
    opacity: 0.95;
    pointer-events: auto;
    transform: translateY(0);
}
#nf-music-bar.hidden-by-game { opacity: 0 !important; pointer-events: none !important; transform: translateY(-6px) !important; }
/* Collapsed state removed in S5 — the bar is now reveal-on-demand, so there
   is no need for a separate collapsed pill. The old .collapsed rules are
   gone; the bar simply shows or hides via .show. */
/* Pulse hint on the mute button when a long-press / dblclk would toggle the
   player — a subtle ring draws attention to the gesture. */
#mute-btn.nf-hint-pulse {
    box-shadow: 0 0 0 2px rgba(34,211,238,0.5);
    animation: nfHintPulse 1.2s ease-out 2;
}
@keyframes nfHintPulse {
    0%, 100% { box-shadow: 0 0 0 2px rgba(34,211,238,0.5); }
    50% { box-shadow: 0 0 0 5px rgba(34,211,238,0); }
}
.nf-music-btn {
    background: rgba(255,255,255,0.06);
    border: none;
    color: #c7c7f0;
    width: 26px; height: 26px;
    border-radius: 50%;
    cursor: pointer;
    font-size: 0.85em;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
    line-height: 1;
}
.nf-music-btn:active { transform: scale(0.9); }
.nf-music-info {
    min-width: 0;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    flex: 1;
}
.nf-music-label {
    font-size: 0.82em;
    color: #9ca3ff;
    letter-spacing: .5px;
}
.nf-music-track {
    font-weight: 600;
    color: #e8e8f5;
    overflow: hidden;
    text-overflow: ellipsis;
}
.nf-music-bars {
    display: inline-flex;
    align-items: flex-end;
    gap: 2px;
    height: 12px;
    margin-right: 2px;
    flex-shrink: 0;
}
.nf-music-bars span {
    width: 2px;
    background: linear-gradient(180deg, #22d3ee, #a78bfa);
    border-radius: 1px;
    animation: nfMusicBar 0.8s ease-in-out infinite;
}
.nf-music-bars span:nth-child(2) { animation-delay: .15s; }
.nf-music-bars span:nth-child(3) { animation-delay: .3s; }
.nf-music-bars span:nth-child(4) { animation-delay: .45s; }
@keyframes nfMusicBar {
    0%, 100% { height: 30%; }
    50% { height: 100%; }
}
#nf-music-bar.paused .nf-music-bars span { animation-play-state: paused; opacity: 0.4; }

@media (hover: hover) and (pointer: fine) {
    .nf-music-btn:hover { background: rgba(255,255,255,0.14); }
}
`;

export function initShell() {
  if (window.__nfShellInit) return;
  window.__nfShellInit = true;

  // ============ STATS ============
  interface RecentScore { score: number; lines: number; level: number; date: string }
  interface Stats {
    gamesPlayed: number;
    totalLines: number;
    totalScore: number;
    bestScore: number;
    bestLevel: number;
    playTimeSec: number;
    lastPlayed: string | null;
    achievements: string[];
    recentScores: RecentScore[];
  }
  const STATS_KEY = 'nf_stats';
  const DISMISS_KEY = 'nf_install_dismissed';
  const RECENT_MAX = 5;

  const ACHIEVEMENTS: { id: string; name: string; icon: string }[] = [
    { id: 'first_game', name: 'Erstes Spiel', icon: '◆' },
    { id: 'lines_50', name: '50 Linien', icon: '▣' },
    { id: 'lines_100', name: '100 Linien', icon: '▣' },
    { id: 'lines_500', name: '500 Linien', icon: '▣' },
    { id: 'score_1k', name: '1.000 Punkte', icon: '★' },
    { id: 'score_5k', name: '5.000 Punkte', icon: '★' },
    { id: 'score_20k', name: '20.000 Punkte', icon: '★' },
    { id: 'level_5', name: 'Level 5', icon: '▲' },
    { id: 'level_10', name: 'Level 10', icon: '▲' },
    { id: 'games_10', name: '10 Spiele', icon: '●' },
    { id: 'games_50', name: '50 Spiele', icon: '●' },
    { id: 'tetris_4', name: 'Tetris! (4er)', icon: '◆' },
  ];

  function defaultStats(): Stats {
    return {
      gamesPlayed: 0, totalLines: 0, totalScore: 0, bestScore: 0,
      bestLevel: 1, playTimeSec: 0, lastPlayed: null, achievements: [],
      recentScores: [],
    };
  }
  function loadStats(): Stats {
    try {
      const raw = localStorage.getItem(STATS_KEY);
      if (!raw) return defaultStats();
      return { ...defaultStats(), ...JSON.parse(raw) };
    } catch { return defaultStats(); }
  }
  function saveStats(s: Stats) {
    try { localStorage.setItem(STATS_KEY, JSON.stringify(s)); } catch {}
  }

  let stats = loadStats();
  let runningMaxLevel = 1;

  // ============ ACHIEVEMENT UNLOCK TOAST ============
  const achToast = document.getElementById('nf-ach-toast');
  let achToastTimer: any = null;
  function showAchToast(id: string) {
    const a = ACHIEVEMENTS.find(x => x.id === id);
    if (!a || !achToast) return;
    achToast.querySelector('.nf-ach-toast-icon')!.textContent = a.icon;
    achToast.querySelector('.nf-ach-toast-name')!.textContent = a.name;
    achToast.classList.add('show');
    if (achToastTimer) clearTimeout(achToastTimer);
    achToastTimer = setTimeout(() => achToast.classList.remove('show'), 3200);
  }

  function unlock(id: string) {
    if (!stats.achievements.includes(id)) {
      stats.achievements.push(id);
      saveStats(stats);
      showAchToast(id);
    }
  }

  function checkAchievements(singleGameLines: number, singleGameScore: number) {
    if (stats.gamesPlayed >= 1) unlock('first_game');
    if (stats.gamesPlayed >= 10) unlock('games_10');
    if (stats.gamesPlayed >= 50) unlock('games_50');
    if (stats.totalLines >= 50) unlock('lines_50');
    if (stats.totalLines >= 100) unlock('lines_100');
    if (stats.totalLines >= 500) unlock('lines_500');
    if (singleGameScore >= 1000 || stats.bestScore >= 1000) unlock('score_1k');
    if (singleGameScore >= 5000 || stats.bestScore >= 5000) unlock('score_5k');
    if (singleGameScore >= 20000 || stats.bestScore >= 20000) unlock('score_20k');
    if (stats.bestLevel >= 5) unlock('level_5');
    if (stats.bestLevel >= 10) unlock('level_10');
    // tetris_4 is awarded live by the #lines jump observer (a real 4-line clear).
  }

  function parseNum(s: string | null | undefined): number {
    if (!s) return 0;
    const m = s.replace(/[^\d]/g, '');
    return m ? parseInt(m, 10) : 0;
  }

  // Observe game-over screen becoming visible → record a finished game.
  const gameOverEl = document.getElementById('game-over-screen');
  let wasGameOver = false;
  if (gameOverEl) {
    const mo = new MutationObserver(() => {
      const visible = gameOverEl.classList.contains('visible');
      if (visible && !wasGameOver) {
        wasGameOver = true;
        const singleScore = parseNum(document.getElementById('final-score')?.textContent);
        const singleLines = parseNum(document.getElementById('lines')?.textContent);
        const singleLevel = runningMaxLevel;
        stats.gamesPlayed += 1;
        stats.totalLines += singleLines;
        stats.totalScore += singleScore;
        if (singleScore > stats.bestScore) stats.bestScore = singleScore;
        if (runningMaxLevel > stats.bestLevel) stats.bestLevel = runningMaxLevel;
        stats.lastPlayed = new Date().toISOString();
        stats.recentScores.unshift({ score: singleScore, lines: singleLines, level: singleLevel, date: stats.lastPlayed });
        if (stats.recentScores.length > RECENT_MAX) stats.recentScores.length = RECENT_MAX;
        checkAchievements(singleLines, singleScore);
        saveStats(stats);
      } else if (!visible && wasGameOver) {
        wasGameOver = false;
        runningMaxLevel = 1;
      }
    });
    mo.observe(gameOverEl, { attributes: true, attributeFilter: ['class'] });
  }

  // Track running max level during play.
  const levelEl = document.getElementById('level');
  if (levelEl) {
    const lvlMo = new MutationObserver(() => {
      const lv = parseNum(levelEl.textContent);
      if (lv > runningMaxLevel) runningMaxLevel = lv;
    });
    lvlMo.observe(levelEl, { childList: true, characterData: true, subtree: true });
  }

  // Detect a real Tetris (4 lines cleared at once) by watching #lines jump by
  // exactly 4 in a single mutation. Awards the tetris_4 achievement live.
  const linesEl = document.getElementById('lines');
  let lastLines = 0;
  if (linesEl) {
    lastLines = parseNum(linesEl.textContent);
    const linesMo = new MutationObserver(() => {
      const cur = parseNum(linesEl.textContent);
      const delta = cur - lastLines;
      lastLines = cur;
      if (delta >= 4) {
        stats = loadStats();
        unlock('tetris_4');
      }
    });
    linesMo.observe(linesEl, { childList: true, characterData: true, subtree: true });
  }

  // Track play time: 1s ticks while game is actively running.
  function isGameRunning(): boolean {
    // Game-state only (no document.hidden check) — used for the stats-panel
    // pause decision, which must pause even if the tab is focused.
    const hint = document.getElementById('hint-overlay');
    const start = document.getElementById('start-prompt');
    const pause = document.getElementById('pause-overlay');
    const over = document.getElementById('game-over-screen');
    if (hint && !hint.classList.contains('hidden')) return false;
    if (start && start.classList.contains('visible')) return false;
    if (pause && pause.classList.contains('visible')) return false;
    if (over && over.classList.contains('visible')) return false;
    return true;
  }
  function isGameActive(): boolean {
    // For play-time accounting: also require the tab to be visible.
    if (document.hidden) return false;
    return isGameRunning();
  }
  let tickCount = 0;
  setInterval(() => {
    if (isGameActive()) {
      stats = loadStats(); // merge in case another tab changed it
      stats.playTimeSec += 1;
      tickCount += 1;
      if (tickCount % 10 === 0) saveStats(stats);
      // check live achievements
      checkAchievements(0, stats.bestScore);
    }
  }, 1000);

  // ============ STATS PANEL ============
  const statsBtn = document.getElementById('nf-stats-btn');
  const statsPanel = document.getElementById('nf-stats-panel');
  let pausedByStats = false;

  function fmtTime(sec: number): string {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    if (h > 0) return h + 'h ' + m + 'm';
    if (m > 0) return m + 'm ' + s + 's';
    return s + 's';
  }
  function fmtDate(iso: string | null): string {
    if (!iso) return '—';
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
        ' ' + d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
    } catch { return '—'; }
  }

  function fmtRecent(iso: string): string {
    try {
      const d = new Date(iso);
      const now = new Date();
      const diffMin = Math.floor((now.getTime() - d.getTime()) / 60000);
      if (diffMin < 1) return 'gerade eben';
      if (diffMin < 60) return 'vor ' + diffMin + ' min';
      const diffH = Math.floor(diffMin / 60);
      if (diffH < 24) return 'vor ' + diffH + ' h';
      return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
    } catch { return '—'; }
  }

  function renderStats() {
    const s = loadStats();
    const card = document.getElementById('nf-stats-card');
    if (!card) return;
    const achHtml = ACHIEVEMENTS.map(a => {
      const got = s.achievements.includes(a.id);
      return '<div class="nf-ach' + (got ? ' unlocked' : '') + '">' +
        '<span class="nf-ach-icon">' + a.icon + '</span>' +
        '<span class="nf-ach-name">' + a.name + '</span></div>';
    }).join('');
    const recentHtml = (s.recentScores && s.recentScores.length)
      ? s.recentScores.map(r =>
          '<div class="nf-recent-item">' +
            '<span class="nf-recent-meta">L' + r.level + ' · ' + r.lines + ' Linien · ' + fmtRecent(r.date) + '</span>' +
            '<span class="nf-recent-score">' + r.score.toLocaleString('de-DE') + '</span>' +
          '</div>').join('')
      : '<div class="nf-recent-empty">Noch keine Spiele — leg los!</div>';
    card.innerHTML =
      '<div class="nf-stats-header">' +
        '<div class="nf-stats-title">STATISTIK</div>' +
        '<button class="nf-stats-close" id="nf-stats-close" aria-label="Schließen">✕</button>' +
      '</div>' +
      '<div class="nf-stats-grid">' +
        '<div class="nf-stat-cell"><div class="nf-stat-label">Spiele</div><div class="nf-stat-value">' + s.gamesPlayed + '</div></div>' +
        '<div class="nf-stat-cell"><div class="nf-stat-label">Bestes Level</div><div class="nf-stat-value">' + s.bestLevel + '</div></div>' +
        '<div class="nf-stat-cell"><div class="nf-stat-label">Highscore</div><div class="nf-stat-value accent">' + s.bestScore.toLocaleString('de-DE') + '</div></div>' +
        '<div class="nf-stat-cell"><div class="nf-stat-label">Linien gesamt</div><div class="nf-stat-value">' + s.totalLines.toLocaleString('de-DE') + '</div></div>' +
        '<div class="nf-stat-cell wide"><div class="nf-stat-label">Punkte gesamt</div><div class="nf-stat-value">' + s.totalScore.toLocaleString('de-DE') + '</div></div>' +
        '<div class="nf-stat-cell wide"><div class="nf-stat-label">Spielzeit</div><div class="nf-stat-value">' + fmtTime(s.playTimeSec) + '</div></div>' +
      '</div>' +
      '<div class="nf-section-label">Letzte Spiele</div>' +
      '<div class="nf-recent">' + recentHtml + '</div>' +
      '<div class="nf-section-label">Erfolge · ' + s.achievements.length + ' / ' + ACHIEVEMENTS.length + '</div>' +
      '<div class="nf-achievements">' + achHtml + '</div>' +
      '<div class="nf-stats-footer">zuletzt gespielt: ' + fmtDate(s.lastPlayed) + '</div>' +
      '<div class="nf-reset-row"><button class="nf-reset-btn" id="nf-stats-reset">Statistik zurücksetzen</button></div>' +
      '<div class="nf-reset-confirm" id="nf-reset-confirm">' +
        '<div class="nf-reset-confirm-text">Wirklich alle Statistiken & Erfolge löschen?<br>Dies kann nicht rückgängig gemacht werden.</div>' +
        '<div class="nf-reset-confirm-actions">' +
          '<button class="nf-reset-yes" id="nf-reset-yes">Löschen</button>' +
          '<button class="nf-reset-no" id="nf-reset-no">Abbrechen</button>' +
        '</div>' +
      '</div>';
    const closeBtn = document.getElementById('nf-stats-close');
    if (closeBtn) closeBtn.addEventListener('click', closeStats);
    const resetBtn = document.getElementById('nf-stats-reset');
    const resetConfirm = document.getElementById('nf-reset-confirm');
    if (resetBtn) resetBtn.addEventListener('click', () => {
      resetConfirm?.classList.add('show');
      (resetBtn as HTMLElement).style.display = 'none';
      // Scroll the confirm into view so its buttons are reachable (the card is
      // scrollable and the confirm sits at the bottom).
      setTimeout(() => resetConfirm?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50);
    });
    const resetNo = document.getElementById('nf-reset-no');
    if (resetNo) resetNo.addEventListener('click', () => {
      resetConfirm?.classList.remove('show');
      const rb = document.getElementById('nf-stats-reset');
      if (rb) (rb as HTMLElement).style.display = '';
    });
    const resetYes = document.getElementById('nf-reset-yes');
    if (resetYes) resetYes.addEventListener('click', () => {
      stats = defaultStats();
      saveStats(stats);
      renderStats();
    });
  }

  function openStats() {
    if (isGameRunning()) {
      const pb = document.getElementById('pause-btn') as HTMLButtonElement | null;
      if (pb) { pb.click(); pausedByStats = true; }
    }
    renderStats();
    statsPanel?.classList.add('show');
  }
  function closeStats() {
    statsPanel?.classList.remove('show');
    if (pausedByStats) {
      const rb = document.getElementById('resume-button') as HTMLButtonElement | null;
      if (rb) rb.click();
      pausedByStats = false;
    }
  }
  statsBtn?.addEventListener('click', (e) => { e.stopPropagation(); openStats(); });
  statsPanel?.addEventListener('click', (e) => { if (e.target === statsPanel) closeStats(); });

  // ============ ONLINE / OFFLINE ============
  const dot = document.getElementById('nf-online-dot');
  function updateOnline() {
    if (!dot) return;
    dot.classList.toggle('offline', !navigator.onLine);
    dot.title = navigator.onLine ? 'Online' : 'Offline — Spiel läuft weiter aus dem Cache';
  }
  updateOnline();
  window.addEventListener('online', updateOnline);
  window.addEventListener('offline', updateOnline);

  // ============ LANDSCAPE ROTATE HINT ============
  // The game is portrait-only. On narrow screens in landscape, show a polite
  // "please rotate" overlay so the board isn't squished. Desktop/tablet (wide
  // enough) is left alone.
  const rotateHint = document.getElementById('nf-rotate-hint');
  function updateRotateHint() {
    if (!rotateHint) return;
    const isLandscape = window.innerWidth > window.innerHeight;
    // Only enforce on phone-class widths (portrait width < 500). Tablets / desktop
    // have enough room in landscape.
    const isPhone = Math.min(window.innerWidth, window.innerHeight) < 500;
    rotateHint.classList.toggle('show', isLandscape && isPhone);
  }
  updateRotateHint();
  window.addEventListener('resize', updateRotateHint);
  window.addEventListener('orientationchange', updateRotateHint);

  // ============ MUSIC CROSSFADE PLAYER (21 tracks) ============
  // The game's own neonfall-music.mp3 is now a silent stub; this player provides
  // the real soundtrack with seamless 3 s crossfades between 21 tracks. It runs on
  // a separate AudioContext and syncs with the game's pause/mute/visibility.
  const TRACKS = [
    { file: '/music/track-1-neon-pulse.mp3',          name: 'Pulse Drive' },
    { file: '/music/track-2-neon-pulse-alt.mp3',      name: 'Static Bloom' },
    { file: '/music/track-3-neon-pixel-run.mp3',      name: 'Pixel Drift' },
    { file: '/music/track-4-neon-pixel-run-alt.mp3',  name: 'Bitstream' },
    { file: '/music/track-5-neon-pixel-rush.mp3',     name: 'Grid Runner' },
    { file: '/music/track-6-neon-pixel-rush-alt.mp3', name: 'Circuit Breaker' },
    { file: '/music/track-7-block-rush.mp3',          name: 'Cascade' },
    { file: '/music/track-8-block-rush-alt.mp3',      name: 'Freefall' },
    { file: '/music/track-9-block-rush-ii.mp3',       name: 'Avalanche' },
    { file: '/music/track-10-block-rush-iii.mp3',     name: 'Thunderfall' },
    { file: '/music/track-11-block-rush-iv.mp3',      name: 'Momentum Shift' },
    { file: '/music/track-12-block-rush-v.mp3',       name: 'Overdrive' },
    // S8.17: Fixed file paths to match actual files in public/music/
    //   (previously pointed to non-existent track-13..16-*.mp3 -> 404 errors).
    //   Added the missing 5 tracks (17-21) that were uploaded but never listed.
    { file: '/music/track-13-block-rush-vi.mp3',          name: 'Neon Storm' },
    { file: '/music/track-14-neon-block-rush.mp3',        name: 'Electric Rain' },
    { file: '/music/track-15-neon-block-rush-alt.mp3',    name: 'Heartbeat Sync' },
    { file: '/music/track-16-neon-pulse-ii.mp3',          name: 'Voltage Surge' },
    { file: '/music/track-17-neon-pulse-iii.mp3',         name: 'Current Drift' },
    { file: '/music/track-18-neon-pixel-run.mp3',         name: 'Pixel Wave' },
    { file: '/music/track-19-neon-pixel-run-alt.mp3',     name: 'Bitstorm' },
    { file: '/music/track-20-neon-pixel-rush.mp3',        name: 'Hyperdrive' },
    { file: '/music/track-21-neon-pixel-rush-alt.mp3',    name: 'Quantum Leap' },
  ];
  const FADE_DUR = 3.0;          // seconds of crossfade between tracks
  const MUSIC_VOL = 0.5;         // target music volume (matches game's musicGain)
  const musicBar = document.getElementById('nf-music-bar');
  const musicTrackEl = document.getElementById('nf-music-track');
  let mCtx: AudioContext | null = null;
  let mMaster: GainNode | null = null;     // master (mute) gain
  let mVol: GainNode | null = null;        // volume gain (for crossfades + pause ramps)
  let buffers: (AudioBuffer | null)[] = TRACKS.map(() => null);
  let curIdx = 0;
  let curSrc: AudioBufferSourceNode | null = null;
  let nextTimer: any = null;
  let mStarted = false;
  let mPaused = false;          // paused by game-pause sync
  let mMuted = false;           // muted by game-mute sync

  async function loadTrack(i: number): Promise<AudioBuffer | null> {
    if (buffers[i]) return buffers[i];
    if (!mCtx) return null;
    try {
      const res = await fetch(TRACKS[i].file);
      const ab = await res.arrayBuffer();
      const buf = await mCtx.decodeAudioData(ab);
      buffers[i] = buf;
      return buf;
    } catch { return null; }
  }

  function updateMusicBar() {
    if (!musicBar || !musicTrackEl) return;
    musicTrackEl.textContent = TRACKS[curIdx]?.name || '—';
    musicBar.classList.toggle('paused', mPaused || mMuted);
  }

  function stopCurSource() {
    if (nextTimer) { clearTimeout(nextTimer); nextTimer = null; }
    if (curSrc) {
      try { curSrc.onended = null; curSrc.stop(); } catch {}
      curSrc = null;
    }
  }

  // Play track i immediately, fading in over fadeInDur. Schedules the next track
  // to crossfade in FADE_DUR before this track ends.
  async function playTrack(i: number, fadeInDur: number) {
    if (!mCtx || !mVol) return;
    const buf = await loadTrack(i);
    if (!buf || !mCtx) return;
    // If we switched tracks while loading, abort.
    if (curIdx !== i) return;
    stopCurSource();
    curSrc = mCtx.createBufferSource();
    curSrc.buffer = buf;
    curSrc.loop = false;
    const t0 = mCtx.currentTime;
    const srcGain = mCtx.createGain();
    srcGain.gain.setValueAtTime(0.0001, t0);
    srcGain.gain.exponentialRampToValueAtTime(MUSIC_VOL, t0 + fadeInDur);
    curSrc.connect(srcGain); srcGain.connect(mVol);
    curSrc.start(t0);
    // schedule crossfade to next track
    const dur = buf.duration;
    const crossStart = Math.max(0, dur - FADE_DUR);
    if (nextTimer) clearTimeout(nextTimer);
    nextTimer = setTimeout(() => {
      // fade out current, start next
      if (curSrc && mCtx) {
        const tt = mCtx.currentTime;
        try {
          srcGain.gain.cancelScheduledValues(tt);
          srcGain.gain.setValueAtTime(srcGain.gain.value, tt);
          srcGain.gain.exponentialRampToValueAtTime(0.0001, tt + FADE_DUR);
        } catch {}
      }
      curIdx = (curIdx + 1) % TRACKS.length;
      // give the fade-out a moment, then start next (overlapping)
      setTimeout(() => { playTrack(curIdx, FADE_DUR); updateMusicBar(); }, 50);
      // stop the old source after the fade completes
      setTimeout(() => {
        if (curSrc && curSrc.buffer === buf) {
          try { curSrc.stop(); } catch {}
        }
      }, FADE_DUR * 1000 + 100);
    }, crossStart * 1000);
    updateMusicBar();
  }

  function startMusic() {
    if (mStarted) return;
    mStarted = true;
    try {
      mCtx = new (window.AudioContext || window.webkitAudioContext)();
      mMaster = mCtx.createGain();
      mMaster.gain.value = mMuted ? 0 : 1;
      mMaster.connect(mCtx.destination);
      mVol = mCtx.createGain();
      mVol.gain.value = mPaused ? 0 : 1;
      mVol.connect(mMaster);
    } catch { return; }
    // Mobile (especially iOS) keeps AudioContext suspended even after a user
    // gesture unless we explicitly resume it. Without this, the music bar
    // appears but no sound plays — SFX still work because the game's own
    // audioCtx.resume() is called separately. This was the root cause of
    // "I hear sound effects but no music" reports.
    if (mCtx.state === 'suspended') mCtx.resume().catch(() => {});
    // S5: do NOT auto-show the music bar here. It is reveal-on-demand only
    // (long-press / double-click on the mute button). The music plays in the
    // background; the bar stays hidden until the user explicitly asks for it.
    curIdx = Math.floor(Math.random() * TRACKS.length); // start on a random track
    playTrack(curIdx, 1.5);
    // preload the next track in the background
    loadTrack((curIdx + 1) % TRACKS.length);
  }

  function setMusicMuted(muted: boolean) {
    mMuted = muted;
    if (mMaster && mCtx) {
      const t = mCtx.currentTime;
      mMaster.gain.cancelScheduledValues(t);
      mMaster.gain.setValueAtTime(mMaster.gain.value, t);
      mMaster.gain.linearRampToValueAtTime(muted ? 0 : 1, t + 0.08);
    }
    updateMusicBar();
  }
  function setMusicPaused(paused: boolean) {
    mPaused = paused;
    if (mVol && mCtx) {
      const t = mCtx.currentTime;
      mVol.gain.cancelScheduledValues(t);
      mVol.gain.setValueAtTime(mVol.gain.value, t);
      mVol.gain.linearRampToValueAtTime(paused ? 0 : 1, t + 0.12);
    }
    if (mCtx) {
      if (paused) mCtx.suspend().catch(() => {});
      else mCtx.resume().catch(() => {});
    }
    updateMusicBar();
  }
  function skipMusic(dir: number) {
    if (!mStarted) { startMusic(); return; }
    curIdx = (curIdx + dir + TRACKS.length) % TRACKS.length;
    // stop + immediately play new track with short fade
    stopCurSource();
    if (mCtx) mCtx.resume().catch(() => {});
    playTrack(curIdx, 0.8);
    loadTrack((curIdx + 1) % TRACKS.length);
  }

  // Wire player buttons
  (document.getElementById('nf-music-prev') as HTMLButtonElement | null)
    ?.addEventListener('click', (e) => { e.stopPropagation(); skipMusic(-1); });
  (document.getElementById('nf-music-next') as HTMLButtonElement | null)
    ?.addEventListener('click', (e) => { e.stopPropagation(); skipMusic(1); });

  // ============ Music bar reveal-on-demand (S5 redesign) ============
  // The bar is hidden by default and only appears when the user long-presses
  // or double-clicks the mute button. It auto-hides after 4s, or immediately
  // on click-outside / Escape. This keeps it from overlaying game controls.
  let musicHideTimer: any = null;
  function showMusicBar() {
    if (!musicBar) return;
    musicBar.classList.add('show');
    if (musicHideTimer) clearTimeout(musicHideTimer);
    musicHideTimer = setTimeout(() => {
      musicBar.classList.remove('show');
    }, 4000);
  }
  function hideMusicBar() {
    if (!musicBar) return;
    musicBar.classList.remove('show');
    if (musicHideTimer) { clearTimeout(musicHideTimer); musicHideTimer = null; }
  }

  const muteBtnEl = document.getElementById('mute-btn');
  if (muteBtnEl) {
    // Long-press (mobile / touch): 450 ms hold → reveal music bar.
    let lpTimer: any = null;
    let lpFired = false;
    muteBtnEl.addEventListener('touchstart', () => {
      lpFired = false;
      lpTimer = setTimeout(() => { lpFired = true; showMusicBar(); }, 450);
    }, { passive: true });
    const cancelLP = () => { if (lpTimer) { clearTimeout(lpTimer); lpTimer = null; } };
    muteBtnEl.addEventListener('touchend', cancelLP);
    muteBtnEl.addEventListener('touchmove', cancelLP);
    muteBtnEl.addEventListener('touchcancel', cancelLP);
    // Prevent the game's click-mute from firing right after a long-press reveal.
    muteBtnEl.addEventListener('click', (e) => { if (lpFired) { e.preventDefault(); e.stopPropagation(); lpFired = false; } }, true);

    // Double-click (desktop / mouse): reveal music bar.
    muteBtnEl.addEventListener('dblclick', (e) => { e.preventDefault(); e.stopPropagation(); showMusicBar(); });

    // One-time hint pulse so users discover the gesture.
    setTimeout(() => {
      if (!sessionStorage.getItem('nf_hint_shown')) {
        muteBtnEl.classList.add('nf-hint-pulse');
        setTimeout(() => muteBtnEl.classList.remove('nf-hint-pulse'), 2600);
        try { sessionStorage.setItem('nf_hint_shown', '1'); } catch {}
      }
    }, 2500);
  }

  // Click outside the music bar (or outside the mute button) hides it.
  document.addEventListener('click', (e) => {
    if (!musicBar?.classList.contains('show')) return;
    const target = e.target as Node;
    if (musicBar.contains(target)) return;
    if (muteBtnEl?.contains(target)) return;
    hideMusicBar();
  }, true);
  // Escape hides the music bar.
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && musicBar?.classList.contains('show')) {
      hideMusicBar();
    }
  });

  // Start music on first user interaction (same triggers as the game's initAudio)
  function tryStartMusic() { if (!mStarted) startMusic(); }
  const gc = document.getElementById('game-container');
  gc?.addEventListener('touchstart', tryStartMusic, { passive: true });
  gc?.addEventListener('mousedown', tryStartMusic);
  document.addEventListener('keydown', tryStartMusic);
  // also start when the hint closes / start-prompt tapped
  document.getElementById('hint-close-button')?.addEventListener('click', tryStartMusic);
  document.getElementById('start-prompt')?.addEventListener('click', tryStartMusic);

  // Sync with game pause (#pause-overlay .visible)
  const pauseOv = document.getElementById('pause-overlay');
  if (pauseOv) {
    new MutationObserver(() => {
      if (!mStarted) return;
      setMusicPaused(pauseOv.classList.contains('visible'));
    }).observe(pauseOv, { attributes: true, attributeFilter: ['class'] });
  }
  // Sync with game-over screen: keep playing (no change), but if the user
  // restarts we just keep the music flowing.
  // Sync with game mute (#mute-btn data-muted attribute)
  const muteBtn = document.getElementById('mute-btn');
  if (muteBtn) {
    new MutationObserver(() => {
      // S7.5b: IIFE uses innerHTML with SVGs now, not textContent emojis.
      // Check data-muted attribute instead (set by applyMuteState in IIFE).
      setMusicMuted(muteBtn.getAttribute('data-muted') === '1');
    }).observe(muteBtn, { attributes: true, attributeFilter: ['data-muted'] });
  }
  // Sync with tab visibility (game silences its audio on hide; do the same)
  document.addEventListener('visibilitychange', () => {
    if (!mStarted) return;
    if (document.hidden) {
      if (mMaster && mCtx) {
        const t = mCtx.currentTime;
        mMaster.gain.cancelScheduledValues(t);
        mMaster.gain.setValueAtTime(mMaster.gain.value, t);
        mMaster.gain.linearRampToValueAtTime(0, t + 0.05);
      }
    } else if (!mMuted) {
      // S7.5b: mCtx might be auto-suspended by browser after background.
      // Resume explicitly before fading in, otherwise no music plays.
      if (mCtx && mCtx.state === 'suspended') mCtx.resume().catch(() => {});
      if (mMaster && mCtx) {
        const t = mCtx.currentTime;
        mMaster.gain.cancelScheduledValues(t);
        mMaster.gain.setValueAtTime(0, t);
        mMaster.gain.linearRampToValueAtTime(1, t + 0.2);
      }
    }
  });
  // Hide the music bar while a game modal covers the board (hint at first load)
  function syncMusicBarVisibility() {
    const hint = document.getElementById('hint-overlay');
    const over = document.getElementById('game-over-screen');
    const hide = (hint && !hint.classList.contains('hidden')) || (over && over.classList.contains('visible'));
    musicBar?.classList.toggle('hidden-by-game', !!hide);
  }
  ['hint-overlay', 'game-over-screen'].forEach(id => {
    const el = document.getElementById(id);
    if (el) new MutationObserver(syncMusicBarVisibility).observe(el, { attributes: true, attributeFilter: ['class'] });
  });
  syncMusicBarVisibility();

  // Shift the music bar up when the install banner is visible (they share the
  // bottom edge; this prevents the banner from covering the skip buttons).
  const installBanner = document.getElementById('nf-install-banner');
  function syncMusicBarShift() {
    musicBar?.classList.toggle('shift-up', installBanner?.classList.contains('show') || false);
  }
  if (installBanner) {
    new MutationObserver(syncMusicBarShift).observe(installBanner, { attributes: true, attributeFilter: ['class'] });
  }

  // ============ PWA INSTALL ============
  const banner = document.getElementById('nf-install-banner');
  const iosCard = document.getElementById('nf-ios-install');
  let deferredPrompt: any = null;
  let pendingShowBanner = false;

  function isStandalone(): boolean {
    return (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
      navigator.standalone === true;
  }
  function isIOS(): boolean {
    const ua = navigator.userAgent;
    return /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && 'ontouchend' in document);
  }
  // Don't show the banner over a game modal (hint / pause / game-over) — it would
  // cover interactive controls like the hint's close button.
  function modalIsVisible(): boolean {
    const hint = document.getElementById('hint-overlay');
    const pause = document.getElementById('pause-overlay');
    const over = document.getElementById('game-over-screen');
    if (hint && !hint.classList.contains('hidden')) return true;
    if (pause && pause.classList.contains('visible')) return true;
    if (over && over.classList.contains('visible')) return true;
    return false;
  }
  function tryShowBanner() {
    if (!deferredPrompt) return;
    if (localStorage.getItem(DISMISS_KEY)) return;
    if (modalIsVisible()) { pendingShowBanner = true; return; }
    banner?.classList.add('show');
  }

  window.addEventListener('beforeinstallprompt', (e: Event) => {
    e.preventDefault();
    deferredPrompt = e;
    if (!isStandalone()) tryShowBanner();
  });

  // When the hint overlay closes, show a pending banner if one was deferred.
  const hintEl = document.getElementById('hint-overlay');
  if (hintEl) {
    new MutationObserver(() => {
      if (hintEl.classList.contains('hidden') && pendingShowBanner) {
        pendingShowBanner = false;
        tryShowBanner();
      }
    }).observe(hintEl, { attributes: true, attributeFilter: ['class'] });
  }

  (document.getElementById('nf-install-accept') as HTMLButtonElement | null)
    ?.addEventListener('click', async () => {
      if (!deferredPrompt) return;
      banner?.classList.remove('show');
      deferredPrompt.prompt();
      try { await deferredPrompt.userChoice; } catch {}
      deferredPrompt = null;
    });
  (document.getElementById('nf-install-dismiss') as HTMLButtonElement | null)
    ?.addEventListener('click', () => {
      banner?.classList.remove('show');
      try { localStorage.setItem(DISMISS_KEY, '1'); } catch {}
    });

  // On iOS, surface an "installieren" hint via the stats-area or a one-time banner button.
  // We expose it through a small persistent affordance: tapping the online-dot on iOS opens the guide.
  if (isIOS() && !isStandalone()) {
    dot?.addEventListener('click', () => iosCard?.classList.add('show'));
    dot!.style.pointerEvents = 'auto';
    dot!.style.cursor = 'pointer';
  }
  (document.getElementById('nf-ios-close') as HTMLButtonElement | null)
    ?.addEventListener('click', () => iosCard?.classList.remove('show'));
  iosCard?.addEventListener('click', (e) => { if (e.target === iosCard) iosCard.classList.remove('show'); });

  // ============ SERVICE WORKER UPDATE ============
  const updateToast = document.getElementById('nf-update-toast');
  function showUpdateToast() { updateToast?.classList.add('show'); }
  (document.getElementById('nf-update-reload') as HTMLButtonElement | null)
    ?.addEventListener('click', () => { window.location.reload(); });

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').then((reg) => {
        reg.addEventListener('updatefound', () => {
          const nw = reg.installing;
          if (!nw) return;
          nw.addEventListener('statechange', () => {
            if (nw.state === 'installed' && navigator.serviceWorker.controller) {
              showUpdateToast();
            }
          });
        });
        // periodic update check
        setInterval(() => { reg.update().catch(() => {}); }, 60 * 60 * 1000);
      }).catch(() => {});
    });
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      // a new SW took control after reload; nothing to do here.
    });
    if (document.readyState === 'complete') {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }
}
