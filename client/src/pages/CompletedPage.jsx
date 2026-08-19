import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import OptixLogo from '../components/OptixLogo';
import { useAuth } from '../context/AuthContext';
import { getStatus } from '../api/game';

export default function CompletedPage() {
  const { user, clearAuth } = useAuth();
  const navigate = useNavigate();
  const [statusData, setStatusData] = useState(null);

  useEffect(() => {
    getStatus()
      .then((res) => setStatusData(res.data))
      .catch(() => {});
  }, []);

  const handleSignOut = () => {
    clearAuth();
    navigate('/');
  };

  const isExpired = statusData?.status === 'EXPIRED';

  return (
    <div className="page-wrapper flex flex-col min-h-screen">
      <div className="grid-bg" />
      <Navbar showExitBtn={false} />

      <main className="container max-w-2xl flex-1 flex flex-col items-center justify-center text-center py-12 relative z-10">
        <div className="glass-card p-10 border-violet/40 w-full animate-scale-in">
          <OptixLogo size={72} className="mx-auto mb-6" />

          <span className={`badge ${isExpired ? 'badge-danger' : 'badge-success'} mb-4 font-mono`}>
            {isExpired ? '⏱️ SESSION EXPIRED' : '🎉 CHALLENGE COMPLETED'}
          </span>

          <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-3">
            {isExpired ? 'Time Expired' : 'Thank You for Participating!'}
          </h1>

          <p className="text-secondary text-sm max-w-md mx-auto mb-8">
            {isExpired
              ? 'Your 30-minute global arena window has lapsed. Your score has been recorded permanently.'
              : 'You have completed all rounds of the OPTIX ISR Challenge / AnalyticsQuest.'}
          </p>

          {/* Final Score Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            <div className="glass-card p-4">
              <div className="text-xs text-muted font-medium mb-1">Final Score</div>
              <div className="text-2xl font-bold font-mono text-cyan">
                {statusData?.totalScore?.toLocaleString() || user?.totalScore || 0}
              </div>
            </div>

            <div className="glass-card p-4">
              <div className="text-xs text-muted font-medium mb-1">Total XP</div>
              <div className="text-2xl font-bold font-mono text-violet">
                {statusData?.totalXp?.toLocaleString() || user?.totalXp || 0}
              </div>
            </div>

            <div className="glass-card p-4 col-span-2 md:col-span-1">
              <div className="text-xs text-muted font-medium mb-1">Final Rank</div>
              <div className="text-2xl font-bold font-mono text-white">
                #{statusData?.estimatedRank || '--'}
              </div>
            </div>
          </div>

          <div className="p-4 glass-card bg-surface2/60 border-border text-xs text-muted mb-8">
            🔒 <strong>Session Security Lock Active:</strong> Your account status is marked as COMPLETED/EXPIRED. Re-entry into active quiz rounds is permanently restricted.
          </div>

          <button onClick={handleSignOut} className="btn btn-outline btn-full">
            Sign Out & Return Home ➜
          </button>
        </div>
      </main>
    </div>
  );
}
