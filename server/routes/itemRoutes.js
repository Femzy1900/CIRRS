const express = require('express');
const rateLimit = require('express-rate-limit');
const {
  getItems,
  getItem,
  createItem,
  updateItem,
  deleteItem,
  contactItem,
} = require('../controllers/itemController');

const router = express.Router();

const { protect } = require('../middleware/authMiddleware');

// Raw HTTP rate limiter: 10 attempts per IP per 15 min (last line of defence against bots)
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests. Please wait a few minutes and try again.' },
});

router
  .route('/')
  .get(getItems)
  .post(protect, createItem);

router
  .route('/:id')
  .get(getItem)
  .put(protect, updateItem)
  .delete(protect, deleteItem);

router.post('/:id/contact', protect, contactLimiter, contactItem);

module.exports = router;
