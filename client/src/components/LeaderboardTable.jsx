import React from 'react';

export default function LeaderboardTable({ players = [], currentUserRoll }) {
  if (!players || players.length === 0) {
    return <div className="p-6 text-center text-muted text-sm">No players on the leaderboard yet.</div>;
  }

  return (
    <div className="glass-card overflow-hidden">
      <div className="flex justify-between items-center p-4 border-b border-border">
        <span className="text-xs font-semibold text-muted tracking-wider uppercase">Top Players</span>
        <span className="text-xs text-muted">Updated Live</span>
      </div>

      <div>
        {players.map((p) => {
          const isCurrent = p.rollNumber === currentUserRoll;
          let rankClass = '';
          let trophy = null;

          if (p.rank === 1) { rankClass = 'gold'; trophy = '🏆'; }
          else if (p.rank === 2) { rankClass = 'silver'; trophy = '🥈'; }
          else if (p.rank === 3) { rankClass = 'bronze'; trophy = '🥉'; }

          return (
            <div
              key={p.rollNumber}
              className={`leaderboard-row ${isCurrent ? 'bg-cyan-glow/20 border-l-2 border-cyan' : ''}`}
            >
              <div className={`leaderboard-rank ${rankClass}`}>
                {trophy ? trophy : p.rank}
              </div>

              <div className="leaderboard-name flex items-center gap-2">
                <span>{p.name}</span>
                {isCurrent && <span className="badge badge-cyan text-xs">You</span>}
              </div>

              <div className="leaderboard-score">
                {p.totalScore.toLocaleString()} pts
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
