const db = require('../models/db');
const { v4: uuidv4 } = require('uuid');

const generateRoomCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

// POST /api/race/create
const createRace = async (req, res) => {
  try {
    const { difficulty = 'medium', language = 'english', isPrivate = false } = req.body;
    const userId = req.user.id;

    // Get a random text
    const [texts] = await db.query(
      'SELECT * FROM Texts WHERE difficulty = ? AND language = ? ORDER BY RAND() LIMIT 1',
      [difficulty, language]
    );

    if (texts.length === 0) {
      return res.status(404).json({ error: 'No texts available for this difficulty/language' });
    }

    const text = texts[0];
    let roomCode = generateRoomCode();

    // Ensure unique room code
    let attempts = 0;
    while (attempts < 5) {
      const [existing] = await db.query(
        "SELECT race_id FROM Races WHERE room_code = ? AND status != 'finished'",
        [roomCode]
      );
      if (existing.length === 0) break;
      roomCode = generateRoomCode();
      attempts++;
    }

    const [result] = await db.query(
      'INSERT INTO Races (text_id, status, room_code, is_private, created_by) VALUES (?, ?, ?, ?, ?)',
      [text.id, 'waiting', roomCode, isPrivate, userId]
    );

    // Add creator as participant
    await db.query(
      'INSERT INTO RaceParticipants (race_id, user_id) VALUES (?, ?)',
      [result.insertId, userId]
    );

    res.status(201).json({
      race: {
        race_id: result.insertId,
        room_code: roomCode,
        text,
        status: 'waiting',
        is_private: isPrivate,
      },
    });
  } catch (err) {
    console.error('Create race error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// POST /api/race/join
const joinRace = async (req, res) => {
  try {
    const { room_code } = req.body;
    const userId = req.user.id;

    const [races] = await db.query(
      `SELECT r.*, t.content, t.difficulty, t.language 
       FROM Races r 
       JOIN Texts t ON r.text_id = t.id
       WHERE r.room_code = ? AND r.status = 'waiting'`,
      [room_code]
    );

    if (races.length === 0) {
      return res.status(404).json({ error: 'Race not found or already started' });
    }

    const race = races[0];

    // Check if already joined
    const [existing] = await db.query(
      'SELECT id FROM RaceParticipants WHERE race_id = ? AND user_id = ?',
      [race.race_id, userId]
    );

    if (existing.length === 0) {
      await db.query(
        'INSERT INTO RaceParticipants (race_id, user_id) VALUES (?, ?)',
        [race.race_id, userId]
      );
    }

    res.json({ race });
  } catch (err) {
    console.error('Join race error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// GET /api/race/result
const getRaceResult = async (req, res) => {
  try {
    const { race_id } = req.query;

    const [participants] = await db.query(
      `SELECT rp.*, u.username, u.avatar
       FROM RaceParticipants rp
       JOIN Users u ON rp.user_id = u.id
       WHERE rp.race_id = ?
       ORDER BY rp.position ASC, rp.finish_time ASC`,
      [race_id]
    );

    res.json({ participants });
  } catch (err) {
    console.error('Race result error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// POST /api/race/finish
// Called directly by the frontend when a race ends (works for solo/bot races
// that don't go through the socket flow). Updates RaceParticipants + Leaderboard.
const finishRace = async (req, res) => {
  try {
    const userId = req.user.id;
    const { race_id, wpm, accuracy, finish_time, position } = req.body;

    if (!race_id || wpm == null || accuracy == null) {
      return res.status(400).json({ error: 'race_id, wpm and accuracy are required' });
    }

    // Make sure a participant row exists for this user+race (it should from createRace,
    // but guard against missing rows too)
    const [existing] = await db.query(
      'SELECT id FROM RaceParticipants WHERE race_id = ? AND user_id = ?',
      [race_id, userId]
    );

    if (existing.length === 0) {
      await db.query(
        'INSERT INTO RaceParticipants (race_id, user_id, wpm, accuracy, finish_time, position) VALUES (?, ?, ?, ?, ?, ?)',
        [race_id, userId, wpm, accuracy, finish_time || null, position || 1]
      );
    } else {
      await db.query(
        'UPDATE RaceParticipants SET wpm = ?, accuracy = ?, finish_time = ?, position = ? WHERE race_id = ? AND user_id = ?',
        [wpm, accuracy, finish_time || null, position || 1, race_id, userId]
      );
    }

    // Mark race as finished
    await db.query("UPDATE Races SET status = 'finished' WHERE race_id = ?", [race_id]);

    // Update leaderboard
    const [lbRows] = await db.query('SELECT * FROM Leaderboard WHERE user_id = ?', [userId]);

    if (lbRows.length === 0) {
      await db.query(
        'INSERT INTO Leaderboard (user_id, best_wpm, avg_accuracy, total_races) VALUES (?, ?, ?, 1)',
        [userId, wpm, accuracy]
      );
    } else {
      const current = lbRows[0];
      const newBestWpm = Math.max(current.best_wpm, wpm);
      const newTotalRaces = current.total_races + 1;
      const newAvgAccuracy =
        (current.avg_accuracy * current.total_races + accuracy) / newTotalRaces;

      await db.query(
        'UPDATE Leaderboard SET best_wpm = ?, avg_accuracy = ?, total_races = ? WHERE user_id = ?',
        [newBestWpm, newAvgAccuracy.toFixed(2), newTotalRaces, userId]
      );
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Finish race error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { createRace, joinRace, getRaceResult, finishRace };
