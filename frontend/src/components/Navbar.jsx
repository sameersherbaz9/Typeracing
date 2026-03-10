import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/'); setMenuOpen(false); };
  const isActive = (path) => location.pathname === path;

  const navLinks = user
    ? [
        { to: '/dashboard', label: 'Dashboard', icon: '📊' },
        { to: '/race',      label: 'Race',      icon: '🏎️' },
        { to: '/practice',  label: 'Practice',  icon: '🎯' },
        { to: '/leaderboard', label: 'Leaderboard', icon: '🏆' },
      ]
    : [{ to: '/leaderboard', label: 'Leaderboard', icon: '🏆' }];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group shrink-0" onClick={() => setMenuOpen(false)}>
            <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center text-white font-bold text-sm font-mono group-hover:glow-brand transition-all duration-300">
              TR
            </div>
            <span className="font-display font-bold text-lg text-white">
              Type<span className="text-brand-500">Racing</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(link => (
              <Link key={link.to} to={link.to}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 font-body ${
                  isActive(link.to) ? 'text-brand-400 bg-brand-500/10' : 'text-dark-200 hover:text-white hover:bg-white/5'
                }`}>
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop auth */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                <Link to="/profile"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-dark-700 border border-white/5 hover:border-brand-500/30 transition-all duration-200">
                  <span className="text-lg">{user.avatar || '🏎️'}</span>
                  <span className="text-sm font-medium text-white font-display">{user.username}</span>
                </Link>
                <button onClick={handleLogout}
                  className="px-4 py-2 text-sm text-dark-200 hover:text-white transition-colors">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="px-4 py-2 text-sm text-dark-200 hover:text-white transition-colors">Login</Link>
                <Link to="/register" className="px-4 py-2 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600 transition-colors">
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button className="md:hidden p-2 text-dark-200 hover:text-white rounded-lg" onClick={() => setMenuOpen(!menuOpen)}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden pb-4 border-t border-white/5 mt-2 pt-3 space-y-1 animate-slide-up">
            {navLinks.map(link => (
              <Link key={link.to} to={link.to} onClick={() => setMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  isActive(link.to) ? 'text-brand-400 bg-brand-500/10' : 'text-dark-200 hover:text-white hover:bg-white/5'
                }`}>
                <span>{link.icon}</span>{link.label}
              </Link>
            ))}
            <div className="pt-2 border-t border-white/5 mt-2 space-y-1">
              {user ? (
                <>
                  <Link to="/profile" onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-white hover:bg-white/5 transition-all">
                    <span className="text-xl">{user.avatar || '🏎️'}</span>
                    <span className="font-display font-semibold">{user.username}</span>
                    <span className="text-xs text-dark-500 ml-1">· Profile</span>
                  </Link>
                  <button onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-red-400 hover:bg-red-500/5 transition-all">
                    🚪 Logout
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-dark-200 hover:text-white hover:bg-white/5 transition-all">
                    🔑 Login
                  </Link>
                  <Link to="/register" onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-white bg-brand-500/20 border border-brand-500/30 hover:bg-brand-500/30 transition-all font-medium">
                    🚀 Get Started Free
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
