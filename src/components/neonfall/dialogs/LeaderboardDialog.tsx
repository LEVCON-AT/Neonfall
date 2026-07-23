'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Crown, Medal, Award, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  useLeaderboard,
  getPlayerName,
} from '@/lib/api/leaderboard';
import { GAME_MODES, type GameMode, type ScoreEntry } from '@/lib/types';

interface LeaderboardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** initial mode tab — defaults to the currently selected game mode */
  initialMode?: GameMode;
}

const MODE_ORDER: GameMode[] = ['marathon', 'sprint', 'ultra', 'zen'];

export function LeaderboardDialog({
  open,
  onOpenChange,
  initialMode = 'marathon',
}: LeaderboardDialogProps) {
  const [mode, setMode] = useState<GameMode>(initialMode);
  const { data, isLoading, error } = useLeaderboard(mode, 20);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="nf-dialog-neon nf-leaderboard-dialog">
        <DialogHeader>
          <DialogTitle className="nf-dialog-title">
            <Trophy size={16} aria-hidden="true" style={{ verticalAlign: -3, marginRight: 6, color: '#fbbf24' }} />
            Bestenliste
          </DialogTitle>
          <DialogDescription className="nf-dialog-desc">
            Die Top 20 Spieler weltweit. Spiel einen Modus und trage deinen
            Namen ein, um hier aufzutauchen.
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={mode}
          onValueChange={(v) => setMode(v as GameMode)}
          className="nf-leaderboard-tabs"
        >
          <TabsList className="nf-leaderboard-tabslist">
            {MODE_ORDER.map((m) => (
              <TabsTrigger key={m} value={m} className="nf-leaderboard-tab">
                {GAME_MODES[m].label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="nf-leaderboard-body">
          {isLoading && <LeaderboardSkeleton />}
          {error && (
            <div className="nf-leaderboard-empty">
              Die Bestenliste konnte nicht geladen werden.
            </div>
          )}
          {data && data.length === 0 && (
            <div className="nf-leaderboard-empty">
              Noch keine Einträge in diesem Modus.
              <br />
              Sei der/die Erste!
            </div>
          )}
          {data && data.length > 0 && (
            <ol className="nf-leaderboard-list">
              {data.map((entry, i) => (
                <LeaderboardRow key={entry.id} rank={i + 1} entry={entry} />
              ))}
            </ol>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function LeaderboardRow({
  rank,
  entry,
}: {
  rank: number;
  entry: ScoreEntry;
}) {
  const myName = getPlayerName();
  const isMe = entry.isMe || entry.playerName === myName;
  const date = new Date(entry.createdAt);
  const dateStr = date.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
  });

  return (
    <motion.li
      layout
      className={`nf-leaderboard-row${isMe ? ' nf-leaderboard-me' : ''}`}
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2, delay: Math.min(rank * 0.02, 0.3) }}
    >
      <div className="nf-leaderboard-rank">
        <RankIcon rank={rank} />
      </div>
      <div className="nf-leaderboard-name" title={entry.playerName}>
        {entry.playerName}
        {isMe && <span className="nf-leaderboard-you">DU</span>}
      </div>
      <div className="nf-leaderboard-score">
        {entry.score.toLocaleString('de-DE')}
      </div>
      <div className="nf-leaderboard-meta">
        <span title="Linien">{entry.lines}L</span>
        <span title="Level">· Lv {entry.level}</span>
        <span title="Datum" className="nf-leaderboard-date">{dateStr}</span>
      </div>
    </motion.li>
  );
}

function RankIcon({ rank }: { rank: number }) {
  if (rank === 1) return <Crown size={14} aria-hidden="true" style={{ color: '#fbbf24' }} />;
  if (rank === 2) return <Medal size={14} aria-hidden="true" style={{ color: '#cbd5e1' }} />;
  if (rank === 3) return <Award size={14} aria-hidden="true" style={{ color: '#d97706' }} />;
  return <span className="nf-leaderboard-rank-num">{rank}</span>;
}

function LeaderboardSkeleton() {
  return (
    <div className="nf-leaderboard-list">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="nf-leaderboard-skeleton">
          <div className="nf-leaderboard-sk-rank" />
          <div className="nf-leaderboard-sk-name" />
          <div className="nf-leaderboard-sk-score" />
          <div className="nf-leaderboard-sk-meta" />
        </div>
      ))}
      <div className="nf-leaderboard-loading">
        <Loader2 size={14} className="animate-spin" aria-hidden="true" />
        Lade Bestenliste …
      </div>
    </div>
  );
}
