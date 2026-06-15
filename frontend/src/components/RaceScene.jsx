import { useEffect, useRef, useState } from 'react';
import { useTypingEngine } from '../hooks/useTypingEngine';

const LANE_COLORS = [
  '#e63946', '#2563eb', '#16a34a', '#9333ea', '#f59e0b', '#06b6d4',
];

// Realistic sports car SVG — side view with detailed body, shading, rims
const CarSVG = ({ color, isMe }) => {
  // Slightly darker shade for depth/shadow areas
  const shade = (hex, amt) => {
    const num = parseInt(hex.slice(1), 16);
    let r = (num >> 16) + amt, g = ((num >> 8) & 0x00FF) + amt, b = (num & 0x0000FF) + amt;
    r = Math.max(Math.min(255, r), 0); g = Math.max(Math.min(255, g), 0); b = Math.max(Math.min(255, b), 0);
    return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, '0')}`;
  };
  const dark = shade(color, -40);
  const light = shade(color, 35);

  return (
    <svg viewBox="0 0 100 44" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
      {/* Ground shadow */}
      <ellipse cx="50" cy="40" rx="42" ry="4" fill="#000" opacity="0.28" />

      {/* Lower body / chassis */}
      <path d="M6 30 Q4 24 14 23 L20 23 Q26 14 38 12 L66 12 Q78 14 86 23 L92 23 Q98 24 96 30 L96 33 Q96 36 92 36 L10 36 Q6 36 6 33 Z" fill={color} />
      {/* Body shading - bottom strip */}
      <path d="M6 30 Q4 24 14 23 L92 23 Q98 24 96 30 L96 33 Q96 36 92 36 L10 36 Q6 36 6 33 Z" fill={dark} opacity="0.25" />

      {/* Roof / cabin */}
      <path d="M28 23 Q32 11 42 9 L62 9 Q72 11 78 23 Z" fill={color} />
      {/* Roof highlight */}
      <path d="M30 22 Q34 13 42 11 L60 11 Q56 13 54 22 Z" fill={light} opacity="0.45" />

      {/* Windshield (front, right) */}
      <path d="M62 11 Q70 13 75 23 L65 23 Q63 16 62 11 Z" fill="#bcd4e6" opacity="0.9" />
      <path d="M64 12 Q68 14 71 20 L66 20 Q65 15 64 12 Z" fill="#fff" opacity="0.5" />
      {/* Rear window */}
      <path d="M42 10 Q35 12 31 23 L40 23 Q41 15 42 10 Z" fill="#bcd4e6" opacity="0.9" />
      {/* Side window divider */}
      <rect x="40" y="11" width="22" height="12" fill="#a8c4da" opacity="0.85" rx="1" />
      <rect x="41" y="12" width="20" height="3" fill="#fff" opacity="0.35" />

      {/* Door line */}
      <path d="M52 23 L52 36" stroke={dark} strokeWidth="0.7" opacity="0.4" />
      {/* Door handle */}
      <rect x="56" y="25" width="6" height="1.6" rx="0.8" fill={light} opacity="0.8" />

      {/* Side skirt stripe */}
      <rect x="14" y="29" width="78" height="2.5" fill={light} opacity="0.5" />

      {/* Spoiler (rear) */}
      <path d="M8 19 L8 23 L16 23 L16 21 Z" fill={dark} />
      <rect x="6" y="17" width="4" height="2.5" rx="1" fill={dark} />

      {/* Front bumper / nose accent */}
      <path d="M86 23 L96 23 Q99 24 97 28 L92 28 Z" fill={dark} opacity="0.6" />

      {/* Headlight */}
      <ellipse cx="93" cy="27" rx="3.5" ry="2.8" fill="#fff8d6" />
      <ellipse cx="94" cy="27" rx="1.8" ry="1.6" fill="#fffef0" />
      {/* Taillight */}
      <rect x="6" y="25" width="4" height="4.5" rx="1.2" fill="#ff3344" />
      <rect x="6.8" y="26" width="2.2" height="2.5" rx="0.6" fill="#ff8888" />

      {/* Front wheel arch + wheel */}
      <path d="M70 36 a13 13 0 0 1 26 0 Z" fill={dark} opacity="0.3" />
      <circle cx="79" cy="36" r="9.5" fill="#16181d" />
      <circle cx="79" cy="36" r="6.8" fill="#2b2e35" />
      <circle cx="79" cy="36" r="6.8" fill="none" stroke="#454952" strokeWidth="0.6" />
      <circle cx="79" cy="36" r="3.6" fill="#75798a" />
      <circle cx="79" cy="36" r="1.4" fill="#ccc" />
      {[0, 72, 144, 216, 288].map(a => (
        <line key={a}
          x1={79 + 2 * Math.cos(a * Math.PI / 180)} y1={36 + 2 * Math.sin(a * Math.PI / 180)}
          x2={79 + 6 * Math.cos(a * Math.PI / 180)} y2={36 + 6 * Math.sin(a * Math.PI / 180)}
          stroke="#aaa" strokeWidth="1.2" strokeLinecap="round" />
      ))}

      {/* Rear wheel arch + wheel */}
      <path d="M8 36 a13 13 0 0 1 26 0 Z" fill={dark} opacity="0.3" />
      <circle cx="21" cy="36" r="9.5" fill="#16181d" />
      <circle cx="21" cy="36" r="6.8" fill="#2b2e35" />
      <circle cx="21" cy="36" r="6.8" fill="none" stroke="#454952" strokeWidth="0.6" />
      <circle cx="21" cy="36" r="3.6" fill="#75798a" />
      <circle cx="21" cy="36" r="1.4" fill="#ccc" />
      {[0, 72, 144, 216, 288].map(a => (
        <line key={a}
          x1={21 + 2 * Math.cos(a * Math.PI / 180)} y1={36 + 2 * Math.sin(a * Math.PI / 180)}
          x2={21 + 6 * Math.cos(a * Math.PI / 180)} y2={36 + 6 * Math.sin(a * Math.PI / 180)}
          stroke="#aaa" strokeWidth="1.2" strokeLinecap="round" />
      ))}

      {/* Racing stripe */}
      <path d="M30 13 Q40 11 50 11 L52 36 L46 36 Z" fill={light} opacity="0.3" />

      {/* YOU crown badge */}
      {isMe && (
        <g transform="translate(46, 1)">
          <path d="M0 8 L2 2 L5 6 L8 0 L11 6 L14 2 L16 8 Z" fill="#ffd700" stroke="#e6b800" strokeWidth="0.5" />
        </g>
      )}
    </svg>
  );
};

// Scenic background — road-dominant: thin sky strip, then multi-lane asphalt
// with lane markings, side rumble strips, and a distant skyline silhouette.
const SceneBackground = () => (
  <svg viewBox="0 0 1000 400" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg"
    style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}>
    <defs>
      <linearGradient id="sky2" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#5fa8dd" />
        <stop offset="100%" stopColor="#bfe3f7" />
      </linearGradient>
      <linearGradient id="road2" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#4b4e58" />
        <stop offset="50%" stopColor="#3c3f48" />
        <stop offset="100%" stopColor="#33363e" />
      </linearGradient>
      <linearGradient id="grass" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#6fae5c" />
        <stop offset="100%" stopColor="#5a9249" />
      </linearGradient>
    </defs>

    {/* Sky strip — thin */}
    <rect x="0" y="0" width="1000" height="46" fill="url(#sky2)" />
    {/* Sun glow */}
    <circle cx="880" cy="16" r="14" fill="#fff7d6" opacity="0.9" />
    {/* Clouds */}
    {[[90, 16, 0.8], [430, 10, 0.6], [650, 20, 0.7]].map(([x, y, s], i) => (
      <g key={i} opacity="0.85" transform={`translate(${x},${y}) scale(${s})`}>
        <ellipse cx="0" cy="6" rx="22" ry="8" fill="#fff" />
        <ellipse cx="16" cy="3" rx="15" ry="7" fill="#fff" />
        <ellipse cx="-15" cy="5" rx="13" ry="6" fill="#fff" />
      </g>
    ))}

    {/* Distant city skyline silhouette (small strip between sky and grass) */}
    <rect x="0" y="38" width="1000" height="14" fill="#9fc3da" opacity="0.7" />
    {[...Array(28)].map((_, i) => {
      const x = i * 36 + (i % 2) * 8;
      const h = 8 + (i % 3) * 5;
      return <rect key={i} x={x} y={52 - h} width="20" height={h} fill="#8fb5cd" opacity="0.65" />;
    })}

    {/* Grass strip */}
    <rect x="0" y="52" width="1000" height="20" fill="url(#grass)" />
    {/* small bushes on grass */}
    {[...Array(40)].map((_, i) => (
      <ellipse key={i} cx={i * 25 + 8} cy="64" rx="9" ry="6" fill={i % 2 === 0 ? '#4f8c45' : '#5d9c52'} opacity="0.8" />
    ))}

    {/* Rumble strip (red/white) */}
    <rect x="0" y="72" width="1000" height="10" fill="#e8e8e8" />
    {[...Array(50)].map((_, i) => (
      <rect key={i} x={i * 20} y="72" width="10" height="10" fill="#d63a3a" />
    ))}

    {/* Main road surface — fills the rest */}
    <rect x="0" y="82" width="1000" height="318" fill="url(#road2)" />

    {/* subtle asphalt texture lines */}
    {[...Array(30)].map((_, i) => (
      <rect key={i} x="0" y={90 + i * 11} width="1000" height="1" fill="#fff" opacity="0.02" />
    ))}
  </svg>
);

// Traffic light widget — red / yellow / green stack
const TrafficLight = ({ phase }) => {
  const isGreen = phase === 'racing';
  const isRed = phase !== 'racing';

  return (
    <div className="flex flex-col items-center gap-1.5 select-none">
      <div className="rounded-xl p-2 sm:p-2.5 flex gap-2 sm:gap-2.5" style={{ background: '#1a1c22', border: '2px solid #2a2d35' }}>
        <div className="w-5 h-5 sm:w-7 sm:h-7 rounded-full transition-all duration-300"
          style={{
            background: isRed ? '#ef4444' : '#3a1515',
            boxShadow: isRed ? '0 0 14px 3px rgba(239,68,68,0.7)' : 'none',
          }} />
        <div className="w-5 h-5 sm:w-7 sm:h-7 rounded-full transition-all duration-300"
          style={{ background: '#3a2e10' }} />
        <div className="w-5 h-5 sm:w-7 sm:h-7 rounded-full transition-all duration-300"
          style={{
            background: isGreen ? '#22c55e' : '#143a1f',
            boxShadow: isGreen ? '0 0 14px 3px rgba(34,197,94,0.7)' : 'none',
          }} />
      </div>
      <span className="text-xs font-bold font-mono px-2 py-0.5 rounded"
        style={{ background: '#1a1c22', color: isGreen ? '#22c55e' : '#facc15', border: '1px solid #2a2d35' }}>
        {isGreen ? 'GO' : 'SET'}
      </span>
    </div>
  );
};

// One horizontal race lane
const RaceLane = ({ player, index, currentUserId, totalPlayers }) => {
  const color = LANE_COLORS[index % LANE_COLORS.length];
  const progress = player.progress || 0;
  const isMe = player.userId === currentUserId;
  const carW = 92, carH = 42;

  return (
    <div className="relative" style={{ height: `${100 / totalPlayers}%`, minHeight: '48px' }}>
      {/* Lane divider line */}
      <div className="absolute bottom-0 inset-x-0 h-px" style={{ background: 'rgba(255,255,255,0.12)' }} />
      {/* dashed center markers */}
      <div className="absolute inset-0 flex items-center justify-around px-2 opacity-30">
        {[...Array(14)].map((_, i) => (
          <div key={i} style={{ width: '22px', height: '3px', background: '#ffe680', borderRadius: '1px' }} />
        ))}
      </div>

      {/* Name tag */}
      <div className="absolute z-10 transition-all duration-300"
        style={{
          top: '50%', transform: 'translateY(-50%)',
          left: `clamp(2px, calc(${progress}% - 6px), calc(100% - 150px))`,
        }}>
        <span className={`inline-block px-2.5 py-1 rounded-md text-xs font-bold font-display whitespace-nowrap shadow-lg ${
          isMe ? 'text-dark-900' : 'text-white'
        }`}
          style={{
            background: isMe ? '#22c55e' : 'rgba(0,0,0,0.6)',
            transform: `translateY(${carH / 2 + 10}px)`,
          }}>
          {isMe ? 'You' : player.username}
        </span>
      </div>

      {/* Car */}
      <div className="absolute transition-all duration-300 z-10"
        style={{
          width: `${carW}px`, height: `${carH}px`,
          top: '50%', transform: 'translateY(-50%)',
          left: `clamp(2px, calc(${progress}% - ${carW - 10}px), calc(100% - ${carW + 6}px))`,
          filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.45))',
        }}>
        <CarSVG color={color} isMe={isMe} />
      </div>

      {/* finished badge */}
      {player.finished && (
        <div className="absolute z-20" style={{ right: '6px', top: '8px' }}>
          <span className="text-xs font-mono font-bold px-1.5 py-0.5 rounded-full"
            style={{ background: 'rgba(0,255,136,0.15)', color: '#00ff88', border: '1px solid rgba(0,255,136,0.4)' }}>
            #{player.position}
          </span>
        </div>
      )}
    </div>
  );
};

const RaceScene = ({ players, currentUserId, text, phase, timer, onProgress, onFinish, soundEnabled }) => {
  const started = phase === 'racing';
  const disabled = phase !== 'racing';

  const { typed, wpm, finished, handleInput, handleKeyDown, inputRef } = useTypingEngine({
    text, onProgress, onFinish, disabled, started, soundEnabled,
  });

  const [showHeadStart, setShowHeadStart] = useState(false);
  const sceneRef = useRef(null);

  // Detect "head start" attempts — user pressed a key before the light is green
  useEffect(() => {
    if (phase === 'racing') {
      setShowHeadStart(false);
      return;
    }
    const handleAnyKey = () => {
      if (phase !== 'racing') {
        setShowHeadStart(true);
        setTimeout(() => setShowHeadStart(false), 1500);
      }
    };
    window.addEventListener('keydown', handleAnyKey);
    return () => window.removeEventListener('keydown', handleAnyKey);
  }, [phase]);

  // Click anywhere on the scene focuses the hidden input once racing
  const handleSceneClick = () => {
    if (started && !disabled) inputRef.current?.focus();
  };

  // Build word list with per-word completion state for the bottom bar
  const words = text.split(' ');
  let charCount = 0;
  const wordSpans = words.map((word) => {
    const start = charCount;
    const end = charCount + word.length;
    charCount = end + 1; // +1 for the space
    return { word, start, end };
  });

  // Determine which word is "current"
  const currentWordIdx = wordSpans.findIndex(w => typed.length <= w.end) ?? 0;
  const activeWordIdx = currentWordIdx === -1 ? wordSpans.length - 1 : currentWordIdx;

  const formatTime = (s) => {
    const whole = Math.floor(s);
    const tenth = Math.floor((s - whole) * 10);
    return `${String(Math.floor(whole / 60)).padStart(2, '0')}:${String(whole % 60).padStart(2, '0')}.${tenth}`;
  };

  return (
    <div ref={sceneRef} onClick={handleSceneClick}
      className="relative w-full h-full rounded-2xl overflow-hidden border border-white/10 cursor-text flex flex-col"
      style={{ minHeight: 0 }}>

      {/* Scenic background */}
      <SceneBackground />

      {/* Top HUD */}
      <div className="relative z-10 flex items-center justify-between p-2 sm:p-3 pointer-events-none">
        <div className="px-3 py-1.5 rounded-xl font-bold font-mono text-sm sm:text-base"
          style={{ background: 'rgba(20,22,30,0.75)', color: '#fff', backdropFilter: 'blur(4px)' }}>
          {Math.round(wpm)} <span className="text-xs text-dark-300 font-normal">WPM</span>
        </div>
        <div className="px-3 py-1.5 rounded-xl font-bold font-mono text-sm sm:text-base flex items-center gap-1.5"
          style={{ background: 'rgba(20,22,30,0.75)', color: '#fff', backdropFilter: 'blur(4px)' }}>
          <span className={phase === 'racing' ? 'text-red-400' : 'text-dark-300'}>⏱</span>
          {formatTime(timer)}
        </div>
      </div>

      {/* Race lanes */}
      <div className="relative z-10 flex-1 flex flex-col px-1 sm:px-2" style={{ minHeight: 0 }}>
        {players.map((player, i) => (
          <RaceLane key={player.userId} player={player} index={i} currentUserId={currentUserId} totalPlayers={players.length} />
        ))}

        {/* Checkered finish line column */}
        <div className="absolute top-0 right-1 sm:right-2 bottom-0 w-3 sm:w-4 z-0"
          style={{
            backgroundImage: 'repeating-conic-gradient(#fff 0% 25%, #1a1a1a 0% 50%)',
            backgroundSize: '10px 10px',
            opacity: 0.9,
            boxShadow: '0 0 12px rgba(0,0,0,0.4)',
          }} />
      </div>

      {/* Traffic light — bottom-left, overlapping lanes/bottom bar */}
      <div className="absolute z-20 left-2 sm:left-3" style={{ bottom: '78px' }}>
        <TrafficLight phase={phase} />
      </div>

      {/* Head start warning */}
      {showHeadStart && (
        <div className="absolute z-30 left-1/2 -translate-x-1/2 animate-slide-up" style={{ bottom: '90px' }}>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold font-display text-sm whitespace-nowrap"
            style={{ background: 'rgba(20,40,20,0.9)', border: '1px solid rgba(34,197,94,0.5)', color: '#4ade80' }}>
            ⚠️ Head start! Wait for the green light!
          </div>
        </div>
      )}

      {/* Bottom typing bar — current word, large single line */}
      <div className="relative z-10 px-3 sm:px-5 py-3 sm:py-4"
        style={{ background: 'rgba(15,17,23,0.92)', backdropFilter: 'blur(6px)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-2 overflow-hidden">
          <span className="text-brand-500 text-lg sm:text-xl shrink-0">▶</span>
          <div className="flex-1 overflow-hidden whitespace-nowrap font-mono text-lg sm:text-2xl font-bold tracking-wide"
            style={{ lineHeight: 1.4 }}>
            {finished ? (
              <span className="text-neon-green">✓ Finished! Great job!</span>
            ) : !started ? (
              <span className="text-dark-300">
                {wordSpans.slice(0, 12).map((w, i) => (
                  <span key={i} className={i === 0 ? 'text-white' : 'text-dark-400'}>{w.word} </span>
                ))}
              </span>
            ) : (
              <span>
                {wordSpans.slice(Math.max(0, activeWordIdx - 1), activeWordIdx + 10).map((w, idx) => {
                  const realIdx = Math.max(0, activeWordIdx - 1) + idx;
                  const isActive = realIdx === activeWordIdx;
                  // Render this word's characters with correctness coloring if active
                  if (isActive) {
                    return (
                      <span key={realIdx} className="relative">
                        {Array.from(w.word).map((ch, ci) => {
                          const globalIdx = w.start + ci;
                          let cls = 'text-dark-400';
                          if (globalIdx < typed.length) {
                            cls = typed[globalIdx] === ch ? 'text-white' : 'text-red-400 underline';
                          } else if (globalIdx === typed.length) {
                            cls = 'text-brand-400 underline';
                          }
                          return <span key={ci} className={cls}>{ch}</span>;
                        })}
                        {' '}
                      </span>
                    );
                  }
                  const isDone = realIdx < activeWordIdx;
                  return <span key={realIdx} className={isDone ? 'text-dark-600 line-through opacity-50' : 'text-dark-400'}>{w.word} </span>;
                })}
              </span>
            )}
          </div>
        </div>

        {/* Hidden input */}
        <input
          ref={inputRef}
          type="text"
          value={typed}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          disabled={disabled || finished || !started}
          className="opacity-0 absolute pointer-events-none"
          autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false} tabIndex={-1}
        />
      </div>
    </div>
  );
};

export default RaceScene;
