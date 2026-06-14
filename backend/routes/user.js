const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { getProfile, getRaceHistory, getWpmStats } = require('../controllers/userController');

router.get('/profile', authMiddleware, getProfile);
router.get('/race-history', authMiddleware, getRaceHistory);
router.get('/wpm-stats', authMiddleware, getWpmStats);

module.exports = router;
