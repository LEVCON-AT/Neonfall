# NEONFALL — IT-Security-Konzept

> **Zweck:** Vollständige Security-Audit-Roadmap für produktionsfähige App.
> Jeder Sprint wird erst geplant, dann umgesetzt, verifiziert, und mit "GO"
> des Nutzers freigegeben. Ein laufender Testbericht wird mitgeführt.

**Status:** Plan erstellt — Sprints warten auf GO
**Ziel:** Perfekt produktionsfähige Multiplayer-App mit externem Pentest-Empfehlung

---

## Sprint-Übersicht

| Sprint | Bereich | Punkte | Status |
|--------|---------|--------|--------|
| S8.1 | Architektur-Review + Threat Modeling | 1, 2 | ⏳ |
| S8.2 | Code Review (manuell) + SAST | 3, 5 | ⏳ |
| S8.3 | Dependency Audit + Container Security | 4, 29 | ⏳ |
| S8.4 | API Security + Input Validation | 8, 10 | ⏳ |
| S8.5 | WebSocket Security + Anti-Cheat | 9, 14, 15 | ⏳ |
| S8.6 | Auth & Session Management | 11, 12, 13 | ⏳ |
| S8.7 | OWASP Top 10 + DAST | 6, 16 | ⏳ |
| S8.8 | Load/Stress/Soak Testing | 20, 21, 22 | ⏳ |
| S8.9 | Monitoring + Logging | 17, 18 | ⏳ |
| S8.10 | Backup + Disaster Recovery | 23, 24 | ⏳ |
| S8.11 | Datenschutz + Compliance (DSGVO) | 25, 26 | ⏳ |
| S8.12 | CI/CD Quality Gates + Secrets Management | 27, 28 | ⏳ |
| S8.13 | Penetrationstest (manuell) | 7 | ⏳ |
| S8.14 | Chaos Testing + Staging Pipeline | 22, 27 | ⏳ |
| S8.15 | Documentation + Final Release Gate | 31, 32 | ⏳ |

---

## S8.1 — Architektur-Review + Threat Modeling

### Punkte 1 + 2

