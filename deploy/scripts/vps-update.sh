#!/bin/bash
# ═══════════════════════════════════════════════════════════════
#  NEONFALL — VPS UPDATE SCRIPT
#  Wird bei jedem Push auf main via GitHub Actions ausgeführt
# ═══════════════════════════════════════════════════════════════
#
#  Dieses Skript:
#  - Macht git pull (latest main)
#  - Installiert Dependencies (Next.js + Multiplayer)
#  - Updated DB Schema (falls geändert)
#  - Baut Next.js neu (Standalone)
#  - Kopiert static files
#  - Restartet systemd services (Next.js + Multiplayer)
#  - Reloaded nginx (falls config geändert)

set -e

# Non-interactive mode (wichtig für CI/CD — keine Prompts!)
export DEBIAN_FRONTEND=noninteractive
export BUN_INSTALL="$HOME/.bun"
export PATH="$BUN_INSTALL/bin:/usr/local/bin:/usr/bin:/bin:$PATH"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m'

echo -e "${GREEN}═════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  NEONFALL — VPS UPDATE${NC}"
echo -e "${GREEN}  $(date)${NC}"
echo -e "${GREEN}═════════════════════════════════════════════════════${NC}"

# Project directory
PROJECT_DIR="/var/www/neonfall"
cd "$PROJECT_DIR" || {
    echo -e "${RED}Project directory not found: $PROJECT_DIR${NC}"
    exit 1
}

# Fix "dubious ownership" warning
git config --global --add safe.directory "$PROJECT_DIR"
git config --add safe.directory "$PROJECT_DIR"

# ── 1. SAVE CURRENT STATE (for rollback) ───────────────────────
echo -e "\n${YELLOW}[1] Save current state for rollback...${NC}"

if [ -d ".next/standalone" ]; then
    cp -r .next/standalone .next/standalone.backup
    cp -r .next/static .next/static.backup
    echo "  ✓ Backup erstellt"
fi

# ── 2. GIT PULL ────────────────────────────────────────────────
echo -e "\n${YELLOW}[2] Git pull...${NC}"

git fetch origin main
git reset --hard origin/main
git clean -fd -e .env -e .env.local -e .env.production

echo "  ✓ Code aktualisiert: $(git log --oneline -1)"

# ── 2.5. ENV-FILE KORRIGIEREN ──────────────────────────────────
if [ -f ".env" ]; then
    VPS_DB_URL="file:/var/www/neonfall/db/neonfall.db"
    if grep -q "^DATABASE_URL=" .env; then
        CURRENT_DB_URL=$(grep "^DATABASE_URL=" .env | head -1 | cut -d'=' -f2- | tr -d '"')
        if [ "$CURRENT_DB_URL" != "$VPS_DB_URL" ]; then
            echo "  Korrigiere DATABASE_URL: $CURRENT_DB_URL → $VPS_DB_URL"
            sed -i "s|^DATABASE_URL=.*|DATABASE_URL=\"$VPS_DB_URL\"|" .env
        fi
    else
        echo "DATABASE_URL=\"$VPS_DB_URL\"" >> .env
        echo "  Füge DATABASE_URL hinzu: $VPS_DB_URL"
    fi
    if grep -q "^PORT=" .env; then
        sed -i "s|^PORT=.*|PORT=\"3003\"|" .env
    else
        echo "PORT=\"3003\"" >> .env
    fi
else
    echo -e "${RED}  ✗ .env fehlt! Erstelle Minimal-Env...${NC}"
    echo "DATABASE_URL=\"file:/var/www/neonfall/db/neonfall.db\"" > .env
    echo "PORT=\"3003\"" >> .env
    echo "NEXT_PUBLIC_SITE_URL=\"https://neonfall.levcon.ai\"" >> .env
fi

# ── 3. INSTALL DEPENDENCIES ────────────────────────────────────
echo -e "\n${YELLOW}[3] Install dependencies...${NC}"

bun install --frozen-lockfile --no-progress 2>&1 || bun install --frozen-lockfile 2>&1
echo "  ✓ Dependencies installiert"

# ── 3.5. INSTALL MULTIPLAYER DEPENDENCIES ──────────────────────
echo -e "\n${YELLOW}[3.5] Install multiplayer dependencies...${NC}"

cd mini-services/multiplayer
bun install --frozen-lockfile --no-progress 2>&1 || bun install --frozen-lockfile 2>&1
cd "$PROJECT_DIR"
echo "  ✓ Multiplayer dependencies installiert"

# ── 4. PRISMA DB PUSH ──────────────────────────────────────────
echo -e "\n${YELLOW}[4] Prisma DB push...${NC}"

