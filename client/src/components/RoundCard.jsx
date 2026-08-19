import React from 'react';

export default function RoundCard({ round, onSelect }) {
  const { roundNumber, title, type, timeLimit, xpReward, difficulty, isUnlocked, isCompleted } = round;

  const handleClick = () => {
    if (isUnlocked && !isCompleted && onSelect) {
      onSelect(round);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`round-card ${isCompleted ? 'completed' : isUnlocked ? 'unlocked' : 'locked'}`}
    >
      <div className={`round-icon ${isCompleted ? 'success' : isUnlocked ? 'cyan' : 'locked-icon'}`}>
        {isCompleted ? (
          '✓'
        ) : isUnlocked ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        )}
      </div>

      <div className="round-info">
        <div className="round-label">R{roundNumber}</div>
        <div className="round-title">{title}</div>
        <div className="round-meta">
          {type} · 4 Qs · {timeLimit} min
        </div>
      </div>

      <div className="round-xp">
        <div>+{xpReward} XP</div>
        <div className="text-xs font-sans text-muted mt-1">{difficulty}</div>
      </div>

      {isUnlocked && !isCompleted && (
        <div className="text-cyan font-bold text-lg ml-2">›</div>
      )}
    </div>
  );
}
