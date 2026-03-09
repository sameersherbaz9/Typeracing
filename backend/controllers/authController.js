const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const db = require('../models/db');

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, username: user.username, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// POST /api/register
const register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, email, password, avatar } = req.body;

  try {
    // Check if user exists
    const [existing] = await db.query(
      'SELECT id FROM Users WHERE email = ? OR username = ?',
      [email, username]
    );
    if (existing.length > 0) {
      return res.status(409).json({ error: 'Username or email already exists' });
    }

    const hashed = await bcrypt.hash(password, 12);
    const userAvatar = avatar || '🏎️';

    const [result] = await db.query(
      'INSERT INTO Users (username, email, password, avatar) VALUES (?, ?, ?, ?)',
      [username, email, hashed, userAvatar]
    );

    // Initialize leaderboard entry
    await db.query(
      'INSERT INTO Leaderboard (user_id, best_wpm, avg_accuracy, total_races) VALUES (?, 0, 0, 0)',
      [result.insertId]
    );

    const token = generateToken({ id: result.insertId, username, email });

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: { id: result.insertId, username, email, avatar: userAvatar },
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// POST /api/login
const login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    const [rows] = await db.query('SELECT * FROM Users WHERE email = ?', [email]);
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(user);

    res.json({
      message: 'Login successful',
      token,
      user: { id: user.id, username: user.username, email: user.email, avatar: user.avatar },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { register, login };
