import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const StatBox = ({ label, value, sub, color = 'text-brand-400' }) => (
  <div className="glass rounded-2xl p-6 border border-white/5">
    <p className="text-dark-300 text-xs uppercase tracking-wider font-display mb-2">{label}</p>
    <p className={`text-4xl font-bold font-mono ${color}`}>{value}</p>
    {sub && <p className="text-dark-400 text-xs mt-1">{sub}</p>}
  </div>
);

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileRes, historyRes] = await Promise.all([
          api.get('/profile'),
          api.get('/race-history?limit=5'),
        ]);
        setStats(profileRes.data.stats);
        setHistory(historyRes.data.history);
      } catch (err) {
        console.error('Dashboard load error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-brand-500 text-xl font-mono animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 bg-grid">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="animate-slide-up">
          <p className="text-dark-300 text-sm font-mono mb-1">WELCOME BACK</p>
          <h1 className="text-4xl font-bold font-display text-white">
            {user?.avatar} {user?.username}
          </h1>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-slide-up stagger-1">
          <StatBox label="Best WPM" value={Math.round(stats?.best_wpm || 0)} sub="words per minute" color="text-brand-400" />
          <StatBox label="Avg Accuracy" value={`${Math.round(stats?.avg_accuracy || 0)}%`} sub="character accuracy" color="text-neon-green" />
          <StatBox label="Total Races" value={stats?.total_races || 0} sub="races completed" color="text-neon-blue" />
          <StatBox label="Status" value={stats?.total_races > 0 ? '🏆' : '🌱'} sub={stats?.total_races > 0 ? 'Active racer' : 'Just started'} color="text-white" />
        </div>

        {/* Quick actions */}
        <div className="grid sm:grid-cols-3 gap-4 animate-slide-up stagger-2">
          <Link
            to="/race"
            className="glass rounded-2xl p-6 border border-white/5 hover:border-brand-500/30 transition-all duration-200 hover:-translate-y-1 group"
          >
            <div className="text-3xl mb-3">🏎️</div>
            <h3 className="font-semibold font-display text-white group-hover:text-brand-400 transition-colors">Multiplayer Race</h3>
            <p className="text-dark-300 text-sm mt-1">Compete in real-time</p>
          </Link>
          <Link
            to="/practice"
            className="glass rounded-2xl p-6 border border-white/5 hover:border-brand-500/30 transition-all duration-200 hover:-translate-y-1 group"
          >
            <div className="text-3xl mb-3">🎯</div>
            <h3 className="font-semibold font-display text-white group-hover:text-brand-400 transition-colors">Practice Mode</h3>
            <p className="text-dark-300 text-sm mt-1">Improve your speed</p>
          </Link>
          <Link
            to="/leaderboard"
            className="glass rounded-2xl p-6 border border-white/5 hover:border-brand-500/30 transition-all duration-200 hover:-translate-y-1 group"
          >
            <div className="text-3xl mb-3">🏆</div>
            <h3 className="font-semibold font-display text-white group-hover:text-brand-400 transition-colors">Leaderboard</h3>
            <p className="text-dark-300 text-sm mt-1">See global rankings</p>
          </Link>
        </div>

        {/* Recent races */}
        <div className="animate-slide-up stagger-3">
          <h2 className="text-xl font-bold font-display text-white mb-4">Recent Races</h2>
          {history.length === 0 ? (
            <div className="glass rounded-2xl p-10 text-center border border-white/5">
              <div className="text-4xl mb-3">🏁</div>
              <p className="text-dark-300">No races yet. Time to hit the track!</p>
              <Link to="/race" className="inline-block mt-4 px-6 py-2.5 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-xl transition-colors duration-200 font-display text-sm">
                Start Racing →
              </Link>
            </div>
          ) : (
            <div className="glass rounded-2xl border border-white/5 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="text-left px-6 py-4 text-dark-300 text-xs font-semibold uppercase tracking-wider font-display">Date</th>
                      <th className="text-left px-6 py-4 text-dark-300 text-xs font-semibold uppercase tracking-wider font-display">WPM</th>
                      <th className="text-left px-6 py-4 text-dark-300 text-xs font-semibold uppercase tracking-wider font-display">Accuracy</th>
                      <th className="text-left px-6 py-4 text-dark-300 text-xs font-semibold uppercase tracking-wider font-display">Position</th>
                      <th className="text-left px-6 py-4 text-dark-300 text-xs font-semibold uppercase tracking-wider font-display">Difficulty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((race, i) => (
                      <tr key={race.id} className="border-b border-white/5 last:border-0 hover:bg-white/2 transition-colors">
                        <td className="px-6 py-4 text-dark-200 text-sm font-mono">
                          {new Date(race.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-bold font-mono text-brand-400">{Math.round(race.wpm)}</span>
                          <span className="text-dark-400 text-xs ml-1">wpm</span>
                        </td>
                        <td className="px-6 py-4 font-mono text-sm text-white">{Math.round(race.accuracy)}%</td>
                        <td className="px-6 py-4">
                          {race.position ? (
                            <span className="text-sm">{race.position === 1 ? '🥇' : race.position === 2 ? '🥈' : race.position === 3 ? '🥉' : `#${race.position}`}</span>
                          ) : (
                            <span className="text-dark-400 text-sm">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
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

export default Dashboard;
