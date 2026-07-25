import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';

// Simple in-memory rate limiting (per IP, per window). Good enough for a
// single-instance deployment; for multi-instance we'd need Redis.
const RATE_WINDOW_MS = 60_000; // 1 minute
const RATE_MAX = 6; // max 6 score submissions per minute per IP
const rateMap = new Map<string, { count: number; resetAt: number }>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > RATE_MAX;
}

const ScoreSchema = z.object({
  name: z.string().trim().min(1).max(16).regex(/^[^\s].*[^\s]$|^[^\s]$/, 'Name darf nicht mit Leerzeichen beginnen/enden'),
  score: z.number().int().min(0).max(10_000_000),
  lines: z.number().int().min(0).max(1_000_000),
  level: z.number().int().min(1).max(100),
  mode: z.enum(['marathon', 'sprint', 'ultra', 'zen']).default('marathon'),
  duration: z.number().int().min(0).max(86_400).default(0),
  playerId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    if (rateLimited(ip)) {
      return NextResponse.json({ error: 'Zu viele Anfragen. Bitte warte einen Moment.' }, { status: 429 });
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Ungültiger Request-Body.' }, { status: 400 });
    }

    const parsed = ScoreSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Ungültige Daten.', details: parsed.error.flatten() }, { status: 422 });
    }
    const { name, score, lines, level, mode, duration, playerId } = parsed.data;

    // S8.5: Anti-Cheat — server-side score plausibility check.
    // Reject scores that are physically impossible given the game mechanics.
    // NEONFALL scoring: points = (linePoints[cleared] * level) + combo bonus
    // Max realistic: 40 lines at level 20, all tetrises → ~800*20*40 = 640k
    // We allow generous headroom but reject obvious fakes.
    const MAX_PLAUSIBLE_SCORE = 2_000_000; // 2M — very generous
    if (score > MAX_PLAUSIBLE_SCORE) {
      return NextResponse.json(
        { error: 'Score ist unrealistisch hoch.' },
        { status: 422 }
      );
    }
    // Lines-to-score ratio: minimum 100 points per line (level 1, single clear)
    // If score > lines * 10000, it's suspicious (would need avg 100x multiplier per line)
    if (lines > 0 && score > lines * 50_000) {
      return NextResponse.json(
        { error: 'Score-Linien-Verhältnis ist unrealistisch.' },
        { status: 422 }
      );
    }
    // Duration plausibility: game must have taken at least some time
    // Min 1 second per line (very fast), so 40 lines → 40s minimum
    if (duration > 0 && lines > 0 && duration < lines * 500) {
      return NextResponse.json(
        { error: 'Spieldauer ist zu kurz für die Anzahl Linien.' },
        { status: 422 }
      );
    }

    // Find or create the player. If a playerId is provided and exists, update
    // their name (unless taken by someone else) + lastSeen. Otherwise create a
    // new player with this name.
    let player;
    if (playerId) {
      player = await db.player.findUnique({ where: { id: playerId } });
    }
    if (player) {
      // Update name only if it's free (not owned by another player).
      if (player.name !== name) {
        const existing = await db.player.findUnique({ where: { name } });
        if (existing && existing.id !== player.id) {
          // Name taken — keep old name, don't fail the submission.
        } else {
          player = await db.player.update({ where: { id: player.id }, data: { name, lastSeen: new Date() } });
        }
      } else {
        player = await db.player.update({ where: { id: player.id }, data: { lastSeen: new Date() } });
      }
    } else {
      // Create new player (or reuse existing by name).
      player = await db.player.upsert({
        where: { name },
        create: { name },
        update: { lastSeen: new Date() },
      });
    }

    const record = await db.score.create({
      data: { playerId: player.id, score, lines, level, mode, duration },
    });

    return NextResponse.json({ ok: true, playerId: player.id, scoreId: record.id });
  } catch (err) {
    console.error('[api/scores] POST error:', err);
    return NextResponse.json({ error: 'Serverfehler beim Speichern des Scores.' }, { status: 500 });
  }
}
