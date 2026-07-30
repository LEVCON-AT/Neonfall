// AUTO-GENERATED from upload/neonfall-10.html by scripts/extract.js
// Do not edit by hand. Re-run: bun run scripts/extract.js
export const GAME_CSS = `
    * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
    html, body {
        margin: 0;
        height: 100vh;
        height: 100dvh;
        overflow: hidden;
        touch-action: none;
        background: #0a0a14;
        font-family: var(--font-space-grotesk), sans-serif;
        color: #e8e8f5;
    }

    body {
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 38px 8px 6px;
        gap: 6px;
        z-index: 1;
    }

    body::before, body::after {
        content: '';
        position: fixed;
        width: 60vmax;
        height: 60vmax;
        border-radius: 50%;
        filter: blur(80px);
        z-index: -1;
        opacity: 0.32;
        animation: drift 16s ease-in-out infinite alternate;
    }
    body::before { background: radial-gradient(circle, #22d3ee, transparent 70%); top: -20%; left: -20%; }
    body::after { background: radial-gradient(circle, #a855f7, transparent 70%); bottom: -25%; right: -20%; animation-delay: -8s; }
    @keyframes drift {
        0% { transform: translate(0,0) scale(1); }
        100% { transform: translate(6%, 8%) scale(1.15); }
    }

    h1#title {
        margin: 0;
        font-size: 0;
        flex: 0 0 auto;
        position: fixed;
        top: max(8px, env(safe-area-inset-top));
        left: 50%;
        transform: translateX(-50%);
        z-index: 20;
        opacity: 0.6;
    }

    .glass {
        background: rgba(255,255,255,0.045);
        backdrop-filter: blur(18px) saturate(160%);
        -webkit-backdrop-filter: blur(18px) saturate(160%);
        border: 1px solid rgba(255,255,255,0.09);
        box-shadow: 0 8px 28px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.06);
        border-radius: 14px;
    }

    #top-bar, #second-bar {
        display: flex;
        align-items: stretch;
        justify-content: center;
        width: 100%;
        max-width: 318px;  /* = canvas(300px) + container padding(8+8) + border(1+1) = 318px */
        gap: 6px;
        flex: 0 0 auto;
    }

    .stat-box { padding: 4px 6px; text-align: center; flex: 1; min-width: 0; }
    .stat-box h3 { margin: 0; font-size: 0.55em; color: #9ca3ff; letter-spacing: 1.5px; font-weight: 600; }
    .stat-box p {
        margin: 1px 0 0;
        font-family: var(--font-jetbrains-mono), monospace;
        font-size: 1.05em;
        font-weight: 700;
        line-height: 1.15;
        background: linear-gradient(90deg, #e8e8f5, #c7c7f0);
        -webkit-background-clip: text;
        background-clip: text;
        color: transparent;
    }

    .mini-box {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 4px 8px;
        gap: 1px;
        cursor: pointer;
        transition: opacity 0.2s, transform 0.15s;
        flex: 1;
    }
    .mini-box:active { transform: scale(0.94); }
    .mini-box.disabled { opacity: 0.35; cursor: default; }
    .mini-box h3 { margin: 0; font-size: 0.55em; color: #9ca3ff; letter-spacing: 1.5px; font-weight: 600; }

    #mute-btn {
        position: fixed;
        top: max(8px, env(safe-area-inset-top));
        right: max(8px, env(safe-area-inset-right));
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
    }
    #mute-btn:active { transform: scale(0.9); opacity: 1; }

    #info-btn {
        position: fixed;
        top: max(8px, env(safe-area-inset-top));
        left: max(8px, env(safe-area-inset-left));
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
    }
    #info-btn:active { transform: scale(0.9); opacity: 1; }

    #game-container {
        position: relative;
        flex: 0 1 auto;
        min-height: 0;
        width: fit-content;
        max-width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 18px;
        padding: 8px;
        background: linear-gradient(145deg, rgba(34,211,238,0.08), rgba(168,85,247,0.08));
        border: 1px solid rgba(255,255,255,0.1);
        box-shadow: 0 0 0 1px rgba(255,255,255,0.03), 0 20px 60px rgba(0,0,0,0.55), 0 0 40px rgba(120,90,255,0.15);
        overflow: hidden;
    }

    #tetris-canvas {
        display: block;
        height: 100%;
        width: auto;
        max-width: 100%;
        max-height: 100%;
        aspect-ratio: 12 / 24;
        object-fit: contain;
        border-radius: 10px;
        touch-action: none;
    }

    #flash-overlay {
        position: absolute;
        top: 8px; left: 8px; right: 8px; bottom: 8px;
        background: #ffffff;
        opacity: 0;
        pointer-events: none;
        border-radius: 10px;
    }

    #combo-popup {
        position: absolute;
        top: 42%;
        left: 50%;
        transform: translate(-50%, -50%) scale(0.6);
        font-family: var(--font-space-grotesk), sans-serif;
        font-weight: 700;
        font-size: 1.5em;
        letter-spacing: 1px;
        background: linear-gradient(90deg, #22d3ee, #f472b6);
        -webkit-background-clip: text;
        background-clip: text;
        color: transparent;
        text-shadow: 0 0 30px rgba(244,114,182,0.4);
        opacity: 0;
        pointer-events: none;
        white-space: nowrap;
    }
    #combo-popup.pop { animation: comboPop 0.7s cubic-bezier(.2,.9,.3,1.3); }
    @keyframes comboPop {
        0% { opacity: 0; transform: translate(-50%,-50%) scale(0.5); }
        25% { opacity: 1; transform: translate(-50%,-50%) scale(1.25); }
        60% { opacity: 1; transform: translate(-50%,-55%) scale(1.05); }
        100% { opacity: 0; transform: translate(-50%,-75%) scale(1); }
    }

    #hint-overlay {
        position: absolute;
        top: 8px; left: 8px; right: 8px; bottom: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        text-align: center;
        padding: 16px;
        background: rgba(8,8,18,0.72);
        backdrop-filter: blur(6px);
        color: #e8e8f5;
        font-size: 0.75em;
        line-height: 1.7;
        pointer-events: auto;
        transition: opacity 0.8s ease;
        border-radius: 10px;
        overflow-y: auto;
        z-index: 15;
    }
    #hint-overlay b { color: #a78bfa; }
    #hint-overlay.hidden { opacity: 0; pointer-events: none; }
    #hint-content {
        max-width: 480px;
        margin: auto;
    }
    #hint-content p { margin: 0 0 8px; }
    .hint-col { text-align: left; margin-bottom: 10px; }
    .hint-col h3 {
        margin: 0 0 6px;
        font-size: 0.85em;
        letter-spacing: 1.5px;
        text-transform: uppercase;
        color: #9ca3ff;
        text-align: center;
    }
    kbd {
        display: inline-block;
        min-width: 1.6em;
        padding: 2px 6px;
        font-family: var(--font-jetbrains-mono), monospace;
        font-size: 0.9em;
        color: #e8e8f5;
        background: rgba(255,255,255,0.08);
        border: 1px solid rgba(255,255,255,0.2);
        border-bottom-width: 2px;
        border-radius: 5px;
        text-align: center;
    }
    #hide-hint-label {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        margin: 14px 0 10px;
        font-size: 0.95em;
        color: #c7c7f0;
        cursor: pointer;
    }
    #hide-hint-label input { accent-color: #a78bfa; width: 15px; height: 15px; }
    #hint-close-button {
        display: block;
        margin: 0 auto 10px;
        padding: 10px 26px;
        font-size: 1em;
        font-family: var(--font-space-grotesk), sans-serif;
        font-weight: 600;
        background: linear-gradient(90deg, #22d3ee, #a78bfa);
        color: #0a0a14;
        border: none;
        border-radius: 10px;
        cursor: pointer;
        letter-spacing: 1px;
    }
    #hint-close-button:active { transform: scale(0.96); }

    #start-prompt {
        position: absolute;
        top: 8px; left: 8px; right: 8px; bottom: 8px;
        display: none;
        align-items: center;
        justify-content: center;
        text-align: center;
        background: rgba(6,6,14,0.42);
        pointer-events: none;
        border-radius: 10px;
        z-index: 12;
    }
    #start-prompt.visible { display: flex; }
    .start-prompt-inner {
        color: #e8e8f5;
        font-family: var(--font-space-grotesk), sans-serif;
        font-weight: 600;
        letter-spacing: 1.5px;
        font-size: 0.95em;
        text-shadow: 0 0 20px rgba(0,0,0,0.6);
    }
    #start-prompt-icon {
        font-size: 2.2em;
        margin-bottom: 8px;
        background: linear-gradient(90deg, #22d3ee, #a78bfa, #f472b6);
        -webkit-background-clip: text;
        background-clip: text;
        color: transparent;
        animation: startPulse 1.4s ease-in-out infinite;
    }
    @keyframes startPulse {
        0%, 100% { transform: scale(1); opacity: 0.85; }
        50% { transform: scale(1.15); opacity: 1; }
    }

    #game-over-screen {
        position: absolute;
        top: 8px; left: 8px; right: 8px; bottom: 8px;
        background: rgba(6,6,14,0.9);
        backdrop-filter: blur(8px);
        display: none;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        z-index: 10;
        text-align: center;
        border-radius: 10px;
        overflow-y: auto;
        padding: 10px;
    }
    #game-over-screen.visible { display: flex; }
    #game-over-screen h1 {
        font-size: 1.5em;
        margin-bottom: 8px;
        background: linear-gradient(90deg, #f472b6, #22d3ee);
        -webkit-background-clip: text;
        background-clip: text;
        color: transparent;
    }
    #game-over-screen p { color: #c7c7f0; font-size: 1em; margin-bottom: 18px; font-family: var(--font-jetbrains-mono), monospace; }
    #game-over-screen button {
        padding: 11px 24px;
        font-size: 1em;
        font-family: var(--font-space-grotesk), sans-serif;
        font-weight: 600;
        background: linear-gradient(90deg, #22d3ee, #a78bfa);
        color: #0a0a14;
        border: none;
        border-radius: 10px;
        cursor: pointer;
        letter-spacing: 1px;
        /* S8.18-P4: restart button fills width to prevent overflow.
           !important on align-self to override parent align-items:center. */
        width: 100%;
        max-width: 220px;
        align-self: stretch !important;
    }
    #game-over-screen button:active { transform: scale(0.96); }

    .level-select {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: center;
        gap: 6px 10px;
        margin-bottom: 18px;
        font-size: 0.85em;
        color: #c7c7f0;
        width: 100% !important;
        max-width: 220px;
        align-self: stretch !important;
    }
    /* S8.18-P4: "Startlevel" label gets its own line; the − value + buttons
       group together below it. Prevents overflow on narrow screens.
       Using !important because the original .level-select span rule
       (inherited from older CSS) sets display:inline. */
    .level-select span {
        display: block !important;
        width: 100% !important;
        text-align: center;
        margin-bottom: 2px;
    }
    .level-select b {
        font-family: var(--font-jetbrains-mono), monospace;
        font-size: 1.2em;
        color: #e8e8f5;
        min-width: 1.2em;
        text-align: center;
    }
    .level-select button {
        width: 32px;
        height: 32px;
        border-radius: 8px;
        border: 1px solid rgba(255,255,255,0.15);
        background: rgba(255,255,255,0.06);
        color: #e8e8f5;
        font-size: 1.1em;
        cursor: pointer;
        line-height: 1;
        flex-shrink: 0;
    }
    .level-select button:active { transform: scale(0.92); }

    #pause-btn {
        position: fixed;
        top: max(8px, env(safe-area-inset-top));
        right: calc(max(8px, env(safe-area-inset-right)) + 42px);
        background: rgba(255,255,255,0.06);
        border: 1px solid rgba(255,255,255,0.08);
        color: rgba(199,199,240,0.65);
        border-radius: 50%;
        width: 34px;
        height: 34px;
        font-size: 0.9em;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 20;
        opacity: 0.6;
    }
    #pause-btn:active { transform: scale(0.9); opacity: 1; }

    #pause-overlay {
        position: absolute;
        top: 8px; left: 8px; right: 8px; bottom: 8px;
        background: rgba(6,6,14,0.9);
        backdrop-filter: blur(8px);
        display: none;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        z-index: 10;
        text-align: center;
        border-radius: 10px;
        overflow-y: auto;
        padding: 10px;
    }
    #pause-overlay.visible { display: flex; }
    #pause-overlay h1 {
        font-size: 1.5em;
        margin-bottom: 8px;
        letter-spacing: 3px;
        background: linear-gradient(90deg, #22d3ee, #a78bfa, #f472b6);
        -webkit-background-clip: text;
        background-clip: text;
        color: transparent;
    }
    #pause-overlay p { color: #c7c7f0; font-size: 1em; margin-bottom: 14px; font-family: var(--font-jetbrains-mono), monospace; }

    #settings-panel {
        width: 100%;
        max-width: 240px;
        background: rgba(255,255,255,0.04);
        border: 1px solid rgba(255,255,255,0.08);
        border-radius: 12px;
        padding: 12px 14px;
        margin-bottom: 16px;
    }
    #settings-panel h2 {
        margin: 0 0 10px;
        font-size: 0.7em;
        letter-spacing: 1.5px;
        color: #9ca3ff;
        font-weight: 600;
        text-transform: uppercase;
        text-align: left;
    }
    .settings-row { margin-bottom: 10px; }
    .settings-row:last-child { margin-bottom: 0; }
    .settings-row label {
        display: block;
        font-size: 0.75em;
        color: #c7c7f0;
        text-align: left;
        margin-bottom: 4px;
    }
    .slider-line {
        display: flex;
        align-items: center;
        gap: 8px;
    }
    .slider-line input[type="range"] {
        flex: 1;
        accent-color: #a78bfa;
        height: 4px;
    }
    .slider-line span {
        font-family: var(--font-jetbrains-mono), monospace;
        font-size: 0.75em;
        color: #e8e8f5;
        min-width: 2.6em;
        text-align: right;
    }

    /* S8.18-P4: pause-buttons can wrap to vertical stack on narrow screens.
       Each button flexes to fill available width. !important on align-self
       to override the parent #pause-overlay's align-items:center. */
    #pause-buttons {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        width: 100% !important;
        align-self: stretch !important;
    }
    #pause-buttons > button {
        flex: 1 1 auto;
        min-width: 120px;
    }
    #pause-overlay button {
        padding: 11px 20px;
        font-size: 0.95em;
        font-family: var(--font-space-grotesk), sans-serif;
        font-weight: 600;
        background: linear-gradient(90deg, #22d3ee, #a78bfa);
        color: #0a0a14;
        border: none;
        border-radius: 10px;
        cursor: pointer;
        letter-spacing: 1px;
    }
    #restart-from-pause-button {
        background: rgba(255,255,255,0.08) !important;
        color: #e8e8f5 !important;
        border: 1px solid rgba(255,255,255,0.15) !important;
    }
    #pause-overlay button:active { transform: scale(0.96); }

    #new-highscore-badge {
        font-weight: 700;
        letter-spacing: 1px;
        font-size: 1.05em;
        margin-bottom: 6px !important;
        display: flex !important;
        align-items: center;
        justify-content: center;
        gap: 6px;
    }
    #new-highscore-badge .nf-trophy-inline {
        filter: drop-shadow(0 0 4px rgba(251,191,36,0.5));
        flex-shrink: 0;
    }
    #new-highscore-badge .nf-highscore-text {
        background: linear-gradient(90deg, #fbbf24, #f472b6);
        -webkit-background-clip: text;
        background-clip: text;
        color: transparent;
        filter: drop-shadow(0 0 8px rgba(251,191,36,0.3));
    }

    /* ===== Ab hier: reine Desktop-/Zeigegeräte-Ergänzungen. ===== */
    /* Alles oberhalb bleibt fuer Mobile unveraendert. */

    /* S8.18-P4: Very narrow screens (e.g. iPhone SE landscape, small phones).
       Force all action buttons to full-width vertical stack to prevent any
       horizontal overflow. */
    @media (max-width: 340px) {
        #pause-buttons > button,
        #game-over-screen button,
        .level-select {
            width: 100% !important;
            max-width: 100% !important;
        }
        .level-select button {
            width: 36px;
            height: 36px;
        }
    }

    @media (min-width: 700px) {
        html, body { touch-action: auto; }
        h1#title { font-size: 0; }
        .stat-box p { font-size: 1.3em; }
        .mini-box h3, .stat-box h3 { font-size: 0.65em; }
        #hint-content { max-width: 560px; }
        #hint-overlay { font-size: 0.85em; }
        .hint-cols-wrap { display: flex; gap: 24px; }
    }

    @media (hover: hover) and (pointer: fine) {
        #mute-btn:hover, #info-btn:hover, #pause-btn:hover {
            opacity: 1;
            background: rgba(255,255,255,0.12);
        }
        .mini-box:not(.disabled):hover { background: rgba(255,255,255,0.075); }
        .level-select button:hover { background: rgba(255,255,255,0.14); }
        #hint-close-button:hover,
        #restart-button:hover,
        #resume-button:hover,
        #restart-from-pause-button:hover {
            filter: brightness(1.12);
        }
        #restart-from-pause-button:hover { background: rgba(255,255,255,0.14) !important; }
        .slider-line input[type="range"]:hover { opacity: 0.9; }
    }
`;

