const db = require('../models/db');

// GET /api/leaderboard
const getLeaderboard = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT l.id, u.username, u.avatar, l.best_wpm, l.avg_accuracy, l.total_races, l.date
       FROM Leaderboard l
       JOIN Users u ON l.user_id = u.id
       WHERE l.total_races > 0
       ORDER BY l.best_wpm DESC
       LIMIT 20`
    );

    res.json({ leaderboard: rows });
  } catch (err) {
    console.error('Leaderboard error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// GET /api/practice-text
const getPracticeText = async (req, res) => {
  try {
    const { difficulty = 'medium', language = 'english' } = req.query;

    const [rows] = await db.query(
      'SELECT * FROM Texts WHERE difficulty = ? AND language = ? ORDER BY RAND() LIMIT 1',
      [difficulty, language]
    );

    if (rows.length === 0) {
      // Fallback to any text
      const [fallback] = await db.query('SELECT * FROM Texts ORDER BY RAND() LIMIT 1');
      return res.json({ text: fallback[0] });
    }

    res.json({ text: rows[0] });
  } catch (err) {
    console.error('Practice text error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { getLeaderboard, getPracticeText };
