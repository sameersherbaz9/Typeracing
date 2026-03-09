const MEDALS = ['🥇', '🥈', '🥉'];

const RaceResults = ({ results, onPlayAgain, onLeave }) => {
  return (
    <div className="fixed inset-0 bg-dark-900/90 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="glass rounded-2xl p-8 w-full max-w-lg animate-slide-up border border-white/10">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">{results[0]?.position === 1 ? '🏆' : '🏁'}</div>
          <h2 className="text-2xl font-bold font-display text-white">Race Finished!</h2>
          <p className="text-dark-300 text-sm mt-1">Here's how everyone did</p>
        </div>

        <div className="space-y-3 mb-8">
          {results.map((player, index) => (
            <div
              key={player.userId || index}
              className={`flex items-center gap-4 p-4 rounded-xl transition-all ${
                index === 0
                  ? 'bg-gradient-to-r from-yellow-500/10 to-brand-500/10 border border-yellow-500/20'
                  : 'bg-dark-700/50'
              }`}
            >
              <span className="text-2xl">{MEDALS[index] || `#${index + 1}`}</span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold font-display text-white truncate">{player.username}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-bold font-mono text-brand-400">{Math.round(player.wpm)} WPM</p>
                <p className="text-xs font-mono text-dark-300">{Math.round(player.accuracy)}% acc</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onPlayAgain}
            className="flex-1 py-3 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-xl transition-colors duration-200 font-display"
          >
            Race Again
          </button>
          <button
            onClick={onLeave}
            className="flex-1 py-3 bg-dark-600 hover:bg-dark-500 text-white font-semibold rounded-xl transition-colors duration-200 font-display"
          >
            Leave
          </button>
        </div>
      </div>
    </div>
  );
};

export default RaceResults;
