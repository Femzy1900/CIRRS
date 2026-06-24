const express = require('express');
const {
  submitComplaint,
  getComplaints,
  reviewComplaint,
} = require('../controllers/complaintController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/',     protect,                    submitComplaint);
router.get('/',      protect, authorize('admin'), getComplaints);
router.put('/:id',   protect, authorize('admin'), reviewComplaint);

module.exports = router;