chmod +x node_modules/@prisma/engines/* 2>/dev/null || true
chmod +x node_modules/.bin/* 2>/dev/null || true

bun run db:push --accept-data-loss 2>&1 || bun run db:push 2>&1

chown -R www-data:www-data db 2>/dev/null || true
chmod 755 db 2>/dev/null || true
if [ -f "db/neonfall.db" ]; then
    chown www-data:www-data db/neonfall.db
    chmod 664 db/neonfall.db
    echo "  ✓ DB ownership korrigiert (www-data)"
fi

echo "  ✓ DB Schema synchronisiert"

# ── 5. NEXT.JS BUILD ───────────────────────────────────────────
echo -e "\n${YELLOW}[5] Next.js build...${NC}"

if timeout 300 bun run build; then
    echo "  ✓ Build erfolgreich"
else
    echo -e "${RED}  ✗ Build fehlgeschlagen — Restore backup${NC}"
    
    if [ -d ".next/standalone.backup" ]; then
        rm -rf .next/standalone
        mv .next/standalone.backup .next/standalone
        rm -rf .next/static
        mv .next/static.backup .next/static
        echo -e "${YELLOW}  ⚠ Backup wiederhergestellt — Service läuft auf altem Build${NC}"
    fi
    
    exit 1
fi

# ── 6. COPY STANDALONE FILES ───────────────────────────────────
echo -e "\n${YELLOW}[6] Copy standalone files...${NC}"

cp -r public .next/standalone/
cp -r .next/static .next/standalone/.next/

echo "  ✓ Static files kopiert"

# ── 7. PERMISSIONS ─────────────────────────────────────────────
echo -e "\n${YELLOW}[7] Set permissions...${NC}"

chown -R www-data:www-data /var/www/neonfall

chmod 755 /var/www/neonfall
chmod 755 /var/www/neonfall/db 2>/dev/null || true
chmod 644 /var/www/neonfall/.env
chmod 755 /var/www/neonfall/.next/standalone/server.js 2>/dev/null || true
chmod 664 /var/www/neonfall/db/neonfall.db 2>/dev/null || true
chmod +x /var/www/neonfall/node_modules/@prisma/engines/* 2>/dev/null || true
chmod +x /var/www/neonfall/node_modules/.bin/* 2>/dev/null || true

echo "  ✓ Permissions gesetzt"

# ── 8. NGINX CONFIG ────────────────────────────────────────────
echo -e "\n${YELLOW}[8] Nginx config check...${NC}"

if [ -f "deploy/nginx/neonfall.levcon.ai.conf" ]; then
    cp deploy/nginx/neonfall.levcon.ai.conf /etc/nginx/sites-available/neonfall.levcon.ai
    ln -sf /etc/nginx/sites-available/neonfall.levcon.ai /etc/nginx/sites-enabled/neonfall.levcon.ai
fi

if nginx -t 2>&1; then
    systemctl reload nginx
    echo "  ✓ Nginx reloaded"
else
    echo -e "${RED}  ✗ Nginx config test failed — skip reload${NC}"
fi

# ── 9. SYSTEMD SERVICES RESTART ────────────────────────────────
echo -e "\n${YELLOW}[9] Restart services...${NC}"

# Copy updated systemd service files if changed
if [ -f "deploy/systemd/neonfall.service" ]; then
    cp deploy/systemd/neonfall.service /etc/systemd/system/neonfall.service
fi
if [ -f "deploy/systemd/neonfall-multiplayer.service" ]; then
    cp deploy/systemd/neonfall-multiplayer.service /etc/systemd/system/neonfall-multiplayer.service
fi
systemctl daemon-reload

systemctl restart neonfall
systemctl restart neonfall-multiplayer
sleep 2

if systemctl is-active --quiet neonfall; then
    echo "  ✓ neonfall service läuft"
else
    echo -e "${RED}  ✗ neonfall service nicht gestartet!${NC}"
    journalctl -u neonfall --no-pager -n 30
    exit 1
fi

if systemctl is-active --quiet neonfall-multiplayer; then
    echo "  ✓ neonfall-multiplayer service läuft"
else
    echo -e "${YELLOW}  ⚠ neonfall-multiplayer service nicht gestartet (nicht kritisch)${NC}"
    journalctl -u neonfall-multiplayer --no-pager -n 10
fi

# ── 10. CLEANUP BACKUPS ────────────────────────────────────────
echo -e "\n${YELLOW}[10] Cleanup backups...${NC}"

rm -rf .next/standalone.backup .next/static.backup
echo "  ✓ Backups entfernt"

# ── 11. FINAL STATUS ───────────────────────────────────────────
echo -e "\n${GREEN}═════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  UPDATE ERFOLGREICH!${NC}"
echo -e "${GREEN}═════════════════════════════════════════════════════${NC}"

echo -e "\n${YELLOW}Commit:${NC} $(git log --oneline -1)"
echo -e "${YELLOW}Next.js:${NC} $(systemctl is-active neonfall)"
echo -e "${YELLOW}Multiplayer:${NC} $(systemctl is-active neonfall-multiplayer)"
echo -e "${YELLOW}URL:${NC} https://neonfall.levcon.ai"

exit 0
