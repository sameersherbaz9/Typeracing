import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const Login = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/login', form);
      login(res.data.token, res.data.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-grid">
      <div className="absolute inset-0 bg-radial-glow pointer-events-none" />

      <div className="w-full max-w-md animate-slide-up relative">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-brand-500 flex items-center justify-center text-white font-bold font-mono">
              TR
            </div>
            <span className="font-display font-bold text-xl text-white">
              Type<span className="text-brand-500">Racing</span>
            </span>
          </Link>
          <p className="text-dark-300 text-sm mt-3">Sign in to your account</p>
        </div>

        <div className="glass rounded-2xl p-8 border border-white/5">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-dark-100 mb-2 font-display">Email</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full bg-dark-700 border border-white/5 rounded-xl px-4 py-3 text-white placeholder-dark-400 focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/30 transition-all duration-200 font-body"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-100 mb-2 font-display">Password</label>
              <input
                type="password"
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full bg-dark-700 border border-white/5 rounded-xl px-4 py-3 text-white placeholder-dark-400 focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/30 transition-all duration-200 font-body"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors duration-200 font-display flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing in...
                </>
              ) : (
                'Sign In →'
              )}
            </button>
          </form>

          <p className="text-center text-dark-300 text-sm mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-brand-400 hover:text-brand-300 font-medium transition-colors">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
