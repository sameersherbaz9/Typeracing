const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { createRace, joinRace, getRaceResult, finishRace, abandonRace } = require('../controllers/raceController');

router.post('/create', authMiddleware, createRace);
router.post('/join', authMiddleware, joinRace);
router.get('/result', authMiddleware, getRaceResult);
router.post('/finish', authMiddleware, finishRace);
router.post('/abandon', authMiddleware, abandonRace);

module.exports = router;
