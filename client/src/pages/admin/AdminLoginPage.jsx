import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { adminLogin as apiAdminLogin } from '../../api/admin';
import OptixLogo from '../../components/OptixLogo';
import toast from 'react-hot-toast';

export default function AdminLoginPage() {
  const [rollNumber, setRollNumber] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const { saveAuth } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rollNumber || !password) {
      toast.error('Please fill in admin credentials');
      return;
    }

    setLoading(true);
    try {
      const res = await apiAdminLogin({ rollNumber, password });
      const { token, sessionToken, user } = res.data;
      saveAuth(token, sessionToken, user);
      toast.success('Admin authentication successful');
      navigate('/admin');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Admin login failed');
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
          <h1 className="text-2xl font-bold font-mono text-cyan">OPTIX Admin Portal</h1>
          <p className="text-xs text-muted mt-1">Tournament Control & Audit System</p>
        </div>

        <div className="glass-card p-8 border-cyan/40">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="form-group">
              <label className="form-label">ADMIN ROLL / ID</label>
              <input
                type="text"
                placeholder="ADMIN001"
                value={rollNumber}
                onChange={(e) => setRollNumber(e.target.value)}
                className="form-input uppercase"
                autoComplete="username"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">ADMIN PASSWORD</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input"
                autoComplete="current-password"
                required
              />
            </div>

            <button type="submit" disabled={loading} className="btn btn-cyan btn-full py-4 mt-2">
              {loading ? <span className="spinner" /> : 'Authenticate Admin 🔑'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <span className="text-[11px] text-muted">
              Default Admin: <code className="text-cyan">ADMIN001</code> / <code className="text-cyan">optix@admin2026</code>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
