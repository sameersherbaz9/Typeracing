import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { getSocket, disconnectSocket } from '../socket/socket';
import TypingArea from '../components/TypingArea';
import PlayerProgress from '../components/PlayerProgress';
import CountdownOverlay from '../components/CountdownOverlay';
import RaceResults from '../components/RaceResults';

const DIFFICULTIES = ['easy', 'medium', 'hard'];
const LANGUAGES = ['english', 'coding', 'urdu'];

// Bot names for filling empty slots
const BOT_NAMES = ['SpeedBot', 'TypeMaster', 'KeyWizard', 'RaceAce'];
const BOT_WPMS   = [55, 70, 85, 95]; // avg WPM per bot

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

  const timerRef = useRef(null);
  const socketRef = useRef(null);
  const botIntervalsRef = useRef([]);
  const countdownRef = useRef(null);

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
    const socket = socketRef.current;
    if (socket && raceData) socket.emit('leaveRace', { raceId: raceData.race_id });
  }, [raceData]);

  useEffect(() => { return cleanup; }, [cleanup]);

  // Bot simulation — advances bot progress automatically
  const startBots = useCallback((textLength) => {
    const bots = BOT_NAMES.slice(0, 3).map((name, i) => ({
      userId: `bot_${i}`,
      username: name,
      avatar: ['🤖','💻','⚡'][i],
      progress: 0,
      wpm: BOT_WPMS[i],
      accuracy: 88 + i * 3,
      isBot: true,
      finished: false,
      position: null,
    }));

    setPlayers(prev => [...prev.filter(p => !p.isBot), ...bots]);

    let finishedCount = 0;
    const intervals = bots.map((bot, i) => {
      let charsDone = 0;
      const charsPerTick = (bot.wpm * 5) / 60 / 4; // update 4x/sec
      return setInterval(() => {
        charsDone = Math.min(charsDone + charsPerTick + (Math.random() - 0.4), textLength);
        const pct = Math.round((charsDone / textLength) * 100);

        setPlayers(prev => prev.map(p =>
          p.userId === bot.userId ? { ...p, progress: pct, wpm: bot.wpm + Math.round(Math.random() * 6 - 3) } : p
        ));

        if (charsDone >= textLength) {
          clearInterval(intervals[i]);
          finishedCount++;
          setPlayers(prev => prev.map(p =>
            p.userId === bot.userId ? { ...p, progress: 100, finished: true, position: finishedCount, wpm: bot.wpm } : p
          ));
        }
      }, 250);
    });

    botIntervalsRef.current = intervals;
    return bots;
  }, []);

  const setupSocket = useCallback((raceId, roomCode) => {
    const socket = getSocket();
    socketRef.current = socket;
    socket.emit('joinRace', { raceId, roomCode });

    socket.on('raceJoined', ({ players: ps }) => {
      setPlayers(ps.map(p => ({ ...p, progress: 0 })));
    });
    socket.on('playerJoined', ({ players: ps }) => setPlayers(ps.map(p => ({ ...p }))));
    socket.on('playerLeft', ({ players: ps }) => setPlayers(ps));
    socket.on('countdown', ({ seconds }) => { setPhase('countdown'); setCountdown(seconds); });
    socket.on('raceStarted', () => {
      setCountdown(0);
      setTimeout(() => {
        setPhase('racing');
        setCountdown(null);
        timerRef.current = setInterval(() => setTimer(t => t + 1), 1000);
      }, 800);
    });
    socket.on('progressUpdate', ({ userId, progress, wpm, accuracy }) => {
      setPlayers(prev => prev.map(p => p.userId === userId ? { ...p, progress, wpm, accuracy } : p));
    });
    socket.on('playerFinishedRace', ({ userId, position, wpm, accuracy }) => {
      setPlayers(prev => prev.map(p => p.userId === userId ? { ...p, progress: 100, position, wpm, accuracy, finished: true } : p));
    });
    socket.on('raceFinished', ({ results: r }) => {
      if (timerRef.current) clearInterval(timerRef.current);
      botIntervalsRef.current.forEach(clearInterval);
      setResults(r);
      setPhase('finished');
    });
    socket.on('error', msg => setError(msg));
  }, []);

  // Main: click "Start Race" — create race, add bots, countdown, go
  const handleStartRace = async () => {
    setError('');
    setLoading(true);
    setPhase('matchmaking');

    try {
      const res = await api.post('/race/create', { difficulty, language, isPrivate: false });
      const { race } = res.data;
      setRaceData(race);

      // Add the human player
      const humanPlayer = { userId: user.id, username: user.username, avatar: user.avatar || '🏎️', progress: 0, wpm: 0, accuracy: 100 };
      setPlayers([humanPlayer]);

      // Short matchmaking animation (1.5s) then start
      await new Promise(r => setTimeout(r, 1500));

      // Add 3 bots
      const textLength = race.text?.content?.length || race.content?.length || 200;
      const bots = startBots(textLength);
      setPlayers([humanPlayer, ...bots]);
      setLoading(false);

      // 3-2-1 countdown
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
    const socket = socketRef.current;
    if (socket && raceData) socket.emit('playerProgress', { raceId: raceData.race_id, progress, wpm, accuracy });
    setPlayers(prev => prev.map(p => p.userId === user.id ? { ...p, progress, wpm, accuracy } : p));
  };

  const handleFinish = ({ wpm, accuracy, time, errors, trickyKeys }) => {
    setMyResult({ wpm, accuracy, time, errors, trickyKeys, userId: user.id });
    const socket = socketRef.current;
    if (socket && raceData) socket.emit('playerFinished', { raceId: raceData.race_id, wpm, accuracy, finishTime: time });

    // Build results including bots (finished + unfinished)
    setPlayers(prev => {
      const allPlayers = prev.map(p => p.userId === user.id ? { ...p, progress: 100, finished: true } : p);
      const sorted = [...allPlayers].sort((a, b) => {
        if (a.finished && !b.finished) return -1;
        if (!a.finished && b.finished) return 1;
        return (b.wpm || 0) - (a.wpm || 0);
      }).map((p, i) => ({ ...p, position: i + 1 }));
      // Trigger finished after a moment if no socket
      setTimeout(() => {
        if (!socketRef.current) {
          setResults(sorted);
          setPhase('finished');
        }
      }, 2000);
      return sorted;
    });

    botIntervalsRef.current.forEach(clearInterval);
    if (timerRef.current) clearInterval(timerRef.current);
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
    socketRef.current = null;
  };

  const formatTime = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  // ── LOBBY ─────────────────────────────────────────────────
  if (phase === 'lobby') {
    return (
      <div className="min-h-screen pt-20 pb-12 px-4 bg-grid">
        <div className="max-w-lg mx-auto space-y-5">

          <div className="animate-slide-up text-center">
            <h1 className="text-3xl sm:text-4xl font-bold font-display text-white">Multiplayer Race</h1>
            <p className="text-dark-300 text-sm mt-2">Race against 3 opponents — bots fill empty slots instantly</p>
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
              <p className="text-xs text-dark-400 uppercase tracking-wider font-display mb-3">Your opponents</p>
              <div className="space-y-2">
                {BOT_NAMES.slice(0, 3).map((name, i) => (
                  <div key={name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{['🤖','💻','⚡'][i]}</span>
                      <span className="text-sm text-white font-display">{name}</span>
                      <span className="text-xs text-dark-500 font-mono">BOT</span>
                    </div>
                    <span className="text-xs font-mono text-dark-400">~{BOT_WPMS[i]} WPM</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Big start button */}
          <button onClick={handleStartRace} disabled={loading}
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
            {BOT_NAMES.slice(0, 3).map((name, i) => (
              <div key={name} className="glass rounded-xl px-4 py-2 border border-white/5 text-center animate-pulse" style={{ animationDelay: `${i * 0.2}s` }}>
                <div className="text-xl mb-1">{['🤖','💻','⚡'][i]}</div>
                <div className="text-xs text-white font-display">{name}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── RACING / COUNTDOWN ─────────────────────────────────────
  return (
    <div className="min-h-screen pt-20 pb-12 px-4 bg-grid">
      <div className="max-w-4xl mx-auto space-y-4">

        {/* Header */}
        <div className="flex items-center justify-between animate-slide-up">
          <div className="flex items-center gap-3 min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold font-display text-white truncate">
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

        {/* Race track */}
        <div className="animate-slide-up stagger-1">
          <PlayerProgress players={players} currentUserId={user.id} />
        </div>

        {/* Typing area */}
        <div className="relative animate-slide-up stagger-2">
          <div className="glass rounded-2xl p-4 sm:p-6 border border-white/5">
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
