const db = require('../models/db');
const jwt = require('jsonwebtoken');

// In-memory race state
const activeRaces = new Map();
// raceId -> { players: Map<userId, { socketId, username, avatar, progress, wpm, accuracy, finished }>, countdownTimer, startTime }

const authenticateSocket = (socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error('Authentication required'));
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded;
    next();
  } catch {
    next(new Error('Invalid token'));
  }
};

const setupSocket = (io) => {
  io.use(authenticateSocket);

  io.on('connection', (socket) => {
    console.log(`🔌 User connected: ${socket.user.username} (${socket.id})`);

    // ── JOIN RACE ROOM ──────────────────────────────────
    socket.on('joinRace', async ({ raceId, roomCode }) => {
      try {
        // Validate race exists
        const [races] = await db.query(
          'SELECT r.*, t.content FROM Races r JOIN Texts t ON r.text_id = t.id WHERE r.race_id = ?',
          [raceId]
        );
        if (races.length === 0) return socket.emit('error', 'Race not found');

        const race = races[0];
        socket.join(roomCode);

        if (!activeRaces.has(raceId)) {
          activeRaces.set(raceId, {
            players: new Map(),
            startTime: null,
            text: race.content,
            roomCode,
          });
        }

        const raceState = activeRaces.get(raceId);
        raceState.players.set(socket.user.id, {
          socketId: socket.id,
          userId: socket.user.id,
          username: socket.user.username,
          progress: 0,
          wpm: 0,
          accuracy: 100,
          finished: false,
          position: null,
        });

        socket.raceId = raceId;
        socket.roomCode = roomCode;

        // Send current race state to joining player
        const players = Array.from(raceState.players.values());
        socket.emit('raceJoined', { raceId, text: race.content, players, status: race.status });
        socket.to(roomCode).emit('playerJoined', {
          player: raceState.players.get(socket.user.id),
          players,
        });

        console.log(`🏎️ ${socket.user.username} joined race ${raceId}`);
      } catch (err) {
        console.error('joinRace error:', err);
        socket.emit('error', 'Failed to join race');
      }
    });

    // ── START RACE (host triggers) ──────────────────────
    socket.on('startRace', async ({ raceId }) => {
      try {
        const [races] = await db.query(
          "SELECT * FROM Races WHERE race_id = ? AND status = 'waiting'",
          [raceId]
        );
        if (races.length === 0) return socket.emit('error', 'Race not available to start');

        const race = races[0];
        const raceState = activeRaces.get(raceId);
        if (!raceState) return socket.emit('error', 'Race state not found');

        // Update DB status to countdown
        await db.query("UPDATE Races SET status = 'countdown' WHERE race_id = ?", [raceId]);

        // Send countdown to all players
        io.to(race.room_code).emit('countdown', { seconds: 3 });

        let count = 3;
        const countInterval = setInterval(async () => {
          count--;
          if (count > 0) {
            io.to(race.room_code).emit('countdown', { seconds: count });
          } else {
            clearInterval(countInterval);
            raceState.startTime = Date.now();
            await db.query("UPDATE Races SET status = 'active' WHERE race_id = ?", [raceId]);
            io.to(race.room_code).emit('raceStarted', { startTime: raceState.startTime });
          }
        }, 1000);
      } catch (err) {
        console.error('startRace error:', err);
        socket.emit('error', 'Failed to start race');
      }
    });

    // ── PLAYER PROGRESS UPDATE ──────────────────────────
    socket.on('playerProgress', ({ raceId, progress, wpm, accuracy }) => {
      const raceState = activeRaces.get(raceId);
      if (!raceState) return;

      const player = raceState.players.get(socket.user.id);
      if (!player || player.finished) return;

      player.progress = progress;
      player.wpm = wpm;
      player.accuracy = accuracy;

      // Broadcast to room (excluding sender)
      socket.to(raceState.roomCode).emit('progressUpdate', {
        userId: socket.user.id,
        progress,
        wpm,
        accuracy,
      });
    });

    // ── PLAYER FINISHED ──────────────────────────────────
    socket.on('playerFinished', async ({ raceId, wpm, accuracy, finishTime }) => {
      try {
        const raceState = activeRaces.get(raceId);
        if (!raceState) return;

        const player = raceState.players.get(socket.user.id);
        if (!player || player.finished) return;

        player.finished = true;
        player.wpm = wpm;
        player.accuracy = accuracy;

        // Calculate position
        const finishedPlayers = Array.from(raceState.players.values()).filter((p) => p.finished);
        const position = finishedPlayers.length;
        player.position = position;

        const elapsed = finishTime || (Date.now() - raceState.startTime);

        // Update DB
        await db.query(
          'UPDATE RaceParticipants SET wpm = ?, accuracy = ?, finish_time = ?, position = ? WHERE race_id = ? AND user_id = ?',
          [wpm, accuracy, elapsed, position, raceId, socket.user.id]
        );

        // Update leaderboard
        await updateLeaderboard(socket.user.id, wpm, accuracy);

        // Broadcast finish
        io.to(raceState.roomCode).emit('playerFinishedRace', {
          userId: socket.user.id,
          username: socket.user.username,
          position,
          wpm,
          accuracy,
        });

        // Check if all finished
        const allFinished = Array.from(raceState.players.values()).every((p) => p.finished);
        if (allFinished) {
          await db.query("UPDATE Races SET status = 'finished' WHERE race_id = ?", [raceId]);
          const results = Array.from(raceState.players.values()).sort(
            (a, b) => a.position - b.position
          );
          io.to(raceState.roomCode).emit('raceFinished', { results });
          activeRaces.delete(raceId);
        }
      } catch (err) {
        console.error('playerFinished error:', err);
      }
    });

    // ── RACE CHAT ───────────────────────────────────────
    socket.on('chatMessage', ({ raceId, text }) => {
      const raceState = activeRaces.get(raceId);
      if (!raceState) return;
      socket.to(raceState.roomCode).emit('chatMessage', {
        username: socket.user.username,
        avatar: socket.user.avatar || '🏎️',
        text: String(text).slice(0, 100),
      });
    });

    // ── PLAYER LEFT RACE ────────────────────────────────
    socket.on('leaveRace', ({ raceId }) => {
      handlePlayerLeave(socket, raceId, io);
    });

    // ── DISCONNECT ──────────────────────────────────────
    socket.on('disconnect', () => {
      console.log(`🔌 Disconnected: ${socket.user?.username}`);
      if (socket.raceId) {
        handlePlayerLeave(socket, socket.raceId, io);
      }
    });
  });
};

