#!/bin/bash
# ═══════════════════════════════════════════════════════════════
#  NEONFALL — VPS DEPLOYMENT SCRIPT (Initial Setup)
#  Deploy-Ziel: neonfall.levcon.ai
#  Ausführen als: root (auf dem VPS)
# ═══════════════════════════════════════════════════════════════
#
#  Dieses Skript:
#  1. Installiert Node.js, nginx, certbot, git, bun
#  2. Klont das Neonfall-Repo nach /var/www/neonfall
#  3. Richtet .env ein
#  4. Baut Next.js (Standalone)
#  5. Konfiguriert nginx + SSL (neonfall.levcon.ai)
#  6. Richtet systemd-Services ein (Next.js + Multiplayer)
#  7. Startet alles
#
#  WICHTIG: Als root ausführen!
#  sudo bash deploy.sh
#
#  Voraussetzung: DNS-Eintrag neonfall.levcon.ai → VPS-IP

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m'

echo -e "${GREEN}═════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  NEONFALL — VPS DEPLOYMENT${NC}"
echo -e "${GREEN}  neonfall.levcon.ai${NC}"
echo -e "${GREEN}═════════════════════════════════════════════════════${NC}"

# ── 0. PRE-FLIGHT CHECKS ───────────────────────────────────────
echo -e "\n${YELLOW}[0] Pre-flight checks...${NC}"

if [[ $EUID -ne 0 ]]; then
   echo -e "${RED}Dieses Skript muss als root ausgeführt werden.${NC}"
   exit 1
fi

echo "OS: $(uname -a)"
echo "Hostname: $(hostname)"

# ── 1. SYSTEM UPDATE & PACKAGES ────────────────────────────────
echo -e "\n${YELLOW}[1] System update & packages...${NC}"

apt-get update -y
apt-get upgrade -y
apt-get install -y \
    curl \
    wget \
    git \
    unzip \
    zip \
    nginx \
    certbot \
    python3-certbot-nginx \
    apache2-utils \
    sqlite3 \
    build-essential \
    htop \
    ufw \
    fail2ban \
    unattended-upgrades

# ── 2. NODE.JS 20 LTS ──────────────────────────────────────────
echo -e "\n${YELLOW}[2] Node.js 20 LTS...${NC}"

if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
fi

echo "Node: $(node --version)"
echo "npm: $(npm --version)"

# ── 3. BUN ──────────────────────────────────────────────────────
echo -e "\n${YELLOW}[3] Bun...${NC}"

if ! command -v bun &> /dev/null; then
    curl -fsSL https://bun.sh/install | bash
    export BUN_INSTALL="$HOME/.bun"
    export PATH="$BUN_INSTALL/bin:$PATH"
    # Für alle User verfügbar machen
    ln -sf /root/.bun/bin/bun /usr/local/bin/bun
fi
echo "Bun: $(bun --version)"

# ── 4. FIREWALL (UFW) ──────────────────────────────────────────
echo -e "\n${YELLOW}[4] Firewall...${NC}"

ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# ── 5. FAIL2BAN ────────────────────────────────────────────────
echo -e "\n${YELLOW}[5] Fail2ban...${NC}"

systemctl enable fail2ban
systemctl start fail2ban

# ── 6. AUTO SECURITY UPDATES ───────────────────────────────────
echo -e "\n${YELLOW}[6] Auto security updates...${NC}"

dpkg-reconfigure -plow unattended-upgrades

# ── 7. PROJECT DIRECTORY & GIT CLONE ───────────────────────────
echo -e "\n${YELLOW}[7] Project directory & git clone...${NC}"

mkdir -p /var/www
cd /var/www

if [ -d "neonfall" ]; then
    echo "Verzeichnis existiert bereits — pull latest..."
    git config --global --add safe.directory /var/www/neonfall
    cd neonfall
    git config --add safe.directory /var/www/neonfall
    git fetch origin main
    git reset --hard origin/main
    git clean -fd -e .env
else
    git clone https://github.com/LEVCON-AT/Neonfall.git neonfall
    cd neonfall
fi

echo "  CWD: $(pwd)"
echo "  Commit: $(git log --oneline -1)"

# ── 8. ENVIRONMENT FILE ────────────────────────────────────────
echo -e "\n${YELLOW}[8] Environment file...${NC}"

VPS_DB_URL="file:/var/www/neonfall/db/neonfall.db"

