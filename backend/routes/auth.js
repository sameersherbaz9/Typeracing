const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { register, login } = require('../controllers/authController');

router.post(
  '/register',
  [
    body('username').trim().isLength({ min: 3, max: 20 }).withMessage('Username must be 3-20 characters'),
    body('email').isEmail().normalizeEmail().withMessage('Invalid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  register
);

router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail().withMessage('Invalid email'),
    body('password').notEmpty().withMessage('Password required'),
  ],
  login
);

module.exports = router;
