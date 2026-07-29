# NEONFALL — Staging Setup (Einmalig auf VPS ausführen)

Diese Schritte müssen **einmalig** auf dem VPS ausgeführt werden, bevor die
Staging-Pipeline funktioniert. Danach läuft alles automatisch via GitHub Actions.

## 1. Verzeichnis + Git Clone

```bash
# Staging Verzeichnis erstellen
sudo mkdir -p /var/www/neonfall-staging
sudo chown www-data:www-data /var/www/neonfall-staging

# Als www-data klonen (oder als root, dann chown danach)
cd /var/www/neonfall-staging
sudo git clone git@github.com:LEVCON-AT/Neonfall.git .
sudo git checkout staging

# Falls staging branch nicht existiert, erstelle ihn:
# sudo git checkout -b staging
# sudo git push origin staging

# Ownership
sudo chown -R www-data:www-data /var/www/neonfall-staging
```

## 2. Environment Datei

```bash
cd /var/www/neonfall-staging
sudo cat > .env << 'EOF'
DATABASE_URL="file:/var/www/neonfall-staging/db/neonfall_staging.db"
PORT="3005"
NEXT_PUBLIC_SITE_URL="https://neonfall-staging.levcon.ai"
EOF
sudo chown www-data:www-data .env
sudo chmod 644 .env
```

## 3. DB Verzeichnis

```bash
sudo mkdir -p /var/www/neonfall-staging/db
sudo chown www-data:www-data /var/www/neonfall-staging/db
sudo chmod 755 /var/www/neonfall-staging/db
```

## 4. Bun system-wide (falls noch nicht geschehen)

```bash
# Prüfen ob bun für www-data erreichbar ist
sudo -u www-data /usr/local/bin/bun --version

# Falls nicht:
sudo cp /root/.bun/bin/bun /usr/local/bin/bun
sudo chmod +x /usr/local/bin/bun
```

## 5. systemd Services installieren

```bash
# Service Dateien kopieren (werden vom deploy script gemacht, aber initial):
sudo cp /var/www/neonfall-staging/deploy/staging/neonfall-staging.service /etc/systemd/system/
sudo cp /var/www/neonfall-staging/deploy/staging/neonfall-staging-multiplayer.service /etc/systemd/system/

# Services aktivieren
sudo systemctl daemon-reload
sudo systemctl enable neonfall-staging
sudo systemctl enable neonfall-staging-multiplayer
```

## 6. SSL Zertifikat (certbot)

```bash
# Certbot installieren falls nicht vorhanden
sudo apt install -y certbot python3-certbot-nginx

# Zertifikat für staging Domain holen
sudo certbot certonly --nginx -d neonfall-staging.levcon.ai

# Verifizieren
sudo ls -la /etc/letsencrypt/live/neonfall-staging.levcon.ai/
```

## 7. nginx Config

```bash
# Config kopieren
sudo cp /var/www/neonfall-staging/deploy/staging/neonfall-staging.levcon.ai.conf \
  /etc/nginx/sites-available/neonfall-staging.levcon.ai

# Symlink
sudo ln -sf /etc/nginx/sites-available/neonfall-staging.levcon.ai \
  /etc/nginx/sites-enabled/neonfall-staging.levcon.ai

# Test + Reload
sudo nginx -t
sudo systemctl reload nginx
```

## 8. Erster Build + Start

```bash
cd /var/www/neonfall-staging

# Dependencies
sudo -u www-data bun install --frozen-lockfile
cd mini-services/multiplayer && sudo -u www-data bun install --frozen-lockfile && cd ..

# DB
sudo -u www-data bun run db:push --accept-data-loss

# Build
sudo -u www-data bun run build

# Copy standalone
sudo cp -r public .next/standalone/
sudo cp -r .next/static .next/standalone/.next/

# Permissions
sudo chown -R www-data:www-data /var/www/neonfall-staging

# Services starten
sudo systemctl start neonfall-staging
sudo systemctl start neonfall-staging-multiplayer

# Status prüfen
sudo systemctl status neonfall-staging
sudo systemctl status neonfall-staging-multiplayer
```

## 9. Verifikation

```bash
# Lokal
curl http://127.0.0.1:3005/
curl http://127.0.0.1:3006/health

# Extern
curl https://neonfall-staging.levcon.ai/
curl https://neonfall-staging.levcon.ai/health?XTransformPort=3006
```

## 10. GitHub Branch Setup

Auf GitHub muss ein `staging` branch existieren:

```bash
# Lokal (in dev environment)
git checkout main
git checkout -b staging
git push origin staging
```

Danach: Jeder Push auf `staging` triggert den Staging-Deploy automatisch.

## Promotion Workflow

```
1. Änderung auf staging branch pushen → auto-deploy auf staging.neonfall.levcon.ai
2. Auf staging URL testen
3. Bei GO: PR staging → main (oder fast-forward merge)
4. Merge auf main → auto-deploy auf production (neonfall.levcon.ai)
```
