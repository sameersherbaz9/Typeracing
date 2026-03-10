import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api';
import TypingArea from '../components/TypingArea';

const DIFFICULTIES = ['easy', 'medium', 'hard'];
const LANGUAGES = ['english', 'coding', 'urdu'];
const TIME_MODES = [
  { label: '15s', seconds: 15 },
  { label: '30s', seconds: 30 },
  { label: '60s', seconds: 60 },
  { label: '∞', seconds: null },
];

const RANK_TIERS = [
  { min: 130, label: 'Legendary', icon: '🔥', color: 'text-red-400' },
  { min: 110, label: 'Expert',    icon: '⚡', color: 'text-brand-400' },
  { min: 90,  label: 'Pro',       icon: '🚀', color: 'text-yellow-400' },
  { min: 70,  label: 'Advanced',  icon: '🦅', color: 'text-purple-400' },
  { min: 50,  label: 'Intermediate', icon: '🐆', color: 'text-blue-400' },
  { min: 30,  label: 'Novice',    icon: '🐇', color: 'text-green-400' },
  { min: 0,   label: 'Beginner',  icon: '🐢', color: 'text-gray-400' },
];
const getRank = (wpm) => RANK_TIERS.find(r => wpm >= r.min) || RANK_TIERS[RANK_TIERS.length - 1];

