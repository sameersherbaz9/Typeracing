import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const MEDALS = ['🥇', '🥈', '🥉'];

const Leaderboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get('/leaderboard');
        setData(res.data.leaderboard);
      } catch {
        setError('Failed to load leaderboard');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const userRank = data.findIndex((p) => user && p.username === user.username) + 1;

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 bg-grid">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="animate-slide-up text-center">
          <div className="text-5xl mb-3">🏆</div>
          <h1 className="text-4xl font-bold font-display text-white">Leaderboard</h1>
          <p className="text-dark-300 mt-2">Top 20 typists ranked by best WPM</p>
        </div>

        {/* Your rank banner */}
        {user && userRank > 0 && (
          <div className="glass rounded-2xl p-4 border border-brand-500/20 bg-brand-500/5 animate-slide-up stagger-1 text-center">
            <p className="text-brand-400 font-display font-semibold">
              You are ranked <span className="text-white font-bold">#{userRank}</span> globally 🎉
            </p>
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        {/* Table */}
        <div className="glass rounded-2xl border border-white/5 overflow-hidden animate-slide-up stagger-2">
          {loading ? (
            <div className="py-16 text-center text-brand-500 font-mono animate-pulse">Loading rankings...</div>
          ) : data.length === 0 ? (
            <div className="py-16 text-center">
              <div className="text-4xl mb-3">🏁</div>
              <p className="text-dark-300">No racers yet. Be the first!</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left px-6 py-4 text-dark-300 text-xs font-semibold uppercase tracking-wider font-display w-16">Rank</th>
                  <th className="text-left px-6 py-4 text-dark-300 text-xs font-semibold uppercase tracking-wider font-display">Player</th>
                  <th className="text-right px-6 py-4 text-dark-300 text-xs font-semibold uppercase tracking-wider font-display">Best WPM</th>
                  <th className="text-right px-6 py-4 text-dark-300 text-xs font-semibold uppercase tracking-wider font-display hidden sm:table-cell">Avg Accuracy</th>
                  <th className="text-right px-6 py-4 text-dark-300 text-xs font-semibold uppercase tracking-wider font-display hidden sm:table-cell">Races</th>
                </tr>
              </thead>
              <tbody>
                {data.map((player, index) => {
                  const isCurrentUser = user && player.username === user.username;
                  return (
                    <tr
                      key={player.id}
                      className={`border-b border-white/5 last:border-0 transition-colors ${
                        isCurrentUser ? 'bg-brand-500/5 hover:bg-brand-500/8' : 'hover:bg-white/2'
                      }`}
                    >
                      <td className="px-6 py-4">
                        <span className="font-bold font-mono">
                          {index < 3 ? (
                            <span className="text-xl">{MEDALS[index]}</span>
                          ) : (
                            <span className="text-dark-300">#{index + 1}</span>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{player.avatar || '🏎️'}</span>
                          <div>
                            <span className={`font-semibold font-display ${isCurrentUser ? 'text-brand-400' : 'text-white'}`}>
                              {player.username}
                            </span>
                            {isCurrentUser && (
                              <span className="ml-2 text-xs text-brand-500 font-mono">(you)</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-bold font-mono text-brand-400 text-lg">{Math.round(player.best_wpm)}</span>
                        <span className="text-dark-400 text-xs ml-1">wpm</span>
                      </td>
                      <td className="px-6 py-4 text-right hidden sm:table-cell">
                        <span className="font-mono text-white">{Math.round(player.avg_accuracy)}%</span>
                      </td>
                      <td className="px-6 py-4 text-right hidden sm:table-cell">
                        <span className="font-mono text-dark-300">{player.total_races}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
