import { useEffect, useRef, useState } from 'react';
import { useTypingEngine } from '../hooks/useTypingEngine';

const LANE_COLORS = [
  '#e63946', '#2563eb', '#16a34a', '#9333ea', '#d97706', '#0891b2',
];

// Realistic side-view car SVG, same style as PlayerProgress
const CarSVG = ({ color, isMe }) => (
  <svg viewBox="0 0 80 36" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
    <ellipse cx="40" cy="34" rx="30" ry="4" fill={color} opacity="0.35" />
    <rect x="6" y="22" width="68" height="10" rx="3" fill={color} />
    <path d="M18 22 Q22 10 30 9 L52 9 Q60 10 64 22 Z" fill={color} />
    <path d="M31 10 Q33 12 35 20 L28 20 Q26 14 31 10 Z" fill="#1a2a4a" opacity="0.85" />
    <path d="M51 10 Q56 13 58 20 L51 20 Q49 13 51 10 Z" fill="#1a2a4a" opacity="0.85" />
    <path d="M36 10 L50 10 L50 20 L36 20 Z" fill="#1a2a4a" opacity="0.85" />
    <path d="M38 11 L42 11 L41 13 L37 13 Z" fill="white" opacity="0.2" />
    <ellipse cx="72" cy="26" rx="4" ry="3" fill="#fffbe6" opacity="0.95" />
    <ellipse cx="72" cy="26" rx="2" ry="2" fill="white" />
    <rect x="7" y="24" width="5" height="5" rx="1" fill="#ff2222" opacity="0.9" />
    <rect x="8" y="25" width="3" height="3" rx="0.5" fill="#ff6666" />
    <rect x="18" y="22" width="44" height="2" rx="1" fill="white" opacity="0.12" />
    <circle cx="60" cy="32" r="7" fill="#111" /><circle cx="60" cy="32" r="5" fill="#222" /><circle cx="60" cy="32" r="3" fill="#333" /><circle cx="60" cy="32" r="1.5" fill="#555" />
    <circle cx="20" cy="32" r="7" fill="#111" /><circle cx="20" cy="32" r="5" fill="#222" /><circle cx="20" cy="32" r="3" fill="#333" /><circle cx="20" cy="32" r="1.5" fill="#555" />
    {isMe && <rect x="34" y="4" width="14" height="6" rx="3" fill="#ffd700" />}
    {isMe && <text x="41" y="9" textAnchor="middle" fill="#111" fontSize="4" fontWeight="bold" fontFamily="monospace">YOU</text>}
  </svg>
);

