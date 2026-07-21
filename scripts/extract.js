// Extracts CSS, body HTML, and JS from the NEONFALL HTML file
// into a TypeScript module with properly escaped template literals.
import fs from 'fs';

const SRC = '/home/z/my-project/upload/neonfall-10.html';
const OUT = '/home/z/my-project/src/app/neonfall-content.ts';

const html = fs.readFileSync(SRC, 'utf8');

// CSS between the first <style>...</style>
const cssMatch = html.match(/<style>([\s\S]*?)<\/style>/);
if (!cssMatch) throw new Error('Could not find <style> block');
const GAME_CSS = cssMatch[1];

// Body inner HTML: everything between <body> and the first <script>
const bodyMatch = html.match(/<body>([\s\S]*?)<script>/);
if (!bodyMatch) throw new Error('Could not find <body>...<script> block');
const GAME_HTML = bodyMatch[1].trim();

// JS between <script>...</script> (the game IIFE)
const jsMatch = html.match(/<script>([\s\S]*?)<\/script>/);
if (!jsMatch) throw new Error('Could not find <script> block');
const GAME_SCRIPT = jsMatch[1];

function esc(s) {
  return s
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')
    .replace(/\$\{/g, '\\${');
}

const out = `// AUTO-GENERATED from upload/neonfall-10.html by scripts/extract.js
// Do not edit by hand. Re-run: bun run scripts/extract.js
export const GAME_CSS = \`${esc(GAME_CSS)}\`;

export const GAME_HTML = \`${esc(GAME_HTML)}\`;

export const GAME_SCRIPT = \`${esc(GAME_SCRIPT)}\`;
`;

fs.writeFileSync(OUT, out);
console.log('Wrote', OUT);
console.log('CSS length:', GAME_CSS.length);
console.log('HTML length:', GAME_HTML.length);
console.log('JS length:', GAME_SCRIPT.length);
