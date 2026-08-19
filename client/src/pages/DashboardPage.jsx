import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import ProgressBar from '../components/ProgressBar';
import RoundCard from '../components/RoundCard';
import LeaderboardTable from '../components/LeaderboardTable';
import TimerWidget from '../components/TimerWidget';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { getStatus, getRounds, getLeaderboard, startGame } from '../api/game';
import toast from 'react-hot-toast';

export default function DashboardPage() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [statusData, setStatusData] = useState(null);
  const [rounds, setRounds] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [showStartConfirm, setShowStartConfirm] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [statusRes, roundsRes, lbRes] = await Promise.all([
        getStatus(),
        getRounds(),
        getLeaderboard(),
      ]);

      setStatusData(statusRes.data);
      setRounds(roundsRes.data.rounds || []);
      setLeaderboard(lbRes.data.leaderboard || []);

      if (statusRes.data.status === 'COMPLETED' || statusRes.data.status === 'EXPIRED') {
        navigate('/completed');
      }
    } catch (err) {
      const code = err.response?.data?.code;
      if (code === 'COMPLETED' || code === 'EXPIRED') {
        navigate('/completed');
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchData();

    // 10-second HTTP polling for live leaderboard & status updates
    const pollInterval = setInterval(() => {
      getLeaderboard().then((res) => setLeaderboard(res.data.leaderboard || [])).catch(() => {});
      getStatus().then((res) => {
        setStatusData(res.data);
        if (res.data.status === 'COMPLETED' || res.data.status === 'EXPIRED') {
          navigate('/completed');
        }
      }).catch(() => {});
    }, 10000);

    return () => clearInterval(pollInterval);
  }, [fetchData, navigate]);

  const handleStartGame = async () => {
    setStarting(true);
    try {
      await startGame();
      toast.success('30-Minute Global Timer Started! Good luck!');
      setShowStartConfirm(false);
      await refreshUser();
      await fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to start game.');
    } finally {
      setStarting(false);
    }
  };

  const handleSelectRound = (round) => {
    if (statusData?.status === 'NOT_STARTED') {
      setShowStartConfirm(true);
      return;
    }
    navigate(`/arena/${round._id}`);
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <span className="spinner" />
        <p className="font-mono text-sm">Initializing Arena Dashboard...</p>
      </div>
    );
  }

  const completedRoundsCount = statusData?.roundsCompleted?.length || 0;
  const isGameStarted = statusData?.status === 'IN_PROGRESS';

  return (
    <div className="page-wrapper pb-16">
      <div className="grid-bg" />
      <Navbar showExitBtn={true} />

      <main className="container max-w-5xl pt-8 relative z-10">
        {/* Header Section matching Screenshot 3 */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="text-xs font-mono text-muted tracking-widest uppercase mb-1">
              WELCOME, {user?.rollNumber || 'PLAYER'}
            </div>
            <h1 className="text-3xl font-extrabold text-white font-mono">Game Dashboard</h1>
          </div>

          <div className="flex items-center gap-3">
            {isGameStarted && (
              <TimerWidget initialSeconds={statusData?.timeRemaining} status={statusData?.status} />
            )}
          </div>
        </div>

        {/* Start Game Alert Banner if NOT_STARTED */}
        {statusData?.status === 'NOT_STARTED' && (
          <div className="glass-card-cyan p-6 mb-8 flex flex-col md:flex-row items-center justify-between gap-4 animate-pulse-glow">
            <div>
              <h3 className="text-lg font-bold text-cyan mb-1">Ready to Begin the Tournament?</h3>
              <p className="text-sm text-secondary">
                Clicking "Start Arena Timer" activates your server-side absolute 30-minute global countdown.
              </p>
            </div>
            <button
              onClick={() => setShowStartConfirm(true)}
              className="btn btn-cyan btn-lg whitespace-nowrap"
            >
              Start Arena Timer ⏱️
            </button>
          </div>
        )}

        {/* Overall Progress Bar matching screenshot 3 */}
        <ProgressBar
          completedCount={completedRoundsCount}
          totalCount={5}
          xp={statusData?.totalXp || 0}
        />

        {/* 3 Stat Cards Row matching Screenshot 3 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="glass-card p-6">
            <div className="text-cyan mb-2">⭐</div>
            <div className="text-2xl font-extrabold font-mono text-white mb-1">
              {statusData?.totalScore?.toLocaleString() || 0}
            </div>
            <div className="text-xs text-muted font-medium">Total Score</div>
          </div>

          <div className="glass-card p-6">
            <div className="text-success mb-2">✓</div>
            <div className="text-2xl font-extrabold font-mono text-white mb-1">
              {completedRoundsCount} / 5
            </div>
            <div className="text-xs text-muted font-medium">Rounds Done</div>
          </div>

          <div className="glass-card p-6">
            <div className="text-violet-light mb-2">🏆</div>
            <div className="text-2xl font-extrabold font-mono text-white mb-1">
              #{statusData?.estimatedRank || '--'}
            </div>
            <div className="text-xs text-muted font-medium">Est. Rank</div>
          </div>
        </div>

        {/* Game Rounds Section matching Screenshot 3 & 4 */}
        <div className="mb-10">
          <div className="text-xs font-mono text-muted tracking-widest uppercase mb-4">
            GAME ROUNDS
          </div>

          <div className="flex flex-col gap-4">
            {rounds.map((r) => (
              <RoundCard key={r._id} round={r} onSelect={handleSelectRound} />
            ))}
          </div>
        </div>

        {/* Top Players Leaderboard Section matching Screenshot 4 */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <div className="text-xs font-mono text-muted tracking-widest uppercase">
              TOP PLAYERS
            </div>
          </div>

          <LeaderboardTable players={leaderboard} currentUserRoll={user?.rollNumber} />
        </div>
      </main>

      {/* Start Timer Confirmation Modal */}
      <Modal
        isOpen={showStartConfirm}
        onClose={() => setShowStartConfirm(false)}
        title="⚠️ Confirm Arena Timer Start"
      >
        <div className="flex flex-col gap-4 text-sm text-secondary">
          <p>
            You are about to launch your <strong className="text-cyan">30-Minute Server-Side Timer</strong>.
          </p>
          <div className="p-3 glass-card border-warning/40 text-warning text-xs">
            <strong>CRITICAL:</strong> Once started, the clock will tick continuously on the server even if you close your browser or disconnect.
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button onClick={() => setShowStartConfirm(false)} className="btn btn-outline btn-sm">
            Cancel
          </button>
          <button onClick={handleStartGame} disabled={starting} className="btn btn-cyan btn-sm">
            {starting ? <span className="spinner" /> : 'Confirm & Start 🚀'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
