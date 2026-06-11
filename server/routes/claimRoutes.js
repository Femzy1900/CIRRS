const express = require('express');
const {
  submitClaim,
  getItemClaims,
  getMyClaimForItem,
  updateClaimStatus
} = require('../controllers/claimController');

const router = express.Router();

const { protect } = require('../middleware/authMiddleware');

router.post('/:itemId', protect, submitClaim);
router.get('/item/:itemId', protect, getItemClaims);
router.get('/my/:itemId', protect, getMyClaimForItem);
router.put('/:id', protect, updateClaimStatus);

module.exports = router;