if [ ! -f ".env" ]; then
    cat > .env << EOF
DATABASE_URL="$VPS_DB_URL"
PORT="3003"
NODE_ENV="production"
NEXT_PUBLIC_SITE_URL="https://neonfall.levcon.ai"
EOF
    echo -e "${YELLOW}.env erstellt.${NC}"
else
    echo ".env existiert bereits — prüfe DATABASE_URL..."
fi

# SECURITY: DATABASE_URL immer auf VPS-Pfad setzen
if grep -q "^DATABASE_URL=" .env; then
    sed -i "s|^DATABASE_URL=.*|DATABASE_URL=\"$VPS_DB_URL\"|" .env
    echo "  ✓ DATABASE_URL korrigiert: $VPS_DB_URL"
else
    echo "DATABASE_URL=\"$VPS_DB_URL\"" >> .env
    echo "  ✓ DATABASE_URL hinzugefügt: $VPS_DB_URL"
fi

# PORT sicherstellen
if grep -q "^PORT=" .env; then
    sed -i "s|^PORT=.*|PORT=\"3003\"|" .env
else
    echo "PORT=\"3003\"" >> .env
fi

chmod 600 .env

# ── 9. DATABASE DIRECTORY ──────────────────────────────────────
echo -e "\n${YELLOW}[9] Database directory...${NC}"

mkdir -p db
chown -R www-data:www-data db
chmod 755 db

# ── 10. INSTALL DEPENDENCIES ───────────────────────────────────
echo -e "\n${YELLOW}[10] Install dependencies...${NC}"

bun install

# ── 11. INSTALL MULTIPLAYER DEPENDENCIES ───────────────────────
echo -e "\n${YELLOW}[11] Install multiplayer dependencies...${NC}"

cd mini-services/multiplayer
bun install
cd /var/www/neonfall

# ── 12. PRISMA DB PUSH ─────────────────────────────────────────
echo -e "\n${YELLOW}[12] Prisma DB push...${NC}"

