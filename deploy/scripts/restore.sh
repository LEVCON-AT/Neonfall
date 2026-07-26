#!/bin/bash
# ═══════════════════════════════════════════════════════════════
#  NEONFALL — RESTORE SCRIPT
#  Stellt ein Backup wieder her
# ═══════════════════════════════════════════════════════════════
#
#  Aufruf: sudo bash /var/www/neonfall/deploy/scripts/restore.sh <backup-file>
#  Beispiel: sudo bash restore.sh /var/backups/neonfall/neonfall-20260724_030000.tar.gz

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m'

if [ -z "$1" ]; then
    echo -e "${RED}Usage: sudo bash restore.sh <backup-file.tar.gz>${NC}"
    echo "Available backups:"
    ls -lh /var/backups/neonfall/neonfall-*.tar.gz 2>/dev/null || echo "  No backups found"
    exit 1
fi

BACKUP_FILE="$1"
TEMP_DIR=$(mktemp -d)

if [ ! -f "${BACKUP_FILE}" ]; then
    echo -e "${RED}Backup file not found: ${BACKUP_FILE}${NC}"
    exit 1
fi

if [[ $EUID -ne 0 ]]; then
   echo -e "${RED}This script must be run as root.${NC}"
   exit 1
fi

echo -e "${GREEN}═════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  NEONFALL — RESTORE${NC}"
echo -e "${GREEN}  Backup: ${BACKUP_FILE}${NC}"
echo -e "${GREEN}═════════════════════════════════════════════════════${NC}"

# 1. Extract backup
echo -e "\n${YELLOW}[1] Extract backup...${NC}"
tar -xzf "${BACKUP_FILE}" -C "${TEMP_DIR}"
echo "  ✓ Extracted to ${TEMP_DIR}"

# 2. Stop services
echo -e "\n${YELLOW}[2] Stop services...${NC}"
systemctl stop neonfall 2>/dev/null || true
systemctl stop neonfall-multiplayer 2>/dev/null || true
echo "  ✓ Services stopped"

# 3. Restore DB
echo -e "\n${YELLOW}[3] Restore DB...${NC}"
DB_FILE=$(ls ${TEMP_DIR}/*-db.sql.gz 2>/dev/null | head -1)
if [ -n "${DB_FILE}" ]; then
    gunzip -c "${DB_FILE}" | sqlite3 /var/www/neonfall/db/neonfall.db
    chown www-data:www-data /var/www/neonfall/db/neonfall.db
    chmod 664 /var/www/neonfall/db/neonfall.db
    echo "  ✓ DB restored"
else
    echo -e "  ${RED}✗ DB backup not found in archive${NC}"
fi

# 4. Restore .env
echo -e "\n${YELLOW}[4] Restore .env...${NC}"
ENV_FILE=$(ls ${TEMP_DIR}/*-env 2>/dev/null | head -1)
if [ -n "${ENV_FILE}" ]; then
    cp "${ENV_FILE}" /var/www/neonfall/.env
    chmod 600 /var/www/neonfall/.env
    echo "  ✓ .env restored"
else
    echo -e "  ${YELLOW}⚠ .env not in backup (keeping current)${NC}"
fi

# 5. Restore nginx config
echo -e "\n${YELLOW}[5] Restore nginx config...${NC}"
NGINX_FILE=$(ls ${TEMP_DIR}/*-nginx.conf 2>/dev/null | head -1)
if [ -n "${NGINX_FILE}" ]; then
    cp "${NGINX_FILE}" /etc/nginx/sites-available/neonfall.levcon.ai
    nginx -t && systemctl reload nginx
    echo "  ✓ nginx config restored + reloaded"
fi

# 6. Restore systemd units
echo -e "\n${YELLOW}[6] Restore systemd units...${NC}"
SVC_FILE=$(ls ${TEMP_DIR}/*-neonfall.service 2>/dev/null | head -1)
if [ -n "${SVC_FILE}" ]; then
    cp "${SVC_FILE}" /etc/systemd/system/neonfall.service
    echo "  ✓ neonfall.service restored"
fi
MP_FILE=$(ls ${TEMP_DIR}/*-neonfall-mp.service 2>/dev/null | head -1)
if [ -n "${MP_FILE}" ]; then
    cp "${MP_FILE}" /etc/systemd/system/neonfall-multiplayer.service
    echo "  ✓ neonfall-multiplayer.service restored"
fi
systemctl daemon-reload

# 7. Start services
echo -e "\n${YELLOW}[7] Start services...${NC}"
systemctl start neonfall
systemctl start neonfall-multiplayer 2>/dev/null || true
sleep 3

# 8. Verify
echo -e "\n${YELLOW}[8] Verify...${NC}"
if systemctl is-active --quiet neonfall; then
    echo -e "  ${GREEN}✓ neonfall running${NC}"
else
    echo -e "  ${RED}✗ neonfall not running!${NC}"
    journalctl -u neonfall --no-pager -n 10
fi
if curl -sf http://127.0.0.1:3003/ -o /dev/null 2>/dev/null; then
    echo -e "  ${GREEN}✓ HTTP 200 on port 3003${NC}"
else
    echo -e "  ${YELLOW}⚠ Port 3003 not responding yet (startup may take a moment)${NC}"
fi

# 9. Cleanup
rm -rf "${TEMP_DIR}"

echo -e "\n${GREEN}═════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  RESTORE ERFOLGREICH${NC}"
echo -e "${GREEN}═════════════════════════════════════════════════════${NC}"
