const MEDALS = ['🥇', '🥈', '🥉'];
const RANKS = [
  { min: 0,   label: 'Beginner',     color: 'text-gray-400',   icon: '🐢' },
  { min: 30,  label: 'Novice',       color: 'text-green-400',  icon: '🐇' },
  { min: 50,  label: 'Intermediate', color: 'text-blue-400',   icon: '🐆' },
  { min: 70,  label: 'Advanced',     color: 'text-purple-400', icon: '🦅' },
  { min: 90,  label: 'Pro',          color: 'text-yellow-400', icon: '🚀' },
  { min: 110, label: 'Expert',       color: 'text-brand-400',  icon: '⚡' },
  { min: 130, label: 'Legendary',    color: 'text-red-400',    icon: '🔥' },
];

const getRank = (wpm) => [...RANKS].reverse().find(r => wpm >= r.min) || RANKS[0];

const RaceResults = ({ results, myResult, onPlayAgain, onLeave }) => {
  const myRank = getRank(myResult?.wpm || results[0]?.wpm || 0);
  const winner = results[0];

  return (
    <div className="fixed inset-0 bg-dark-900/95 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="glass rounded-2xl w-full max-w-xl border border-white/10 animate-slide-up my-auto">

        {/* Header */}
        <div className="p-6 border-b border-white/5 text-center">
          <div className="text-5xl mb-2">
            {results.findIndex(r => r.userId === myResult?.userId) === 0 ? '🏆' : '🏁'}
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-display text-white">Race Complete!</h2>
          <p className="text-dark-300 text-sm mt-1">
            Winner: <span className="text-brand-400 font-semibold">{winner?.username}</span> with{' '}
            <span className="text-white font-mono font-bold">{Math.round(winner?.wpm || 0)} WPM</span>
          </p>
        </div>

        {/* Podium results */}
        <div className="p-6 space-y-2 border-b border-white/5">
          {results.map((player, index) => (
            <div
              key={player.userId || index}
              className={`flex items-center gap-4 p-3.5 rounded-xl transition-all ${
                index === 0
                  ? 'bg-gradient-to-r from-yellow-500/10 to-orange-500/5 border border-yellow-500/20'
                  : 'bg-dark-700/40 border border-white/5'
              }`}
            >
              <span className="text-xl w-8 text-center shrink-0">
                {MEDALS[index] || `#${index + 1}`}
              </span>
              <span className="text-xl shrink-0">{player.avatar || '🏎️'}</span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold font-display text-white truncate">{player.username}</p>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-xs font-mono text-dark-400">acc {Math.round(player.accuracy)}%</span>
                  {player.finish_time && (
                    <span className="text-xs font-mono text-dark-400">
                      {(player.finish_time / 1000).toFixed(1)}s
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="font-bold font-mono text-brand-400 text-lg">{Math.round(player.wpm)}</p>
                <p className="text-xs text-dark-400 font-mono">WPM</p>
              </div>
            </div>
          ))}
        </div>

        {/* My stats breakdown */}
        {myResult && (
          <div className="p-6 border-b border-white/5">
            <p className="text-xs font-display text-dark-400 uppercase tracking-wider mb-3">Your Performance</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              {[
                { label: 'WPM', value: Math.round(myResult.wpm), color: 'text-brand-400' },
                { label: 'Accuracy', value: `${Math.round(myResult.accuracy)}%`, color: myResult.accuracy >= 95 ? 'text-neon-green' : 'text-yellow-400' },
                { label: 'Errors', value: myResult.errors || 0, color: myResult.errors === 0 ? 'text-neon-green' : 'text-red-400' },
                { label: 'Time', value: myResult.time ? `${(myResult.time / 1000).toFixed(1)}s` : '—', color: 'text-white' },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-dark-700/50 rounded-xl p-3 text-center">
                  <div className={`text-xl font-bold font-mono ${color}`}>{value}</div>
                  <div className="text-dark-400 text-xs mt-0.5 font-display">{label}</div>
                </div>
              ))}
            </div>

            {/* Rank badge */}
            <div className="flex items-center gap-3 px-4 py-3 bg-dark-700/50 rounded-xl">
              <span className="text-2xl">{myRank.icon}</span>
              <div>
                <p className={`font-bold font-display ${myRank.color}`}>{myRank.label} Typist</p>
                <p className="text-dark-400 text-xs font-mono">{Math.round(myResult.wpm)} WPM achieved</p>
              </div>
            </div>

            {/* Tricky keys from this race */}
            {myResult.trickyKeys && Object.keys(myResult.trickyKeys).length > 0 && (
              <div className="mt-3">
                <p className="text-xs text-dark-400 font-display mb-2">⚡ Practice these keys:</p>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(myResult.trickyKeys).sort((a,b) => b[1]-a[1]).slice(0,6).map(([k, c]) => (
                    <span key={k} className="px-2 py-1 bg-red-500/10 border border-red-500/20 rounded text-xs font-mono text-red-400">
                      {k === ' ' ? 'SPACE' : k} ×{c}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="p-5 flex gap-3">
          <button
            onClick={onPlayAgain}
            className="flex-1 py-3 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl transition-colors font-display"
          >
            🏎️ Race Again
          </button>
          <button
            onClick={onLeave}
            className="flex-1 py-3 bg-dark-600 hover:bg-dark-500 text-white font-semibold rounded-xl transition-colors font-display"
          >
            Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default RaceResults;
