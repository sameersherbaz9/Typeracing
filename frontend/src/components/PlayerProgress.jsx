const AVATARS = ['🏎️', '🚀', '⚡', '🐆', '🦅', '🔥', '💨', '🌪️'];

const getColor = (index) => {
  const colors = [
    'from-brand-500 to-brand-600',
    'from-blue-500 to-blue-600',
    'from-neon-green to-emerald-500',
    'from-purple-500 to-purple-600',
    'from-yellow-500 to-orange-500',
    'from-pink-500 to-rose-500',
  ];
  return colors[index % colors.length];
};

const PlayerProgress = ({ players, currentUserId }) => {
  return (
    <div className="glass rounded-xl p-5 space-y-4">
      <h3 className="text-sm font-semibold text-dark-300 uppercase tracking-wider font-display">
        Live Race · {players.length} Racers
      </h3>
      <div className="space-y-3">
        {players.map((player, index) => (
          <div key={player.userId} className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">{player.avatar || AVATARS[index % AVATARS.length]}</span>
                <span className={`text-sm font-medium font-display ${
                  player.userId === currentUserId ? 'text-brand-400' : 'text-white'
                }`}>
                  {player.username}
                  {player.userId === currentUserId && (
                    <span className="ml-1.5 text-xs text-dark-400 font-normal">(you)</span>
                  )}
                </span>
                {player.finished && (
                  <span className="text-xs bg-neon-green/10 text-neon-green px-1.5 py-0.5 rounded font-mono">
                    #{player.position}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs font-mono text-dark-300">
                {player.wpm > 0 && <span>{player.wpm} WPM</span>}
                <span className="text-dark-400">{player.progress || 0}%</span>
              </div>
            </div>
            <div className="progress-track">
              <div
                className={`progress-fill bg-gradient-to-r ${getColor(index)}`}
                style={{ width: `${player.progress || 0}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PlayerProgress;
