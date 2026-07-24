import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

const ALLOWED_MODES = new Set(['marathon', 'sprint', 'ultra', 'zen']);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get('mode') || 'marathon';
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10) || 20, 100);

    if (!ALLOWED_MODES.has(mode)) {
      return NextResponse.json({ error: 'Unbekannter Modus.' }, { status: 400 });
    }

    const scores = await db.score.findMany({
      where: { mode },
      orderBy: { score: 'desc' },
      take: limit,
      include: { player: { select: { name: true } } },
    });

    const result = scores.map((s, i) => ({
      rank: i + 1,
      playerId: s.playerId,
      name: s.player.name,
      score: s.score,
      lines: s.lines,
      level: s.level,
      mode: s.mode,
      date: s.createdAt.toISOString(),
    }));

    return NextResponse.json({ mode, scores: result });
  } catch (err) {
    console.error('[api/leaderboard] GET error:', err);
    return NextResponse.json({ error: 'Serverfehler beim Laden des Leaderboards.' }, { status: 500 });
  }
}
