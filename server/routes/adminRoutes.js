const express = require('express');
const {
  getUsers,
  updateUserRole,
  deleteUser,
  getStats,
  getAllClaims,
  runMatchingBackfill,
} = require('../controllers/adminController');

const router = express.Router();

const { protect, authorize, requireSuperAdmin } = require('../middleware/authMiddleware');

// Secure all admin routes — must be logged in and have admin (or superAdmin) role
router.use(protect);
router.use(authorize('admin'));

router.get('/users', getUsers);
router.get('/stats', getStats);
router.get('/claims', getAllClaims);
router.delete('/users/:id', deleteUser);

// Role assignment is super-admin-only
router.put('/users/:id/role', requireSuperAdmin, updateUserRole);

// Run matching engine on all existing items (backfill historical data)
router.post('/run-matching-backfill', runMatchingBackfill);

module.exports = router;
