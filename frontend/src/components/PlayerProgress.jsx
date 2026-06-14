// Realistic SVG Car component — side view
const CarSVG = ({ color, glowColor, isMe }) => (
  <svg viewBox="0 0 80 36" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
    {/* Glow under car */}
    <ellipse cx="40" cy="34" rx="30" ry="4" fill={glowColor} opacity="0.5" />
    {/* Car body bottom */}
    <rect x="6" y="22" width="68" height="10" rx="3" fill={color} />
    {/* Car body top / cabin */}
    <path d="M18 22 Q22 10 30 9 L52 9 Q60 10 64 22 Z" fill={color} />
    {/* Windshield */}
    <path d="M31 10 Q33 12 35 20 L28 20 Q26 14 31 10 Z" fill="#1a2a4a" opacity="0.85" />
    {/* Rear window */}
    <path d="M51 10 Q56 13 58 20 L51 20 Q49 13 51 10 Z" fill="#1a2a4a" opacity="0.85" />
    {/* Middle window */}
    <path d="M36 10 L50 10 L50 20 L36 20 Z" fill="#1a2a4a" opacity="0.85" />
    {/* Window glare */}
    <path d="M38 11 L42 11 L41 13 L37 13 Z" fill="white" opacity="0.2" />
    {/* Headlight */}
    <ellipse cx="72" cy="26" rx="4" ry="3" fill="#fffbe6" opacity="0.95" />
    <ellipse cx="72" cy="26" rx="2" ry="2" fill="white" />
    {/* Tail light */}
    <rect x="7" y="24" width="5" height="5" rx="1" fill="#ff2222" opacity="0.9" />
    <rect x="8" y="25" width="3" height="3" rx="0.5" fill="#ff6666" />
    {/* Racing stripe */}
    <rect x="18" y="22" width="44" height="2" rx="1" fill="white" opacity="0.12" />
    {/* Front wheel */}
    <circle cx="60" cy="32" r="7" fill="#111" />
    <circle cx="60" cy="32" r="5" fill="#222" />
    <circle cx="60" cy="32" r="3" fill="#333" />
    <circle cx="60" cy="32" r="1.5" fill="#555" />
    {/* Rear wheel */}
    <circle cx="20" cy="32" r="7" fill="#111" />
    <circle cx="20" cy="32" r="5" fill="#222" />
    <circle cx="20" cy="32" r="3" fill="#333" />
    <circle cx="20" cy="32" r="1.5" fill="#555" />
    {/* YOU badge */}
    {isMe && <rect x="34" y="4" width="14" height="6" rx="3" fill="#ff3d24" />}
    {isMe && <text x="41" y="9" textAnchor="middle" fill="white" fontSize="4" fontWeight="bold" fontFamily="monospace">YOU</text>}
  </svg>
);

export const COLORS = [
  { body: '#e63946', glow: 'rgba(230,57,70,0.6)',   label: 'text-red-400'    },
  { body: '#2563eb', glow: 'rgba(37,99,235,0.6)',    label: 'text-blue-400'  },
  { body: '#16a34a', glow: 'rgba(22,163,74,0.6)',    label: 'text-green-400' },
  { body: '#9333ea', glow: 'rgba(147,51,234,0.6)',   label: 'text-purple-400'},
  { body: '#d97706', glow: 'rgba(217,119,6,0.6)',    label: 'text-yellow-400'},
  { body: '#0891b2', glow: 'rgba(8,145,178,0.6)',    label: 'text-cyan-400'  },
];

