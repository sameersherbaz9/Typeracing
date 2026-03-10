const CARS = ['🏎️', '🚗', '🚕', '🚙', '🛻', '🚓'];
const COLORS = [
  { bar: 'from-brand-500 to-orange-500', glow: 'rgba(255,61,36,0.5)', car: '#ff3d24' },
  { bar: 'from-blue-500 to-cyan-400',   glow: 'rgba(59,130,246,0.5)',  car: '#3b82f6' },
  { bar: 'from-emerald-500 to-green-400', glow: 'rgba(16,185,129,0.5)', car: '#10b981' },
  { bar: 'from-purple-500 to-violet-400', glow: 'rgba(139,92,246,0.5)', car: '#8b5cf6' },
  { bar: 'from-yellow-400 to-amber-500', glow: 'rgba(251,191,36,0.5)',  car: '#fbbf24' },
  { bar: 'from-pink-500 to-rose-400',   glow: 'rgba(236,72,153,0.5)',   car: '#ec4899' },
];

const PlayerProgress = ({ players, currentUserId }) => {
  return (
    <div className="glass rounded-2xl p-5 border border-white/5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-dark-300 uppercase tracking-wider font-display">
          🏁 Live Race Track
        </h3>
        <span className="text-xs font-mono text-dark-400">{players.length} racer{players.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Race track for each player */}
      <div className="space-y-4">
        {players.map((player, index) => {
          const color = COLORS[index % COLORS.length];
          const car = player.avatar || CARS[index % CARS.length];
          const progress = player.progress || 0;
          const isMe = player.userId === currentUserId;

          return (
            <div key={player.userId} className="space-y-1">
              {/* Player label row */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-base">{car}</span>
                  <span className={`font-semibold font-display ${isMe ? 'text-brand-400' : 'text-white'}`}>
                    {player.username}
                    {isMe && <span className="ml-1 text-dark-500 font-normal">(you)</span>}
                  </span>
                  {player.finished && (
                    <span className="px-1.5 py-0.5 rounded bg-neon-green/10 text-neon-green font-mono text-xs">
                      #{player.position} ✓
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 font-mono text-dark-300">
                  {player.wpm > 0 && <span className="text-white font-semibold">{Math.round(player.wpm)} wpm</span>}
                  <span>{progress}%</span>
                </div>
              </div>

              {/* Road track */}
              <div className="relative h-8 rounded-xl overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>

                {/* Road markings */}
                <div className="absolute inset-y-0 left-0 right-0 flex items-center">
                  {[...Array(20)].map((_, i) => (
                    <div key={i} className="flex-1 flex justify-center">
                      <div className="w-4 h-0.5 bg-white/5 rounded" />
                    </div>
                  ))}
                </div>

                {/* Progress fill */}
                <div
                  className={`absolute inset-y-0 left-0 bg-gradient-to-r ${color.bar} opacity-20 rounded-xl transition-all duration-300`}
                  style={{ width: `${progress}%` }}
                />

                {/* Finish line */}
                <div className="absolute right-0 top-0 bottom-0 w-1.5"
                  style={{ background: 'repeating-linear-gradient(180deg, white 0px, white 4px, black 4px, black 8px)', opacity: 0.4 }} />

                {/* Car emoji moving along track */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 text-lg transition-all duration-300 select-none"
                  style={{
                    left: `clamp(4px, calc(${progress}% - 20px), calc(100% - 32px))`,
                    filter: `drop-shadow(0 0 6px ${color.car})`,
                    fontSize: '1.2rem',
                    lineHeight: 1,
                  }}
                >
                  {car}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PlayerProgress;