const Practice = () => {
  const [text, setText] = useState(null);
  const [difficulty, setDifficulty] = useState('medium');
  const [language, setLanguage] = useState('english');
  const [timeMode, setTimeMode] = useState(TIME_MODES[2]); // 60s default
  const [started, setStarted] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [wpmHistory, setWpmHistory] = useState([]); // [{t, wpm}] for graph
  const timerRef = useRef(null);
  const countdownRef = useRef(null);
  const startTimeRef = useRef(null);
  const [timeLeft, setTimeLeft] = useState(null);

  const fetchText = useCallback(async () => {
    setLoading(true);
    setStarted(false);
    setResult(null);
    setTimer(0);
    setTimeLeft(timeMode.seconds);
    setWpmHistory([]);
    if (timerRef.current) clearInterval(timerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    try {
      const res = await api.get(`/practice-text?difficulty=${difficulty}&language=${language}`);
      setText(res.data.text);
    } catch {
      setText({ content: 'The quick brown fox jumps over the lazy dog. Practice your typing speed and accuracy.', difficulty: 'easy', language: 'english' });
    } finally {
      setLoading(false);
    }
  }, [difficulty, language, timeMode]);

  useEffect(() => { fetchText(); }, [fetchText]);

  const handleStart = () => {
    setStarted(true);
    setResult(null);
    setWpmHistory([]);
    startTimeRef.current = Date.now();

    // Elapsed timer
    timerRef.current = setInterval(() => {
      setTimer(t => t + 1);
    }, 1000);

    // Countdown timer (if time mode)
    if (timeMode.seconds) {
      setTimeLeft(timeMode.seconds);
      countdownRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(countdownRef.current);
            clearInterval(timerRef.current);
            // Force finish — handled in TypingArea via onFinish, but also timeout:
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  };

  const handleProgress = ({ wpm }) => {
    const elapsed = (Date.now() - startTimeRef.current) / 1000;
    setWpmHistory(h => [...h.slice(-29), { t: Math.round(elapsed), wpm }]);
  };

  const handleFinish = ({ wpm, accuracy, time, errors, trickyKeys }) => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    setResult({ wpm, accuracy, time, errors: errors || 0, trickyKeys: trickyKeys || {} });
    setStarted(false);
  };

  // Auto-finish when time runs out
  useEffect(() => {
    if (timeLeft === 0 && started) {
      handleFinish({ wpm: 0, accuracy: 0, time: (timeMode.seconds || 0) * 1000, errors: 0, trickyKeys: {} });
    }
  }, [timeLeft, started]);

  const handleReset = () => {
    setStarted(false);
    setResult(null);
    setTimer(0);
    setWpmHistory([]);
    if (timerRef.current) clearInterval(timerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    fetchText();
  };

  const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  const rank = result ? getRank(result.wpm) : null;

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 bg-grid">
      <div className="max-w-3xl mx-auto space-y-5">

        {/* Header */}
        <div className="animate-slide-up flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold font-display text-white">Practice Mode</h1>
            <p className="text-dark-300 text-sm mt-1">Sharpen your speed and accuracy solo</p>
          </div>
          {/* Sound toggle */}
          <button
            onClick={() => setSoundEnabled(s => !s)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all text-sm font-display ${
              soundEnabled ? 'bg-brand-500/10 border-brand-500/30 text-brand-400' : 'bg-dark-700 border-white/5 text-dark-400'
            }`}
          >
            {soundEnabled ? '🔊' : '🔇'} Sound
          </button>
        </div>

        {/* Config row */}
        <div className="glass rounded-2xl p-4 border border-white/5 animate-slide-up stagger-1">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Difficulty */}
            <div>
              <label className="block text-xs text-dark-400 mb-2 uppercase tracking-wider font-display">Difficulty</label>
              <div className="flex gap-1.5">
                {DIFFICULTIES.map(d => (
                  <button key={d} disabled={started} onClick={() => setDifficulty(d)}
                    className={`flex-1 py-2 text-xs font-mono rounded-lg capitalize transition-all disabled:opacity-40 ${
                      difficulty === d ? 'bg-brand-500 text-white' : 'bg-dark-700 text-dark-300 hover:text-white'
                    }`}>
                    {d}
                  </button>
                ))}
              </div>
            </div>
            {/* Language */}
            <div>
              <label className="block text-xs text-dark-400 mb-2 uppercase tracking-wider font-display">Mode</label>
              <div className="flex gap-1.5">
                {LANGUAGES.map(l => (
                  <button key={l} disabled={started} onClick={() => setLanguage(l)}
                    className={`flex-1 py-2 text-xs font-mono rounded-lg capitalize transition-all disabled:opacity-40 ${
                      language === l ? 'bg-brand-500 text-white' : 'bg-dark-700 text-dark-300 hover:text-white'
                    }`}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
            {/* Time mode */}
            <div>
              <label className="block text-xs text-dark-400 mb-2 uppercase tracking-wider font-display">Time</label>
              <div className="flex gap-1.5">
                {TIME_MODES.map(m => (
                  <button key={m.label} disabled={started} onClick={() => setTimeMode(m)}
                    className={`flex-1 py-2 text-xs font-mono rounded-lg transition-all disabled:opacity-40 ${
                      timeMode.label === m.label ? 'bg-brand-500 text-white' : 'bg-dark-700 text-dark-300 hover:text-white'
                    }`}>
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Timer display */}
        {started && (
          <div className="flex items-center gap-4 animate-slide-up">
            <div className="glass rounded-xl px-5 py-2.5 border border-white/5 flex items-center gap-3">
              <span className="text-dark-400 text-sm font-mono">⏱</span>
              <span className="text-white font-mono text-xl font-bold">{formatTime(timer)}</span>
            </div>
            {timeMode.seconds && timeLeft !== null && (
              <div className={`glass rounded-xl px-5 py-2.5 border flex items-center gap-2 ${
                timeLeft <= 10 ? 'border-red-500/40 bg-red-500/5' : 'border-white/5'
              }`}>
                <span className="text-dark-400 text-sm font-mono">Left</span>
                <span className={`font-mono text-xl font-bold ${timeLeft <= 10 ? 'text-red-400 animate-pulse' : 'text-brand-400'}`}>
                  {timeLeft}s
                </span>
              </div>
            )}
          </div>
        )}

        {/* Typing area */}
        <div className="glass rounded-2xl p-6 border border-white/5 animate-slide-up stagger-2">
          {loading ? (
            <div className="text-center py-8 text-brand-500 font-mono animate-pulse">Loading text...</div>
          ) : (
            <TypingArea
              key={`${text?.id}-${started}`}
              text={text?.content || ''}
              started={started}
              disabled={!started || !!result}
              soundEnabled={soundEnabled}
              onProgress={handleProgress}
              onFinish={handleFinish}
            />
          )}
        </div>

        {/* Start / new text buttons */}
        {!started && !result && (
          <div className="flex gap-3 animate-slide-up stagger-3">
            <button onClick={handleStart} disabled={loading || !text}
              className="flex-1 py-3.5 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-bold rounded-xl transition-colors font-display text-lg">
              ▶ Start Typing
            </button>
            <button onClick={fetchText} disabled={loading}
              className="px-5 py-3.5 bg-dark-700 hover:bg-dark-600 text-dark-200 hover:text-white font-semibold rounded-xl transition-colors font-display text-xl"
              title="New text">
              ↻
            </button>
          </div>
        )}

        {/* RESULTS */}
        {result && (
          <div className="glass rounded-2xl border border-white/10 overflow-hidden animate-slide-up">
            {/* Result header */}
            <div className="bg-gradient-to-r from-brand-500/10 to-transparent p-6 border-b border-white/5 text-center">
              <div className="text-5xl mb-2">{rank?.icon}</div>
              <h2 className="text-2xl font-bold font-display text-white">Practice Complete!</h2>
              <p className={`text-lg font-bold mt-1 ${rank?.color}`}>{rank?.label} Typist</p>
            </div>

            {/* Main stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-0 divide-x divide-y divide-white/5">
              {[
                { label: 'WPM', value: Math.round(result.wpm), color: 'text-brand-400', icon: '⚡' },
                { label: 'Accuracy', value: `${Math.round(result.accuracy)}%`, color: result.accuracy >= 95 ? 'text-neon-green' : 'text-yellow-400', icon: '🎯' },
                { label: 'Errors', value: result.errors, color: result.errors === 0 ? 'text-neon-green' : 'text-red-400', icon: '❌' },
                { label: 'Time', value: formatTime(Math.round(result.time / 1000)), color: 'text-white', icon: '⏱' },
              ].map(({ label, value, color, icon }) => (
                <div key={label} className="p-5 text-center">
                  <div className="text-lg mb-1">{icon}</div>
                  <div className={`text-3xl font-bold font-mono ${color}`}>{value}</div>
                  <div className="text-dark-400 text-xs mt-1 uppercase tracking-wider font-display">{label}</div>
                </div>
              ))}
            </div>

            {/* WPM history mini chart */}
            {wpmHistory.length > 2 && (
              <div className="p-5 border-t border-white/5">
                <p className="text-xs text-dark-400 font-display uppercase tracking-wider mb-3">WPM Over Time</p>
                <div className="flex items-end gap-1 h-12">
                  {wpmHistory.map((pt, i) => {
                    const maxWpm = Math.max(...wpmHistory.map(p => p.wpm), 1);
                    const h = Math.max((pt.wpm / maxWpm) * 100, 4);
                    return (
                      <div key={i} className="flex-1 bg-brand-500/40 hover:bg-brand-500/70 rounded-t transition-all" style={{ height: `${h}%` }} title={`${pt.wpm} WPM`} />
                    );
                  })}
                </div>
              </div>
            )}

            {/* Tricky keys */}
            {Object.keys(result.trickyKeys).length > 0 && (
              <div className="p-5 border-t border-white/5">
                <p className="text-xs text-dark-400 font-display uppercase tracking-wider mb-3">⚡ Keys to Practice</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(result.trickyKeys).sort((a,b) => b[1]-a[1]).slice(0,8).map(([k, c]) => (
                    <span key={k} className="px-3 py-1.5 bg-red-500/10 border border-red-500/20 rounded-xl text-sm font-mono text-red-400">
                      {k === ' ' ? 'SPACE' : k} <span className="text-red-600">×{c}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="p-5 border-t border-white/5 flex gap-3">
              <button onClick={handleReset}
                className="flex-1 py-3 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl transition-colors font-display">
                ▶ Practice Again
              </button>
              <button onClick={() => { setResult(null); setStarted(false); setTimer(0); }}
                className="px-5 py-3 bg-dark-700 hover:bg-dark-600 text-white font-semibold rounded-xl transition-colors font-display">
                Same Text
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Practice;
