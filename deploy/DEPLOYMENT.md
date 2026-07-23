# Neonfall — Deployment Guide

**Domain:** neonfall.levcon.ai
**GitHub Repo:** https://github.com/LEVCON-AT/Neonfall

---

## Architektur

```
GitHub (main branch)
    │
    │ Push
    ↓
GitHub Actions Workflow (.github/workflows/deploy.yml)
    │
    │ SSH
    ↓
VPS
    │
    ├── /var/www/neonfall/              ← Next.js App
    │   ├── .env                        ← Production env (manuell gepflegt)
    │   ├── .next/standalone/           ← Build-Output
    │   ├── db/neonfall.db              ← SQLite
    │   ├── mini-services/multiplayer/  ← socket.io Backend
    │   └── deploy/                     ← Deploy-Scripts (aus git)
    │
    ├── nginx                           ← Reverse Proxy + SSL
    │   └── neonfall.levcon.ai.conf     ← Next.js + WebSocket
    │
    ├── systemd                         ← Process Manager
    │   ├── neonfall.service            ← Next.js (Port 3003)
    │   └── neonfall-multiplayer.service ← socket.io (Port 3004)
    │
    └── Let's Encrypt                   ← SSL Zertifikate (auto-renew)
```

---

## Ports

| Port | Service | Beschreibung |
|------|---------|-------------|
| 3003 | neonfall.service | Next.js (Standalone) |
| 3004 | neonfall-multiplayer.service | socket.io Backend |
| 80   | nginx | HTTP → HTTPS Redirect |
| 443  | nginx | HTTPS (neonfall.levcon.ai) |

**Wichtig:** 3000 (Dev), 3001 (levcon.at), 3002 (levcon.ai) sind belegt — Neonfall nutzt 3003/3004.

---

## 1. Einmaliges Initial-Setup (manuell)

### 1.1 DNS-Eintrag erstellen

```
neonfall.levcon.ai  A  <VPS-IP>
```

### 1.2 SSH auf VPS

```bash
ssh root@<VPS-IP>
```

### 1.3 Initial-Deployment-Skript ausführen

```bash
cd /tmp
git clone https://github.com/LEVCON-AT/Neonfall.git neonfall-repo
cd neonfall-repo
chmod +x deploy/scripts/deploy.sh
sudo bash deploy/scripts/deploy.sh
```

Das Skript macht alles:
- System-Update + Pakete installieren
- Node.js 20, Bun, nginx, certbot
- Firewall (UFW), Fail2ban
- Git-Clone nach `/var/www/neonfall`
- `.env` erstellen
- DB anlegen, Next.js build
- Multiplayer-Dependencies installieren
- nginx-Konfiguration + SSL (Let's Encrypt)
- systemd-Services (Next.js + Multiplayer)
- Backup-Cron

### 1.4 Verifikation

```bash
# Services prüfen
systemctl status neonfall
systemctl status neonfall-multiplayer
systemctl status nginx

# Lokal testen
curl -sI http://127.0.0.1:3003/ | head -3
curl -sI http://127.0.0.1:3004/ | head -3

# External testen
curl -sI https://neonfall.levcon.ai/ | head -3
```

---

## 2. GitHub Actions (automatische Updates)

Nach dem Initial-Setup wird jeder Push auf `main` automatisch deployt.

### 2.1 GitHub Secrets konfigurieren

Im GitHub Repo → Settings → Secrets and variables → Actions:

| Secret | Wert |
|--------|------|
| `VPS_HOST` | VPS-IP (z.B. `87.106.25.91`) |
| `VPS_USER` | `root` (oder deploy-User) |
| `VPS_SSH_KEY` | Private SSH-Key (vollständiger Inhalt) |
| `VPS_PORT` | `22` (oder abweichend) |

### 2.2 Workflow triggern

- **Automatisch:** Jeder Push auf `main`
- **Manuell:** GitHub → Actions → "Deploy to VPS" → Run workflow

---

## 3. manuelle Wartung

### 3.1 Logs ansehen

```bash
# Next.js
journalctl -u neonfall -f

# Multiplayer
journalctl -u neonfall-multiplayer -f

# Nginx
tail -f /var/log/nginx/neonfall.levcon.ai.error.log
tail -f /var/log/nginx/neonfall.levcon.ai.access.log
```

### 3.2 Services neu starten

```bash
sudo systemctl restart neonfall
sudo systemctl restart neonfall-multiplayer
sudo systemctl reload nginx
```

### 3.3 .env anpassen

```bash
nano /var/www/neonfall/.env
sudo systemctl restart neonfall
```

### 3.4 Manuelles Update (ohne GitHub Actions)

```bash
cd /var/www/neonfall
git pull origin main
bash deploy/scripts/vps-update.sh
```

### 3.5 DB Backup

Backups laufen automatisch täglich 03:00 via cron nach `/var/backups/neonfall/`.

Manuelles Backup:
```bash
sqlite3 /var/www/neonfall/db/neonfall.db ".dump" | gzip > /tmp/neonfall-backup-$(date +%Y%m%d).db.gz
```

---

## 4. Multiplayer-Service

Der socket.io Backend läuft als separater systemd-Service auf Port 3004.

### 4.1 Funktionsweise

- Spieler verbinden sich via `io('/?XTransformPort=3004')`
- nginx routet Requests mit `?XTransformPort=3004` Query-Param zu Port 3004
- 1v1 Matches mit 4-char Room-Codes (A-Z)
- Garbage-Lines werden bei Line-Clears zum Gegner geschickt

### 4.2 Debug

```bash
# Service status
systemctl status neonfall-multiplayer

# Live logs
journalctl -u neonfall-multiplayer -f

# Port check
ss -tln | grep 3004

# Direkter Test
curl -s "http://127.0.0.1:3004/socket.io/?EIO=4&transport=polling" | head -c 100
```

---

## 5. SSL-Zertifikate

### 5.1 Erneuerung prüfen

```bash
certbot certificates
```

### 5.2 Manuell erneuern

```bash
sudo certbot renew --dry-run
sudo certbot renew
sudo systemctl reload nginx
```

Auto-Renewal läuft via `certbot.timer`.

---

## 6. Troubleshooting

### Next.js startet nicht

```bash
journalctl -u neonfall --no-pager -n 50
# Häufige Ursachen:
# - .env fehlt DATABASE_URL
# - DB-File fehlt (db:push nicht gelaufen)
# - Port 3003 belegt (fuser -k 3003/tcp)
```

### Multiplayer verbindet nicht

```bash
# Service läuft?
systemctl status neonfall-multiplayer

# Port erreichbar?
curl -s http://127.0.0.1:3004/socket.io/?EIO=4&transport=polling

# nginx routing?
# Teste via Browser: https://neonfall.levcon.ai/?XTransformPort=3004
```

### Build schlägt fehl

```bash
cd /var/www/neonfall
bun run build 2>&1 | tail -30

# Rollback: backup wird automatisch bei Build-Fehler wiederhergestellt
# Prüfe: journalctl -u neonfall -n 20
```

### Port-Konflikte

```bash
# Wer hört auf welchem Port?
ss -tln | grep -E '300[0-4]'

# Prozess killen
fuser -k 3003/tcp
fuser -k 3004/tcp
```
