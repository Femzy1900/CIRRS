const express = require('express');
const {
  getItems,
  getItem,
  createItem,
  updateItem,
  deleteItem
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

module.exports = router;
