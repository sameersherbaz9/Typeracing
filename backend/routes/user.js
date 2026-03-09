const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { getProfile, getRaceHistory } = require('../controllers/userController');

router.get('/profile', authMiddleware, getProfile);
router.get('/race-history', authMiddleware, getRaceHistory);

module.exports = router;
