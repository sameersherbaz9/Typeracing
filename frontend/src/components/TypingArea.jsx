import { useState, useEffect, useRef, useCallback } from 'react';

const TypingArea = ({ text, onProgress, onFinish, disabled = false, started = false }) => {
  const [typed, setTyped] = useState('');
  const [startTime, setStartTime] = useState(null);
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [finished, setFinished] = useState(false);
  const inputRef = useRef(null);
  const intervalRef = useRef(null);
  const cursorRef = useRef(null);
  const textBoxRef = useRef(null);

  useEffect(() => {
    setTyped('');
    setStartTime(null);
    setWpm(0);
    setAccuracy(100);
    setFinished(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, [text]);

  useEffect(() => {
    if (started && !disabled && inputRef.current) {
      inputRef.current.focus();
    }
  }, [started, disabled]);

  // Auto-scroll the text box to keep the cursor visible
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

  const handleInput = useCallback((e) => {
    if (disabled || finished || !started) return;

    const value = e.target.value;
    if (value.length > text.length) return;

    let currentStart = startTime;
    if (!startTime && value.length > 0) {
      currentStart = Date.now();
      setStartTime(currentStart);
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
      onFinish?.({ wpm: newWpm, accuracy: newAcc, time: elapsed });
    }
  }, [disabled, finished, started, startTime, text, calculateStats, onProgress, onFinish]);

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
        <span
          key={i}
          ref={isCurrent ? cursorRef : null}
          className={`typing-char ${colorClass}`}
        >
          {char === ' ' ? '\u00A0' : char}
        </span>
      );
    });
  };

  return (
    <div className="space-y-4">
      {/* Stats bar */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <span className="text-dark-300 text-sm font-mono">WPM</span>
          <span className="text-2xl font-bold font-mono text-brand-400">{wpm}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-dark-300 text-sm font-mono">ACC</span>
          <span className={`text-2xl font-bold font-mono ${accuracy >= 95 ? 'text-neon-green' : accuracy >= 80 ? 'text-neon-yellow' : 'text-red-400'}`}>
            {accuracy}%
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-dark-300 text-sm font-mono">PROG</span>
          <span className="text-2xl font-bold font-mono text-white">
            {text ? Math.round((typed.length / text.length) * 100) : 0}%
          </span>
        </div>
      </div>

      {/* Text display — fixed height with scroll, proper word wrap */}
      <div
        ref={textBoxRef}
        className="glass rounded-xl p-6 cursor-text select-none overflow-y-auto"
        style={{
          height: '140px',
          overflowX: 'hidden',
          scrollBehavior: 'smooth',
        }}
        onClick={() => inputRef.current?.focus()}
      >
        {text ? (
          <p
            style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: '1.15rem',
              lineHeight: '2rem',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              overflowWrap: 'break-word',
              margin: 0,
            }}
          >
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
        disabled={disabled || finished || !started}
        className="opacity-0 absolute pointer-events-none"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        tabIndex={-1}
      />

      {/* Visible status bar */}
      <div
        className={`glass rounded-xl px-5 py-4 flex items-center gap-3 cursor-text transition-all duration-200 ${
          !disabled && started && !finished ? 'border border-brand-500/30 ring-1 ring-brand-500/20' : 'border border-transparent'
        }`}
        onClick={() => inputRef.current?.focus()}
      >
        <svg className="w-4 h-4 text-dark-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
        {finished ? (
          <span className="text-neon-green font-mono text-sm">✓ Race complete!</span>
        ) : !started ? (
          <span className="text-dark-400 font-mono text-sm">Waiting for race to start...</span>
        ) : disabled ? (
          <span className="text-dark-400 font-mono text-sm">Typing disabled</span>
        ) : (
          <span className="text-dark-400 font-mono text-sm">
            Click here and start typing
            <span className="inline-block w-0.5 h-4 bg-brand-500 ml-1 animate-pulse align-middle" />
          </span>
        )}
      </div>
    </div>
  );
};

export default TypingArea;