export const GAME_HTML = `<h1 id="title">NEONFALL</h1>

<div id="top-bar" class="glass">
    <div class="stat-box"><h3>SCORE</h3><p id="score">0</p></div>
    <div class="stat-box"><h3>BEST</h3><p id="best-score">0</p></div>
    <div class="stat-box"><h3>LEVEL</h3><p id="level">1</p></div>
    <div class="stat-box"><h3>LINES</h3><p id="lines">0</p></div>
</div>

<div id="second-bar">
    <div id="hold-box" class="mini-box glass disabled">
        <h3>HOLD</h3>
        <canvas id="hold-canvas" width="46" height="46"></canvas>
    </div>
    <div id="next-box" class="mini-box glass">
        <h3>NEXT</h3>
        <canvas id="next-canvas" width="120" height="46"></canvas>
    </div>
</div>

<button id="info-btn"></button>
<button id="pause-btn"></button>
<button id="mute-btn"></button>

<div id="game-container">
    <canvas id="tetris-canvas"></canvas>
    <div id="flash-overlay"></div>
    <div id="combo-popup"></div>
    <div id="hint-overlay">
        <div id="hint-content">
            <div class="hint-cols-wrap">
            <div class="hint-col">
                <h3>Touch</h3>
                <p><b>Wischen</b> links/rechts: Stein bewegen</p>
                <p><b>Tippen</b> linke/rechte Bildschirmhälfte: Drehung links/rechts</p>
                <p><b>Wischen</b> nach unten: Falltempo richtet sich nach der Wischgeschwindigkeit — langsam lässt den Stein gleiten, ein kräftiger Schwung beschleunigt Fall und Aufprall, ein sehr schneller Wisch lässt ihn sofort einschlagen</p>
                <p><b>Wischen</b> nach oben: Stein tauschen (Hold)</p>
            </div>
            <div class="hint-col">
                <h3>Tastatur</h3>
                <p><kbd>◀</kbd> <kbd>▶</kbd> Bewegen</p>
                <p><kbd>▲</kbd> / <kbd>X</kbd> Drehung rechts · <kbd>Z</kbd> Drehung links</p>
                <p><kbd>▼</kbd> Absenken · <kbd>Leertaste</kbd> Sofort-Drop</p>
                <p><kbd>Shift</kbd> / <kbd>C</kbd> Stein tauschen (Hold)</p>
                <p><kbd>P</kbd> Pause · <kbd>M</kbd> Ton · <kbd>I</kbd> Hinweis</p>
            </div>
            </div>
            <label id="hide-hint-label">
                <input type="checkbox" id="hide-hint-checkbox"> Beim Start nicht mehr anzeigen
            </label>
            <button id="hint-close-button">LOS GEHT'S</button>
            <small>über das Info-Symbol oben links jederzeit wieder aufrufbar · <a href="https://github.com/LEVCON-AT/Neonfall" target="_blank" rel="noopener" style="color:#22d3ee;text-decoration:none">GitHub</a></small>
        </div>
    </div>
    <div id="start-prompt">
        <div class="start-prompt-inner">
            <div id="start-prompt-icon"></div>
            Tippen zum Start
        </div>
    </div>
    <div id="pause-overlay">
        <h1>PAUSE</h1>
        <p id="pause-score">Score: 0</p>
        <div class="level-select">
            <span>Startlevel</span>
            <button class="level-minus">−</button>
            <b class="level-select-value">1</b>
            <button class="level-plus">+</button>
        </div>
        <div id="settings-panel">
            <h2>Feedback-Stärke</h2>
            <div class="settings-row">
                <label for="rattle-slider">Ratterbewegung beim Schieben</label>
                <div class="slider-line">
                    <input type="range" id="rattle-slider" min="0" max="200" value="100" step="10">
                    <span id="rattle-value">100%</span>
                </div>
            </div>
            <div class="settings-row">
                <label for="impact-slider">Stärke des Aufpralls</label>
                <div class="slider-line">
                    <input type="range" id="impact-slider" min="0" max="200" value="100" step="10">
                    <span id="impact-value">100%</span>
                </div>
            </div>
        </div>
        <div id="pause-buttons">
            <button id="resume-button">WEITER</button>
            <button id="restart-from-pause-button">NEUSTART</button>
        </div>
    </div>
    <div id="game-over-screen">
        <h1>GAME OVER</h1>
        <p id="new-highscore-badge" style="display:none;">Neuer Highscore!</p>
        <p id="final-score">Score: 0</p>
        <p id="final-highscore">Best: 0</p>
        <div class="level-select">
            <span>Startlevel</span>
            <button class="level-minus">−</button>
            <b class="level-select-value">1</b>
            <button class="level-plus">+</button>
        </div>
        <button id="restart-button">NEUSTART</button>
    </div>
</div>`;

