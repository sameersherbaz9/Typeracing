const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { createRace, joinRace, getRaceResult } = require('../controllers/raceController');

router.post('/create', authMiddleware, createRace);
router.post('/join', authMiddleware, joinRace);
router.get('/result', authMiddleware, getRaceResult);

module.exports = router;