chmod +x node_modules/@prisma/engines/* 2>/dev/null || true
chmod +x node_modules/.bin/* 2>/dev/null || true

bun run db:push --accept-data-loss 2>&1 || bun run db:push 2>&1

if [ -f "db/neonfall.db" ]; then
    echo "  ✓ DB erstellt: $(ls -la db/neonfall.db | awk '{print $5}') bytes"
    chown www-data:www-data db/neonfall.db
    chmod 644 db/neonfall.db
else
    echo -e "${RED}  ✗ DB wurde nicht erstellt!${NC}"
fi

# ── 13. NEXT.JS BUILD ──────────────────────────────────────────
echo -e "\n${YELLOW}[13] Next.js build...${NC}"

bun run build

# ── 14. STANDALONE SERVER FILE ─────────────────────────────────
echo -e "\n${YELLOW}[14] Copy standalone files...${NC}"

cp -r public .next/standalone/
cp -r .next/static .next/standalone/.next/

mkdir -p .next/standalone/.next/cache
mkdir -p .next/cache
mkdir -p db

chown -R www-data:www-data /var/www/neonfall

# ── 15. SSL CERTIFICATES (Let's Encrypt) ───────────────────────
echo -e "\n${YELLOW}[15] SSL certificates...${NC}"

echo -e "${YELLOW}Hinweis: Stelle sicher, dass neonfall.levcon.ai auf diese VPS-IP zeigt!${NC}"
echo -e "${YELLOW}Drücke ENTER zum Fortfahren...${NC}"
read

systemctl stop nginx 2>/dev/null || true

if [ ! -f "/etc/letsencrypt/live/neonfall.levcon.ai/fullchain.pem" ]; then
    echo "Erstelle Zertifikat für neonfall.levcon.ai (via standalone)..."
    certbot certonly --standalone \
        -d neonfall.levcon.ai \
        --email admin@levcon.at --agree-tos --no-eff-email --non-interactive
fi

# ── 16. NGINX CONFIGURATION ────────────────────────────────────
echo -e "\n${YELLOW}[16] Nginx configuration...${NC}"

mkdir -p /var/www/letsencrypt

cp deploy/nginx/neonfall.levcon.ai.conf /etc/nginx/sites-available/neonfall.levcon.ai
ln -sf /etc/nginx/sites-available/neonfall.levcon.ai /etc/nginx/sites-enabled/neonfall.levcon.ai

# Default site entfernen (nur wenn neonfall die einzige site ist)
# rm -f /etc/nginx/sites-enabled/default

if nginx -t 2>&1; then
    echo "  ✓ Nginx config OK"
else
    echo -e "${RED}  ✗ Nginx config test fehlgeschlagen${NC}"
    exit 1
fi

# ── 17. AUTO-RENEWAL ───────────────────────────────────────────
echo -e "\n${YELLOW}[17] Auto-renewal...${NC}"

systemctl enable certbot.timer
systemctl start certbot.timer

cat > /etc/letsencrypt/renewal-hooks/post/reload-nginx-neonfall.sh << 'EOF'
#!/bin/bash
systemctl reload nginx
EOF
chmod +x /etc/letsencrypt/renewal-hooks/post/reload-nginx-neonfall.sh

# ── 18. SYSTEMD SERVICES ───────────────────────────────────────
echo -e "\n${YELLOW}[18] Systemd services...${NC}"

cp deploy/systemd/neonfall.service /etc/systemd/system/neonfall.service
cp deploy/systemd/neonfall-multiplayer.service /etc/systemd/system/neonfall-multiplayer.service
systemctl daemon-reload
systemctl enable neonfall
systemctl enable neonfall-multiplayer

# ── 19. START SERVICES ─────────────────────────────────────────
echo -e "\n${YELLOW}[19] Start services...${NC}"

systemctl stop neonfall 2>/dev/null || true
systemctl stop neonfall-multiplayer 2>/dev/null || true
sleep 1

# Zombie-Prozesse killen
if command -v fuser &> /dev/null; then
    fuser -k 3003/tcp 2>/dev/null || true
    fuser -k 3004/tcp 2>/dev/null || true
fi
sleep 1

systemctl restart nginx
systemctl restart neonfall
systemctl restart neonfall-multiplayer
sleep 3

# Verify Next.js läuft
if systemctl is-active --quiet neonfall; then
    echo "  ✓ neonfall service aktiv"
else
    echo -e "${RED}  ✗ neonfall service nicht aktiv!${NC}"
    journalctl -u neonfall --no-pager -n 30
fi

if systemctl is-active --quiet neonfall-multiplayer; then
    echo "  ✓ neonfall-multiplayer service aktiv"
else
    echo -e "${RED}  ✗ neonfall-multiplayer service nicht aktiv!${NC}"
    journalctl -u neonfall-multiplayer --no-pager -n 30
fi

# Verify ports
for port in 3003 3004; do
    if ss -tln | grep -q ":$port"; then
        echo "  ✓ Port $port lauscht"
    else
        echo -e "${RED}  ✗ Port $port nicht erreichbar${NC}"
    fi
done

# ── 20. DB BACKUP CRON ─────────────────────────────────────────
echo -e "\n${YELLOW}[20] DB backup cron...${NC}"

mkdir -p /var/backups/neonfall

cat > /etc/cron.d/neonfall-backup << 'EOF'
# Neonfall DB Backup — täglich 03:00
0 3 * * * root sqlite3 /var/www/neonfall/db/neonfall.db ".dump" | gzip > /var/backups/neonfall/neonfall-$(date +\%Y\%m\%d).db.gz && find /var/backups/neonfall -name "neonfall-*.db.gz" -mtime +30 -delete
EOF
chmod 644 /etc/cron.d/neonfall-backup

# ── 21. FINAL STATUS ───────────────────────────────────────────
echo -e "\n${GREEN}═════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  DEPLOYMENT ERFOLGREICH!${NC}"
echo -e "${GREEN}═════════════════════════════════════════════════════${NC}"

echo -e "\n${YELLOW}Status:${NC}"
systemctl status neonfall --no-pager | head -5
echo ""
systemctl status neonfall-multiplayer --no-pager | head -5
echo ""
systemctl status nginx --no-pager | head -5

echo -e "\n${YELLOW}URLs:${NC}"
echo "  https://neonfall.levcon.ai"
echo "  Multiplayer: Port 3004 (intern), via XTransformPort erreichbar"

echo -e "\n${YELLOW}Logs:${NC}"
echo "  Next.js:     journalctl -u neonfall -f"
echo "  Multiplayer: journalctl -u neonfall-multiplayer -f"
echo "  Nginx:       tail -f /var/log/nginx/neonfall.levcon.ai.error.log"

echo -e "\n${GREEN}Fertig! 🎮${NC}"
