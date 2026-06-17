const express = require('express');
const rateLimit = require('express-rate-limit');
const { syncUser, getMe, updateProfile, deleteAccount } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Limiter for sync endpoint (covers register + login)
const syncLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { success: false, message: 'Too many requests. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// POST /api/auth/sync — called after every Firebase login/register
router.post('/sync', syncLimiter, syncUser);

// Protected routes (require valid Firebase token + MongoDB user)
router.get('/me', protect, getMe);
router.put('/updateprofile', protect, updateProfile);
router.delete('/deleteaccount', protect, deleteAccount);

module.exports = router;
