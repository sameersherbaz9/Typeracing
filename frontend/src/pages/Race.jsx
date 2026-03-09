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

const Race = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [phase, setPhase] = useState('lobby'); // lobby | waiting | countdown | racing | finished
  const [raceData, setRaceData] = useState(null);
  const [players, setPlayers] = useState([]);
  const [results, setResults] = useState([]);
  const [countdown, setCountdown] = useState(null);
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [language, setLanguage] = useState('english');
  const [isPrivate, setIsPrivate] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(0);
  const timerRef = useRef(null);
  const socketRef = useRef(null);

  const cleanup = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    const socket = socketRef.current;
    if (socket && raceData) {
      socket.emit('leaveRace', { raceId: raceData.race_id });
    }
  }, [raceData]);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  const setupSocket = useCallback((raceId, roomCode) => {
    const socket = getSocket();
    socketRef.current = socket;

    socket.emit('joinRace', { raceId, roomCode });

    socket.on('raceJoined', ({ text, players: ps, status }) => {
      setPlayers(ps.map((p) => ({ ...p, progress: 0 })));
      if (status === 'waiting') setPhase('waiting');
    });

    socket.on('playerJoined', ({ players: ps }) => {
      setPlayers(ps.map((p) => ({ ...p })));
    });

    socket.on('playerLeft', ({ players: ps }) => {
      setPlayers(ps);
    });

    socket.on('countdown', ({ seconds }) => {
      setPhase('countdown');
      setCountdown(seconds);
    });

    socket.on('raceStarted', () => {
      setCountdown(0);
      setTimeout(() => {
        setPhase('racing');
        setCountdown(null);
        timerRef.current = setInterval(() => setTimer((t) => t + 1), 1000);
      }, 800);
    });

    socket.on('progressUpdate', ({ userId, progress, wpm, accuracy }) => {
      setPlayers((prev) =>
        prev.map((p) => (p.userId === userId ? { ...p, progress, wpm, accuracy } : p))
      );
    });

    socket.on('playerFinishedRace', ({ userId, position, wpm, accuracy }) => {
      setPlayers((prev) =>
        prev.map((p) => (p.userId === userId ? { ...p, progress: 100, position, wpm, accuracy, finished: true } : p))
      );
    });

    socket.on('raceFinished', ({ results: r }) => {
      if (timerRef.current) clearInterval(timerRef.current);
      setResults(r);
      setPhase('finished');
    });

    socket.on('error', (msg) => setError(msg));
  }, []);

  const handleCreateRace = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/race/create', { difficulty, language, isPrivate });
      const { race } = res.data;
      setRaceData(race);
      setPhase('waiting');
      setupSocket(race.race_id, race.room_code);
      setPlayers([{ userId: user.id, username: user.username, avatar: user.avatar, progress: 0 }]);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create race');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRace = async () => {
    if (!roomCodeInput.trim()) return setError('Enter a room code');
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/race/join', { room_code: roomCodeInput.trim().toUpperCase() });
      const { race } = res.data;
      setRaceData(race);
      setPhase('waiting');
      setupSocket(race.race_id, race.room_code);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to join race');
    } finally {
      setLoading(false);
    }
  };

  const handleStartRace = () => {
    const socket = socketRef.current;
    if (socket && raceData) {
      socket.emit('startRace', { raceId: raceData.race_id });
    }
  };

  const handleProgress = ({ progress, wpm, accuracy }) => {
    const socket = socketRef.current;
    if (socket && raceData) {
      socket.emit('playerProgress', { raceId: raceData.race_id, progress, wpm, accuracy });
    }
    setPlayers((prev) =>
      prev.map((p) => (p.userId === user.id ? { ...p, progress, wpm, accuracy } : p))
    );
  };

  const handleFinish = ({ wpm, accuracy, time }) => {
    const socket = socketRef.current;
    if (socket && raceData) {
      socket.emit('playerFinished', { raceId: raceData.race_id, wpm, accuracy, finishTime: time });
    }
  };

  const handleLeave = () => {
    cleanup();
    disconnectSocket();
    setPhase('lobby');
    setRaceData(null);
    setPlayers([]);
    setResults([]);
    setTimer(0);
    setCountdown(null);
    socketRef.current = null;
  };

  const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  // ── LOBBY ──────────────────────────────────────────
  if (phase === 'lobby') {
    return (
      <div className="min-h-screen pt-24 pb-16 px-4 bg-grid">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="animate-slide-up">
            <h1 className="text-4xl font-bold font-display text-white">Multiplayer Race</h1>
            <p className="text-dark-300 mt-2">Create a room or join an existing one</p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm animate-slide-up">
              {error}
            </div>
          )}

          {/* Create Race */}
          <div className="glass rounded-2xl p-6 border border-white/5 animate-slide-up stagger-1 space-y-5">
            <h2 className="font-semibold font-display text-white text-lg">Create New Race</h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-dark-300 mb-2 uppercase tracking-wider font-display">Difficulty</label>
                <div className="flex gap-2">
                  {DIFFICULTIES.map((d) => (
                    <button
                      key={d}
                      onClick={() => setDifficulty(d)}
                      className={`flex-1 py-2 text-xs font-mono rounded-lg capitalize transition-all ${
                        difficulty === d ? 'bg-brand-500 text-white' : 'bg-dark-700 text-dark-300 hover:text-white'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs text-dark-300 mb-2 uppercase tracking-wider font-display">Language</label>
                <div className="flex gap-2">
                  {LANGUAGES.map((l) => (
                    <button
                      key={l}
                      onClick={() => setLanguage(l)}
                      className={`flex-1 py-2 text-xs font-mono rounded-lg capitalize transition-all ${
                        language === l ? 'bg-brand-500 text-white' : 'bg-dark-700 text-dark-300 hover:text-white'
                      }`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <label className="flex items-center gap-3 cursor-pointer">
              <div
                onClick={() => setIsPrivate(!isPrivate)}
                className={`w-11 h-6 rounded-full transition-colors duration-200 relative ${isPrivate ? 'bg-brand-500' : 'bg-dark-600'}`}
              >
                <div className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform duration-200 ${isPrivate ? 'translate-x-5' : ''}`} />
              </div>
              <span className="text-sm text-dark-200 font-body">Private Room</span>
            </label>

            <button
              onClick={handleCreateRace}
              disabled={loading}
              className="w-full py-3.5 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-bold rounded-xl transition-colors font-display"
            >
              {loading ? 'Creating...' : 'Create Race Room →'}
            </button>
          </div>

          {/* Join Race */}
          <div className="glass rounded-2xl p-6 border border-white/5 animate-slide-up stagger-2 space-y-4">
            <h2 className="font-semibold font-display text-white text-lg">Join Race</h2>
            <div className="flex gap-3">
              <input
                type="text"
                value={roomCodeInput}
                onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === 'Enter' && handleJoinRace()}
                placeholder="Enter room code (e.g. ABC123)"
                maxLength={6}
                className="flex-1 bg-dark-700 border border-white/5 rounded-xl px-4 py-3 text-white placeholder-dark-400 focus:outline-none focus:border-brand-500/50 font-mono uppercase"
              />
              <button
                onClick={handleJoinRace}
                disabled={loading}
                className="px-6 py-3 bg-dark-600 hover:bg-dark-500 text-white font-semibold rounded-xl transition-colors font-display disabled:opacity-50"
              >
                Join
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── WAITING ROOM / RACING ───────────────────────────
  return (
    <div className="min-h-screen pt-24 pb-16 px-4 bg-grid">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between animate-slide-up">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold font-display text-white">
                {phase === 'waiting' ? 'Waiting Room' : 'Race in Progress'}
              </h1>
              {phase === 'racing' && (
                <span className="flex items-center gap-1.5 text-xs font-mono text-red-400 bg-red-500/10 px-2 py-1 rounded-full">
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse-fast" />
                  LIVE
                </span>
              )}
            </div>
            {raceData && (
              <div className="flex items-center gap-3 mt-1">
                <p className="text-dark-400 text-sm font-mono">Room: <span className="text-white">{raceData.room_code}</span></p>
                {phase === 'racing' && (
                  <p className="text-dark-400 text-sm font-mono">⏱ {formatTime(timer)}</p>
                )}
              </div>
            )}
          </div>
          <button
            onClick={handleLeave}
            className="px-4 py-2 text-sm text-dark-300 hover:text-white bg-dark-700 hover:bg-dark-600 rounded-xl transition-colors font-display"
          >
            Leave
          </button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Players progress */}
        <div className="animate-slide-up stagger-1">
          <PlayerProgress players={players} currentUserId={user.id} />
        </div>

        {/* Typing area */}
        <div className="relative animate-slide-up stagger-2">
          <div className="glass rounded-2xl p-6 border border-white/5">
            <TypingArea
              text={raceData?.text?.content || raceData?.content || ''}
              started={phase === 'racing'}
              disabled={phase !== 'racing'}
              onProgress={handleProgress}
              onFinish={handleFinish}
            />
          </div>

          {/* Countdown overlay */}
          {(phase === 'countdown' || phase === 'waiting') && countdown !== null && (
            <CountdownOverlay seconds={countdown} />
          )}
        </div>

        {/* Waiting room - start button for host */}
        {phase === 'waiting' && countdown === null && (
          <div className="glass rounded-2xl p-6 border border-white/5 animate-slide-up stagger-3 text-center">
            <p className="text-dark-300 mb-4 font-body">
              {players.length < 2
                ? 'Waiting for more players to join...'
                : 'Ready to race! Start when everyone is here.'}
            </p>
            <div className="flex items-center justify-center gap-2 text-dark-400 text-sm font-mono mb-4">
              <span>{players.length} player{players.length !== 1 ? 's' : ''} in room</span>
              {raceData && (
                <span>· Code: <strong className="text-white">{raceData.room_code}</strong></span>
              )}
            </div>
            <button
              onClick={handleStartRace}
              className="px-8 py-3 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl transition-colors font-display"
            >
              Start Race →
            </button>
          </div>
        )}
      </div>

      {/* Results modal */}
      {phase === 'finished' && results.length > 0 && (
        <RaceResults
          results={results}
          onPlayAgain={() => { handleLeave(); }}
          onLeave={() => navigate('/dashboard')}
        />
      )}
    </div>
  );
};

export default Race;
