const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { createRace, joinRace, getRaceResult, finishRace } = require('../controllers/raceController');

router.post('/create', authMiddleware, createRace);
router.post('/join', authMiddleware, joinRace);
router.get('/result', authMiddleware, getRaceResult);
router.post('/finish', authMiddleware, finishRace);

module.exports = router;
