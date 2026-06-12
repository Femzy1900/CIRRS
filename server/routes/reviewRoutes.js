const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getReviews,
  getMyReview,
  createReview,
  deleteReview,
} = require('../controllers/reviewController');

router.get('/', getReviews);
router.get('/mine', protect, getMyReview);
router.post('/', protect, createReview);
router.delete('/:id', protect, deleteReview);

module.exports = router;
