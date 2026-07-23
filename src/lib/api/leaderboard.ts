'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { GameMode, ScoreEntry } from '@/lib/types';

const PLAYER_ID_KEY = 'neonfall_player_id';
const PLAYER_NAME_KEY = 'neonfall_player_name';

export function getPlayerId(): string {
  if (typeof window === 'undefined') return '';
  let id = localStorage.getItem(PLAYER_ID_KEY);
  if (!id) {
    id = `p_${Math.random().toString(36).slice(2, 12)}${Date.now().toString(36)}`;
    localStorage.setItem(PLAYER_ID_KEY, id);
  }
  return id;
}

export function getPlayerName(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(PLAYER_NAME_KEY) ?? '';
}

export function setPlayerName(name: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(PLAYER_NAME_KEY, name);
}

export interface SubmitScorePayload {
  playerId: string;
  name: string;
  score: number;
  lines: number;
  level: number;
  mode: GameMode;
  duration: number;
}

export function useLeaderboard(mode: GameMode, limit = 20) {
  return useQuery<ScoreEntry[]>({
    queryKey: ['leaderboard', mode, limit],
    queryFn: async () => {
      const res = await fetch(
        `/api/leaderboard?mode=${encodeURIComponent(mode)}&limit=${limit}`,
        { cache: 'no-store' },
      );
      if (!res.ok) throw new Error('leaderboard fetch failed');
      const data = await res.json();
      const me = getPlayerId();
      // The API returns { name, date, rank } — we normalise to ScoreEntry
      // (id/playerName/createdAt) so the rest of the app speaks one type.
      return (data.scores ?? []).map(
        (s: {
          rank?: number;
          playerId: string;
          name: string;
          score: number;
          lines: number;
          level: number;
          mode: string;
          date: string;
        }): ScoreEntry => ({
          id: `${s.playerId}-${s.date}`,
          playerId: s.playerId,
          playerName: s.name,
          score: s.score,
          lines: s.lines,
          level: s.level,
          mode: s.mode as GameMode,
          duration: 0,
          createdAt: s.date,
          isMe: s.playerId === me,
        }),
      );
    },
    staleTime: 15_000,
    refetchOnWindowFocus: true,
  });
}

export function useSubmitScore() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: SubmitScorePayload) => {
      const res = await fetch('/api/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? 'submit failed');
      }
      return res.json();
    },
    onSuccess: (_data, vars) => {
      // invalidate leaderboard for this mode so the new score appears
      qc.invalidateQueries({ queryKey: ['leaderboard', vars.mode] });
    },
  });
}
