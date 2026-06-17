const express = require('express');
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

router
  .route('/')
  .get(getItems)
  .post(protect, createItem);

router
  .route('/:id')
  .get(getItem)
  .put(protect, updateItem)
  .delete(protect, deleteItem);

router.post('/:id/contact', protect, contactItem);

module.exports = router;
