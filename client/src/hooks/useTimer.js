import { useEffect, useRef, useState, useCallback } from 'react';
import { getStatus } from '../api/game';

/**
 * useTimer — syncs with server every 30s to prevent client-side tampering.
 * Returns { timeRemaining (seconds), formattedTime, isWarning, isDanger }
 */
export function useTimer(initialSeconds, gameStatus) {
  const [seconds, setSeconds] = useState(initialSeconds ?? null);
  const intervalRef = useRef(null);
  const syncIntervalRef = useRef(null);

  const syncWithServer = useCallback(async () => {
    try {
      const res = await getStatus();
      const { timeRemaining, status } = res.data;
      if (status === 'EXPIRED' || status === 'COMPLETED') {
        setSeconds(0);
        return;
      }
      if (timeRemaining !== null && timeRemaining !== undefined) {
        setSeconds(timeRemaining);
      }
    } catch (e) {
      // ignore sync errors
    }
  }, []);

  useEffect(() => {
    if (gameStatus !== 'IN_PROGRESS') return;

    // Tick every second
    intervalRef.current = setInterval(() => {
      setSeconds((s) => {
        if (s === null) return null;
        return Math.max(0, s - 1);
      });
    }, 1000);

    // Sync with server every 30 seconds
    syncIntervalRef.current = setInterval(syncWithServer, 30000);

    return () => {
      clearInterval(intervalRef.current);
      clearInterval(syncIntervalRef.current);
    };
  }, [gameStatus, syncWithServer]);

  useEffect(() => {
    if (initialSeconds !== null && initialSeconds !== undefined) {
      setSeconds(initialSeconds);
    }
  }, [initialSeconds]);

  const formatTime = (s) => {
    if (s === null) return '--:--';
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  return {
    timeRemaining: seconds,
    formattedTime: formatTime(seconds),
    isWarning: seconds !== null && seconds <= 300 && seconds > 60,
    isDanger: seconds !== null && seconds <= 60,
  };
}
