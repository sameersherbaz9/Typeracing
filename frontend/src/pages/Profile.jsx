import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const Profile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileRes, historyRes] = await Promise.all([
          api.get('/profile'),
          api.get('/race-history?limit=20'),
        ]);
        setStats(profileRes.data.stats);
        setHistory(historyRes.data.history);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-brand-500 font-mono animate-pulse">Loading profile...</div>
      </div>
    );
  }

  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
    : 'Recently';

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 bg-grid">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Profile card */}
        <div className="glass rounded-2xl p-8 border border-white/5 animate-slide-up">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="w-20 h-20 rounded-2xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-5xl">
              {user?.avatar || '🏎️'}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl font-bold font-display text-white">{user?.username}</h1>
              <p className="text-dark-300 mt-1">{user?.email}</p>
              <p className="text-dark-400 text-sm mt-1 font-mono">Member since {memberSince}</p>
            </div>
            <button
              onClick={handleLogout}
              className="px-5 py-2.5 bg-dark-700 hover:bg-dark-600 text-dark-200 hover:text-white font-semibold rounded-xl transition-colors font-display text-sm shrink-0"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 animate-slide-up stagger-1">
          {[
            { label: 'Best WPM', value: Math.round(stats?.best_wpm || 0), color: 'text-brand-400' },
            { label: 'Avg Accuracy', value: `${Math.round(stats?.avg_accuracy || 0)}%`, color: 'text-neon-green' },
            { label: 'Total Races', value: stats?.total_races || 0, color: 'text-neon-blue' },
            { label: 'Rank', value: stats?.total_races > 0 ? '🏆' : '—', color: 'text-white' },
          ].map(({ label, value, color }) => (
            <div key={label} className="glass rounded-2xl p-5 border border-white/5 text-center">
              <p className={`text-3xl font-bold font-mono ${color}`}>{value}</p>
              <p className="text-dark-400 text-xs mt-1.5 uppercase tracking-wider font-display">{label}</p>
            </div>
          ))}
        </div>

        {/* Progress summary */}
        {stats?.best_wpm > 0 && (
          <div className="glass rounded-2xl p-6 border border-white/5 animate-slide-up stagger-2">
            <h2 className="text-lg font-bold font-display text-white mb-4">Typing Profile</h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-dark-300 font-display">Speed Level</span>
                  <span className="font-mono text-brand-400">{stats.best_wpm} WPM</span>
                </div>
                <div className="progress-track">
                  <div
                    className="progress-fill"
                    style={{ width: `${Math.min((stats.best_wpm / 120) * 100, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs mt-1 text-dark-500 font-mono">
                  <span>0</span>
                  <span>40 Beginner</span>
                  <span>80 Intermediate</span>
                  <span>120 Expert</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-dark-300 font-display">Accuracy</span>
                  <span className="font-mono text-neon-green">{Math.round(stats.avg_accuracy)}%</span>
                </div>
                <div className="progress-track">
                  <div
                    className="progress-fill bg-gradient-to-r from-neon-green to-emerald-500"
                    style={{ width: `${stats.avg_accuracy}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Race history */}
        <div className="animate-slide-up stagger-3">
          <h2 className="text-xl font-bold font-display text-white mb-4">Race History</h2>
          {history.length === 0 ? (
            <div className="glass rounded-2xl p-10 border border-white/5 text-center">
              <div className="text-4xl mb-3">🏁</div>
              <p className="text-dark-300">No races completed yet.</p>
            </div>
          ) : (
            <div className="glass rounded-2xl border border-white/5 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="text-left px-6 py-4 text-dark-300 text-xs font-semibold uppercase tracking-wider font-display">Date</th>
                      <th className="text-right px-6 py-4 text-dark-300 text-xs font-semibold uppercase tracking-wider font-display">WPM</th>
                      <th className="text-right px-6 py-4 text-dark-300 text-xs font-semibold uppercase tracking-wider font-display">Accuracy</th>
                      <th className="text-right px-6 py-4 text-dark-300 text-xs font-semibold uppercase tracking-wider font-display hidden sm:table-cell">Position</th>
                      <th className="text-right px-6 py-4 text-dark-300 text-xs font-semibold uppercase tracking-wider font-display hidden sm:table-cell">Difficulty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((race) => (
                      <tr key={race.id} className="border-b border-white/5 last:border-0 hover:bg-white/2 transition-colors">
                        <td className="px-6 py-4 text-dark-200 text-sm font-mono">
                          {new Date(race.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="font-bold font-mono text-brand-400">{Math.round(race.wpm)}</span>
                        </td>
                        <td className="px-6 py-4 text-right font-mono text-sm text-white">
                          {Math.round(race.accuracy)}%
                        </td>
                        <td className="px-6 py-4 text-right hidden sm:table-cell">
                          {race.position ? (
                            <span>{race.position === 1 ? '🥇' : race.position === 2 ? '🥈' : race.position === 3 ? '🥉' : `#${race.position}`}</span>
                          ) : (
                            <span className="text-dark-400">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right hidden sm:table-cell">
                          <span className={`px-2 py-0.5 rounded text-xs font-mono capitalize ${
                            race.difficulty === 'easy' ? 'bg-neon-green/10 text-neon-green' :
                            race.difficulty === 'hard' ? 'bg-red-500/10 text-red-400' :
                            'bg-yellow-500/10 text-yellow-400'
                          }`}>
                            {race.difficulty || 'medium'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
