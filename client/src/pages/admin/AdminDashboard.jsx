import React, { useEffect, useState, useCallback } from 'react';
import Navbar from '../../components/Navbar';
import Modal from '../../components/Modal';
import {
  getStats,
  getPlayers,
  getAuditLogs,
  getFullLeaderboard,
  resetPlayer,
  updateQuestion,
  getQuestions,
  exportCSV,
} from '../../api/admin';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview'); // overview | players | audit | questions

  // Data states
  const [stats, setStats] = useState(null);
  const [players, setPlayers] = useState([]);
  const [playerTotal, setPlayerTotal] = useState(0);
  const [playerPage, setPlayerPage] = useState(1);
  const [playerSearch, setPlayerSearch] = useState('');

  const [auditLogs, setAuditLogs] = useState([]);
  const [auditTotal, setAuditTotal] = useState(0);
  const [auditPage, setAuditPage] = useState(1);
  const [auditAction, setAuditAction] = useState('');

  const [leaderboard, setLeaderboard] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [editingQuestion, setEditingQuestion] = useState(null);

  const [resetTarget, setResetTarget] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load Overview Stats
  const loadStats = useCallback(async () => {
    try {
      const [statsRes, lbRes] = await Promise.all([getStats(), getFullLeaderboard()]);
      setStats(statsRes.data.stats);
      setLeaderboard(lbRes.data.leaderboard || []);
    } catch (err) {
      toast.error('Failed to load admin stats');
    }
  }, []);

  // Load Players
  const loadPlayers = useCallback(async () => {
    try {
      const res = await getPlayers({ page: playerPage, limit: 20, search: playerSearch });
      setPlayers(res.data.players || []);
      setPlayerTotal(res.data.total || 0);
    } catch (err) {
      toast.error('Failed to load players');
    }
  }, [playerPage, playerSearch]);

  // Load Audit Logs
  const loadAudit = useCallback(async () => {
    try {
      const res = await getAuditLogs({ page: auditPage, limit: 20, action: auditAction });
      setAuditLogs(res.data.logs || []);
      setAuditTotal(res.data.total || 0);
    } catch (err) {
      toast.error('Failed to load audit logs');
    }
  }, [auditPage, auditAction]);

  // Load Questions
  const loadQuestionsData = useCallback(async () => {
    try {
      const res = await getQuestions();
      setQuestions(res.data.questions || []);
    } catch (err) {
      toast.error('Failed to load questions');
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([loadStats(), loadPlayers(), loadAudit(), loadQuestionsData()])
      .finally(() => setLoading(false));
  }, [loadStats, loadPlayers, loadAudit, loadQuestionsData]);

  // CSV Export Handler
  const handleExportCSV = async () => {
    try {
      const res = await exportCSV();
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'OPTIX_AnalyticsQuest_Leaderboard.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Leaderboard exported to CSV!');
    } catch (err) {
      toast.error('Export failed.');
    }
  };

  // Reset Player Handler
  const handleResetPlayer = async () => {
    if (!resetTarget) return;
    try {
      await resetPlayer(resetTarget._id);
      toast.success(`Player ${resetTarget.rollNumber} has been reset.`);
      setResetTarget(null);
      loadPlayers();
      loadStats();
    } catch (err) {
      toast.error('Reset failed.');
    }
  };

  // Save Edit Question
  const handleSaveQuestion = async (e) => {
    e.preventDefault();
    if (!editingQuestion) return;
    try {
      await updateQuestion(editingQuestion._id, editingQuestion);
      toast.success('Question updated!');
      setEditingQuestion(null);
      loadQuestionsData();
    } catch (err) {
      toast.error('Update failed');
    }
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <span className="spinner" />
        <p className="font-mono text-sm">Loading Admin Command Center...</p>
      </div>
    );
  }

  return (
    <div className="page-wrapper pb-16">
      <div className="grid-bg" />
      <Navbar title="ADMIN COMMAND CENTER" />

      <main className="container max-w-6xl pt-8 relative z-10">
        {/* Navigation Tabs */}
        <div className="flex gap-3 mb-8 border-b border-border pb-4 overflow-x-auto">
          {[
            { id: 'overview', label: '📊 Overview' },
            { id: 'players', label: `👥 Players (${playerTotal})` },
            { id: 'audit', label: `🛡️ Audit Logs (${auditTotal})` },
            { id: 'questions', label: `❓ Questions (${questions.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`btn btn-sm ${
                activeTab === tab.id ? 'btn-cyan' : 'btn-outline'
              }`}
            >
              {tab.label}
            </button>
          ))}

          <div className="ml-auto">
            <button onClick={handleExportCSV} className="btn btn-primary btn-sm">
              📥 Export CSV
            </button>
          </div>
        </div>

        {/* ── TAB 1: OVERVIEW ── */}
        {activeTab === 'overview' && (
          <div className="flex flex-col gap-8">
            {/* Stat Cards Row */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="glass-card p-5">
                <div className="text-xs text-muted font-mono uppercase mb-1">TOTAL PLAYERS</div>
                <div className="text-3xl font-bold font-mono text-white">{stats?.totalPlayers || 0}</div>
              </div>
              <div className="glass-card p-5">
                <div className="text-xs text-muted font-mono uppercase mb-1">ACTIVE ONLINE</div>
                <div className="text-3xl font-bold font-mono text-cyan">{stats?.activePlayers || 0}</div>
              </div>
              <div className="glass-card p-5">
                <div className="text-xs text-muted font-mono uppercase mb-1">COMPLETED</div>
                <div className="text-3xl font-bold font-mono text-success">{stats?.completedPlayers || 0}</div>
              </div>
              <div className="glass-card p-5">
                <div className="text-xs text-muted font-mono uppercase mb-1">EXPIRED</div>
                <div className="text-3xl font-bold font-mono text-danger">{stats?.expiredPlayers || 0}</div>
              </div>
              <div className="glass-card p-5 col-span-2 md:col-span-1">
                <div className="text-xs text-muted font-mono uppercase mb-1">AVG TIME</div>
                <div className="text-3xl font-bold font-mono text-violet">
                  {stats?.avgCompletionTime || 0} <span className="text-xs">min</span>
                </div>
              </div>
            </div>

            {/* Drop-off Per Round */}
            <div className="glass-card p-6">
              <h3 className="text-sm font-mono text-muted uppercase mb-4">Round Participation & Drop-off Rate</h3>
              <div className="grid grid-cols-5 gap-4 text-center">
                {[1, 2, 3, 4, 5].map((r) => {
                  const count = stats?.dropoff?.[`round${r}`] || 0;
                  const percent = stats?.totalPlayers ? Math.round((count / stats.totalPlayers) * 100) : 0;
                  return (
                    <div key={r} className="p-4 glass-card bg-surface2/40">
                      <div className="text-xs font-mono text-cyan mb-1">Round {r}</div>
                      <div className="text-xl font-bold font-mono text-white">{count}</div>
                      <div className="text-[10px] text-muted">{percent}% reached</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Top 10 Live Leaderboard */}
            <div className="glass-card p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-mono text-muted uppercase">Tournament Leaderboard</h3>
                <button onClick={handleExportCSV} className="btn btn-outline btn-sm text-xs">
                  Download CSV
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>Player Name</th>
                      <th>Roll Number</th>
                      <th>Score</th>
                      <th>XP</th>
                      <th>Rounds</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.map((p) => (
                      <tr key={p.rollNumber}>
                        <td className="font-mono font-bold">{p.rank}</td>
                        <td className="font-bold">{p.name}</td>
                        <td className="font-mono text-cyan">{p.rollNumber}</td>
                        <td className="font-mono text-violet-light font-bold">{p.totalScore}</td>
                        <td className="font-mono">{p.totalXp} XP</td>
                        <td>{p.roundsCompleted}/5</td>
                        <td>
                          <span className={`status-chip ${p.status}`}>{p.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 2: PLAYERS MANAGEMENT ── */}
        {activeTab === 'players' && (
          <div className="glass-card p-6">
            <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
              <input
                type="text"
                placeholder="Search by name or roll number..."
                value={playerSearch}
                onChange={(e) => {
                  setPlayerSearch(e.target.value);
                  setPlayerPage(1);
                }}
                className="form-input max-w-sm"
              />
            </div>

            <div className="overflow-x-auto">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Roll Number</th>
                    <th>Name</th>
                    <th>Status</th>
                    <th>Score</th>
                    <th>XP</th>
                    <th>Round</th>
                    <th>IP Address</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {players.map((p) => (
                    <tr key={p._id}>
                      <td className="font-mono font-bold text-cyan">{p.rollNumber}</td>
                      <td>{p.name}</td>
                      <td>
                        <span className={`status-chip ${p.status}`}>{p.status}</span>
                      </td>
                      <td className="font-mono font-bold">{p.totalScore}</td>
                      <td className="font-mono text-violet-light">{p.totalXp}</td>
                      <td>R{p.currentRound}</td>
                      <td className="font-mono text-xs text-muted">{p.lastIpAddress || 'n/a'}</td>
                      <td>
                        <button
                          onClick={() => setResetTarget(p)}
                          className="btn btn-danger btn-sm text-xs"
                          title="Reset player timer & session in technical emergency"
                        >
                          Reset 🔄
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── TAB 3: AUDIT LOGS ── */}
        {activeTab === 'audit' && (
          <div className="glass-card p-6">
            <div className="flex gap-4 mb-6">
              <select
                value={auditAction}
                onChange={(e) => {
                  setAuditAction(e.target.value);
                  setAuditPage(1);
                }}
                className="form-input max-w-xs"
              >
                <option value="">All Actions</option>
                <option value="LOGIN">LOGIN</option>
                <option value="LOGOUT">LOGOUT</option>
                <option value="REGISTER">REGISTER</option>
                <option value="SESSION_REVOKED">SESSION_REVOKED</option>
                <option value="ROUND_START">ROUND_START</option>
                <option value="ROUND_SUBMIT">ROUND_SUBMIT</option>
                <option value="GAME_EXPIRED">GAME_EXPIRED</option>
                <option value="PLAYER_RESET">PLAYER_RESET</option>
              </select>
            </div>

            <div className="overflow-x-auto">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Roll Number</th>
                    <th>Action</th>
                    <th>IP Address</th>
                    <th>User Agent</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map((log) => (
                    <tr key={log._id}>
                      <td className="font-mono text-xs text-muted">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="font-mono text-cyan font-bold">
                        {log.rollNumber || log.userId?.rollNumber || '--'}
                      </td>
                      <td>
                        <span className={`badge ${
                          log.action === 'GAME_EXPIRED' ? 'badge-danger' :
                          log.action === 'ROUND_SUBMIT' ? 'badge-success' :
                          log.action === 'SESSION_REVOKED' ? 'badge-warning' : 'badge-cyan'
                        }`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="font-mono text-xs">{log.ipAddress}</td>
                      <td className="font-mono text-[10px] text-muted max-w-xs truncate">
                        {log.userAgent}
                      </td>
                      <td className="font-mono text-xs">
                        {JSON.stringify(log.metadata || {})}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── TAB 4: QUESTIONS EDITOR ── */}
        {activeTab === 'questions' && (
          <div className="glass-card p-6">
            <h3 className="text-sm font-mono text-muted uppercase mb-4">Question Database</h3>

            <div className="flex flex-col gap-4">
              {questions.map((q) => (
                <div key={q._id} className="p-4 glass-card border-border flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="badge badge-cyan">Round {q.roundNumber}</span>
                      <span className="badge badge-violet">{q.points} pts</span>
                      <span className="text-xs font-mono text-success">Answer: {q.correctAnswer}</span>
                    </div>
                    <p className="text-sm font-medium text-white">{q.questionText}</p>
                    <div className="flex gap-4 mt-2 text-xs text-muted">
                      {q.options?.map((opt) => (
                        <span key={opt} className={opt.startsWith(q.correctAnswer) ? 'text-success font-bold' : ''}>
                          {opt}
                        </span>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => setEditingQuestion(q)}
                    className="btn btn-outline btn-sm"
                  >
                    Edit ✏️
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Reset Player Modal */}
      <Modal
        isOpen={!!resetTarget}
        onClose={() => setResetTarget(null)}
        title="⚠️ Reset Player Session & Timer"
      >
        <div className="text-sm text-secondary flex flex-col gap-3">
          <p>
            Are you sure you want to reset <strong className="text-cyan">{resetTarget?.rollNumber} ({resetTarget?.name})</strong>?
          </p>
          <div className="p-3 glass-card border-danger/30 text-danger text-xs">
            This will wipe their scores, reset status to NOT_STARTED, clear active session tokens, and allow them to start fresh.
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={() => setResetTarget(null)} className="btn btn-outline btn-sm">
            Cancel
          </button>
          <button onClick={handleResetPlayer} className="btn btn-danger btn-sm">
            Confirm Reset
          </button>
        </div>
      </Modal>

      {/* Edit Question Modal */}
      {editingQuestion && (
        <Modal
          isOpen={true}
          onClose={() => setEditingQuestion(null)}
          title="Edit Question"
        >
          <form onSubmit={handleSaveQuestion} className="flex flex-col gap-4">
            <div className="form-group">
              <label className="form-label">Question Text</label>
              <textarea
                value={editingQuestion.questionText}
                onChange={(e) => setEditingQuestion({ ...editingQuestion, questionText: e.target.value })}
                className="form-input"
                rows={3}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Correct Answer Letter (A, B, C, or D)</label>
              <input
                type="text"
                value={editingQuestion.correctAnswer}
                onChange={(e) => setEditingQuestion({ ...editingQuestion, correctAnswer: e.target.value.toUpperCase() })}
                className="form-input uppercase"
                maxLength={1}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Points</label>
              <input
                type="number"
                value={editingQuestion.points}
                onChange={(e) => setEditingQuestion({ ...editingQuestion, points: Number(e.target.value) })}
                className="form-input"
                required
              />
            </div>

            <div className="flex justify-end gap-3 mt-4">
              <button type="button" onClick={() => setEditingQuestion(null)} className="btn btn-outline btn-sm">
                Cancel
              </button>
              <button type="submit" className="btn btn-cyan btn-sm">
                Save Changes
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