export const GAME_SCRIPT = `
(function () {
    // S8.17: Guard against double-init on Fast Refresh / HMR.
    //   Without this, Next.js dev hot-reload re-runs the IIFE, which tries to
    //   re-register event listeners and re-fetch elements -> runtime error ->
    //   "Fast Refresh had to perform a full reload" warning in console.
    //   The guard short-circuits subsequent invocations cleanly.
    if (window.__nfInitialized) return;
    window.__nfInitialized = true;
    // --- KONSTANTEN ---
    // S5b/P1: Grid von 10→12 Spalten erweitert (rechtliche Abhebung vom
    //   Tetris-Standard 10×20). Combined mit den zusätzlichen Pentomino-Formen
    //   ergibt das eine deutliche Abhebung vom Tetris "look & feel".
    const COLS = 12;
    const ROWS = 24;
    // BLOCK_SIZE von 28→24 reduziert, damit 12 Spalten auf Mobile (360px)
    //   noch bequem passen: 12×24=288px Canvas-Breite (vorher 10×28=280px).
    const BLOCK_SIZE = 24;

    const canvas = document.getElementById('tetris-canvas');
    const ctx = canvas.getContext('2d');
    const nextCanvas = document.getElementById('next-canvas');
    const nextCtx = nextCanvas.getContext('2d');
    const holdCanvas = document.getElementById('hold-canvas');
    const holdCtx = holdCanvas.getContext('2d');
    const holdBox = document.getElementById('hold-box');
    const gameContainer = document.getElementById('game-container');
    const flashOverlay = document.getElementById('flash-overlay');
    const hintOverlay = document.getElementById('hint-overlay');
    const startPromptEl = document.getElementById('start-prompt');
    const comboPopup = document.getElementById('combo-popup');

    canvas.width = COLS * BLOCK_SIZE;
    canvas.height = ROWS * BLOCK_SIZE;

    const scoreEl = document.getElementById('score');
    const bestScoreEl = document.getElementById('best-score');
    const levelEl = document.getElementById('level');
    const linesEl = document.getElementById('lines');
    const gameOverScreen = document.getElementById('game-over-screen');
    const finalScoreEl = document.getElementById('final-score');
    const finalHighscoreEl = document.getElementById('final-highscore');
    const newHighscoreBadge = document.getElementById('new-highscore-badge');
    const pauseOverlay = document.getElementById('pause-overlay');
    const pauseScoreEl = document.getElementById('pause-score');
    const muteBtn = document.getElementById('mute-btn');
    const pauseBtn = document.getElementById('pause-btn');

    // S5b/P1: 7 Standard-Tetrominos + 9 Pentomino-Formen (5 Zellen, inkl. Spiegel).
    //   Pentominoes sind prä-Tetris (Solomon Golomb 1953), öffentliches Gut.
    //   Die Kombination aus 12er-Grid + Pentomino-Mix hebt NEONFALL deutlich
    //   vom Tetris "look & feel" ab (Tetris Holding LLC v. Xio, 2012).
    //   S7.5b: Spiegelversionen hinzugefügt (F', P', Y', J5) — wie J/L und S/Z
    //   bei Tetrominos haben chiralen Pentominoes eigene Spiegelvarianten.
    // S8.16: UNIQUE NEONFALL COLORS for ALL 16 pieces.
    //   Mirror pairs (J/L, S/Z, F/F', P/P', Y/Y', L5/J5) sit at OPPOSITE ends
    //   of the warm/cool spectrum so they are always distinguishable.
    //   No two pieces share the same hue family.
    const SHAPES = {
        // --- 7 Tetrominos (4 Zellen) ---
        'I':  { shape: [[1, 1, 1, 1]],              color: '#00f0ff' }, // electric cyan
        'J':  { shape: [[1, 0, 0], [1, 1, 1]],     color: '#4d7dff' }, // royal blue
        'L':  { shape: [[0, 0, 1], [1, 1, 1]],     color: '#ff8c1a' }, // neon orange
        'O':  { shape: [[1, 1], [1, 1]],           color: '#ffd400' }, // golden yellow
        'S':  { shape: [[0, 1, 1], [1, 1, 0]],     color: '#00e676' }, // emerald green
        'T':  { shape: [[0, 1, 0], [1, 1, 1]],     color: '#b347ff' }, // neon purple
        'Z':  { shape: [[1, 1, 0], [0, 1, 1]],     color: '#ff2db4' }, // hot pink
        // --- 9 Pentominoes (5 Zellen) — inkl. Spiegelvarianten ---
        'F':  { shape: [[0, 1, 1], [1, 1, 0], [0, 1, 0]],         color: '#00ffaa' }, // mint (cool)
        "F'": { shape: [[1, 1, 0], [0, 1, 1], [0, 1, 0]],         color: '#ffaa00' }, // amber (warm)
        'P':  { shape: [[1, 1], [1, 1], [1, 0]],                   color: '#ff5cb0' }, // rose pink (warm)
        "P'": { shape: [[1, 1], [1, 1], [0, 1]],                   color: '#c4ff3d' }, // chartreuse (cool)
        'T5': { shape: [[1, 1, 1], [0, 1, 0], [0, 1, 0]],         color: '#00b3a4' }, // deep teal
        'Y':  { shape: [[1, 0], [1, 1], [1, 0], [1, 0]],          color: '#d9b34d' }, // mustard gold (warm)
        "Y'": { shape: [[0, 1], [1, 1], [0, 1], [0, 1]],          color: '#5d9cff' }, // sky blue (cool)
        'L5': { shape: [[1, 0], [1, 0], [1, 0], [1, 1]],          color: '#7a1aff' }, // deep violet (cool)
        'J5': { shape: [[0, 1], [0, 1], [0, 1], [1, 1]],          color: '#ff6e3d' }  // coral (warm)
    };
    // PIECE_TYPES als Array (nicht String) weil 'T5', 'L5' und 'F'' 2-Char-Typen sind.
    const PIECE_TYPES = ['I', 'J', 'L', 'O', 'S', 'T', 'Z', 'F', "F'", 'P', "P'", 'T5', 'Y', "Y'", 'L5', 'J5'];

    let board = createBoard();
    let score = 0;
    let level = 1;
    let linesCleared = 0;
    let dropCounter = 0;
    let dropInterval = 1000;
    let lastTime = 0;
    let gameOver = false;
    let animationId = null;
    let comboCount = -1;

    // S7.2: pendingGarbage + applyGarbage hier definiert (vor resetPlayer),
    //   damit der TDZ (temporal dead zone) Fehler vermieden wird. Früher am
    //   IIFE-Ende definiert + resetPlayer monkey-patched — das crashte beim
    //   initialen restartGame() weil pendingGarbage noch nicht initialisiert war.
    let pendingGarbage = 0;
    function applyGarbage() {
        if (pendingGarbage <= 0) return;
        const n = Math.min(pendingGarbage, ROWS - 2);
        pendingGarbage = 0;
        // Random hole column for each garbage row.
        for (let i = 0; i < n; i++) {
            board.shift(); // remove top row
            const hole = Math.floor(Math.random() * COLS);
            const row = new Array(COLS).fill(9); // 9 = garbage marker
            row[hole] = 0;
            board.push(row);
        }
        // If the current piece now overlaps garbage, push it up.
        if (collide(board, player)) {
            player.pos.y--;
        }
    }

    let player = { matrix: null, color: null, pos: { x: 0, y: 0 } };
    let nextPiece = { matrix: null, color: null, type: null };
    // S8.15b: Next queue — shows up to 3 upcoming pieces.
    let nextQueue = [];
    const NEXT_QUEUE_SIZE = 3;
    function fillNextQueue() {
        while (nextQueue.length < NEXT_QUEUE_SIZE) {
            nextQueue.push(randomType());
        }
    }
    let nextPreviewCount = 3;
    // S8.15b-fix: Read preview count AFTER settings store is initialized.
    // The initial value is 3; React's useGameSync will update it via
    // window.__nfNextPreview() once the settings are loaded.
    let heldType = null;
    let canHold = true;
    let startLevel = 1;
    let isPaused = false;
    let gameStarted = false;
    let highscore = 0;
    let rattleStrength = 1;
    let impactStrength = 1;
    // S8.21.2: Lock-Delay — when a piece lands, give the player a 1-second
    //   grace period to rotate/move it before it locks. Modern Tetris standard.
    //   The timer runs continuously from first contact. Rotation and horizontal
    //   moves do NOT reset it. Hard-Drop bypasses lock-delay (instant lock).
    let lockDelayActive = false;
    let lockTimer = 0;
    const LOCK_DELAY_MS = 1000;
    let pendingImpactIntensity = 0;
    // S8.19: Track last game-over's "new highscore" state for React GameOverDialog.
    let lastIsNewHighscore = false;

    function loadHighscore() {
        // S8.15b-fix: Try API first (global best), fallback to localStorage.
        // The localStorage value is per-browser; the API value is global.
        // We show whichever is higher.
        try {
            const localV = localStorage.getItem('neonfall_highscore');
            const localHs = localV ? parseInt(localV, 10) || 0 : 0;
            highscore = localHs;
            bestScoreEl.textContent = highscore;
        } catch (e) {
            highscore = 0;
        }
        // Async: fetch global best from API and update if higher.
        fetch('/api/leaderboard?mode=marathon&limit=1')
            .then(r => r.ok ? r.json() : null)
            .then(data => {
                if (data && data.scores && data.scores[0]) {
                    const globalBest = data.scores[0].score || 0;
                    if (globalBest > highscore) {
                        highscore = globalBest;
                        bestScoreEl.textContent = highscore;
                    }
                }
            })
            .catch(() => {});
    }

    function saveHighscore() {
        // S8.15b-fix: Save locally AND update display. API submission
        // happens separately via NameInputDialog (React).
        try { localStorage.setItem('neonfall_highscore', String(highscore)); } catch (e) {}
    }

    function createBoard() {
        const b = [];
        for (let y = 0; y < ROWS; y++) b.push(new Array(COLS).fill(0));
        return b;
    }

    // 12-Bag-Randomizer: jeder Stein kommt genau einmal pro 12er-Bag, keine langen Duerren/Fluten.
    //   (Vor S5b/P1: 7-Bag mit 7 Tetrominos; jetzt 12 Formen inkl. 5 Pentominoes.)
    let pieceBag = [];
    function refillBag() {
        // S5b/P1: PIECE_TYPES ist jetzt ein Array (für 2-Char-Typen wie 'T5').
        //   slice() statt split('').
        pieceBag = PIECE_TYPES.slice();
        for (let i = pieceBag.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [pieceBag[i], pieceBag[j]] = [pieceBag[j], pieceBag[i]];
        }
    }

    function randomType() {
        if (pieceBag.length === 0) refillBag();
        return pieceBag.pop();
    }

    function createPiece(type) {
        const def = SHAPES[type];
        const matrix = def.shape.map(row => row.slice());
        return {
            matrix: matrix,
            color: def.color,
            type: type,
            pos: { x: Math.floor(COLS / 2) - Math.ceil(matrix[0].length / 2), y: 0 }
        };
    }

    function collide(board, piece) {
        const m = piece.matrix;
        const o = piece.pos;
        for (let y = 0; y < m.length; y++) {
            for (let x = 0; x < m[y].length; x++) {
                if (m[y][x] === 0) continue;
                const boardX = x + o.x;
                const boardY = y + o.y;
                if (boardX < 0 || boardX >= COLS || boardY >= ROWS) return true;
                if (boardY >= 0 && board[boardY][boardX] !== 0) return true;
            }
        }
        return false;
    }

    function merge(board, piece) {
        piece.matrix.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    const by = y + piece.pos.y;
                    const bx = x + piece.pos.x;
                    if (by >= 0) board[by][bx] = piece.color;
                }
            });
        });
    }

    function rotateCW(matrix) {
        const rows = matrix.length;
        const cols = matrix[0].length;
        const result = [];
        for (let x = 0; x < cols; x++) {
            const newRow = [];
            for (let y = rows - 1; y >= 0; y--) newRow.push(matrix[y][x]);
            result.push(newRow);
        }
        return result;
    }

    function rotateCCW(matrix) {
        return rotateCW(rotateCW(rotateCW(matrix)));
    }

    function playerRotate(dir) {
        const oldMatrix = player.matrix;
        const oldPos = { x: player.pos.x, y: player.pos.y };
        player.matrix = dir < 0 ? rotateCCW(player.matrix) : rotateCW(player.matrix);
        let offset = 1;
        while (collide(board, player)) {
            player.pos.x += offset;
            offset = -(offset + (offset > 0 ? 1 : -1));
            if (Math.abs(offset) > player.matrix[0].length + 1) {
                player.matrix = oldMatrix;
                player.pos = oldPos;
                return;
            }
        }
        playBeep(dir < 0 ? 430 : 620, 0.05, 'square', sfxGain, 0.18);
        // S8.21.2-fix3: After a successful rotation, check if the piece is
        //   still resting. If rotation moved it off the stack, cancel lock-delay.
        if (lockDelayActive && !isResting()) {
            lockDelayActive = false;
            lockTimer = 0;
            pendingImpactIntensity = 0;
        }
    }

    // S8.21.2-fix3: Check if the piece is resting on the floor or on another
    //   block. Used after horizontal moves/rotations to determine if the
    //   piece is still in contact. If not, lock-delay is cancelled so the
    //   piece can continue falling (prevents mid-air locking).
    function isResting() {
        player.pos.y++;
        const resting = collide(board, player);
        player.pos.y--;
        return resting;
    }

    function playerMove(dir) {
        player.pos.x += dir;
        if (collide(board, player)) {
            player.pos.x -= dir;
        } else {
            playBeep(300, 0.04, 'square', sfxGain, 0.1);
            // S8.21.2-fix3: After a successful horizontal move, check if the
            //   piece is still resting. If moved off a ledge into mid-air,
            //   cancel lock-delay so it can fall further.
            if (lockDelayActive && !isResting()) {
                lockDelayActive = false;
                lockTimer = 0;
                pendingImpactIntensity = 0;
            }
        }
    }

    function playerDrop() {
        player.pos.y++;
        if (collide(board, player)) {
            player.pos.y--;
            // S8.21.2: Lock-Delay — don't lock immediately. Start the grace
            //   period instead. The actual lockPiece() happens in update()
            //   when lockTimer >= LOCK_DELAY_MS.
            if (!lockDelayActive) {
                lockDelayActive = true;
                lockTimer = 0;
            }
        } else {
            // Piece moved down successfully — cancel any active lock delay.
            lockDelayActive = false;
        }
        dropCounter = 0;
    }

    // ein Schritt nach unten waehrend des Ziehens (Momentum-Drop / Rattern).
    // S8.21.2-fix2: Bei Kollision wird NICHT sofort eingerastet — stattdessen
    //   Lock-Delay gestartet. Der Impact-Effekt wird erst beim tatsaechlichen
    //   Locken ausgefuehrt (in lockPiece via pendingImpactIntensity).
    function stepDownDuringDrag(intensityOnLock) {
        player.pos.y++;
        if (collide(board, player)) {
            player.pos.y--;
            if (!lockDelayActive) {
                lockDelayActive = true;
                lockTimer = 0;
                pendingImpactIntensity = intensityOnLock;
            }
            dropCounter = 0;
            return false;
        }
        dropCounter = 0;
        return true;
    }

    // maximaler Insta-Slam bei extrem schnellem Swipe oder Leertaste.
    // S8.21.2: Bypasses lock-delay — hard-drop locks IMMEDIATELY.
    function playerHardDrop(intensity) {
        while (!collide(board, player)) player.pos.y++;
        player.pos.y--;
        lockDelayActive = false;
        pendingImpactIntensity = 0;
        lockPiece();
        impact(intensity);
        dropCounter = 0;
    }

    // nach dem Loslassen faellt der Stein von selbst weiter im "angeschupsten" Tempo,
    // bis er einrastet (Trägheit/Momentum aus dem Schups)
    let momentumActive = false;
    let momentumBlockVelocity = 0;

    function momentumTick() {
        player.pos.y++;
        if (collide(board, player)) {
            player.pos.y--;
            momentumActive = false;
            lockPiece();
            impact(mapVelocityToIntensity(momentumBlockVelocity));
            dropCounter = 0;
            return;
        }
        microFeedback(momentumBlockVelocity);
        dropCounter = 0;
    }

    function lockPiece() {
        merge(board, player);
        canHold = true;
        momentumActive = false;
        // S8.21.2: Reset lock-delay state. Fire pending impact effect if
        //   the piece was momentum-dropped.
        lockDelayActive = false;
        lockTimer = 0;
        if (pendingImpactIntensity > 0) {
            impact(pendingImpactIntensity);
            pendingImpactIntensity = 0;
        }
        resetPlayer();
        clearLines();
    }

    function impact(intensity) {
        const i = Math.max(0, intensity);
        shakeScreen((4 + i * 30) * impactStrength, 140 + i * 300);
        // S5c: Reduced flash intensity — was (0.12 + i * 0.65), now (0.04 + i * 0.12).
        //   Combined with the 0.25 cap in flash(), this gives a subtle tint instead
        //   of a blinding white overlay on hard drops.
        flash((0.04 + i * 0.12) * impactStrength);
        playThud(0.25 + i * 1.05);
    }

    function microFeedback(blockVelocity) {
        const v = Math.max(0, Math.min(1, blockVelocity / 0.05));
        if (v > 0.03) shakeScreen((2 + v * 15) * rattleStrength, 70 + v * 100);
        if (v > 0.25) flash(v * 0.18 * rattleStrength);
        playBeep(150 + v * 320, 0.03 + v * 0.03, 'square', sfxGain, 0.05 + v * 0.2);
    }

    // S8.22.8: shakeScreen completely disabled — no transform on gameContainer.
    //   The screen-shake effect caused the playfield to shift sideways when
    //   dialogs opened (body padding-right + transform interaction) and was
    //   visually distracting. The game stays perfectly stable now.
    function shakeScreen(intensity, duration) {
        // No-op: all transform code removed.
    }

    function flash(peakOpacity) {
        // S5c: Reduced max opacity from 0.85 → 0.25. Hard drops were
        //   flashing too much white over the playfield, making it hard to
        //   see the next piece during rapid drops. Now it's a subtle tint.
        flashOverlay.style.transition = 'none';
        flashOverlay.style.opacity = String(Math.min(0.25, peakOpacity));
        requestAnimationFrame(() => {
            flashOverlay.style.transition = 'opacity 180ms ease-out';
            flashOverlay.style.opacity = '0';
        });
    }

    function showCombo(text) {
        comboPopup.textContent = text;
        comboPopup.classList.remove('pop');
        void comboPopup.offsetWidth;
        comboPopup.classList.add('pop');
    }

    function clearLines() {
        let cleared = 0;
        outer: for (let y = ROWS - 1; y >= 0; y--) {
            for (let x = 0; x < COLS; x++) {
                if (board[y][x] === 0) continue outer;
            }
            board.splice(y, 1);
            board.unshift(new Array(COLS).fill(0));
            cleared++;
            y++;
        }

        if (cleared > 0) {
            const points = [0, 100, 300, 500, 800];
            score += (points[cleared] || 800) * level;

            comboCount++;
            if (comboCount > 0) {
                score += 50 * comboCount * level;
                showCombo('STREAK x' + (comboCount + 1));
            }

            linesCleared += cleared;
            level = Math.floor(linesCleared / 10) + 1;
            dropInterval = Math.max(50, 1000 - (level - 1) * 75);

            updateStats();
            playLineClearSound(cleared);
            // S5c: dispatch event for multiplayer + haptics. detail.cleared = 1..4.
            try { window.dispatchEvent(new CustomEvent('nf-lines-cleared', { detail: { cleared } })); } catch (e) {}
        } else {
            comboCount = -1;
        }
    }

    function resetPlayer() {
        applyGarbage();
        fillNextQueue();
        const nextType = nextQueue.shift();
        player = createPiece(nextType);
        nextPiece = createPiece(nextQueue[0]);
        fillNextQueue();
        drawNext();
        if (collide(board, player)) triggerGameOver();
    }

    function holdSwap() {
        if (!canHold || gameOver) return;
        // S8.21.2: Cancel lock-delay when holding.
        lockDelayActive = false;
        lockTimer = 0;
        pendingImpactIntensity = 0;
        const currentType = player.type;
        if (heldType === null) {
            heldType = currentType;
            resetPlayer();
        } else {
            const swapType = heldType;
            heldType = currentType;
            player = createPiece(swapType);
        }
        canHold = false;
        drawHold();
        playBeep(440, 0.06, 'sawtooth', sfxGain, 0.16);
    }

    function updateStats() {
        scoreEl.textContent = score;
        levelEl.textContent = level;
        linesEl.textContent = linesCleared;
    }

    function triggerGameOver() {
        gameOver = true;
        let isNewHighscore = false;
        // S8.18-P3: "Neuer Highscore" only if score is strictly greater than
        //   the current highscore AND score > 0.
        //   - score > 0: prevents "Neuer Highscore" on a 0-point game (e.g.
        //     instant game-over with no lines cleared).
        //   - score > highscore (strict): ties don't count as new record.
        //   The displayed bestScoreEl may lag behind the async API fetch in
        //   loadHighscore(), so we also re-read it as a safety net.
        var displayedBest = parseInt(bestScoreEl.textContent, 10) || 0;
        var effectiveHighscore = Math.max(highscore, displayedBest);
        if (score > 0 && score > effectiveHighscore) {
            highscore = score;
            saveHighscore();
            bestScoreEl.textContent = highscore;
            isNewHighscore = true;
        } else {
            // Ensure highscore display is correct (in case async fetch
            // completed and set highscore but bestScoreEl wasn't updated).
            highscore = Math.max(highscore, effectiveHighscore);
            bestScoreEl.textContent = highscore;
        }
        finalScoreEl.textContent = 'Score: ' + score;
        finalHighscoreEl.textContent = 'Best: ' + highscore;
        newHighscoreBadge.style.display = isNewHighscore ? 'block' : 'none';
        lastIsNewHighscore = isNewHighscore;
        gameOverScreen.classList.add('visible');
        // S5c: start-prompt entfernen falls noch sichtbar (überlappte sonst
        //   den Game-Over-Screen mit "Tippen zum Start").
        startPromptEl.classList.remove('visible');
        if (animationId) cancelAnimationFrame(animationId);
        playGameOverSound();
    }

    function restartGame() {
        board = createBoard();
        pieceBag = [];
        score = 0;
        level = startLevel;
        linesCleared = (startLevel - 1) * 10;
        dropInterval = Math.max(50, 1000 - (level - 1) * 75);
        dropCounter = 0;
        lastTime = 0;
        gameOver = false;
        comboCount = -1;
        heldType = null;
        canHold = true;
        momentumActive = false;
        // S8.21.2: Reset lock-delay state on restart.
        lockDelayActive = false;
        lockTimer = 0;
        pendingImpactIntensity = 0;
        isPaused = false;
        gameStarted = true;
        startPromptEl.classList.remove('visible');
        pauseOverlay.classList.remove('visible');
        pauseBtn.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>';
        gameOverScreen.classList.remove('visible');
        updateStats();
        drawHold();
        nextQueue = [];
        fillNextQueue();
        resetPlayer();
        draw();
        animationId = requestAnimationFrame(update);
    }

    function startGame() {
        gameStarted = true;
        startPromptEl.classList.remove('visible');
        lastTime = performance.now();
    }

    // --- ZEICHNEN ---
    function lighten(hex, percent) {
        const num = parseInt(hex.slice(1), 16);
        let r = (num >> 16) + Math.round(255 * percent / 100);
        let g = ((num >> 8) & 0xff) + Math.round(255 * percent / 100);
        let b = (num & 0xff) + Math.round(255 * percent / 100);
        r = Math.min(255, Math.max(0, r));
        g = Math.min(255, Math.max(0, g));
        b = Math.min(255, Math.max(0, b));
        return \`rgb(\${r},\${g},\${b})\`;
    }

    function roundedRectPath(context, x, y, w, h, r) {
        context.beginPath();
        context.moveTo(x + r, y);
        context.arcTo(x + w, y, x + w, y + h, r);
        context.arcTo(x + w, y + h, x, y + h, r);
        context.arcTo(x, y + h, x, y, r);
        context.arcTo(x, y, x + w, y, r);
        context.closePath();
    }

    function drawCell(context, x, y, colorHex, size, glow) {
        const px = x * size, py = y * size;
        const pad = size * 0.07;
        const w = size - pad * 2, h = size - pad * 2;
        context.save();
        if (glow) { context.shadowColor = colorHex; context.shadowBlur = glow; }
        const grad = context.createLinearGradient(0, py + pad, 0, py + pad + h);
        grad.addColorStop(0, lighten(colorHex, 28));
        grad.addColorStop(1, colorHex);
        roundedRectPath(context, px + pad, py + pad, w, h, size * 0.18);
        context.fillStyle = grad;
        context.fill();
        context.restore();
        context.strokeStyle = 'rgba(255,255,255,0.28)';
        context.lineWidth = 1;
        roundedRectPath(context, px + pad, py + pad, w, h, size * 0.18);
        context.stroke();
    }

    function drawGrid() {
        ctx.strokeStyle = 'rgba(255,255,255,0.045)';
        ctx.lineWidth = 1;
        for (let x = 0; x <= COLS; x++) {
            ctx.beginPath(); ctx.moveTo(x * BLOCK_SIZE, 0); ctx.lineTo(x * BLOCK_SIZE, canvas.height); ctx.stroke();
        }
        for (let y = 0; y <= ROWS; y++) {
            ctx.beginPath(); ctx.moveTo(0, y * BLOCK_SIZE); ctx.lineTo(canvas.width, y * BLOCK_SIZE); ctx.stroke();
        }
    }

    function drawGhostCell(context, x, y, colorHex, size) {
        const px = x * size, py = y * size;
        const pad = size * 0.07;
        const w = size - pad * 2, h = size - pad * 2;
        context.save();
        context.globalAlpha = 0.16;
        roundedRectPath(context, px + pad, py + pad, w, h, size * 0.18);
        context.fillStyle = colorHex;
        context.fill();
        context.restore();
        context.save();
        context.globalAlpha = 0.4;
        context.strokeStyle = colorHex;
        context.lineWidth = 1.5;
        roundedRectPath(context, px + pad, py + pad, w, h, size * 0.18);
        context.stroke();
        context.restore();
    }

    function getGhostPos() {
        const ghost = { matrix: player.matrix, pos: { x: player.pos.x, y: player.pos.y } };
        while (!collide(board, ghost)) ghost.pos.y++;
        ghost.pos.y--;
        return ghost.pos;
    }

    function draw() {
        const bg = ctx.createLinearGradient(0, 0, 0, canvas.height);
        bg.addColorStop(0, '#0d0d1c');
        bg.addColorStop(1, '#08080f');
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        drawGrid();
        board.forEach((row, y) => row.forEach((value, x) => {
            if (value !== 0) drawCell(ctx, x, y, value, BLOCK_SIZE, 4);
        }));
        const ghostPos = getGhostPos();
        player.matrix.forEach((row, y) => row.forEach((value, x) => {
            if (value !== 0) drawGhostCell(ctx, x + ghostPos.x, y + ghostPos.y, player.color, BLOCK_SIZE);
        }));
        player.matrix.forEach((row, y) => row.forEach((value, x) => {
            if (value !== 0) drawCell(ctx, x + player.pos.x, y + player.pos.y, player.color, BLOCK_SIZE, 16);
        }));
        // S5c: dispatch board-updated event for multiplayer opponent preview.
        try { window.dispatchEvent(new CustomEvent('nf-board-updated')); } catch (e) {}
    }

    function drawMiniPreview(context, canvasEl, type) {
        context.clearRect(0, 0, canvasEl.width, canvasEl.height);
        if (!type) return;
        const def = SHAPES[type];
        const matrix = def.shape;
        const size = 11;
        const offsetX = (canvasEl.width / size - matrix[0].length) / 2;
        const offsetY = (canvasEl.height / size - matrix.length) / 2;
        matrix.forEach((row, y) => row.forEach((value, x) => {
            if (value !== 0) drawCell(context, x + offsetX, y + offsetY, def.color, size, 6);
        }));
    }

    function drawNext() {
        // S8.18-P1b: Dynamic slot layout — only draws as many slots as there
        //   are pieces to show, and centers them across the canvas. Previously
        //   all 3 slot backgrounds were always drawn, leaving empty "ghost"
        //   containers when nextPreviewCount was 1 or 2.
        //
        //   Slot sizes scale with count:
        //     count=1: one large slot (size 12), centered
        //     count=2: front size 11 + mid size 7, distributed across canvas
        //     count=3: front size 11 + mid size 6 + back size 5 (S8.17 layout)
        nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
        var count = Math.min(nextPreviewCount, nextQueue.length);
        if (count === 0) return;

        // Canvas is 160x52. Outer pad 4px, gap between slots 4px.
        var CW = nextCanvas.width;   // 160
        var CH = nextCanvas.height;  // 52
        var PAD = 4;
        var GAP = 4;

        // Build slot config based on count. Each entry: { size, opacity, glow }
        var configs;
        if (count === 1) {
            configs = [
                { size: 12, opacity: 1.00, glow: 8 }
            ];
        } else if (count === 2) {
            configs = [
                { size: 11, opacity: 1.00, glow: 8 },
                { size: 7,  opacity: 0.50, glow: 1 }
            ];
        } else {
            configs = [
                { size: 11, opacity: 1.00, glow: 8 },
                { size: 6,  opacity: 0.50, glow: 1 },
                { size: 5,  opacity: 0.25, glow: 0 }
            ];
        }

        // Distribute slots across canvas width.
        // Each slot gets equal width: (CW - 2*PAD - (count-1)*GAP) / count
        var totalGap = (count - 1) * GAP;
        var slotW = (CW - 2 * PAD - totalGap) / count;
        var slots = [];
        for (var i = 0; i < count; i++) {
            var x0 = PAD + i * (slotW + GAP);
            slots.push({
                x0: x0,
                x1: x0 + slotW,
                size: configs[i].size,
                opacity: configs[i].opacity,
                glow: configs[i].glow
            });
        }

        // Subtle slot backgrounds: rounded rects with faint border + fill.
        // Fill/stroke alpha decreases for rear slots (depth hierarchy).
        for (var s = 0; s < slots.length; s++) {
            var sl = slots[s];
            nextCtx.save();
            var pad = 3;
            var rx = sl.x0 + pad;
            var ry = 2;
            var rw = sl.x1 - sl.x0 - pad * 2;
            var rh = CH - 4;
            var r = 4;
            var fillAlpha = s === 0 ? 0.06 : s === 1 ? 0.035 : 0.02;
            var strokeAlpha = s === 0 ? 0.16 : 0.08;
            nextCtx.fillStyle = 'rgba(255,255,255,' + fillAlpha + ')';
            nextCtx.strokeStyle = 'rgba(255,255,255,' + strokeAlpha + ')';
            nextCtx.lineWidth = 1;
            roundedRectPath(nextCtx, rx, ry, rw, rh, r);
            nextCtx.fill();
            nextCtx.stroke();
            nextCtx.restore();
        }

        // Draw pieces centered in their slots.
        for (var i = 0; i < count; i++) {
            var type = nextQueue[i];
            if (!type) continue;
            var def = SHAPES[type];
            var matrix = def.shape;
            var slot = slots[i];
            var pieceW = matrix[0].length * slot.size;
            var pieceH = matrix.length * slot.size;
            var slotCenterX = (slot.x0 + slot.x1) / 2;
            var offsetX_px = slotCenterX - pieceW / 2;
            var offsetY_px = (CH - pieceH) / 2;
            // Cell-unit conversion (drawCell multiplies internally by size).
            var offsetX_cells = offsetX_px / slot.size;
            var offsetY_cells = offsetY_px / slot.size;
            nextCtx.save();
            nextCtx.globalAlpha = slot.opacity;
            matrix.forEach(function (row, y) {
                row.forEach(function (value, x) {
                    if (value !== 0) drawCell(nextCtx, x + offsetX_cells, y + offsetY_cells, def.color, slot.size, slot.glow);
                });
            });
            nextCtx.restore();
        }
    }
    function drawHold() {
        drawMiniPreview(holdCtx, holdCanvas, heldType);
        holdBox.classList.toggle('disabled', !canHold);
    }

    function update(time = 0) {
        if (gameOver) return;
        if (isPaused || !gameStarted) {
            lastTime = time;
            animationId = requestAnimationFrame(update);
            return;
        }
        const deltaTime = time - lastTime;
        lastTime = time;
        // S8.21.2: Lock-Delay timer — if a piece is resting (lockDelayActive),
        //   count up. When the grace period expires, lock the piece.
        if (lockDelayActive) {
            lockTimer += deltaTime;
            if (lockTimer >= LOCK_DELAY_MS) {
                lockPiece();
            }
        } else {
            dropCounter += deltaTime;
            const interval = momentumActive ? Math.max(6, 1 / momentumBlockVelocity) : dropInterval;
            if (dropCounter > interval) {
                if (momentumActive) momentumTick(); else playerDrop();
            }
        }
        draw();
        animationId = requestAnimationFrame(update);
    }

    function silenceAudioImmediately() {
        if (!audioCtx) return;
        try {
            const t = audioCtx.currentTime;
            if (masterGain) {
                masterGain.gain.cancelScheduledValues(t);
                masterGain.gain.setValueAtTime(masterGain.gain.value, t);
                masterGain.gain.linearRampToValueAtTime(0, t + 0.03);
            }
            audioCtx.suspend();
        } catch (e) { /* Kontext evtl. schon inaktiv, kein Problem */ }
    }

    function pauseGame() {
        if (gameOver || isPaused || !gameStarted) return;
        isPaused = true;
        pauseScoreEl.textContent = 'Score: ' + score;
        pauseOverlay.classList.add('visible');
        pauseBtn.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>';
        silenceAudioImmediately();
    }

    function resumeGame() {
        if (gameOver || !isPaused) return;
        isPaused = false;
        pauseOverlay.classList.remove('visible');
        pauseBtn.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>';
        if (audioCtx) {
            // audioCtx.suspend()/resume() friert den Loop-Track exakt an der
            // Stelle ein und spielt ihn nahtlos weiter - kein Neustart noetig.
            audioCtx.resume().catch(() => {});
            const t = audioCtx.currentTime;
            if (masterGain) {
                masterGain.gain.cancelScheduledValues(t);
                masterGain.gain.setValueAtTime(0, t);
                masterGain.gain.linearRampToValueAtTime(muted ? 0 : 0.85, t + 0.05);
            }
        }
    }

    // --- AUDIO: Hintergrundmusik als durchgehend loopender Track + synth. SFX ---
    let audioCtx = null;
    let masterGain, musicGain, sfxGain;
    let muted = false;
    let musicBuffer = null;
    let musicSource = null;

    function initAudio() {
        if (audioCtx) { if (audioCtx.state === 'suspended') audioCtx.resume(); return; }
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        masterGain = audioCtx.createGain();
        masterGain.gain.value = 0.85;
        masterGain.connect(audioCtx.destination);

        musicGain = audioCtx.createGain();
        musicGain.gain.value = 0.5;
        musicGain.connect(masterGain);

        sfxGain = audioCtx.createGain();
        sfxGain.gain.value = 0.9;
        sfxGain.connect(masterGain);

        loadAndStartMusic();
    }

    async function loadAndStartMusic() {
        try {
            const response = await fetch('neonfall-music.mp3');
            const arrayBuffer = await response.arrayBuffer();
            musicBuffer = await audioCtx.decodeAudioData(arrayBuffer);
            if (!audioCtx || musicSource) return; // inzwischen z.B. neu geladen/geschlossen
            musicSource = audioCtx.createBufferSource();
            musicSource.buffer = musicBuffer;
            musicSource.loop = true;
            musicSource.connect(musicGain);
            musicSource.start(0);
        } catch (e) {
            // Musikdatei nicht erreichbar (z.B. lokal ohne Hosting geoeffnet) -
            // Spiel bleibt trotzdem voll spielbar, nur ohne Hintergrundmusik.
        }
    }

    function playBeep(freq, dur, type, gainNode, vol) {
        if (!audioCtx) return;
        const t = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        osc.type = type || 'square';
        osc.frequency.setValueAtTime(freq, t);
        const g = audioCtx.createGain();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(vol || 0.2, t + 0.005);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        osc.connect(g);
        g.connect(gainNode || sfxGain);
        osc.start(t);
        osc.stop(t + dur + 0.02);
    }

    function noiseBuffer(durSec) {
        const bufferSize = Math.max(1, Math.floor(audioCtx.sampleRate * durSec));
        const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
        return buffer;
    }

    function playThud(intensity) {
        if (!audioCtx) return;
        const t = audioCtx.currentTime;
        const dur = 0.14 + 0.18 * intensity;
        const osc = audioCtx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(170, t);
        osc.frequency.exponentialRampToValueAtTime(30, t + dur);
        const g = audioCtx.createGain();
        g.gain.setValueAtTime(Math.min(1, 0.65 * intensity), t);
        g.gain.exponentialRampToValueAtTime(0.001, t + dur);
        osc.connect(g); g.connect(sfxGain);
        osc.start(t); osc.stop(t + dur + 0.02);

        const noise = audioCtx.createBufferSource();
        noise.buffer = noiseBuffer(0.18);
        const noiseFilter = audioCtx.createBiquadFilter();
        noiseFilter.type = 'lowpass';
        noiseFilter.frequency.value = 600 + 1100 * intensity;
        const noiseGain = audioCtx.createGain();
        noiseGain.gain.setValueAtTime(Math.min(0.9, 0.5 * intensity), t);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
        noise.connect(noiseFilter); noiseFilter.connect(noiseGain); noiseGain.connect(sfxGain);
        noise.start(t);
    }

    function playLineClearSound(count) {
        if (!audioCtx) return;
        const base = 500;
        for (let i = 0; i < count + 1; i++) {
            setTimeout(() => playBeep(base + i * 130, 0.09, 'square', sfxGain, 0.28), i * 55);
        }
    }

    function playGameOverSound() {
        if (!audioCtx) return;
        [420, 360, 300, 220].forEach((f, i) => {
            setTimeout(() => playBeep(f, 0.25, 'triangle', sfxGain, 0.28), i * 180);
        });
    }

    function applyMuteState() {
        muteBtn.innerHTML = muted
            ? '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>'
            : '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>';
        muteBtn.setAttribute('data-muted', muted ? '1' : '0');
        if (!masterGain || !audioCtx) return;
        const t = audioCtx.currentTime;
        masterGain.gain.cancelScheduledValues(t);
        masterGain.gain.setValueAtTime(muted ? 0 : 0.85, t);
    }

    muteBtn.addEventListener('click', () => {
        initAudio();
        muted = !muted;
        applyMuteState();
    });

    holdBox.addEventListener('click', () => { initAudio(); holdSwap(); });

    // --- TOUCH STEUERUNG ---
    let touchStartX = 0, touchStartY = 0, touchStartTime = 0;
    let lastMoveX = 0, lastMoveY = 0, lastMoveTime = 0;
    let dragDownAccum = 0;
    let extremeTriggered = false;
    let smoothedDownVelocity = 0;
    let hintVisible = true;
    let ignoreCurrentGesture = false;

    function cssToBlocks(px) {
        const rect = canvas.getBoundingClientRect();
        const scale = canvas.width / rect.width;
        return (px * scale) / BLOCK_SIZE;
    }

    function mapVelocityToIntensity(blockVelocity) {
        const GLIDE = 0.006, CAP = 0.045;
        let t = (blockVelocity - GLIDE) / (CAP - GLIDE);
        t = Math.max(0, Math.min(1, t));
        return Math.pow(t, 0.6);
    }

    gameContainer.addEventListener('touchstart', (e) => {
        initAudio();
        ignoreCurrentGesture = false;
        if (hintVisible) { ignoreCurrentGesture = true; return; }
        if (!gameStarted) { startGame(); ignoreCurrentGesture = true; return; }
        if (isPaused) { ignoreCurrentGesture = true; return; }
        if (gameOver) return;
        momentumActive = false;
        const t = e.touches[0];
        touchStartX = lastMoveX = t.clientX;
        touchStartY = lastMoveY = t.clientY;
        touchStartTime = lastMoveTime = performance.now();
        dragDownAccum = 0;
        extremeTriggered = false;
        smoothedDownVelocity = 0;
    }, { passive: true });

    gameContainer.addEventListener('touchmove', (e) => {
        if (gameOver || isPaused || extremeTriggered || ignoreCurrentGesture) return;
        e.preventDefault();
        const t = e.touches[0];
        const now = performance.now();

        // horizontales Ziehen -> Spalten bewegen
        const dxBlocks = cssToBlocks(t.clientX - lastMoveX);
        if (Math.abs(dxBlocks) >= 1) {
            const steps = Math.trunc(dxBlocks);
            for (let i = 0; i < Math.abs(steps); i++) playerMove(Math.sign(steps));
            const rect = canvas.getBoundingClientRect();
            lastMoveX += steps * BLOCK_SIZE * (rect.width / canvas.width);
        }

        const dt = Math.max(1, now - lastMoveTime);
        const dy = t.clientY - lastMoveY;
        const blockVelocity = cssToBlocks(dy) / dt; // Blocks pro ms, positiv = runter
        if (blockVelocity > 0) smoothedDownVelocity = smoothedDownVelocity * 0.65 + blockVelocity * 0.35;

        const elapsedSinceStart = now - touchStartTime;
        const totalDownSoFar = lastMoveY - touchStartY;

        // extrem schneller Flick -> sofortiger Insta-Slam
        if (blockVelocity > 0.05 && elapsedSinceStart > 25 && totalDownSoFar > 12) {
            extremeTriggered = true;
            playerHardDrop(1.3);
            lastMoveY = t.clientY;
            lastMoveTime = now;
            return;
        }

        // kontinuierliches "Mitlaufen" mit dem Finger, Tempo = Swipe-Tempo
        if (dy > 0) {
            dragDownAccum += cssToBlocks(dy);
            while (dragDownAccum >= 1) {
                dragDownAccum -= 1;
                const moved = stepDownDuringDrag(mapVelocityToIntensity(blockVelocity));
                microFeedback(blockVelocity);
                if (!moved) { extremeTriggered = true; break; } // eingerastet, Gesture beenden
            }
        }

        lastMoveY = t.clientY;
        lastMoveTime = now;
    }, { passive: false });

    gameContainer.addEventListener('touchend', () => {
        if (gameOver || ignoreCurrentGesture) return;
        const now = performance.now();
        const totalDX = lastMoveX - touchStartX;
        const totalDY = lastMoveY - touchStartY;
        const totalDT = Math.max(1, now - touchStartTime);

        const TAP_MAX_TIME = 220;
        const TAP_MAX_DIST = 12;
        const MIN_SWIPE_UP_DIST = 26;

        const isTap = Math.abs(totalDX) < TAP_MAX_DIST && Math.abs(totalDY) < TAP_MAX_DIST && totalDT < TAP_MAX_TIME;

        if (isTap) {
            const rect = gameContainer.getBoundingClientRect();
            const isLeftHalf = touchStartX < rect.left + rect.width / 2;
            playerRotate(isLeftHalf ? -1 : 1);
            return;
        }

        if (!extremeTriggered && totalDY < -MIN_SWIPE_UP_DIST && Math.abs(totalDY) > Math.abs(totalDX) * 1.1) {
            holdSwap();
            return;
        }

        // Schups nach unten losgelassen -> Stein faellt von selbst weiter,
        // Tempo = wie stark angeschupst wurde
        if (!extremeTriggered && totalDY > 0 && Math.abs(totalDY) > Math.abs(totalDX) && smoothedDownVelocity > 0.004) {
            momentumActive = true;
            momentumBlockVelocity = Math.min(0.09, smoothedDownVelocity);
        }
    });

    document.addEventListener('keydown', (e) => {
        // S8.22.2: Block all keyboard input when a React shadcn Dialog is open.
        //   Prevents the game from reacting to key presses while the user is
        //   typing in an input field (e.g. multiplayer room code, name input)
        //   or interacting with a dialog (settings, pause, game-over, hint).
        //   The P/M/I shortcuts are also blocked because the React dialogs
        //   handle their own close logic.
        if (document.querySelector('[data-slot="dialog-content"]')) return;

        // S8.22.2: Also block if the active element is an input/textarea
        //   (fallback for non-shadcn inputs like the multiplayer code field).
        const activeTag = document.activeElement?.tagName;
        if (activeTag === 'INPUT' || activeTag === 'TEXTAREA') return;

        initAudio();
        if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
            if (isPaused) resumeGame(); else pauseGame();
            return;
        }
        if (e.key === 'm' || e.key === 'M') {
            muted = !muted;
            applyMuteState();
            return;
        }
        if (e.key === 'i' || e.key === 'I') {
            hintOverlay.classList.remove('hidden');
            hintVisible = true;
            return;
        }
        if (hintVisible) return;
        if (!gameStarted) { e.preventDefault(); startGame(); return; }
        if (gameOver || isPaused) return;
        switch (e.key) {
            case 'ArrowLeft': playerMove(-1); break;
            case 'ArrowRight': playerMove(1); break;
            case 'ArrowDown': playerDrop(); break;
            case 'ArrowUp': case 'x': case 'X': playerRotate(1); break;
            case 'z': case 'Z': playerRotate(-1); break;
            case ' ': e.preventDefault(); playerHardDrop(1.3); break;
            case 'Shift': case 'c': case 'C': holdSwap(); break;
        }
    });

    gameContainer.addEventListener('click', () => {
        initAudio();
        if (!hintVisible && !gameStarted && !isPaused) startGame();
    });

    document.getElementById('restart-button').addEventListener('click', restartGame);

    pauseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        initAudio();
        if (isPaused) resumeGame(); else pauseGame();
    });
    document.getElementById('resume-button').addEventListener('click', (e) => {
        e.stopPropagation();
        resumeGame();
    });
    document.getElementById('restart-from-pause-button').addEventListener('click', (e) => {
        e.stopPropagation();
        restartGame();
    });

    const rattleSlider = document.getElementById('rattle-slider');
    const impactSlider = document.getElementById('impact-slider');
    const rattleValueEl = document.getElementById('rattle-value');
    const impactValueEl = document.getElementById('impact-value');

    rattleSlider.addEventListener('input', (e) => {
        e.stopPropagation();
        rattleStrength = Number(rattleSlider.value) / 100;
        rattleValueEl.textContent = rattleSlider.value + '%';
    });
    impactSlider.addEventListener('input', (e) => {
        e.stopPropagation();
        impactStrength = Number(impactSlider.value) / 100;
        impactValueEl.textContent = impactSlider.value + '%';
    });
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            // Ton sofort stoppen, unabhaengig davon, ob gerade eine Partie laeuft
            silenceAudioImmediately();
            pauseGame();
        }
    });

    // Beim tatsächlichen Verlassen/Schließen der Seite: Ton hart abschalten,
    // damit nichts nachklingt (z.B. Pad-Echo oder gerade gestartete Sounds)
    window.addEventListener('pagehide', silenceAudioImmediately);
    window.addEventListener('beforeunload', silenceAudioImmediately);

    const infoBtn = document.getElementById('info-btn');
    infoBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        hintOverlay.classList.remove('hidden');
        hintVisible = true;
    });

    document.getElementById('hide-hint-label').addEventListener('click', (e) => e.stopPropagation());
    document.getElementById('hint-close-button').addEventListener('click', (e) => {
        e.stopPropagation();
        if (document.getElementById('hide-hint-checkbox').checked) {
            try { localStorage.setItem('neonfall_hide_hint', '1'); } catch (err) { /* nicht verfuegbar, kein Problem */ }
        }
        hintOverlay.classList.add('hidden');
        hintVisible = false;
        // S7.6: Only show "Tippen zum Start" when the game hasn't started yet.
        //   Previously this was always called, so pressing (i) during a running
        //   game and closing the hint would show "Tippen zum Start" over the
        //   active playfield.
        if (!gameStarted) startPromptEl.classList.add('visible');
    });

    function updateLevelSelectDisplays() {
        document.querySelectorAll('.level-select-value').forEach(el => { el.textContent = startLevel; });
    }
    document.querySelectorAll('.level-minus').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            startLevel = Math.max(1, startLevel - 1);
            updateLevelSelectDisplays();
        });
    });
    document.querySelectorAll('.level-plus').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            startLevel = Math.min(20, startLevel + 1);
            updateLevelSelectDisplays();
        });
    });

    loadHighscore();
    restartGame();

    // Erststart: Spiel bleibt angehalten, bis der Hinweis geschlossen und
    // anschliessend auf das Spielfeld getippt wurde
    gameStarted = false;
    let hideHintPref = false;
    try { hideHintPref = localStorage.getItem('neonfall_hide_hint') === '1'; } catch (err) { hideHintPref = false; }
    if (hideHintPref) {
        hintOverlay.classList.add('hidden');
        hintVisible = false;
        startPromptEl.classList.add('visible');
    } else {
        hintVisible = true;
    }

    // ===== S5c/S7.2: Multiplayer hooks =====
    // pendingGarbage + applyGarbage sind jetzt oben (bei den anderen State-
    // variablen) definiert, nicht mehr hier. Das verhindert TDZ-Fehler beim
    // initialen restartGame().

    // Expose hooks for the React multiplayer layer.
    window.__nfAddGarbage = (count) => { pendingGarbage += Math.max(0, count | 0); };
    window.__nfResetGarbage = () => { pendingGarbage = 0; };
    window.__nfGetBoard = () => board.map(row => row.slice());
    window.__nfRestart = () => restartGame();
    window.__nfNextPreview = (n) => {
        nextPreviewCount = Math.max(1, Math.min(3, n | 0));
        drawNext();
    };
    // S8.19: React HintDialog calls this when the user closes the hint.
    //   Sets hintVisible=false (so gestures work again), adds 'hidden' class
    //   (so MutationObserver in useGameSync closes the React dialog), and
    //   shows start-prompt if the game hasn't started yet.
    window.__nfCloseHint = () => {
        hintOverlay.classList.add('hidden');
        hintVisible = false;
        if (!gameStarted) startPromptEl.classList.add('visible');
    };
    // S8.19: React PauseDialog calls these for WEITER / NEUSTART.
    //   They delegate to the IIFE's internal pause/resume/restart functions
    //   so audio + game state stays in sync.
    window.__nfResume = () => { resumeGame(); };
    // S8.19: React PauseDialog reads this for the live score display.
    window.__nfGetScore = () => score;
    // S8.19: React dialogs read/write startLevel for the level-stepper.
    window.__nfGetStartLevel = () => startLevel;
    window.__nfSetStartLevel = (lv) => {
        startLevel = Math.max(1, Math.min(20, lv | 0));
        updateLevelSelectDisplays();
    };
    // S8.19: React GameOverDialog reads these for score/best/new-highscore display.
    window.__nfGetHighscore = () => highscore;
    window.__nfIsNewHighscore = () => lastIsNewHighscore;

    // S7.2: Monkey-Patch entfernt — applyGarbage() ist jetzt direkt in
    //   resetPlayer() eingebaut (oben). Sauberer als Function-Overriding.
})();
`;