// Scenic background — sky, city skyline, trees, road barrier
const SceneBackground = () => (
  <svg viewBox="0 0 1000 220" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg"
    style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}>
    {/* Sky */}
    <defs>
      <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#6fb8e8" />
        <stop offset="100%" stopColor="#a8d8f0" />
      </linearGradient>
      <linearGradient id="roadGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#5a5d68" />
        <stop offset="100%" stopColor="#4a4d58" />
      </linearGradient>
    </defs>
    <rect x="0" y="0" width="1000" height="120" fill="url(#sky)" />

    {/* Clouds */}
    {[[80, 30, 1], [400, 18, 0.8], [750, 35, 1.2], [920, 15, 0.7]].map(([x, y, s], i) => (
      <g key={i} opacity="0.85" transform={`translate(${x},${y}) scale(${s})`}>
        <ellipse cx="0" cy="10" rx="28" ry="12" fill="#fff" />
        <ellipse cx="20" cy="6" rx="20" ry="10" fill="#fff" />
        <ellipse cx="-20" cy="8" rx="18" ry="9" fill="#fff" />
      </g>
    ))}

    {/* City skyline */}
    {[
      [0, 75, 50, 45, '#8fb4c9'], [55, 60, 40, 60, '#a3c4d6'], [100, 80, 35, 40, '#8fb4c9'],
      [140, 50, 45, 70, '#9bbdd0'], [190, 70, 38, 50, '#a3c4d6'], [235, 65, 42, 55, '#8fb4c9'],
      [285, 55, 50, 65, '#9bbdd0'], [340, 75, 40, 45, '#a3c4d6'], [385, 60, 45, 60, '#8fb4c9'],
      [435, 80, 35, 40, '#9bbdd0'], [475, 50, 48, 70, '#a3c4d6'], [528, 70, 38, 50, '#8fb4c9'],
      [570, 65, 44, 55, '#9bbdd0'], [618, 55, 50, 65, '#a3c4d6'], [672, 75, 40, 45, '#8fb4c9'],
      [716, 60, 45, 60, '#9bbdd0'], [765, 80, 35, 40, '#a3c4d6'], [804, 50, 48, 70, '#8fb4c9'],
      [856, 70, 38, 50, '#9bbdd0'], [898, 65, 44, 55, '#a3c4d6'], [946, 55, 54, 65, '#8fb4c9'],
    ].map(([x, y, w, h, c], i) => (
      <g key={i}>
        <rect x={x} y={y} width={w} height={h} fill={c} />
        {/* windows */}
        {[...Array(Math.floor(h / 12))].map((_, ri) =>
          [...Array(Math.floor(w / 10))].map((_, ci) => (
            <rect key={`${ri}-${ci}`} x={x + 4 + ci * 10} y={y + 5 + ri * 12} width="4" height="5" fill="#fff" opacity="0.4" />
          ))
        )}
      </g>
    ))}

    {/* Trees row */}
    <rect x="0" y="118" width="1000" height="14" fill="#6fa05a" />
    {[...Array(34)].map((_, i) => (
      <g key={i} transform={`translate(${i * 30 + 10}, 110)`}>
        <ellipse cx="0" cy="0" rx="16" ry="13" fill={i % 2 === 0 ? '#4f8c45' : '#5d9c52'} />
        <ellipse cx="-6" cy="3" rx="10" ry="8" fill={i % 2 === 0 ? '#5d9c52' : '#6fae62'} />
        <rect x="-2" y="8" width="4" height="6" fill="#6b4423" />
      </g>
    ))}

    {/* Barrier wall */}
    <rect x="0" y="124" width="1000" height="18" fill="#9aa0ab" />
    {[...Array(40)].map((_, i) => (
      <g key={i}>
        <rect x={i * 25} y="124" width="20" height="6" fill="#fff" />
        <rect x={i * 25} y="124" width="20" height="6" fill="#e63946" opacity={i % 2 === 0 ? 0 : 0.85} />
        <rect x={i * 25 + 8} y="118" width="4" height="24" fill="#6b6f78" />
      </g>
    ))}

    {/* Road surface (the race lanes render on top of this in HTML) */}
    <rect x="0" y="142" width="1000" height="78" fill="url(#roadGrad)" />
  </svg>
);

// Traffic light widget — red / yellow / green stack
const TrafficLight = ({ phase }) => {
  // phase: 'countdown' (red/yellow building) or 'racing' (green)
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
  const carW = 64, carH = 32;

  return (
    <div className="relative" style={{ height: `${100 / totalPlayers}%`, minHeight: '36px' }}>
      {/* Lane divider lines */}
      <div className="absolute inset-0 flex items-center px-2">
        <div className="w-full h-px" style={{ background: 'rgba(255,255,255,0.15)' }} />
      </div>
      {/* dashed center markers */}
      <div className="absolute inset-0 flex items-center justify-around px-2 opacity-25">
        {[...Array(10)].map((_, i) => (
          <div key={i} style={{ width: '16px', height: '2px', background: '#fff', borderRadius: '1px' }} />
        ))}
      </div>

      {/* Name tag */}
      <div className="absolute z-10 transition-all duration-300"
        style={{
          top: '50%', transform: 'translateY(-50%)',
          left: `clamp(2px, calc(${progress}% - 4px), calc(100% - 130px))`,
        }}>
        <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold font-display whitespace-nowrap shadow-lg ${
          isMe ? 'text-dark-900' : 'text-white'
        }`}
          style={{
            background: isMe ? '#22c55e' : 'rgba(0,0,0,0.55)',
            transform: 'translateY(-26px)',
          }}>
          {isMe ? 'You' : player.username}
        </span>
      </div>

      {/* Car */}
      <div className="absolute transition-all duration-300 z-10"
        style={{
          width: `${carW}px`, height: `${carH}px`,
          top: '50%', transform: 'translateY(-50%)',
          left: `clamp(2px, calc(${progress}% - ${carW - 8}px), calc(100% - ${carW + 4}px))`,
          filter: 'drop-shadow(0 3px 5px rgba(0,0,0,0.5))',
        }}>
        <CarSVG color={color} isMe={isMe} />
      </div>

      {/* finished badge */}
      {player.finished && (
        <div className="absolute z-20" style={{ right: '2px', top: '50%', transform: 'translateY(-50%)' }}>
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
  const wordSpans = words.map((word, wi) => {
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
                            cls = 'text-brand-400';
                          }
                          return <span key={ci} className={cls}>{ch}</span>;
                        })}
                        {typed.length === w.start + w.word.length && (
                          <span className="text-brand-400">·</span>
                        )}
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
