#!/bin/bash
# ═══════════════════════════════════════════════════════════════
#  NEONFALL — Multiplayer Service Start Wrapper
#  Findet bun wo auch immer es installiert ist und startet den Service.
# ═══════════════════════════════════════════════════════════════
#
#  Reihenfolge:
#    1. /usr/local/bin/bun (system-wide installation)
#    2. /opt/bun/bin/bun (alternative system-wide)
#    3. which bun (PATH lookup)
#    4. node fallback (mit tsx für .ts execution)
#
#  Erstellt von: deploy/scripts/vps-update.sh (wird bei jedem Deploy kopiert)

set -e

SCRIPT_DIR="/var/www/neonfall/mini-services/multiplayer"
ENTRY="$SCRIPT_DIR/index.ts"

# Bun finden
BUN=""
for candidate in /usr/local/bin/bun /opt/bun/bin/bun; do
    if [ -x "$candidate" ]; then
        BUN="$candidate"
        break
    fi
done

# Falls nicht gefunden, PATH durchsuchen
if [ -z "$BUN" ]; then
    BUN=$(which bun 2>/dev/null || true)
fi

if [ -n "$BUN" ] && [ -x "$BUN" ]; then
    echo "Starting multiplayer with bun: $BUN"
    exec "$BUN" run "$ENTRY"
fi

# Fallback: node + tsx
NODE=$(which node 2>/dev/null || true)
if [ -n "$NODE" ]; then
    # Prüfen ob tsx verfügbar ist
    TSX="$SCRIPT_DIR/node_modules/.bin/tsx"
    if [ -x "$TSX" ]; then
        echo "Starting multiplayer with node + tsx: $NODE"
        exec "$NODE" "$TSX" "$ENTRY"
    fi
    # Ohne tsx: versuchen es direkt (node kann .ts mit --import tsx)
    echo "Starting multiplayer with node (native): $NODE"
    exec "$NODE" --import tsx "$ENTRY" 2>/dev/null || exec "$NODE" "$ENTRY"
fi

echo "ERROR: Neither bun nor node found!"
echo "Install bun system-wide: curl -fsSL https://bun.sh/install | bash"
echo "Then: sudo cp ~/.bun/bin/bun /usr/local/bin/bun && sudo chmod +x /usr/local/bin/bun"
exit 1
