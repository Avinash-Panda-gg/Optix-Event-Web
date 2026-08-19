import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { login as apiLogin } from '../api/auth';
import OptixLogo from '../components/OptixLogo';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [rollNumber, setRollNumber] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();

  const { saveAuth } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const reason = searchParams.get('reason');
    if (reason === 'session_revoked') {
      toast.error('Session revoked. Another device logged into your account.', { duration: 5000 });
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rollNumber || !password) {
      toast.error('Please enter Roll Number and Password');
      return;
    }

    setLoading(true);
    try {
      const res = await apiLogin({ rollNumber, password });
      const { token, sessionToken, user } = res.data;
      saveAuth(token, sessionToken, user);

      if (user.status === 'COMPLETED' || user.status === 'EXPIRED') {
        navigate('/completed');
      } else {
        toast.success(`Welcome back, ${user.name}!`);
        navigate('/dashboard');
      }
    } catch (err) {
      const code = err.response?.data?.code;
      if (code === 'COMPLETED' || code === 'EXPIRED') {
        toast.error('Your tournament session has ended.', { duration: 4000 });
        navigate('/completed');
      } else {
        toast.error(err.response?.data?.message || 'Login failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrapper flex items-center justify-center p-6 min-h-screen">
      <div className="grid-bg" />

      <div className="container max-w-md relative z-10">
        <div className="text-center mb-8 flex flex-col items-center">
          <OptixLogo size={54} className="mb-3" />
          <h1 className="text-3xl font-extrabold text-white">Analytics<span className="text-violet">Quest</span></h1>
          <p className="text-sm text-secondary mt-1">Sign in to resume your challenge</p>
        </div>

        <div className="glass-card p-8 border-violet/30">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="form-group">
              <label className="form-label">ROLL NUMBER / TEAM ID</label>
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

            <button type="submit" disabled={loading} className="btn btn-primary btn-full py-4 mt-2">
              {loading ? <span className="spinner" /> : 'Enter Arena ➜'}
            </button>
          </form>

          <div className="text-center mt-6 pt-4 border-t border-border">
            <span className="text-xs text-muted">Don't have an account? </span>
            <Link to="/register" className="text-xs text-cyan hover:underline font-semibold">
              Register Here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
