const express = require('express');
const { getNotifications, markAsRead, clearNotifications } = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect); // All routes require authentication

router.route('/')
  .get(getNotifications)
  .delete(clearNotifications);

router.put('/:id/read', markAsRead);

module.exports = router;
