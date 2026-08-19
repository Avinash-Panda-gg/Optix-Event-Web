import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Modal from '../components/Modal';
import OptixLogo from '../components/OptixLogo';
import { useAuth } from '../context/AuthContext';

export default function LandingPage() {
  const { user } = useAuth();
  const [showRulesModal, setShowRulesModal] = useState(false);

  return (
    <div className="page-wrapper">
      <div className="grid-bg" />
      <Navbar />

      <main className="hero-section container">
        <div className="hero-badge">
          <span className="hero-dot" />
          Season 2025 · Now Live
        </div>

        <h1 className="hero-title animate-fade-in">
          Analytics
          <span className="highlight">Quest</span>
        </h1>

        <p className="hero-subtitle animate-fade-in delay-1">
          The ultimate analytics tournament for our club. Five rounds of data challenges, strategy problems, and speed tests. One champion.
        </p>

        <div className="flex gap-4 justify-center flex-wrap animate-fade-in delay-2">
          {user ? (
            <Link to="/dashboard" className="btn btn-primary btn-lg animate-pulse-violet">
              Enter the Arena ➜
            </Link>
          ) : (
            <Link to="/register" className="btn btn-primary btn-lg animate-pulse-violet">
              Enter the Arena ➜
            </Link>
          )}

          <button onClick={() => setShowRulesModal(true)} className="btn btn-outline btn-lg">
            How it Works
          </button>
        </div>

        {/* Stats Row matching reference screenshot 1 */}
        <div className="hero-stats animate-fade-in delay-3">
          <div>
            <div className="hero-stat-value">3,000+</div>
            <div className="hero-stat-label">Registered Players</div>
          </div>
          <div>
            <div className="hero-stat-value">5</div>
            <div className="hero-stat-label">Game Rounds</div>
          </div>
          <div>
            <div className="hero-stat-value">10,000</div>
            <div className="hero-stat-label">Total XP</div>
          </div>
          <div>
            <div className="hero-stat-value">1</div>
            <div className="hero-stat-label">Device Per Player</div>
          </div>
        </div>
      </main>

      {/* Rules / How it Works Modal */}
      <Modal
        isOpen={showRulesModal}
        onClose={() => setShowRulesModal(false)}
        title="Tournament Rules & Protocol"
      >
        <div className="flex flex-col gap-4 text-sm text-secondary">
          <div className="p-3 glass-card border-cyan">
            <h4 className="text-cyan font-bold mb-1">⏱️ 30-Minute Global Timer</h4>
            <p>Once you click "Start Game", your 30-minute clock begins server-side. It does NOT pause on logout, refresh, or tab close.</p>
          </div>

          <div className="p-3 glass-card border-violet">
            <h4 className="text-violet font-bold mb-1">🔒 Single Device Lock</h4>
            <p>Your session is locked to a single device. Logging in on a new device invalidates your old session instantly.</p>
          </div>

          <div className="p-3 glass-card">
            <h4 className="font-bold text-primary mb-1">🎯 5 Progressive Rounds</h4>
            <p>Rounds 1–5 unlock sequentially. Complete Round N to unlock Round N+1. XP and points accumulate for the live leaderboard.</p>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button onClick={() => setShowRulesModal(false)} className="btn btn-primary btn-sm">
            Understood
          </button>
        </div>
      </Modal>
    </div>
  );
}
