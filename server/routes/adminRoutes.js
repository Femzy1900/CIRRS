const express = require('express');
const {
  getUsers,
  updateUserRole,
  deleteUser,
  getStats,
  getAllClaims,
} = require('../controllers/adminController');

const router = express.Router();

const { protect, authorize } = require('../middleware/authMiddleware');

// Secure all admin routes
router.use(protect);
router.use(authorize('admin'));

router.get('/users', getUsers);
router.put('/users/:id/role', updateUserRole);
router.delete('/users/:id', deleteUser);
router.get('/stats', getStats);
router.get('/claims', getAllClaims);

module.exports = router;
