#!/bin/bash
# ═══════════════════════════════════════════════════════════════
#  NEONFALL — BACKUP SCRIPT
#  Sichert DB, .env, nginx config, systemd units
# ═══════════════════════════════════════════════════════════════
#
#  Aufruf: sudo bash /var/www/neonfall/deploy/scripts/backup.sh
#  Cron: täglich 03:00 (wird von deploy.sh eingerichtet)

set -e

BACKUP_DIR="/var/backups/neonfall"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="neonfall-${DATE}"
BACKUP_PATH="${BACKUP_DIR}/${BACKUP_NAME}"

mkdir -p "${BACKUP_DIR}"

echo "═════════════════════════════════════════════════════"
echo "  NEONFALL — BACKUP"
echo "  $(date)"
echo "═════════════════════════════════════════════════════"

# 1. SQLite DB dump (consistent snapshot)
echo "  [1] DB dump..."
sqlite3 /var/www/neonfall/db/neonfall.db ".dump" | gzip > "${BACKUP_PATH}-db.sql.gz"
echo "      ✓ $(ls -lh ${BACKUP_PATH}-db.sql.gz | awk '{print $5}')"

# 2. .env (secrets: DB URL, API keys)
echo "  [2] .env..."
if [ -f /var/www/neonfall/.env ]; then
    cp /var/www/neonfall/.env "${BACKUP_PATH}-env"
    echo "      ✓"
else
    echo "      ⚠ .env nicht gefunden"
fi

# 3. nginx config
echo "  [3] nginx config..."
if [ -f /etc/nginx/sites-available/neonfall.levcon.ai ]; then
    cp /etc/nginx/sites-available/neonfall.levcon.ai "${BACKUP_PATH}-nginx.conf"
    echo "      ✓"
fi

# 4. systemd units
echo "  [4] systemd units..."
cp /etc/systemd/system/neonfall.service "${BACKUP_PATH}-neonfall.service" 2>/dev/null || true
cp /etc/systemd/system/neonfall-multiplayer.service "${BACKUP_PATH}-neonfall-mp.service" 2>/dev/null || true
echo "      ✓"

# 5. Prisma schema
echo "  [5] Prisma schema..."
cp /var/www/neonfall/prisma/schema.prisma "${BACKUP_PATH}-schema.prisma" 2>/dev/null || true
echo "      ✓"

# 6. Create tarball
echo "  [6] Tarball..."
tar -czf "${BACKUP_PATH}.tar.gz" -C "${BACKUP_DIR}" "${BACKUP_NAME##*/}"* 2>/dev/null
rm -f "${BACKUP_PATH}-db.sql.gz" "${BACKUP_PATH}-env" "${BACKUP_PATH}-nginx.conf" "${BACKUP_PATH}-neonfall.service" "${BACKUP_PATH}-neonfall-mp.service" "${BACKUP_PATH}-schema.prisma"
echo "      ✓ $(ls -lh ${BACKUP_PATH}.tar.gz | awk '{print $5}')"

# 7. Cleanup old backups (>30 days)
echo "  [7] Cleanup..."
find "${BACKUP_DIR}" -name "neonfall-*.tar.gz" -mtime +30 -delete
find "${BACKUP_DIR}" -name "neonfall-*.db.gz" -mtime +30 -delete 2>/dev/null || true
echo "      ✓"

# 8. Summary
echo ""
echo "  Backup: ${BACKUP_PATH}.tar.gz"
echo "  Size: $(ls -lh ${BACKUP_PATH}.tar.gz | awk '{print $5}')"
echo "  Backups: $(ls -1 ${BACKUP_DIR}/neonfall-*.tar.gz 2>/dev/null | wc -l)"
echo ""
echo "═════════════════════════════════════════════════════"
echo "  BACKUP ERFOLGREICH"
echo "═════════════════════════════════════════════════════"
