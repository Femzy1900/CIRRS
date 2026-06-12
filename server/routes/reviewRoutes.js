const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getReviews,
  getMyReview,
  createReview,
  deleteReview,
} = require('../controllers/reviewController');

// Max 3 review submissions per IP per day
const reviewLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  max: 3,
  message: { success: false, message: 'You have submitted too many reviews today. Please try again tomorrow.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.get('/', getReviews);
router.get('/mine', protect, getMyReview);
router.post('/', protect, reviewLimiter, createReview);
router.delete('/:id', protect, deleteReview);

module.exports = router;