**Architektur-Review:**
- Cloud vs. eigener Server → **Eigener VPS (87.106.25.91)**
- Trennung Frontend/Backend/DB/Redis/Matchmaking → **Prüfung nötig**
- Firewall (UFW aktiv), Reverse Proxy (nginx), TLS (Let's Encrypt)
- WAF → **noch nicht vorhanden, Evaluierung**
- Netzwerk: nur notwendige Ports, SSH nur mit Keys, DB nicht öffentlich

**Threat Modeling:**
- Account-Übernahme → Aktuell keine Accounts (nur localStorage Player-ID)
- Spiel-Manipulation → IIFE läuft client-side, Server nur für Scores
- Highscore-Fälschung → Rate-Limiting vorhanden, Zod-Validation vorhanden
- Bots → Keine Bot-Detection vorhanden
- DDoS → UFW + nginx rate-limiting, keine dedizierte DDoS-Protection
- Datenbank-Löschung → DB ist SQLite file, nicht öffentlich
- Session-Klau → Keine Sessions (stateless), nur localStorage
- Match-Manipulation → Multiplayer-Server ist nicht autoritativ (Client sagt "ich habe gewonnen")

**Zu tun:**
1. Architekturdiagramm erstellen
2. Datenflussdiagramm erstellen
3. Bedrohungsmodell (STRIDE) dokumentieren
4. Für jede Bedrohung: Gegenmaßnahme definieren
5. WAF-Evaluierung (optional: Cloudflare vor nginx)

**Verifikation:** Dokumentation in `security/architecture-review.md`
**GO:** ⏳ vom Nutzer

---

## S8.2 — Code Review (manuell) + SAST

### Punkte 3 + 5

**Manueller Code Review:**
- SQL Injection → Prisma ORM (parametrisiert) ✅ bereits geprüft
- XSS → React auto-escaping ✅, IIFE dangerouslySetInnerHTML prüfen
- CSRF → Keine CSRF-Tokens (public API, OK für Score-Submit)
- SSRF → Keine Server-Side Requests außer fetch für Musik
- Command Injection → Keine exec/spawn calls
- Path Traversal → Keine File-System-Operationen außer SQLite
- File Upload → Kein File-Upload
- Race Conditions → S7.4 mpStateRef Guards ✅ bereits behoben
- Memory Leaks → Prüfung nötig (Event-Listener, Intervals, Socket-Verbindungen)
- Integer Overflow → JavaScript, kein echtes Overflow-Risiko
- Unsichere Random → Math.random() für Spiel, crypto für Player-ID prüfen
- Secrets im Code → PAT bereits bereinigt ✅, weitere Prüfung nötig

**SAST (Static Analysis):**
- Semgrep (Open Source, kostenlos)
- CodeQL (GitHub-native)
- Suche nach: SQL Injection, XSS, Hardcoded Secrets, API Keys, Unsafe Functions

**Zu tun:**
1. Semgrep konfigurieren + ausführen
2. CodeQL GitHub Action einrichten
3. Manuelle Review der Findings
4. Alle kritischen Findings beheben

**Verifikation:** SAST-Report in `security/sast-report.md`, 0 critical findings
**GO:** ⏳ vom Nutzer

---

## S8.3 — Dependency Audit + Container Security

### Punkte 4 + 29

**Dependency Audit:**
- `npm audit` / `bun audit` für Node.js Dependencies
- Prüfung aller transitiven Dependencies
- CVE-Datenbank-Abgleich

**Container Security (falls Docker verwendet wird):**
- Non-root User
- Read-only Filesystem
- Minimales Base-Image
- Image Scanning (Trivy)
- Keine unnötigen Pakete

**Aktuell:** Keine Docker-Container (systemd-Services), aber Mini-Service könnte containerisiert werden.

**Zu tun:**
1. `bun audit` ausführen + alle vulnerabilities beheben
2. Trivy Scan (falls Docker vorhanden)
3. Dependabot/renovate für automatische Dependency-Updates aktivieren
4. Package-lock freeze für Production

**Verifikation:** `security/dependency-audit.md`, 0 high/critical vulnerabilities
**GO:** ⏳ vom Nutzer

---

## S8.4 — API Security + Input Validation

### Punkte 8 + 10

**API Security:**
- Authentifizierung → Aktuell keine (public API)
- Autorisierung → Player-ID aus localStorage, nicht verifiziert
- Rate Limits → 6 req/min/IP ✅ vorhanden
- Input Validation → Zod Schema ✅ vorhanden
- JSON Validation → Zod safeParse ✅
- Pagination → limit Parameter mit max 100 ✅
- Fehlercodes → Strukturierte JSON errors ✅
- Keine Stacktraces → Next.js production mode ✅

**Input Validation:**
- Score: int 0-10.000.000 ✅
- Lines: int 0-1.000.000 ✅
- Level: int 1-100 ✅
- Mode: enum ['marathon','sprint','ultra','zen'] ✅
- Name: string 1-16 chars, regex ✅
- Duration: int 0-86400 ✅

**Zu tun:**
1. Alle API-Endpoints systematisch durchgehen
2. Fuzzing-Tests mit ungültigen Inputs
3. Rate-Limiting für Multiplayer-Events prüfen
4. CORS-Policy verifizieren (Same-Origin via nginx)

**Verifikation:** `security/api-security.md`, alle Endpoints dokumentiert + getestet
**GO:** ⏳ vom Nutzer

---

## S8.5 — WebSocket Security + Anti-Cheat

### Punkte 9, 14, 15

**WebSocket Security:**
- Session validieren → Aktuell keine Session (anonymous socket.io)
- Token beim Connect → Nicht vorhanden
- Reconnect sicher → socket.io auto-reconnect, aber keine Reconnection-Validation
- Message Validation → sanitizePlayerName + isValidRoomId ✅
- Message Size Limit → socket.io maxPayload konfigurierbar
- Flood Protection → boardThrottle (10/sec) ✅, aber keine globalen Limits
- Ping Timeout → socket.io default (pingInterval=25s, pingTimeout=60s)
- Replay verhindern → Keine Replay-Protection

**Anti-Cheat:**
- Server ist **nicht** autoritativ → Client sagt "game:over", Server glaubt es
- Score-Submission ist unauthorisiert → jeder kann beliebige Scores einreichen
- Multiplayer: Client sendet Board-State, Server forwarded nur

**Zu tun:**
1. socket.io maxPayload setzen (z.B. 100KB)
2. Rate-Limiting pro Socket (max 20 events/sec)
3. Connection-Authentication (Player-ID als Query-Param)
4. Replay-Protection (Sequence-Numbers oder Timestamps)
5. Server-side Score-Validation (Plausibilitäts-Check)
6. Anti-Cheat: Server berechnet Minimum-Zeit pro Line-Clear

**Verifikation:** `security/websocket-security.md`, Cheat-Tests dokumentiert
**GO:** ⏳ vom Nutzer

---

## S8.6 — Auth & Session Management

### Punkte 11, 12, 13

**Authentifizierung:**
- Aktuell: Keine Accounts, nur localStorage Player-ID
- bcrypt/Argon2 → Nicht benötigt (keine Passwords)
- MFA → Nicht anwendbar
- Password Policy → Nicht anwendbar

**Session Management:**
- Cookies → Keine (stateless)
- JWT → Nicht verwendet
- Player-ID → `p_<random>_<timestamp>` in localStorage, nicht verifizierbar

**Autorisierung:**
- "Darf dieser Benutzer das?" → Aktuell nicht geprüft
- Score-Submit: Jeder kann als jeder speichern (Name + Player-ID)
- Multiplayer: Jeder kann jedem beitreten (4-char Code)

**Zu tun:**
1. Evaluierung: Brauchen wir echte Auth? (Für Leaderboard-Integrität)
2. Falls ja: NextAuth.js oder eigene JWT-Lösung
3. Falls nein: Server-side Score-Plausibilitäts-Check (Zeit vs. Score)
4. Multiplayer: Player-ID als Connection-Auth

**Verifikation:** `security/auth-concept.md`, Entscheidung dokumentiert
**GO:** ⏳ vom Nutzer

---

## S8.7 — OWASP Top 10 + DAST

### Punkte 6, 16

**OWASP Top 10:**
1. Broken Access Control → Prüfung (wer darf was?)
2. Cryptographic Failures → TLS 1.2/1.3 ✅, keine sensiblen Daten
3. Injection → Prisma ✅, Zod ✅
4. Insecure Design → Threat Modeling (S8.1)
5. Security Misconfiguration → nginx hardening prüfen
6. Vulnerable Components → Dependency Audit (S8.3)
7. Authentication Failures → S8.6
8. Software Integrity → CI/CD (S8.12)
9. Logging Failures → S8.9
10. SSRF → Keine Server-Side Requests

**DAST (Dynamic Analysis):**
- OWASP ZAP (Open Source)
- Automated Scan der laufenden App
- API-Endpoint-Testing

**Zu tun:**
1. OWASP Top 10 systematisch durchgehen
2. OWASP ZAP Scan ausführen
3. Alle Findings beheben
4. Re-Scan zur Bestätigung

**Verifikation:** `security/owasp-dast-report.md`, 0 critical/high findings
**GO:** ⏳ vom Nutzer

---

## S8.8 — Load/Stress/Soak Testing

### Punkte 20, 21, 22

**Load Testing:**
- Werkzeug: k6 oder Artillery
- Tests: 100, 500, 1000, 5000 concurrent Users
- Metriken: Response Time, Error Rate, CPU/RAM

**Stress Testing:**
- Server absichtlich überlasten
- Memory Leak, CPU, WebSocket, DB, Queue prüfen

**Soak Testing:**
- 48-72 Stunden Dauerlast
- Memory Leak, Connection Leak, Handle Leak suchen

**Zu tun:**
1. k6 Test-Scripts schreiben
2. Load-Tests durchführen (100→5000 Users)
3. Stress-Test bis Breakpoint
4. 24h Soak-Test (verkürzt)
5. Results dokumentieren

**Verifikation:** `security/loadtest-report.md`, Breakpoint + Empfehlungen
**GO:** ⏳ vom Nutzer

---

## S8.9 — Monitoring + Logging

### Punkte 17, 18

**Logging:**
- Nicht loggen: Passwords (n/a), Tokens, Cookies, Kreditkarten
- Loggen: Login (n/a), Logout (n/a), Fehler, Rate-Limit-Hits, verdächtige Aktivitäten
- Aktuell: console.error in Next.js, journalctl für systemd

**Monitoring:**
- Uptime Kuma (einfach, kostenlos)
- Metriken: CPU, RAM, Response Time, Errors, WebSocket Count, DB Connections
- Optional: Prometheus + Grafana (komplexer)

**Zu tun:**
1. Uptime Kuma installieren (Docker auf VPS)
2. Structured Logging (JSON) für API-Errors
3. Alerting bei: Service-Down, High Error-Rate, Rate-Limit-Hits
4. Log-Rotation konfigurieren

**Verifikation:** `security/monitoring-setup.md`, Uptime Kuma läuft + Alerts konfiguriert
**GO:** ⏳ vom Nutzer

---

## S8.10 — Backup + Disaster Recovery

### Punkte 23, 24

**Backup:**
- Datenbank: SQLite `db/neonfall.db` → täglich 03:00 via cron ✅ vorhanden
- Uploads: /var/www/neonfall/public/ → prüfen
- Konfiguration: .env, nginx configs, systemd units → prüfen
- Secrets: .env (SMTP, API keys) → manuell sichern
- Restore testen!

**Disaster Recovery:**
- RTO (Recovery Time Objective): Wie lange bis alles wieder läuft?
- RPO (Recovery Point Objective): Wieviel Datenverlust ist akzeptabel?
- Aktuell: deploy.sh kann alles neu aufsetzen, aber DB-Restore muss manuell

**Zu tun:**
1. Backup-Script erweitern (uploads, configs, secrets)
2. Restore-Script erstellen + testen
3. RTO/RPO definieren
4. Offsite-Backup (z.B. rsync zu anderem Server oder S3)

**Verifikation:** `security/backup-restore.md`, Restore-Test dokumentiert
**GO:** ⏳ vom Nutzer

---

## S8.11 — Datenschutz + Compliance (DSGVO)

### Punkte 25, 26

**Datenschutz (DSGVO):**
- Datenschenschutzerklärung → erstellen
- Cookie Banner → prüfen ob benötigt (Service Worker, localStorage)
- Export der Daten → Player-Score-Export-API
- Löschung der Daten → Player-Score-Löschung-API
- AVV mit Dienstleistern → VPS-Provider, GitHub, Let's Encrypt

**Compliance:**
- DSGVO → ja (EU-Nutzer)
- NIS2 → wahrscheinlich nicht (kleines Spiel)
- ISO 27001 → optional (nicht B2B)
- SOC 2 → nicht B2B/SaaS

**Zu tun:**
1. Datenschutzerklärung erstellen (de/en)
2. Cookie-Banner Evaluierung (Service Worker = localStorage)
3. Daten-Export + Löschung API
4. AVV-Liste erstellen
5. Impressum prüfen

**Verifikation:** `security/datenschutz.md`, Datenschutzerklärung live
**GO:** ⏳ vom Nutzer

---

## S8.12 — CI/CD Quality Gates + Secrets Management

### Punkte 27, 28

**CI/CD Release-Gate:**
- Vor jedem Deployment: Linter ✅, SAST (S8.2), Dependency Audit (S8.3)
- Unit Tests → noch nicht vorhanden
- Integration Tests → noch nicht vorhanden
- E2E Tests → agent-browser manuell, nicht automatisiert
- Smoke Test → Health Check in GitHub Actions ✅
- Build → Next.js standalone ✅

**Secrets Management:**
- Nie API_KEY im Git → ✅ (PAT bereinigt)
- Umgebungsvariablen → .env auf VPS ✅
- Secret Manager → nicht vorhanden (VPS .env ist OK für kleine App)

**Zu tun:**
1. GitHub Actions: SAST + Dependency Audit als Quality Gates
2. Unit Tests für Kern-Logik (Score-Berechnung, Garbage-Formula)
3. Integration Tests für API (Scores, Leaderboard)
4. Pre-deploy Quality Gate: alle Checks müssen grün sein
5. Secrets Audit: keine Secrets in Code/Comments/Worklog

**Verifikation:** `security/cicd-gates.md`, Quality Gates in GitHub Actions aktiv
**GO:** ⏳ vom Nutzer

---

## S8.13 — Penetrationstest (manuell)

### Punkt 7

**Manueller Pentest:**
- Login brechen → n/a (kein Login)
- Session klauen → n/a (keine Sessions)
- JWT manipulieren → n/a
- Cookies manipulieren → n/a
- APIs verändern → Score-Submit mit gefälschten Daten testen
- Parameter ändern → Fuzzing aller API-Parameter
- Matchmaking manipulieren → Multiplayer-Exploits testen
- WebSockets übernehmen → Socket-Injection, Replay
- Replay Angriffe → Game-Events aufzeichnen + wiedergeben
- Packet Injection → socket.io Message-Manipulation
- Cheat Engine → Memory-Manipulation (client-side, nur Edu)
- Browser Dev Tools → localStorage manipulation, console
- Rate Limits umgehen → IP-Rotation, parallel requests

**Zu tun:**
1. Systematischer Pentest aller Angriffsvektoren
2. Jeden Vektor dokumentieren: Angriff → Ergebnis → Gegenmaßnahme
3. Externe Empfehlung: professioneller Pentester + Bug-Bounty

**Verifikation:** `security/pentest-report.md`, alle Vektoren getestet
**GO:** ⏳ vom Nutzer

---

## S8.14 — Chaos Testing + Staging Pipeline

### Punkte 22, 27

**Chaos Testing:**
- DB aus → Service-Verhalten
- Multiplayer-Service aus → Graceful Degradation
- Netzwerk weg → Reconnection
- Server Neustart → Auto-Recovery
- Internet langsam → Timeout-Verhalten

**Staging Pipeline:**
- Staging-Environment auf Subdomain (z.B. staging.neonfall.levcon.ai)
- eigener Branch (staging) mit eigenem systemd-Service + Port
- Auto-Deploy auf Staging bei Push zu `staging` Branch
- Manuelles Promotion: Staging → Production (merge staging→main)

**Zu tun:**
1. Chaos-Tests dokumentieren + durchführen
2. Staging systemd-Service + nginx config erstellen
3. GitHub Actions: staging Branch → Staging-Deploy
4. Promotion-Workflow dokumentieren

**Verifikation:** `security/chaos-staging.md`, Staging live + Chaos-Tests dokumentiert
**GO:** ⏳ vom Nutzer

---

## S8.15 — Documentation + Final Release Gate

### Punkte 31, 32

**Dokumentation:**
- Architekturdiagramm ✅ (PROJECT-CONTEXT.md)
- Datenflussdiagramm → erstellen
- Bedrohungsmodell → S8.1
- API-Dokumentation → erstellen (OpenAPI/Swagger)
- Betriebsdokumentation → DEPLOYMENT.md ✅
- Notfallhandbuch → erstellen
- Backup- und Restore-Anleitung → S8.10
- Incident-Response-Plan → erstellen
- Changelog → worklog.md ✅
- Sicherheitsrichtlinien → erstellen

**Qualitätssicherung:**
- Unit-Tests → S8.12
- Integrations-Tests → S8.12
- E2E-Tests → Playwright/Cypress
- Cross-Browser-Tests → manuell
- Mobile-Responsiveness → ✅ verifiziert
- Accessibility (WCAG) → prüfen
- Performance-Budgets (Core Web Vitals) → messen
- Regressionstests → vor jedem Release

**Final Release Gate:**

| Bereich | Status |
|---------|--------|
| Architektur-Review | ⏳ |
| Threat Modeling | ⏳ |
| Code Review | ✅ (CODE-REVIEW.md) |
| Unit/Integration/E2E Tests | ⏳ |
| SAST | ⏳ |
| Dependency Audit | ⏳ |
| DAST | ⏳ |
| Penetrationstests | ⏳ |
| OWASP Top 10 | ⏳ |
| API + WebSocket Security | ⏳ |
| Last/Stress/Soak Tests | ⏳ |
| Chaos Tests | ⏳ |
| Monitoring & Alerting | ⏳ |
| Logging & Incident Response | ⏳ |
| Backup & Restore | ⏳ |
| Datenschutz & Compliance | ⏳ |
| CI/CD Quality Gates | ⏳ |
| Documentation | ⏳ |

**Verifikation:** Alle ✅ → Production-Ready
**GO:** ⏳ vom Nutzer (Final Release Gate)

---

## Testbericht (laufend)

| Sprint | Datum | Verifikation | Status |
|--------|-------|-------------|--------|
| S8.1 | — | — | ⏳ geplant |
| S8.2 | — | — | ⏳ geplant |
| ... | ... | ... | ... |

*(Wird mit jedem abgeschlossenen Sprint aktualisiert)*

---

## Empfehlungen für nach dem Produktivstart

1. **Externer Penetrationstest** durch professionelle Firma
2. **Responsible Disclosure** oder **Bug-Bounty-Programm** einrichten
3. **Regelmäßige** Sicherheitsupdates + Dependency-Updates
4. **Zertifikate** automatisch erneuern (certbot timer ✅)
5. **Pentest** mindestens einmal jährlich wiederholen
6. **Backups** regelmäßig prüfen (Restore-Test monatlich)

---

*Erstellt: S8 Plan — wartet auf GO für S8.1*
