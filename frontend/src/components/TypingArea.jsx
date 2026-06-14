import { useState, useEffect, useRef, useCallback } from 'react';

// --- Sound Effects via Web Audio API (no external files needed) ---
const createSound = (ctx, type) => {
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.connect(g);
  g.connect(ctx.destination);
  if (type === 'correct') {
    o.frequency.value = 600;
    g.gain.setValueAtTime(0.04, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
    o.type = 'sine';
  } else {
    o.frequency.value = 180;
    g.gain.setValueAtTime(0.08, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
    o.type = 'square';
  }
  o.start();
  o.stop(ctx.currentTime + 0.15);
};

const TypingArea = ({ text, onProgress, onFinish, disabled = false, started = false, soundEnabled = true }) => {
  const [typed, setTyped] = useState('');
  const [startTime, setStartTime] = useState(null);
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [finished, setFinished] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [errorCount, setErrorCount] = useState(0);
  const [trickyKeys, setTrickyKeys] = useState({}); // { char: errorCount }
  const inputRef = useRef(null);
  const intervalRef = useRef(null);
  const cursorRef = useRef(null);
  const textBoxRef = useRef(null);
  const audioCtxRef = useRef(null);

  // Init audio context on first interaction
  const getAudioCtx = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioCtxRef.current;
  };

  useEffect(() => {
    setTyped('');
    setStartTime(null);
    setWpm(0);
    setAccuracy(100);
    setFinished(false);
    setErrorCount(0);
    setTrickyKeys({});
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, [text]);

  useEffect(() => {
    if (started && !disabled && inputRef.current) {
      inputRef.current.focus();
    }
  }, [started, disabled]);

  // Auto-scroll to keep cursor visible
  useEffect(() => {
    if (cursorRef.current && textBoxRef.current) {
      const box = textBoxRef.current;
      const cursor = cursorRef.current;
      const boxTop = box.scrollTop;
      const boxBottom = boxTop + box.clientHeight;
      const cursorTop = cursor.offsetTop;
      const cursorBottom = cursorTop + cursor.offsetHeight;
      if (cursorBottom > boxBottom - 8) {
        box.scrollTop = cursorTop - box.clientHeight / 2;
      } else if (cursorTop < boxTop + 8) {
        box.scrollTop = cursorTop - box.clientHeight / 2;
      }
    }
  }, [typed]);

  const calculateStats = useCallback((typedText, startT) => {
    if (!startT || typedText.length === 0) return { wpm: 0, accuracy: 100 };
    const elapsed = (Date.now() - startT) / 1000 / 60;
    const correctChars = typedText.split('').filter((c, i) => c === text[i]).length;
    const calcWpm = Math.round((typedText.length / 5) / Math.max(elapsed, 0.01));
    const calcAccuracy = Math.round((correctChars / typedText.length) * 100);
    return { wpm: calcWpm, accuracy: calcAccuracy };
  }, [text]);

  const handleKeyDown = (e) => {
    setCapsLock(e.getModifierState?.('CapsLock') || false);
  };

  const handleInput = useCallback((e) => {
    if (disabled || finished || !started) return;
    const value = e.target.value;
    if (value.length > text.length) return;

    let currentStart = startTime;
    if (!startTime && value.length > 0) {
      currentStart = Date.now();
      setStartTime(currentStart);
    }

    // Detect error on latest char
    const lastIdx = value.length - 1;
    if (lastIdx >= 0 && value.length > typed.length) {
      const isCorrect = value[lastIdx] === text[lastIdx];
      if (soundEnabled) {
        try { createSound(getAudioCtx(), isCorrect ? 'correct' : 'error'); } catch {}
      }
      if (!isCorrect) {
        setErrorCount(c => c + 1);
        const wrongChar = text[lastIdx];
        setTrickyKeys(prev => ({ ...prev, [wrongChar]: (prev[wrongChar] || 0) + 1 }));
      }
    }

    setTyped(value);
    const { wpm: newWpm, accuracy: newAcc } = calculateStats(value, currentStart);
    setWpm(newWpm);
    setAccuracy(newAcc);

    const progress = Math.round((value.length / text.length) * 100);
    onProgress?.({ progress, wpm: newWpm, accuracy: newAcc });

    if (value.length === text.length) {
      const elapsed = Date.now() - currentStart;
      setFinished(true);
      if (intervalRef.current) clearInterval(intervalRef.current);
      onFinish?.({ wpm: newWpm, accuracy: newAcc, time: elapsed, errors: errorCount, trickyKeys });
    }
  }, [disabled, finished, started, startTime, text, typed, soundEnabled, errorCount, trickyKeys, calculateStats, onProgress, onFinish]);

  const renderText = () => {
    return text.split('').map((char, i) => {
      const isCurrent = i === typed.length;
      let colorClass = '';
      if (i < typed.length) {
        colorClass = typed[i] === char ? 'correct' : 'incorrect';
      } else if (isCurrent) {
        colorClass = 'current';
      } else {
        colorClass = 'pending';
      }
      return (
        <span key={i} ref={isCurrent ? cursorRef : null} className={`typing-char ${colorClass}`}>
          {char === ' ' ? '\u00A0' : char}
        </span>
      );
    });
  };

  const progress = text ? Math.round((typed.length / text.length) * 100) : 0;

  return (
    <div className="space-y-3">
      {/* Caps Lock Warning */}
      {capsLock && (
        <div className="flex items-center gap-2 px-4 py-2 bg-yellow-500/10 border border-yellow-500/30 rounded-xl animate-slide-up">
          <span className="text-yellow-400 text-lg">⚠️</span>
          <span className="text-yellow-300 text-sm font-mono font-semibold">CAPS LOCK IS ON — turn it off to type correctly</span>
        </div>
      )}

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        {[
          { label: 'WPM', value: wpm, color: 'text-brand-400' },
          { label: 'ACC', value: `${accuracy}%`, color: accuracy >= 95 ? 'text-neon-green' : accuracy >= 80 ? 'text-yellow-400' : 'text-red-400' },
          { label: 'PROG', value: `${progress}%`, color: 'text-white' },
          { label: 'ERRORS', value: errorCount, color: errorCount === 0 ? 'text-neon-green' : 'text-red-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="glass rounded-xl px-4 py-3 text-center border border-white/5">
            <div className={`text-xl font-bold font-mono ${color}`}>{value}</div>
            <div className="text-dark-400 text-xs mt-0.5 font-display uppercase tracking-wider">{label}</div>
          </div>
        ))}
      </div>

      {/* Mini progress bar */}
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${progress}%` }} />
      </div>

      {/* Text display */}
      <div
        ref={textBoxRef}
        className="glass rounded-xl p-6 cursor-text select-none overflow-y-auto border border-white/5"
        style={{ height: '150px', overflowX: 'hidden', scrollBehavior: 'smooth' }}
        onClick={() => inputRef.current?.focus()}
      >
        {text ? (
          <p style={{
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: '1.1rem',
            lineHeight: '2.1rem',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            overflowWrap: 'break-word',
            margin: 0,
          }}>
            {renderText()}
          </p>
        ) : (
          <span className="text-dark-400 font-mono">Loading text...</span>
        )}
      </div>

      {/* Hidden real input */}
      <input
        ref={inputRef}
        type="text"
        value={typed}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        disabled={disabled || finished || !started}
        className="opacity-0 absolute pointer-events-none"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        tabIndex={-1}
      />

      {/* Click-to-focus bar */}
      <div
        className={`glass rounded-xl px-5 py-3.5 flex items-center gap-3 cursor-text transition-all duration-200 ${
          !disabled && started && !finished ? 'border border-brand-500/40 ring-1 ring-brand-500/20' : 'border border-transparent'
        }`}
        onClick={() => inputRef.current?.focus()}
      >
        <span className="text-dark-400 text-sm">⌨️</span>
        {finished ? (
          <span className="text-neon-green font-mono text-sm font-semibold">✓ Finished! Great job!</span>
        ) : !started ? (
          <span className="text-dark-400 font-mono text-sm">Waiting for race to start...</span>
        ) : disabled ? (
          <span className="text-dark-400 font-mono text-sm">Typing disabled</span>
        ) : (
          <span className="text-dark-400 font-mono text-sm">
            Click here and start typing
            <span className="inline-block w-0.5 h-4 bg-brand-500 ml-1.5 animate-pulse align-middle" />
          </span>
        )}
      </div>

      {/* Tricky keys display */}
      {Object.keys(trickyKeys).length > 0 && (
        <div className="glass rounded-xl px-4 py-3 border border-white/5">
          <p className="text-xs text-dark-400 font-display uppercase tracking-wider mb-2">⚡ Tricky Keys</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(trickyKeys)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 8)
              .map(([key, count]) => (
                <span key={key} className="px-2 py-1 bg-red-500/10 border border-red-500/20 rounded-lg text-xs font-mono text-red-400">
                  {key === ' ' ? 'SPACE' : key} ×{count}
                </span>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TypingArea;
