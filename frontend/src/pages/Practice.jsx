import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api';
import TypingArea from '../components/TypingArea';

const DIFFICULTIES = ['easy', 'medium', 'hard'];
const LANGUAGES = ['english', 'coding', 'urdu'];

const Practice = () => {
  const [text, setText] = useState(null);
  const [difficulty, setDifficulty] = useState('medium');
  const [language, setLanguage] = useState('english');
  const [started, setStarted] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(0);
  const timerRef = useRef(null);

  const fetchText = useCallback(async () => {
    setLoading(true);
    setStarted(false);
    setResult(null);
    setTimer(0);
    if (timerRef.current) clearInterval(timerRef.current);
    try {
      const res = await api.get(`/practice-text?difficulty=${difficulty}&language=${language}`);
      setText(res.data.text);
    } catch {
      setText({ content: 'The quick brown fox jumps over the lazy dog. Practice your typing speed and accuracy with this classic sentence.', difficulty: 'easy', language: 'english' });
    } finally {
      setLoading(false);
    }
  }, [difficulty, language]);

  useEffect(() => {
    fetchText();
  }, [fetchText]);

  const handleStart = () => {
    setStarted(true);
    setResult(null);
    timerRef.current = setInterval(() => setTimer((t) => t + 1), 1000);
  };

  const handleFinish = ({ wpm, accuracy }) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setResult({ wpm, accuracy, time: timer });
    setStarted(false);
  };

  const handleReset = () => {
    setStarted(false);
    setResult(null);
    setTimer(0);
    if (timerRef.current) clearInterval(timerRef.current);
    fetchText();
  };

  const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 bg-grid">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="animate-slide-up">
          <h1 className="text-4xl font-bold font-display text-white">Practice Mode</h1>
          <p className="text-dark-300 mt-2">Improve your speed and accuracy solo</p>
        </div>

        {/* Controls */}
        <div className="glass rounded-2xl p-5 border border-white/5 animate-slide-up stagger-1">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-xs text-dark-300 mb-2 uppercase tracking-wider font-display">Difficulty</label>
              <div className="flex gap-2">
                {DIFFICULTIES.map((d) => (
                  <button
                    key={d}
                    disabled={started}
                    onClick={() => setDifficulty(d)}
                    className={`flex-1 py-2 text-xs font-mono rounded-lg capitalize transition-all disabled:cursor-not-allowed ${
                      difficulty === d ? 'bg-brand-500 text-white' : 'bg-dark-700 text-dark-300 hover:text-white'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1">
              <label className="block text-xs text-dark-300 mb-2 uppercase tracking-wider font-display">Language</label>
              <div className="flex gap-2">
                {LANGUAGES.map((l) => (
                  <button
                    key={l}
                    disabled={started}
                    onClick={() => setLanguage(l)}
                    className={`flex-1 py-2 text-xs font-mono rounded-lg capitalize transition-all disabled:cursor-not-allowed ${
                      language === l ? 'bg-brand-500 text-white' : 'bg-dark-700 text-dark-300 hover:text-white'
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Timer display */}
        {started && (
          <div className="flex items-center gap-4 animate-slide-up">
            <div className="glass rounded-xl px-4 py-2 border border-brand-500/20">
              <span className="text-brand-400 font-mono text-xl font-bold">⏱ {formatTime(timer)}</span>
            </div>
          </div>
        )}

        {/* Typing area */}
        <div className="glass rounded-2xl p-6 border border-white/5 animate-slide-up stagger-2">
          {loading ? (
            <div className="text-center py-8 text-brand-500 font-mono animate-pulse">Loading text...</div>
          ) : (
            <TypingArea
              key={text?.id}
              text={text?.content || ''}
              started={started}
              disabled={!started || !!result}
              onFinish={handleFinish}
            />
          )}
        </div>

        {/* Action buttons */}
        {!started && !result && (
          <div className="flex gap-4 animate-slide-up stagger-3">
            <button
              onClick={handleStart}
              disabled={loading || !text}
              className="flex-1 py-3.5 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-bold rounded-xl transition-colors font-display"
            >
              Start Typing →
            </button>
            <button
              onClick={fetchText}
              disabled={loading}
              className="px-5 py-3.5 bg-dark-700 hover:bg-dark-600 text-dark-200 hover:text-white font-semibold rounded-xl transition-colors font-display"
              title="New text"
            >
              ↻
            </button>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="glass rounded-2xl p-8 border border-neon-green/20 animate-slide-up">
            <div className="text-center mb-6">
              <div className="text-4xl mb-2">
                {result.wpm >= 80 ? '🔥' : result.wpm >= 50 ? '⚡' : '🎯'}
              </div>
              <h2 className="text-2xl font-bold font-display text-white">Practice Complete!</h2>
            </div>
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="text-center glass rounded-xl p-4">
                <p className="text-3xl font-bold font-mono text-brand-400">{result.wpm}</p>
                <p className="text-dark-400 text-xs mt-1 uppercase tracking-wider font-display">WPM</p>
              </div>
              <div className="text-center glass rounded-xl p-4">
                <p className="text-3xl font-bold font-mono text-neon-green">{result.accuracy}%</p>
                <p className="text-dark-400 text-xs mt-1 uppercase tracking-wider font-display">Accuracy</p>
              </div>
              <div className="text-center glass rounded-xl p-4">
                <p className="text-3xl font-bold font-mono text-white">{formatTime(result.time)}</p>
                <p className="text-dark-400 text-xs mt-1 uppercase tracking-wider font-display">Time</p>
              </div>
            </div>
            <button
              onClick={handleReset}
              className="w-full py-3.5 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl transition-colors font-display"
            >
              Practice Again →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Practice;
