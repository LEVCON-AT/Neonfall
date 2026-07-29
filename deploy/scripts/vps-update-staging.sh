#!/bin/bash
# ═══════════════════════════════════════════════════════════════
#  NEONFALL — VPS STAGING UPDATE SCRIPT
#  Wird bei jedem Push auf 'staging' branch via GitHub Actions ausgeführt
# ═══════════════════════════════════════════════════════════════
#
#  Unterschiede zu Production (vps-update.sh):
#  - PROJECT_DIR: /var/www/neonfall-staging
#  - DB: neonfall_staging.db (isoliert von Production)
#  - Port: 3005 (Next.js), 3006 (Multiplayer)
#  - systemd: neonfall-staging, neonfall-staging-multiplayer
#  - nginx: neonfall-staging.levcon.ai.conf
#  - Branch: staging (nicht main)

set -e

export DEBIAN_FRONTEND=noninteractive
export BUN_INSTALL="$HOME/.bun"
export PATH="$BUN_INSTALL/bin:/usr/local/bin:/usr/bin:/bin:$PATH"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m'

echo -e "${GREEN}═════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  NEONFALL — STAGING VPS UPDATE${NC}"
echo -e "${GREEN}  $(date)${NC}"
echo -e "${GREEN}═════════════════════════════════════════════════════${NC}"

PROJECT_DIR="/var/www/neonfall-staging"
cd "$PROJECT_DIR" || {
    echo -e "${RED}Staging directory not found: $PROJECT_DIR${NC}"
    echo -e "${YELLOW}Run initial setup first: deploy/staging/SETUP.md${NC}"
    exit 1
}

git config --global --add safe.directory "$PROJECT_DIR"
git config --add safe.directory "$PROJECT_DIR"

# ── 1. BACKUP ──────────────────────────────────────────────────
echo -e "\n${YELLOW}[1] Backup...${NC}"
if [ -d ".next/standalone" ]; then
    cp -r .next/standalone .next/standalone.backup
    cp -r .next/static .next/static.backup
    echo "  ✓ Backup"
fi

# ── 2. GIT PULL (staging branch) ───────────────────────────────
echo -e "\n${YELLOW}[2] Git pull (staging)...${NC}"
git fetch origin staging || {
    echo -e "${RED}  ✗ git fetch staging fehlgeschlagen!${NC}"
    exit 1
}
git reset --hard origin/staging
git clean -fd -e .env -e .env.local -e .env.production
echo "  ✓ Code: $(git log --oneline -1)"

# ── 2.5. ENV ───────────────────────────────────────────────────
if [ -f ".env" ]; then
    VPS_DB_URL="file:/var/www/neonfall-staging/db/neonfall_staging.db"
    if grep -q "^DATABASE_URL=" .env; then
        sed -i "s|^DATABASE_URL=.*|DATABASE_URL=\"$VPS_DB_URL\"|" .env
    else
        echo "DATABASE_URL=\"$VPS_DB_URL\"" >> .env
    fi
    if grep -q "^PORT=" .env; then
        sed -i "s|^PORT=.*|PORT=\"3005\"|" .env
    else
        echo "PORT=\"3005\"" >> .env
    fi
else
    echo "DATABASE_URL=\"$VPS_DB_URL\"" > .env
    echo "PORT=\"3005\"" >> .env
    echo "NEXT_PUBLIC_SITE_URL=\"https://neonfall-staging.levcon.ai\"" >> .env
fi

# ── 3. DEPENDENCIES ────────────────────────────────────────────
echo -e "\n${YELLOW}[3] Install dependencies...${NC}"
bun install --frozen-lockfile --no-progress 2>&1 || bun install --frozen-lockfile 2>&1
echo "  ✓ Dependencies"

# ── 3.5. MULTIPLAYER DEPENDENCIES ──────────────────────────────
echo -e "\n${YELLOW}[3.5] Multiplayer dependencies...${NC}"
cd mini-services/multiplayer
bun install --frozen-lockfile --no-progress 2>&1 || bun install --frozen-lockfile 2>&1
chmod +x start.sh 2>/dev/null || true
chown www-data:www-data start.sh 2>/dev/null || true
cd "$PROJECT_DIR"
echo "  ✓ Multiplayer deps"

