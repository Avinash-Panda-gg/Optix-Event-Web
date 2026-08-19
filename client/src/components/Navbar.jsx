import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import OptixLogo from './OptixLogo';
import { logout as apiLogout } from '../api/auth';
import toast from 'react-hot-toast';

export default function Navbar({ showLeaderboardBtn = true, showExitBtn = false, title }) {
  const { user, clearAuth, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      if (user) await apiLogout();
    } catch (e) {
      // Ignore API logout failure
    } finally {
      clearAuth();
      toast.success('Logged out');
      navigate('/login');
    }
  };

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="nav-logo flex items-center gap-3">
          <OptixLogo size={32} />
          <span>Analytics<span className="text-violet">Quest</span></span>
        </Link>

        {title && <span className="font-mono text-sm text-cyan hide-mobile">{title}</span>}

        <div className="nav-actions">
          {user ? (
            <>
              <span className="text-xs font-mono text-muted hide-mobile">
                {user.rollNumber}
              </span>

              {user.totalXp !== undefined && (
                <div className="badge badge-violet font-mono">
                  ⭐ {user.totalScore || 0} pts
                </div>
              )}

              {isAdmin && (
                <Link to="/admin" className="btn btn-ghost btn-sm text-cyan">
                  Admin Panel
                </Link>
              )}

              {showExitBtn && (
                <button onClick={handleLogout} className="btn btn-ghost btn-sm text-muted">
                  [➜ Exit
                </button>
              )}

              {!showExitBtn && (
                <button onClick={handleLogout} className="btn btn-outline btn-sm">
                  Sign Out
                </button>
              )}
            </>
          ) : (
            <>
              <Link to="/admin/login" className="btn btn-ghost btn-sm text-muted">
                Admin →
              </Link>
              <Link to="/login" className="btn btn-primary btn-sm">
                Sign In ➜
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