const handlePlayerLeave = async (socket, raceId, io) => {
  const raceState = activeRaces.get(raceId);
  if (!raceState) return;

  raceState.players.delete(socket.user.id);

  socket.to(raceState.roomCode).emit('playerLeft', {
    userId: socket.user.id,
    username: socket.user.username,
    players: Array.from(raceState.players.values()),
  });

  // If no players left, clean up
  if (raceState.players.size === 0) {
    activeRaces.delete(raceId);
    await db.query("UPDATE Races SET status = 'finished' WHERE race_id = ?", [raceId]).catch(() => {});
  }
};

const updateLeaderboard = async (userId, wpm, accuracy) => {
  try {
    // Get current leaderboard entry
    const [rows] = await db.query('SELECT * FROM Leaderboard WHERE user_id = ?', [userId]);

    if (rows.length === 0) {
      await db.query(
        'INSERT INTO Leaderboard (user_id, best_wpm, avg_accuracy, total_races) VALUES (?, ?, ?, 1)',
        [userId, wpm, accuracy]
      );
    } else {
      const current = rows[0];
      const newBestWpm = Math.max(current.best_wpm, wpm);
      const newTotalRaces = current.total_races + 1;
      const newAvgAccuracy =
        (current.avg_accuracy * current.total_races + accuracy) / newTotalRaces;

      await db.query(
        'UPDATE Leaderboard SET best_wpm = ?, avg_accuracy = ?, total_races = ? WHERE user_id = ?',
        [newBestWpm, newAvgAccuracy.toFixed(2), newTotalRaces, userId]
      );
    }
  } catch (err) {
    console.error('Leaderboard update error:', err);
  }
};

module.exports = setupSocket;
