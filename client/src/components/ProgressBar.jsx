import React from 'react';

export default function ProgressBar({ completedCount = 0, totalCount = 5, xp = 0 }) {
  const percent = Math.min(100, Math.max(0, (completedCount / totalCount) * 100));

  return (
    <div className="glass-card p-6 mb-6">
      <div className="flex justify-between items-center mb-3">
        <span className="text-sm font-semibold text-muted">Overall Progress</span>
        <span className="font-mono text-sm text-violet">
          {completedCount}/{totalCount} rounds · {xp} XP
        </span>
      </div>

      <div className="progress-track">
        <div className="progress-fill-violet" style={{ width: `${percent}%` }} />
      </div>

      <div className="flex justify-between mt-3">
        {[1, 2, 3, 4, 5].map((r) => (
          <span
            key={r}
            className={`text-xs font-mono ${
              r <= completedCount ? 'text-cyan font-bold' : 'text-muted'
            }`}
          >
            R{r} {r <= completedCount ? '✓' : ''}
          </span>
        ))}
      </div>
    </div>
  );
}
