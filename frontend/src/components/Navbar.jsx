import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMenuOpen(false);
  };

  const isActive = (path) => location.pathname === path;

  const navLinks = user
    ? [
        { to: '/dashboard', label: 'Dashboard' },
        { to: '/race', label: 'Race' },
        { to: '/practice', label: 'Practice' },
        { to: '/leaderboard', label: 'Leaderboard' },
      ]
    : [
        { to: '/leaderboard', label: 'Leaderboard' },
      ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center text-white font-bold text-sm font-mono group-hover:glow-brand transition-all duration-300">
              TR
            </div>
            <span className="font-display font-bold text-lg text-white">
              Type<span className="text-brand-500">Racing</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 font-body ${
                  isActive(link.to)
                    ? 'text-brand-400 bg-brand-500/10'
                    : 'text-dark-200 hover:text-white hover:bg-white/5'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Auth buttons */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <Link
                  to="/profile"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-dark-700 border border-white/5 hover:border-brand-500/30 transition-all duration-200"
                >
                  <span className="text-lg">{user.avatar || '🏎️'}</span>
                  <span className="text-sm font-medium text-white font-display">{user.username}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 text-sm font-medium text-dark-200 hover:text-white transition-colors duration-200"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-dark-200 hover:text-white transition-colors duration-200"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600 transition-colors duration-200"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu toggle */}
          <button
            className="md:hidden p-2 text-dark-200 hover:text-white"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden pb-4 space-y-1 animate-slide-up">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMenuOpen(false)}
                className={`block px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive(link.to)
                    ? 'text-brand-400 bg-brand-500/10'
                    : 'text-dark-200 hover:text-white hover:bg-white/5'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-2 border-t border-white/5 mt-2">
              {user ? (
                <>
                  <Link to="/profile" onClick={() => setMenuOpen(false)} className="block px-4 py-2.5 text-sm text-white">
                    {user.avatar} {user.username}
                  </Link>
                  <button onClick={handleLogout} className="block w-full text-left px-4 py-2.5 text-sm text-dark-200 hover:text-white">
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={() => setMenuOpen(false)} className="block px-4 py-2.5 text-sm text-dark-200 hover:text-white">Login</Link>
                  <Link to="/register" onClick={() => setMenuOpen(false)} className="block px-4 py-2.5 text-sm text-brand-400 font-medium">Get Started →</Link>
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
