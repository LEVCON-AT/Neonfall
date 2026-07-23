#!/bin/bash
# ═══════════════════════════════════════════════════════════════
#  NEONFALL — PORT-CHECK SKRIPT
#  Prüft welche Ports auf dem VPS bereits belegt sind
#  und schlägt freie Ports für Neonfall vor.
# ═══════════════════════════════════════════════════════════════
#
#  Ausführung auf dem VPS (als root oder mit sudo):
#    bash port-check.sh
#
#  Das Skript verändert NICHTS — es prüft nur und gibt Empfehlungen.

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${GREEN}═════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  NEONFALL — PORT-CHECK${NC}"
echo -e "${GREEN}═════════════════════════════════════════════════════${NC}"

# ── 1. ALLE LAUSCHENDEN PORTS (TCP + UDP) ──────────────────────
echo -e "\n${CYAN}[1] Alle lauschenden TCP-Ports:${NC}"
echo "─────────────────────────────────────────"

if command -v ss &> /dev/null; then
    ss -tlnp 2>/dev/null | awk 'NR>1 {
        # Split local address:port
        split($4, a, ":")
        port = a[length(a)]
        proc = $6
        gsub(/users:\(\("/, "", proc)
        gsub(/".*/, "", proc)
        printf "  Port %-6s  %-20s  %s\n", port, proc, $4
    }' | sort -t' ' -k2 -n
elif command -v netstat &> /dev/null; then
    netstat -tlnp 2>/dev/null | awk 'NR>2 {
        split($4, a, ":")
        port = a[length(a)]
        printf "  Port %-6s  %s\n", port, $4
    }' | sort -t' ' -k2 -n
else
    echo -e "${YELLOW}  Weder ss noch netstat verfügbar — installiere net-tools:${NC}"
    echo "  apt-get install -y net-tools"
fi

# ── 2. RELEVANTE PORTS PRÜFEN ──────────────────────────────────
echo -e "\n${CYAN}[2] Relevante Ports für Neonfall prüfen:${NC}"
echo "─────────────────────────────────────────"

PORTS_TO_CHECK=(80 443 3000 3001 3002 3003 3004 3005 3006 3007 3008 3009 3010)

for port in "${PORTS_TO_CHECK[@]}"; do
    if ss -tln 2>/dev/null | grep -q ":$port "; then
        # Versuche Prozess zu ermitteln
        proc=$(ss -tlnp 2>/dev/null | grep ":$port " | head -1 | awk '{print $6}' | sed 's/users:(("//' | sed 's/".*//')
        if [ -z "$proc" ]; then
            proc=$(lsof -i :$port 2>/dev/null | tail -1 | awk '{print $1 " (PID " $2 ")"}')
        fi
        if [ -z "$proc" ]; then
            proc="unbekannt"
        fi
        echo -e "  Port $port: ${RED}BELEGT${NC} durch: $proc"
    else
        echo -e "  Port $port: ${GREEN}FREI${NC}"
    fi
done

# ── 3. SYSTEMD-SERVICES PRÜFEN ─────────────────────────────────
echo -e "\n${CYAN}[3] Laufende systemd-Services (relevant):${NC}"
echo "─────────────────────────────────────────"

services=("levcon" "neonfall" "neonfall-multiplayer" "nginx" "n8n" "caddy" "docker")
for svc in "${services[@]}"; do
    status=$(systemctl is-active "$svc" 2>/dev/null)
    if [ "$status" = "active" ]; then
        echo -e "  $svc: ${GREEN}active${NC}"
    elif [ "$status" = "inactive" ]; then
        echo -e "  $svc: ${YELLOW}inactive${NC}"
    elif [ "$status" = "failed" ]; then
        echo -e "  $svc: ${RED}failed${NC}"
    else
        echo -e "  $svc: ${YELLOW}nicht installiert${NC}"
    fi
done

# ── 4. NGINX SITES ─────────────────────────────────────────────
echo -e "\n${CYAN}[4] Konfigurierte nginx-Sites:${NC}"
echo "─────────────────────────────────────────"

if [ -d /etc/nginx/sites-enabled ]; then
    for site in /etc/nginx/sites-enabled/*; do
        if [ -L "$site" ] || [ -f "$site" ]; then
            name=$(basename "$site")
            # Versuche Port zu ermitteln
            port=$(grep -oP 'proxy_pass\s+http://127\.0\.0\.1:\K\d+' "$site" 2>/dev/null | head -1)
            if [ -z "$port" ]; then
                port=$(grep -oP 'server\s+127\.0\.0\.1:\K\d+' "$site" 2>/dev/null | head -1)
            fi
            if [ -n "$port" ]; then
                echo -e "  $name → Port $port"
            else
                echo -e "  $name (Port unbekannt)"
            fi
        fi
    done
else
    echo "  Keine nginx sites gefunden"
fi

# ── 5. EMPFEHLUNG ──────────────────────────────────────────────
echo -e "\n${CYAN}[5] Empfehlung für Neonfall-Ports:${NC}"
echo "─────────────────────────────────────────"

# Finde freie Ports im Bereich 3003-3010
NEXTJS_PORT=""
MP_PORT=""

for port in 3003 3005 3006 3007 3008 3009 3010; do
    if ! ss -tln 2>/dev/null | grep -q ":$port "; then
        if [ -z "$NEXTJS_PORT" ]; then
            NEXTJS_PORT=$port
        elif [ -z "$MP_PORT" ]; then
            MP_PORT=$port
            break
        fi
    fi
done

if [ -n "$NEXTJS_PORT" ] && [ -n "$MP_PORT" ]; then
    echo -e "  ${GREEN}✓ Empfohlene Ports für Neonfall:${NC}"
    echo -e "    Next.js (neonfall.service):     ${GREEN}$NEXTJS_PORT${NC}"
    echo -e "    Multiplayer (socket.io):        ${GREEN}$MP_PORT${NC}"
    echo ""
    echo -e "  ${YELLOW}Falls diese Ports abweichen von 3003/3004:${NC}"
    echo -e "  Passe folgende Dateien an:"
    echo -e "    deploy/systemd/neonfall.service           → Environment=\"PORT=$NEXTJS_PORT\""
    echo -e "    deploy/systemd/neonfall-multiplayer.service → (Port ist hardcoded in index.ts)"
    echo -e "    deploy/nginx/neonfall.levcon.ai.conf      → upstream neonfall_nextjs { server 127.0.0.1:$NEXTJS_PORT; }"
    echo -e "    deploy/scripts/deploy.sh                  → PORT=\"$NEXTJS_PORT\""
    echo -e "    deploy/scripts/vps-update.sh              → PORT=\"$NEXTJS_PORT\""
    echo ""
    echo -e "  ${CYAN}Oder verwende die Auto-Detection im deploy.sh:${NC}"
    echo -e "  Führe aus: bash deploy/scripts/deploy.sh --auto-ports"
else
    echo -e "  ${RED}Keine freien Ports im Bereich 3003-3010 gefunden!${NC}"
    echo -e "  Prüfe höhere Ports: 3011-3020"
fi

# ── 6. ZUSAMMENFASSUNG ─────────────────────────────────────────
echo -e "\n${CYAN}[6] Zusammenfassung:${NC}"
echo "─────────────────────────────────────────"
echo "  Anzahl belegter TCP-Ports: $(ss -tln 2>/dev/null | tail -n +2 | wc -l)"
echo "  Anzahl aktiver Services:   $(systemctl list-units --type=service --state=active --no-pager 2>/dev/null | wc -l)"

echo -e "\n${GREEN}═════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  Port-Check abgeschlossen${NC}"
echo -e "${GREEN}═════════════════════════════════════════════════════${NC}"
