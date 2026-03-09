const express = require('express');
const router = express.Router();
const { getLeaderboard, getPracticeText } = require('../controllers/leaderboardController');

router.get('/leaderboard', getLeaderboard);
router.get('/practice-text', getPracticeText);

module.exports = router;
