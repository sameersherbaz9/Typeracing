import { useRef, useEffect } from 'react';
import { useTypingEngine } from '../hooks/useTypingEngine';

const TypingArea = ({ text, onProgress, onFinish, disabled = false, started = false, soundEnabled = true }) => {
  const {
    typed, wpm, accuracy, finished, capsLock, errorCount, trickyKeys, progress,
    inputRef, handleInput, handleKeyDown,
  } = useTypingEngine({ text, onProgress, onFinish, disabled, started, soundEnabled });

  const cursorRef = useRef(null);
  const textBoxRef = useRef(null);

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

  return (
    <div className="space-y-2 sm:space-y-3 overflow-y-auto h-full">
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
          <div key={label} className="glass rounded-xl px-3 py-2 sm:px-4 sm:py-3 text-center border border-white/5">
            <div className={`text-lg sm:text-xl font-bold font-mono ${color}`}>{value}</div>
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
        className="glass rounded-xl p-4 sm:p-6 cursor-text select-none overflow-y-auto border border-white/5"
        style={{ height: '140px', overflowX: 'hidden', scrollBehavior: 'smooth' }}
        onClick={() => inputRef.current?.focus()}
      >
        {text ? (
          <p style={{
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: '1.05rem',
            lineHeight: '2rem',
            whiteSpace: 'pre-wrap',
            wordBreak: 'normal',
            overflowWrap: 'normal',
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
        className={`glass rounded-xl px-4 sm:px-5 py-2.5 sm:py-3.5 flex items-center gap-3 cursor-text transition-all duration-200 ${
          !disabled && started && !finished ? 'border border-brand-500/40 ring-1 ring-brand-500/20' : 'border border-transparent'
        }`}
        onClick={() => inputRef.current?.focus()}
      >
        <span className="text-dark-400 text-sm">⌨️</span>
        {finished ? (
          <span className="text-neon-green font-mono text-sm font-semibold">✓ Finished! Great job!</span>
        ) : !started ? (
          <span className="text-dark-400 font-mono text-sm">Get ready — typing will unlock automatically...</span>
        ) : disabled ? (
          <span className="text-dark-400 font-mono text-sm">Typing disabled</span>
        ) : (
          <span className="text-dark-400 font-mono text-sm">
            Start typing!
            <span className="inline-block w-0.5 h-4 bg-brand-500 ml-1.5 animate-pulse align-middle" />
          </span>
        )}
      </div>

      {/* Tricky keys display — only shown after finishing to save space while racing */}
      {finished && Object.keys(trickyKeys).length > 0 && (
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
