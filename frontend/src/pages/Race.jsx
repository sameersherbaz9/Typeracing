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

  const [phase, setPhase] = useState('lobby');
  const [raceData, setRaceData] = useState(null);
  const [players, setPlayers] = useState([]);
  const [results, setResults] = useState([]);
  const [myResult, setMyResult] = useState(null);
  const [countdown, setCountdown] = useState(null);
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [language, setLanguage] = useState('english');
  const [isPrivate, setIsPrivate] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [copied, setCopied] = useState(false);
  const timerRef = useRef(null);
  const socketRef = useRef(null);
  const chatEndRef = useRef(null);

  const cleanup = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    const socket = socketRef.current;
    if (socket && raceData) {
      socket.emit('leaveRace', { raceId: raceData.race_id });
    }
  }, [raceData]);

  useEffect(() => { return cleanup; }, [cleanup]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

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
      setChatMessages(m => [...m, { system: true, text: `${ps[ps.length-1]?.username} joined the race!` }]);
    });
    socket.on('playerLeft', ({ players: ps, username }) => {
      setPlayers(ps);
      setChatMessages(m => [...m, { system: true, text: `${username} left the race` }]);
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
    socket.on('playerFinishedRace', ({ userId, position, wpm, accuracy, username }) => {
      setPlayers((prev) =>
        prev.map((p) => (p.userId === userId ? { ...p, progress: 100, position, wpm, accuracy, finished: true } : p))
      );
      setChatMessages(m => [...m, { system: true, text: `${username} finished #${position} — ${Math.round(wpm)} WPM!` }]);
    });
    socket.on('raceFinished', ({ results: r }) => {
      if (timerRef.current) clearInterval(timerRef.current);
      setResults(r);
      setPhase('finished');
    });
    socket.on('chatMessage', ({ username, text: msg, avatar }) => {
      setChatMessages(m => [...m, { username, text: msg, avatar }]);
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
    if (socket && raceData) socket.emit('startRace', { raceId: raceData.race_id });
  };

  const handleProgress = ({ progress, wpm, accuracy }) => {
    const socket = socketRef.current;
    if (socket && raceData) socket.emit('playerProgress', { raceId: raceData.race_id, progress, wpm, accuracy });
    setPlayers((prev) => prev.map((p) => (p.userId === user.id ? { ...p, progress, wpm, accuracy } : p)));
  };

  const handleFinish = ({ wpm, accuracy, time, errors, trickyKeys }) => {
    setMyResult({ wpm, accuracy, time, errors, trickyKeys, userId: user.id });
    const socket = socketRef.current;
    if (socket && raceData) socket.emit('playerFinished', { raceId: raceData.race_id, wpm, accuracy, finishTime: time });
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
    setChatMessages([]);
    socketRef.current = null;
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(raceData?.room_code || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sendChat = (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !socketRef.current || !raceData) return;
    socketRef.current.emit('chatMessage', { raceId: raceData.race_id, text: chatInput.trim() });
    setChatMessages(m => [...m, { username: user.username, text: chatInput.trim(), avatar: user.avatar, self: true }]);
    setChatInput('');
  };

  const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  // ── LOBBY ──────────────────────────────────────────
  if (phase === 'lobby') {
    return (
      <div className="min-h-screen pt-24 pb-16 px-4 bg-grid">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="animate-slide-up">
            <h1 className="text-4xl font-bold font-display text-white">Multiplayer Race</h1>
            <p className="text-dark-300 mt-2">Create a room or join with a code</p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm animate-slide-up">
              {error}
            </div>
          )}

          {/* Create Race */}
          <div className="glass rounded-2xl p-6 border border-white/5 animate-slide-up stagger-1 space-y-5">
            <h2 className="font-semibold font-display text-white text-lg flex items-center gap-2">🏎️ Create Race Room</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-dark-400 mb-2 uppercase tracking-wider font-display">Difficulty</label>
                <div className="flex gap-2">
                  {DIFFICULTIES.map((d) => (
                    <button key={d} onClick={() => setDifficulty(d)}
                      className={`flex-1 py-2 text-xs font-mono rounded-lg capitalize transition-all ${
                        difficulty === d ? 'bg-brand-500 text-white' : 'bg-dark-700 text-dark-300 hover:text-white'
                      }`}>
                      {d}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs text-dark-400 mb-2 uppercase tracking-wider font-display">Language</label>
                <div className="flex gap-2">
                  {LANGUAGES.map((l) => (
                    <button key={l} onClick={() => setLanguage(l)}
                      className={`flex-1 py-2 text-xs font-mono rounded-lg capitalize transition-all ${
                        language === l ? 'bg-brand-500 text-white' : 'bg-dark-700 text-dark-300 hover:text-white'
                      }`}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <label className="flex items-center gap-3 cursor-pointer">
              <div onClick={() => setIsPrivate(!isPrivate)}
                className={`w-11 h-6 rounded-full transition-colors duration-200 relative ${isPrivate ? 'bg-brand-500' : 'bg-dark-600'}`}>
                <div className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform duration-200 ${isPrivate ? 'translate-x-5' : ''}`} />
              </div>
              <span className="text-sm text-dark-200 font-body">🔒 Private Room (invite only)</span>
            </label>

            <button onClick={handleCreateRace} disabled={loading}
              className="w-full py-3.5 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-bold rounded-xl transition-colors font-display text-lg">
              {loading ? 'Creating...' : '🏁 Create Race Room →'}
            </button>
          </div>

          {/* Join Race */}
          <div className="glass rounded-2xl p-6 border border-white/5 animate-slide-up stagger-2 space-y-4">
            <h2 className="font-semibold font-display text-white text-lg flex items-center gap-2">🔗 Join by Room Code</h2>
            <div className="flex gap-3">
              <input
                type="text"
                value={roomCodeInput}
                onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === 'Enter' && handleJoinRace()}
                placeholder="ABC123"
                maxLength={6}
                className="flex-1 bg-dark-700 border border-white/5 rounded-xl px-4 py-3 text-white placeholder-dark-500 focus:outline-none focus:border-brand-500/50 font-mono uppercase text-xl tracking-widest text-center"
              />
              <button onClick={handleJoinRace} disabled={loading}
                className="px-8 py-3 bg-dark-600 hover:bg-dark-500 text-white font-semibold rounded-xl transition-colors font-display disabled:opacity-50">
                Join →
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
      <div className="max-w-4xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between animate-slide-up">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold font-display text-white">
                {phase === 'waiting' ? '⏳ Waiting Room' : phase === 'countdown' ? '🚦 Get Ready!' : '🏎️ Race Live'}
              </h1>
              {phase === 'racing' && (
                <span className="flex items-center gap-1.5 text-xs font-mono text-red-400 bg-red-500/10 px-2 py-1 rounded-full border border-red-500/20">
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse-fast" /> LIVE
                </span>
              )}
            </div>
            <div className="flex items-center gap-4 mt-1">
              {raceData && (
                <button onClick={handleCopyCode}
                  className="text-dark-400 text-sm font-mono hover:text-white transition-colors flex items-center gap-1.5">
                  Room: <span className="text-white font-bold tracking-widest">{raceData.room_code}</span>
                  <span className="text-xs">{copied ? '✓ Copied!' : '📋'}</span>
                </button>
              )}
              {phase === 'racing' && <p className="text-dark-400 text-sm font-mono">⏱ {formatTime(timer)}</p>}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setSoundEnabled(s => !s)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${soundEnabled ? 'text-brand-400' : 'text-dark-400'}`}>
              {soundEnabled ? '🔊' : '🔇'}
            </button>
            <button onClick={handleLeave}
              className="px-4 py-2 text-sm text-dark-300 hover:text-white bg-dark-700 hover:bg-dark-600 rounded-xl transition-colors font-display">
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
          <div className="glass rounded-2xl p-6 border border-white/5">
            <TypingArea
              text={raceData?.text?.content || raceData?.content || ''}
              started={phase === 'racing'}
              disabled={phase !== 'racing'}
              soundEnabled={soundEnabled}
              onProgress={handleProgress}
              onFinish={handleFinish}
            />
          </div>
          {(phase === 'countdown' || phase === 'waiting') && countdown !== null && (
            <CountdownOverlay seconds={countdown} />
          )}
        </div>

        {/* Waiting controls + Chat side by side */}
        <div className="grid sm:grid-cols-2 gap-4 animate-slide-up stagger-3">
          {/* Start button (waiting only) */}
          {phase === 'waiting' && countdown === null && (
            <div className="glass rounded-2xl p-5 border border-white/5 text-center flex flex-col justify-center gap-3">
              <div className="flex items-center justify-center gap-2 text-sm font-mono text-dark-400">
                <span className="w-2 h-2 bg-neon-green rounded-full animate-pulse" />
                {players.length} player{players.length !== 1 ? 's' : ''} ready
                {raceData && <span>· Code: <strong className="text-white tracking-widest">{raceData.room_code}</strong></span>}
              </div>
              <button onClick={handleStartRace}
                className="w-full py-3 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl transition-colors font-display">
                🚦 Start Race
              </button>
              <p className="text-dark-500 text-xs font-mono">Share room code with friends to race together</p>
            </div>
          )}

          {/* Chat box */}
          {(phase === 'waiting' || phase === 'racing' || phase === 'countdown') && (
            <div className="glass rounded-2xl border border-white/5 flex flex-col" style={{ height: '180px' }}>
              <div className="px-4 py-2.5 border-b border-white/5">
                <p className="text-xs font-display text-dark-400 uppercase tracking-wider">💬 Race Chat</p>
              </div>
              <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1 text-sm">
                {chatMessages.length === 0 && (
                  <p className="text-dark-600 text-xs font-mono text-center mt-4">Say something to your opponents!</p>
                )}
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`${msg.system ? 'text-center' : ''}`}>
                    {msg.system ? (
                      <span className="text-xs text-dark-500 font-mono italic">{msg.text}</span>
                    ) : (
                      <span className={msg.self ? 'text-brand-400' : 'text-white'}>
                        <span className="font-semibold font-display">{msg.avatar} {msg.username}: </span>
                        <span className="text-dark-200">{msg.text}</span>
                      </span>
                    )}
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
              <form onSubmit={sendChat} className="px-3 py-2 border-t border-white/5 flex gap-2">
                <input
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  placeholder="Type a message..."
                  maxLength={100}
                  className="flex-1 bg-dark-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-dark-500 focus:outline-none focus:ring-1 focus:ring-brand-500/30 font-mono"
                />
                <button type="submit" className="px-3 py-1.5 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-xs font-bold transition-colors">
                  →
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Results modal */}
      {phase === 'finished' && results.length > 0 && (
        <RaceResults
          results={results}
          myResult={myResult}
          onPlayAgain={() => { handleLeave(); }}
          onLeave={() => navigate('/dashboard')}
        />
      )}
    </div>
  );
};

export default Race;