# ── 4. PRISMA DB ───────────────────────────────────────────────
echo -e "\n${YELLOW}[4] Prisma DB push...${NC}"
chmod +x node_modules/@prisma/engines/* 2>/dev/null || true
bun run db:push --accept-data-loss 2>&1 || bun run db:push 2>&1
chown -R www-data:www-data db 2>/dev/null || true
chmod 755 db 2>/dev/null || true
echo "  ✓ DB Schema"

# ── 5. BUILD ───────────────────────────────────────────────────
echo -e "\n${YELLOW}[5] Next.js build...${NC}"
if timeout 300 bun run build; then
    echo "  ✓ Build"
else
    echo -e "${RED}  ✗ Build failed — restore backup${NC}"
    if [ -d ".next/standalone.backup" ]; then
        rm -rf .next/standalone
        mv .next/standalone.backup .next/standalone
        rm -rf .next/static
        mv .next/static.backup .next/static
    fi
    exit 1
fi

# ── 6. COPY STANDALONE ─────────────────────────────────────────
echo -e "\n${YELLOW}[6] Copy standalone...${NC}"
cp -r public .next/standalone/
cp -r .next/static .next/standalone/.next/
echo "  ✓ Static files"

# ── 7. PERMISSIONS ─────────────────────────────────────────────
echo -e "\n${YELLOW}[7] Permissions...${NC}"
chown -R www-data:www-data /var/www/neonfall-staging
chmod 755 /var/www/neonfall-staging
chmod 644 /var/www/neonfall-staging/.env
chmod 755 /var/www/neonfall-staging/.next/standalone/server.js 2>/dev/null || true
echo "  ✓ Permissions"

# ── 8. NGINX ───────────────────────────────────────────────────
echo -e "\n${YELLOW}[8] Nginx...${NC}"
if [ -f "deploy/staging/neonfall-staging.levcon.ai.conf" ]; then
    cp deploy/staging/neonfall-staging.levcon.ai.conf /etc/nginx/sites-available/neonfall-staging.levcon.ai
    ln -sf /etc/nginx/sites-available/neonfall-staging.levcon.ai /etc/nginx/sites-enabled/neonfall-staging.levcon.ai
fi
if nginx -t 2>&1; then
    systemctl reload nginx
    echo "  ✓ Nginx reloaded"
else
    echo -e "${RED}  ✗ Nginx config test failed${NC}"
fi

# ── 9. SERVICES ────────────────────────────────────────────────
echo -e "\n${YELLOW}[9] Restart services...${NC}"
if [ -f "deploy/staging/neonfall-staging.service" ]; then
    cp deploy/staging/neonfall-staging.service /etc/systemd/system/neonfall-staging.service
fi
if [ -f "deploy/staging/neonfall-staging-multiplayer.service" ]; then
    cp deploy/staging/neonfall-staging-multiplayer.service /etc/systemd/system/neonfall-staging-multiplayer.service
fi
systemctl daemon-reload

systemctl restart neonfall-staging
systemctl restart neonfall-staging-multiplayer
sleep 2

if systemctl is-active --quiet neonfall-staging; then
    echo "  ✓ neonfall-staging läuft"
else
    echo -e "${RED}  ✗ neonfall-staging nicht gestartet!${NC}"
    journalctl -u neonfall-staging --no-pager -n 30
    exit 1
fi

if systemctl is-active --quiet neonfall-staging-multiplayer; then
    echo "  ✓ neonfall-staging-multiplayer läuft"
else
    echo -e "${YELLOW}  ⚠ neonfall-staging-multiplayer nicht gestartet${NC}"
    journalctl -u neonfall-staging-multiplayer --no-pager -n 10
fi

# ── 10. CLEANUP ────────────────────────────────────────────────
rm -rf .next/standalone.backup .next/static.backup

# ── 11. STATUS ─────────────────────────────────────────────────
echo -e "\n${GREEN}═════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  STAGING UPDATE ERFOLGREICH!${NC}"
echo -e "${GREEN}═════════════════════════════════════════════════════${NC}"
echo -e "\n${YELLOW}Commit:${NC} $(git log --oneline -1)"
echo -e "${YELLOW}Next.js:${NC} $(systemctl is-active neonfall-staging)"
echo -e "${YELLOW}Multiplayer:${NC} $(systemctl is-active neonfall-staging-multiplayer)"
echo -e "${YELLOW}URL:${NC} https://neonfall-staging.levcon.ai"

exit 0
