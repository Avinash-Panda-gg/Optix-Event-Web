import React from 'react';
import { useTimer } from '../hooks/useTimer';

export default function TimerWidget({ initialSeconds, status }) {
  const { formattedTime, isWarning, isDanger } = useTimer(initialSeconds, status);

  let className = 'timer-widget';
  if (isDanger) className += ' danger';
  else if (isWarning) className += ' warning';

  return (
    <div className={className} title="Global 30-Minute Server Countdown">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
      <span>{formattedTime}</span>
    </div>
  );
}
