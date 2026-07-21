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
    font-family: 'Space Grotesk', sans-serif;
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
    font-family: 'Space Grotesk', sans-serif;
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
    font-family: 'JetBrains Mono', monospace;
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
    font-family: 'JetBrains Mono', monospace;
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
    font-family: 'Space Grotesk', sans-serif;
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
    font-family: 'Space Grotesk', sans-serif;
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
    font-family: 'Space Grotesk', sans-serif;
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
    font-family: 'Space Grotesk', sans-serif;
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
`;

export function initShell() {
  if ((window as any).__nfShellInit) return;
  (window as any).__nfShellInit = true;

  // ============ STATS ============
  interface Stats {
    gamesPlayed: number;
    totalLines: number;
    totalScore: number;
    bestScore: number;
    bestLevel: number;
    playTimeSec: number;
    lastPlayed: string | null;
    achievements: string[];
  }
  const STATS_KEY = 'nf_stats';
  const DISMISS_KEY = 'nf_install_dismissed';

  const ACHIEVEMENTS: { id: string; name: string; icon: string }[] = [
    { id: 'first_game', name: 'Erstes Spiel', icon: '🎮' },
    { id: 'lines_50', name: '50 Linien', icon: '📏' },
    { id: 'lines_100', name: '100 Linien', icon: '📊' },
    { id: 'lines_500', name: '500 Linien', icon: '🏆' },
    { id: 'score_1k', name: '1.000 Punkte', icon: '⭐' },
    { id: 'score_5k', name: '5.000 Punkte', icon: '💫' },
    { id: 'score_20k', name: '20.000 Punkte', icon: '✨' },
    { id: 'level_5', name: 'Level 5', icon: '📈' },
    { id: 'level_10', name: 'Level 10', icon: '🚀' },
    { id: 'games_10', name: '10 Spiele', icon: '🎯' },
    { id: 'games_50', name: '50 Spiele', icon: '🏅' },
    { id: 'tetris_4', name: 'Tetris! (4er)', icon: '💎' },
  ];

  function defaultStats(): Stats {
    return {
      gamesPlayed: 0, totalLines: 0, totalScore: 0, bestScore: 0,
      bestLevel: 1, playTimeSec: 0, lastPlayed: null, achievements: [],
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

  function unlock(id: string) {
    if (!stats.achievements.includes(id)) {
      stats.achievements.push(id);
      saveStats(stats);
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
        stats.gamesPlayed += 1;
        stats.totalLines += singleLines;
        stats.totalScore += singleScore;
        if (singleScore > stats.bestScore) stats.bestScore = singleScore;
        if (runningMaxLevel > stats.bestLevel) stats.bestLevel = runningMaxLevel;
        stats.lastPlayed = new Date().toISOString();
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
      '<div class="nf-section-label">Erfolge · ' + s.achievements.length + ' / ' + ACHIEVEMENTS.length + '</div>' +
      '<div class="nf-achievements">' + achHtml + '</div>' +
      '<div class="nf-stats-footer">zuletzt gespielt: ' + fmtDate(s.lastPlayed) + '</div>';
    const closeBtn = document.getElementById('nf-stats-close');
    if (closeBtn) closeBtn.addEventListener('click', closeStats);
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

  // ============ PWA INSTALL ============
  const banner = document.getElementById('nf-install-banner');
  const iosCard = document.getElementById('nf-ios-install');
  let deferredPrompt: any = null;
  let pendingShowBanner = false;

  function isStandalone(): boolean {
    return (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
      (navigator as any).standalone === true;
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
