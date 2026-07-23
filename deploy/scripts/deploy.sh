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

# ── 0.5. PORT-AUTO-DETECTION ───────────────────────────────────
echo -e "\n${YELLOW}[0.5] Port-Belegung prüfen...${NC}"

# Default-Ports
NEXTJS_PORT=3003
MP_PORT=3004

# Prüfe ob Default-Ports frei sind, sonst nächste freie finden
find_free_port() {
    local start=$1
    local end=$2
    for port in $(seq $start $end); do
        if ! ss -tln 2>/dev/null | grep -q ":$port "; then
            echo "$port"
            return
        fi
    done
    echo ""
}

# Prüfe 3003
if ss -tln 2>/dev/null | grep -q ":3003 "; then
    echo -e "  Port 3003 belegt — suche Alternative..."
    NEW_PORT=$(find_free_port 3005 3020)
    if [ -n "$NEW_PORT" ]; then
        NEXTJS_PORT=$NEW_PORT
        echo -e "  ${GREEN}✓ Next.js Port: $NEXTJS_PORT${NC}"
    else
        echo -e "${RED}  ✗ Kein freier Port im Bereich 3005-3020 gefunden!${NC}"
        exit 1
    fi
else
    echo -e "  Port 3003: ${GREEN}frei${NC} (Next.js)"
fi

# Prüfe 3004
if ss -tln 2>/dev/null | grep -q ":3004 "; then
    echo -e "  Port 3004 belegt — suche Alternative..."
    NEW_PORT=$(find_free_port 3005 3020)
    # Stelle sicher dass MP_PORT != NEXTJS_PORT
    while [ "$NEW_PORT" = "$NEXTJS_PORT" ] && [ -n "$NEW_PORT" ]; do
        NEW_PORT=$(find_free_port $((NEW_PORT + 1)) 3020)
    done
    if [ -n "$NEW_PORT" ]; then
        MP_PORT=$NEW_PORT
        echo -e "  ${GREEN}✓ Multiplayer Port: $MP_PORT${NC}"
    else
        echo -e "${YELLOW}  ⚠ Kein freier Port für Multiplayer — deaktiviere MP${NC}"
        MP_PORT=""
    fi
else
    echo -e "  Port 3004: ${GREEN}frei${NC} (Multiplayer)"
fi

echo -e "  ${CYAN}Verwendete Ports: Next.js=$NEXTJS_PORT, Multiplayer=$MP_PORT${NC}"

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
    # SSH statt HTTPS — nutzt den in ~/.ssh/config hinterlegten Key.
    # Funktioniert für private + public Repos ohne Passwort-Prompt.
    git clone git@github.com:LEVCON-AT/Neonfall.git neonfall
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
PORT="$NEXTJS_PORT"
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

# PORT sicherstellen (auto-detected)
if grep -q "^PORT=" .env; then
    sed -i "s|^PORT=.*|PORT=\"$NEXTJS_PORT\"|" .env
else
    echo "PORT=\"$NEXTJS_PORT\"" >> .env
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

# nginx config kopieren und Port anpassen (falls nicht 3003)
cp deploy/nginx/neonfall.levcon.ai.conf /etc/nginx/sites-available/neonfall.levcon.ai
if [ "$NEXTJS_PORT" != "3003" ]; then
    sed -i "s|server 127.0.0.1:3003;|server 127.0.0.1:$NEXTJS_PORT;|g" /etc/nginx/sites-available/neonfall.levcon.ai
    sed -i "s|127.0.0.1:3003|127.0.0.1:$NEXTJS_PORT|g" /etc/nginx/sites-available/neonfall.levcon.ai
    echo "  ✓ nginx Port auf $NEXTJS_PORT angepasst"
fi
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

# Next.js service kopieren und Port anpassen (falls nicht 3003)
cp deploy/systemd/neonfall.service /etc/systemd/system/neonfall.service
if [ "$NEXTJS_PORT" != "3003" ]; then
    sed -i "s|Environment=\"PORT=3003\"|Environment=\"PORT=$NEXTJS_PORT\"|" /etc/systemd/system/neonfall.service
    echo "  ✓ neonfall.service Port auf $NEXTJS_PORT angepasst"
fi

# Multiplayer service (nur wenn Port gefunden wurde)
if [ -n "$MP_PORT" ]; then
    cp deploy/systemd/neonfall-multiplayer.service /etc/systemd/system/neonfall-multiplayer.service
    # Multiplayer port ist in index.ts hardcoded als 3004 — falls abweichend, anpassen
    if [ "$MP_PORT" != "3004" ]; then
        # Ersetze im index.ts die Port-Konstante
        sed -i "s|const PORT = 3004|const PORT = $MP_PORT|" /var/www/neonfall/mini-services/multiplayer/index.ts
        echo "  ✓ multiplayer Port auf $MP_PORT angepasst (in index.ts)"
    fi
    HAS_MP=true
else
    echo -e "${YELLOW}  ⚠ Multiplayer deaktiviert (kein freier Port)${NC}"
    HAS_MP=false
fi

systemctl daemon-reload
systemctl enable neonfall
if [ "$HAS_MP" = true ]; then
    systemctl enable neonfall-multiplayer
fi

# ── 19. START SERVICES ─────────────────────────────────────────
echo -e "\n${YELLOW}[19] Start services...${NC}"

systemctl stop neonfall 2>/dev/null || true
systemctl stop neonfall-multiplayer 2>/dev/null || true
sleep 1

# Zombie-Prozesse killen
if command -v fuser &> /dev/null; then
    fuser -k $NEXTJS_PORT/tcp 2>/dev/null || true
    if [ -n "$MP_PORT" ]; then
        fuser -k $MP_PORT/tcp 2>/dev/null || true
    fi
fi
sleep 1

systemctl restart nginx
systemctl restart neonfall
if [ "$HAS_MP" = true ]; then
    systemctl restart neonfall-multiplayer
fi
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
for port in $NEXTJS_PORT ${MP_PORT:-}; do
    [ -z "$port" ] && continue
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
echo "  Next.js:     Port $NEXTJS_PORT"
if [ -n "$MP_PORT" ]; then
    echo "  Multiplayer: Port $MP_PORT (via XTransformPort erreichbar)"
else
    echo "  Multiplayer: deaktiviert (kein freier Port)"
fi

echo -e "\n${YELLOW}Logs:${NC}"
echo "  Next.js:     journalctl -u neonfall -f"
echo "  Multiplayer: journalctl -u neonfall-multiplayer -f"
echo "  Nginx:       tail -f /var/log/nginx/neonfall.levcon.ai.error.log"

echo -e "\n${GREEN}Fertig! 🎮${NC}"
