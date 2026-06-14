import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { disconnectSocket } from '../socket/socket';
import TypingArea from '../components/TypingArea';
import PlayerProgress from '../components/PlayerProgress';
import CountdownOverlay from '../components/CountdownOverlay';
import RaceResults from '../components/RaceResults';

const DIFFICULTIES = ['easy', 'medium', 'hard'];
const LANGUAGES = ['english', 'coding', 'urdu'];

// Bot identities for the 3 opponent slots
const BOT_PROFILES = [
  { name: 'SpeedBot',  avatar: '🤖' },
  { name: 'TypeMaster', avatar: '💻' },
  { name: 'KeyWizard',  avatar: '⚡' },
];

// Fallback WPM baseline used when the user has no race history yet
const DEFAULT_WPM = 45;

const Race = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [phase, setPhase] = useState('lobby'); // lobby | matchmaking | countdown | racing | finished
  const [raceData, setRaceData] = useState(null);
  const [players, setPlayers] = useState([]);
  const [results, setResults] = useState([]);
  const [myResult, setMyResult] = useState(null);
  const [countdown, setCountdown] = useState(null);
  const [difficulty, setDifficulty] = useState('medium');
  const [language, setLanguage] = useState('english');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [matchmakingDots, setMatchmakingDots] = useState('');
  const [wpmStats, setWpmStats] = useState(null); // { avgWpm, bestWpm, hasHistory }

  const timerRef = useRef(null);
  const botIntervalsRef = useRef([]);
  const countdownRef = useRef(null);

  // Fetch the user's WPM history once on mount so bot speeds can be calibrated
  useEffect(() => {
    api.get('/wpm-stats')
      .then(res => setWpmStats(res.data))
      .catch(() => setWpmStats({ avgWpm: 0, bestWpm: 0, hasHistory: false }));
  }, []);

  // Animate matchmaking dots
  useEffect(() => {
    if (phase !== 'matchmaking') return;
    const t = setInterval(() => setMatchmakingDots(d => d.length >= 3 ? '' : d + '.'), 500);
    return () => clearInterval(t);
  }, [phase]);

  const cleanup = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    botIntervalsRef.current.forEach(clearInterval);
    botIntervalsRef.current = [];
  }, []);

  useEffect(() => { return cleanup; }, [cleanup]);

  // Compute the 3 bot speeds based on the user's skill level:
  //  - Bot 1: slightly below the user's average WPM (a slower rival)
  //  - Bot 2: roughly equal to the user's average WPM (an even match)
  //  - Bot 3: roughly equal to the user's personal best WPM (the one to beat)
  const computeBotWpms = useCallback(() => {
    const avg = wpmStats?.hasHistory ? wpmStats.avgWpm : DEFAULT_WPM;
    const best = wpmStats?.hasHistory ? Math.max(wpmStats.bestWpm, avg + 5) : DEFAULT_WPM + 15;

    const slower = Math.max(15, Math.round(avg * 0.85));
    const even = Math.max(20, Math.round(avg));
    const ace = Math.max(even + 5, Math.round(best));

    return [slower, even, ace];
  }, [wpmStats]);

  // Build the bot player objects (progress = 0, not yet moving)
  const buildBots = useCallback(() => {
    const wpms = computeBotWpms();
    return BOT_PROFILES.map((bot, i) => ({
      userId: `bot_${i}`,
      username: bot.name,
      avatar: bot.avatar,
      progress: 0,
      wpm: wpms[i],
      targetWpm: wpms[i],
      accuracy: 90 + i * 3,
      isBot: true,
      finished: false,
      position: null,
    }));
  }, [computeBotWpms]);

  // Start bot movement — only call this once the race actually begins (phase === 'racing')
  const startBots = useCallback((textLength) => {
    let finishedCount = 0;

    const intervals = BOT_PROFILES.map((bot, i) => {
      let charsDone = 0;
      return setInterval(() => {
        setPlayers(prev => {
          const botPlayer = prev.find(p => p.userId === `bot_${i}`);
          if (!botPlayer || botPlayer.finished) return prev;

          const charsPerTick = (botPlayer.targetWpm * 5) / 60 / 4; // updates 4x/sec
          charsDone = Math.min(charsDone + charsPerTick + (Math.random() - 0.4) * charsPerTick * 0.3, textLength);
          const pct = Math.min(100, Math.round((charsDone / textLength) * 100));
          const wpmJitter = botPlayer.targetWpm + Math.round(Math.random() * 6 - 3);

          let updated = prev.map(p =>
            p.userId === `bot_${i}` ? { ...p, progress: pct, wpm: Math.max(1, wpmJitter) } : p
          );

          if (charsDone >= textLength) {
            clearInterval(intervals[i]);
            finishedCount++;
            updated = updated.map(p =>
              p.userId === `bot_${i}` ? { ...p, progress: 100, finished: true, position: finishedCount, wpm: botPlayer.targetWpm } : p
            );
          }
          return updated;
        });
      }, 250);
    });

    botIntervalsRef.current = intervals;
  }, []);

  // Main: click "Start Race" — create race, prepare bots (stationary), countdown, then race
  const handleStartRace = async () => {
    setError('');
    setLoading(true);
    setPhase('matchmaking');

    try {
      const res = await api.post('/race/create', { difficulty, language, isPrivate: false });
      const { race } = res.data;
      setRaceData(race);

      // Add the human player + stationary bots
      const humanPlayer = { userId: user.id, username: user.username, avatar: user.avatar || '🏎️', progress: 0, wpm: 0, accuracy: 100 };
      const bots = buildBots();
      setPlayers([humanPlayer, ...bots]);

      // Short matchmaking animation (1.5s)
      await new Promise(r => setTimeout(r, 1500));
      setLoading(false);

      // 3-2-1 countdown — bots remain at 0% during this phase
      setPhase('countdown');
      setCountdown(3);
      let count = 3;
      countdownRef.current = setInterval(() => {
        count--;
        if (count > 0) {
          setCountdown(count);
        } else {
          clearInterval(countdownRef.current);
          setCountdown(0);
          setTimeout(() => {
            setPhase('racing');
            setCountdown(null);
            timerRef.current = setInterval(() => setTimer(t => t + 1), 1000);

            // Bots start moving in sync with the human player
            const textLength = race.text?.content?.length || race.content?.length || 200;
            startBots(textLength);
          }, 800);
        }
      }, 1000);

    } catch (err) {
      setError(err.response?.data?.error || 'Failed to start race. Try again.');
      setPhase('lobby');
      setLoading(false);
    }
  };

  const handleProgress = ({ progress, wpm, accuracy }) => {
    setPlayers(prev => prev.map(p => p.userId === user.id ? { ...p, progress, wpm, accuracy } : p));
  };

  const handleFinish = ({ wpm, accuracy, time, errors, trickyKeys }) => {
    botIntervalsRef.current.forEach(clearInterval);
    if (timerRef.current) clearInterval(timerRef.current);

    // Build results including bots (finished + unfinished), determine my position
    setPlayers(prev => {
      const allPlayers = prev.map(p => p.userId === user.id ? { ...p, progress: 100, finished: true, wpm, accuracy } : p);
      const sorted = [...allPlayers].sort((a, b) => {
        if (a.finished && !b.finished) return -1;
        if (!a.finished && b.finished) return 1;
        return (b.wpm || 0) - (a.wpm || 0);
      }).map((p, i) => ({ ...p, position: i + 1 }));

      const myPosition = sorted.find(p => p.userId === user.id)?.position || 1;
      setMyResult({ wpm, accuracy, time, errors, trickyKeys, userId: user.id, position: myPosition });

      // Persist result to DB (RaceParticipants + Leaderboard) via REST API
      if (raceData) {
        api.post('/race/finish', {
          race_id: raceData.race_id,
          wpm: Math.round(wpm),
          accuracy: Math.round(accuracy),
          finish_time: time,
          position: myPosition,
        }).catch(err => console.error('Failed to save race result:', err));
      }

      // Show results modal shortly after
      setTimeout(() => {
        setResults(sorted);
        setPhase('finished');
      }, 1500);

      return sorted;
    });
  };

  const handleLeave = () => {
    cleanup();
    disconnectSocket();
    setPhase('lobby');
    setRaceData(null);
    setPlayers([]);
    setResults([]);
    setMyResult(null);
    setTimer(0);
    setCountdown(null);
  };

  const formatTime = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  // ── LOBBY ─────────────────────────────────────────────────
  if (phase === 'lobby') {
    const previewWpms = computeBotWpms();
    return (
      <div className="min-h-screen pt-20 pb-12 px-4 bg-grid">
        <div className="max-w-lg mx-auto space-y-5">

          <div className="animate-slide-up text-center">
            <h1 className="text-3xl sm:text-4xl font-bold font-display text-white">Multiplayer Race</h1>
            <p className="text-dark-300 text-sm mt-2">Race against 3 opponents matched to your skill level</p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm animate-slide-up">
              {error}
            </div>
          )}

          {/* Config card */}
          <div className="glass rounded-2xl p-5 border border-white/5 animate-slide-up stagger-1 space-y-5">

            {/* Difficulty */}
            <div>
              <label className="block text-xs text-dark-400 mb-2 uppercase tracking-wider font-display">Difficulty</label>
              <div className="flex gap-2">
                {DIFFICULTIES.map(d => (
                  <button key={d} onClick={() => setDifficulty(d)}
                    className={`flex-1 py-2.5 text-sm font-mono rounded-xl capitalize transition-all ${
                      difficulty === d ? 'bg-brand-500 text-white shadow-lg' : 'bg-dark-700 text-dark-300 hover:text-white hover:bg-dark-600'
                    }`}>
                    {d === 'easy' ? '🟢' : d === 'medium' ? '🟡' : '🔴'} {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Language */}
            <div>
              <label className="block text-xs text-dark-400 mb-2 uppercase tracking-wider font-display">Text Mode</label>
              <div className="flex gap-2">
                {LANGUAGES.map(l => (
                  <button key={l} onClick={() => setLanguage(l)}
                    className={`flex-1 py-2.5 text-sm font-mono rounded-xl capitalize transition-all ${
                      language === l ? 'bg-brand-500 text-white shadow-lg' : 'bg-dark-700 text-dark-300 hover:text-white hover:bg-dark-600'
                    }`}>
                    {l === 'english' ? '🇬🇧' : l === 'coding' ? '💻' : '🌙'} {l}
                  </button>
                ))}
              </div>
            </div>

            {/* Opponents preview */}
            <div className="bg-dark-700/40 rounded-xl p-4 border border-white/5">
              <p className="text-xs text-dark-400 uppercase tracking-wider font-display mb-3">
                Your opponents {wpmStats?.hasHistory ? '· calibrated to you' : ''}
              </p>
              <div className="space-y-2">
                {BOT_PROFILES.map((bot, i) => (
                  <div key={bot.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{bot.avatar}</span>
                      <span className="text-sm text-white font-display">{bot.name}</span>
                      <span className="text-xs text-dark-500 font-mono">BOT</span>
                    </div>
                    <span className="text-xs font-mono text-dark-400">
                      ~{previewWpms[i]} WPM
                      <span className="text-dark-600 ml-1">
                        {i === 0 ? '(slower)' : i === 1 ? '(your avg)' : '(your best)'}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
              {!wpmStats?.hasHistory && (
                <p className="text-xs text-dark-500 font-mono mt-3">
                  Complete a race to calibrate opponents to your speed!
                </p>
              )}
            </div>
          </div>

          {/* Big start button */}
          <button onClick={handleStartRace} disabled={loading || !wpmStats}
            className="w-full py-4 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-bold rounded-2xl transition-all duration-200 font-display text-xl shadow-lg hover:shadow-brand-500/30 animate-slide-up stagger-2">
            🏁 Start Race Now
          </button>
        </div>
      </div>
    );
  }

  // ── MATCHMAKING ────────────────────────────────────────────
  if (phase === 'matchmaking') {
    return (
      <div className="min-h-screen pt-20 pb-12 px-4 bg-grid flex items-center justify-center">
        <div className="text-center space-y-6 animate-slide-up">
          <div className="text-6xl animate-pulse">🏎️</div>
          <h2 className="text-2xl font-bold font-display text-white">Finding opponents{matchmakingDots}</h2>
          <p className="text-dark-400 font-mono text-sm">Filling race with 3 opponents</p>
          <div className="flex justify-center gap-3">
            {BOT_PROFILES.map((bot, i) => (
              <div key={bot.name} className="glass rounded-xl px-4 py-2 border border-white/5 text-center animate-pulse" style={{ animationDelay: `${i * 0.2}s` }}>
                <div className="text-xl mb-1">{bot.avatar}</div>
                <div className="text-xs text-white font-display">{bot.name}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── RACING / COUNTDOWN ─────────────────────────────────────
  // Sticky split layout: race track pinned to top, typing area fills remaining
  // viewport so both are visible at once without scrolling.
  return (
    <div className="min-h-screen bg-grid flex flex-col" style={{ paddingTop: '64px' }}>

      {/* Sticky top section: header + race track */}
      <div className="sticky top-16 z-20 px-4 pt-3 pb-2 backdrop-blur-md"
        style={{ background: 'linear-gradient(180deg, rgba(10,11,16,0.95) 0%, rgba(10,11,16,0.85) 80%, transparent 100%)' }}>
        <div className="max-w-4xl mx-auto space-y-2.5">

          {/* Header */}
          <div className="flex items-center justify-between animate-slide-up">
            <div className="flex items-center gap-3 min-w-0">
              <h1 className="text-lg sm:text-2xl font-bold font-display text-white truncate">
                {phase === 'countdown' ? '🚦 Get Ready!' : '🏎️ Race Live'}
              </h1>
              {phase === 'racing' && (
                <span className="flex items-center gap-1.5 text-xs font-mono text-red-400 bg-red-500/10 px-2 py-1 rounded-full border border-red-500/20 shrink-0">
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" /> LIVE
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {phase === 'racing' && (
                <span className="text-brand-400 font-mono text-sm font-bold">⏱ {formatTime(timer)}</span>
              )}
              <button onClick={() => setSoundEnabled(s => !s)}
                className={`p-2 rounded-lg text-base transition-colors ${soundEnabled ? 'text-brand-400' : 'text-dark-500'}`}>
                {soundEnabled ? '🔊' : '🔇'}
              </button>
              <button onClick={handleLeave}
                className="px-3 py-1.5 text-sm text-dark-300 hover:text-white bg-dark-700 hover:bg-dark-600 rounded-xl transition-colors font-display">
                Leave
              </button>
            </div>
          </div>

          {error && <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">{error}</div>}

          {/* Race track — compact so it always fits with the typing area */}
          <div className="animate-slide-up stagger-1">
            <PlayerProgress players={players} currentUserId={user.id} compact />
          </div>
        </div>
      </div>

      {/* Typing area — fills remaining space, always visible */}
      <div className="flex-1 px-4 pb-6 pt-2">
        <div className="max-w-4xl mx-auto h-full flex flex-col">
          <div className="relative animate-slide-up stagger-2 flex-1 flex flex-col">
            <div className="glass rounded-2xl p-4 sm:p-6 border border-white/5 flex-1 flex flex-col justify-center"
              style={{
                boxShadow: phase === 'racing' ? '0 0 0 1px rgba(255,61,36,0.15), 0 8px 32px rgba(255,61,36,0.08)' : 'none',
              }}>
              <TypingArea
                text={raceData?.text?.content || raceData?.content || ''}
                started={phase === 'racing'}
                disabled={phase !== 'racing'}
                soundEnabled={soundEnabled}
                onProgress={handleProgress}
                onFinish={handleFinish}
              />
            </div>
            {(phase === 'countdown') && countdown !== null && (
              <CountdownOverlay seconds={countdown} />
            )}
          </div>
        </div>
      </div>

      {/* Results modal */}
      {phase === 'finished' && results.length > 0 && (
        <RaceResults
          results={results}
          myResult={myResult}
          onPlayAgain={handleLeave}
          onLeave={() => navigate('/dashboard')}
        />
      )}
    </div>
  );
};

export default Race;