// One road lane — shared by compact and full views
const Lane = ({ player, index, currentUserId, height }) => {
  const color = COLORS[index % COLORS.length];
  const progress = player.progress || 0;
  const isMe = player.userId === currentUserId;
  const carWidth = height >= 56 ? 76 : 56;
  const carHeight = height >= 56 ? 44 : 32;

  return (
    <div>
      {/* Player info row */}
      <div className="flex items-center justify-between mb-1 px-1">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`text-xs font-bold font-display truncate ${isMe ? 'text-brand-400' : 'text-white'}`}>
            {player.username}
          </span>
          {isMe && <span className="text-xs text-dark-500 font-mono hidden sm:inline">(you)</span>}
          {player.finished && (
            <span className="px-1.5 py-0.5 rounded-full text-xs font-mono font-bold shrink-0"
              style={{ background: 'rgba(0,255,136,0.1)', color: '#00ff88', border: '1px solid rgba(0,255,136,0.3)' }}>
              #{player.position} ✓
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 sm:gap-3 text-xs font-mono shrink-0">
          {player.wpm > 0 && (
            <span className="font-bold" style={{ color: color.body }}>{Math.round(player.wpm)} WPM</span>
          )}
          <span className="text-dark-400">{progress}%</span>
        </div>
      </div>

      {/* Road lane */}
      <div className="relative rounded-xl overflow-hidden" style={{ height: `${height}px` }}>
        {/* Asphalt */}
        <div className="absolute inset-0"
          style={{ background: 'linear-gradient(180deg, #2a2d35 0%, #1e2028 50%, #2a2d35 100%)' }} />
        {/* Road edge lines */}
        <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'rgba(255,255,255,0.15)' }} />
        <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: 'rgba(255,255,255,0.10)' }} />
        {/* Center dashes */}
        <div className="absolute left-0 right-0 flex items-center" style={{ top: '50%', transform: 'translateY(-50%)' }}>
          {[...Array(22)].map((_, i) => (
            <div key={i} className="flex-1 flex justify-center">
              <div style={{ width: '14px', height: '2px', background: 'rgba(255,255,220,0.2)', borderRadius: '1px' }} />
            </div>
          ))}
        </div>
        {/* Progress glow trail */}
        <div className="absolute inset-y-0 left-0 transition-all duration-300"
          style={{ width: `${progress}%`, background: `linear-gradient(90deg, transparent 0%, ${color.glow.replace('0.6','0.1')} 100%)` }} />
        {/* Checkered finish line */}
        <div className="absolute top-0 bottom-0 right-0 w-4"
          style={{
            backgroundImage: 'repeating-conic-gradient(#fff 0% 25%, #000 0% 50%)',
            backgroundSize: '8px 8px',
            opacity: 0.5,
          }} />
        {/* Speed lines before car */}
        {progress > 3 && progress < 98 && (
          <div className="absolute flex gap-1 items-center"
            style={{
              top: '50%', transform: 'translateY(-50%)',
              left: `clamp(2px, calc(${progress}% - ${carWidth + 30}px), calc(100% - ${carWidth + 40}px))`,
              opacity: 0.5,
            }}>
            {[18, 12, 8].map((w, i) => (
              <div key={i} style={{
                width: `${w}px`, height: '2px',
                background: `linear-gradient(90deg, transparent, ${color.body})`,
                borderRadius: '1px',
              }} />
            ))}
          </div>
        )}
        {/* Car */}
        <div className="absolute transition-all duration-300"
          style={{
            width: `${carWidth}px`, height: `${carHeight}px`,
            top: '50%', transform: 'translateY(-50%)',
            left: `clamp(4px, calc(${progress}% - ${carWidth - 12}px), calc(100% - ${carWidth + 8}px))`,
            filter: `drop-shadow(0 0 10px ${color.glow}) drop-shadow(0 3px 6px rgba(0,0,0,0.9))`,
            zIndex: 2,
          }}>
          <CarSVG color={color.body} glowColor={color.glow} isMe={isMe} />
        </div>
      </div>
    </div>
  );
};

const PlayerProgress = ({ players, currentUserId, compact = false }) => {
  const laneHeight = compact ? 36 : 60;
  const gap = compact ? 'gap-1.5' : 'gap-3';
  const padding = compact ? 'p-2' : 'p-3';

  return (
    <div className="rounded-2xl overflow-hidden border border-white/10"
      style={{ background: 'linear-gradient(180deg, #0f1117 0%, #1a1d2e 100%)' }}>

      {/* Header */}
      {!compact && (
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5"
          style={{ background: 'rgba(255,255,255,0.02)' }}>
          <div className="flex items-center gap-2">
            <span className="text-base">🏁</span>
            <span className="text-xs font-bold text-white uppercase tracking-widest font-display">Live Race Track</span>
          </div>
          <span className="text-xs font-mono text-dark-400">{players.length} racer{players.length !== 1 ? 's' : ''}</span>
        </div>
      )}

      {/* Tracks */}
      <div className={`${padding} flex flex-col ${gap}`}>
        {players.map((player, index) => (
          <Lane key={player.userId} player={player} index={index} currentUserId={currentUserId} height={laneHeight} />
        ))}
      </div>
    </div>
  );
};

export default PlayerProgress;
