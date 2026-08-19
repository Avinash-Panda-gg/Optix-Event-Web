import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { register as apiRegister } from '../api/auth';
import OptixLogo from '../components/OptixLogo';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const { saveAuth } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !rollNumber || !password) {
      toast.error('Please fill in all fields');
      return;
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const res = await apiRegister({ name, rollNumber, password });
      const { token, sessionToken, user } = res.data;
      saveAuth(token, sessionToken, user);
      toast.success('Registration successful! Arena unlocked.');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrapper flex items-center justify-center p-6 min-h-screen">
      <div className="grid-bg" />

      <div className="container max-w-5xl relative z-10 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        {/* Left Column matching Screenshot 2 */}
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <span className="badge badge-cyan font-mono text-xs">((•)) OPTIX / KIIT</span>
          </div>

          <div className="flex items-center gap-4 my-2">
            <div className="glass-card p-2 px-4 flex items-center gap-2 border-cyan/40">
              <OptixLogo size={36} />
              <div className="text-xs">
                <div className="font-bold tracking-wider text-cyan">OPTIX CLUB</div>
                <div className="text-muted text-[10px]">AHEAD OF TIME</div>
              </div>
            </div>
          </div>

          <div>
            <div className="text-xs font-mono text-cyan tracking-widest uppercase mb-2">
              ✦ 2026 KNOWLEDGE ARENA
            </div>
            <h1 className="text-5xl font-extrabold tracking-tight text-white mb-4">
              ISR <span className="text-cyan drop-shadow-[0_0_20px_rgba(0,229,255,0.5)]">CHALLENGE</span>
            </h1>
            <p className="text-secondary text-base max-w-md">
              Think sharper. Retain smarter. Put your ISR instincts to the test.
            </p>
          </div>

          <div className="flex gap-8 mt-4 pt-4 border-t border-border">
            <div>
              <div className="text-2xl font-bold font-mono text-white">20</div>
              <div className="text-xs text-muted">QUESTIONS PER RUN</div>
            </div>
            <div>
              <div className="text-2xl font-bold font-mono text-white">03</div>
              <div className="text-xs text-muted">LEVELS, RISING AS YOU PLAY</div>
            </div>
          </div>
        </div>

        {/* Right Column: Player Setup Form matching Screenshot 2 */}
        <div className="glass-card p-8 border-cyan/30 relative">
          <div className="flex justify-between items-center mb-6">
            <span className="text-xs font-mono text-muted tracking-widest uppercase">PLAYER SETUP</span>
            <span className="text-xs font-mono text-cyan">01 / 03</span>
          </div>

          <h2 className="text-2xl font-bold text-white mb-1">Ready when you are.</h2>
          <p className="text-sm text-secondary mb-6">Enter your details to enter the arena.</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="form-group">
              <label className="form-label">PLAYER NAME</label>
              <input
                type="text"
                placeholder="e.g. Aniket Sharma"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">ROLL NUMBER</label>
              <input
                type="text"
                placeholder="e.g. OPT-042"
                value={rollNumber}
                onChange={(e) => setRollNumber(e.target.value)}
                className="form-input uppercase"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">PASSWORD</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input"
                required
              />
            </div>

            {/* Progressive Difficulty Indicator Card */}
            <div className="p-3 glass-card bg-surface2/60 flex items-center justify-between border-border my-2">
              <div className="flex items-center gap-2">
                <span className="flex gap-1">
                  <span className="w-2 h-2 rounded-full bg-success"></span>
                  <span className="w-2 h-2 rounded-full bg-warning"></span>
                  <span className="w-2 h-2 rounded-full bg-danger"></span>
                </span>
                <span className="text-xs font-semibold text-white">Progressive difficulty</span>
              </div>
              <span className="text-[10px] text-muted font-mono">Easy → Medium → Hard</span>
            </div>

            <button type="submit" disabled={loading} className="btn btn-cyan btn-full py-4 mt-2">
              {loading ? <span className="spinner" /> : 'Play ISR Challenge ➜'}
            </button>
          </form>

          <div className="text-center mt-4">
            <span className="text-xs text-muted">Already registered? </span>
            <Link to="/login" className="text-xs text-cyan hover:underline font-semibold">
              Sign In Here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
