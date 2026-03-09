const db = require('../models/db');

// GET /api/profile
const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const [userRows] = await db.query(
      'SELECT id, username, email, avatar, created_at FROM Users WHERE id = ?',
      [userId]
    );
    if (userRows.length === 0) return res.status(404).json({ error: 'User not found' });

    const [lbRows] = await db.query(
      'SELECT best_wpm, avg_accuracy, total_races FROM Leaderboard WHERE user_id = ?',
      [userId]
    );

    const stats = lbRows[0] || { best_wpm: 0, avg_accuracy: 0, total_races: 0 };

    res.json({ user: userRows[0], stats });
  } catch (err) {
    console.error('Profile error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// GET /api/race-history
const getRaceHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 10;

    const [rows] = await db.query(
      `SELECT rp.id, rp.wpm, rp.accuracy, rp.finish_time, rp.position,
              r.created_at, r.room_code,
              t.content, t.difficulty
       FROM RaceParticipants rp
       JOIN Races r ON rp.race_id = r.race_id
       LEFT JOIN Texts t ON r.text_id = t.id
       WHERE rp.user_id = ?
       ORDER BY r.created_at DESC
       LIMIT ?`,
      [userId, limit]
    );

    res.json({ history: rows });
  } catch (err) {
    console.error('Race history error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { getProfile, getRaceHistory };
