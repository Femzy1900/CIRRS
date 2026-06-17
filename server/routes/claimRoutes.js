const express    = require('express');
const rateLimit  = require('express-rate-limit');
const {
  submitClaim,
  getItemClaims,
  getMyClaimForItem,
  updateClaimStatus,
  withdrawClaim,
  getFlaggedClaims,
  getClaimAudit
} = require('../controllers/claimController');

const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');

// Max 5 claim submissions per user per hour (per item)
const claimLimiter = rateLimit({
  windowMs:   60 * 60 * 1000,
  max:        5,
  keyGenerator: (req) => `claim_${req.user?.id || req.ip}_${req.params.itemId}`,
  message:    { success: false, message: 'Too many claim submissions. Please wait before trying again.' },
  standardHeaders: true,
  legacyHeaders:   false,
  skip: (req) => !req.user
});

// ── Specific routes (must come before /:id wildcard) ──────────────────────
router.get('/flagged',         protect, authorize('admin'), getFlaggedClaims);
router.get('/item/:itemId',    protect, getItemClaims);
router.get('/my/:itemId',      protect, getMyClaimForItem);
router.get('/:id/audit',       protect, getClaimAudit);

// ── Core submit + status update ───────────────────────────────────────────
router.post('/:itemId',        protect, claimLimiter, submitClaim);
router.put('/:id/withdraw',    protect, withdrawClaim);
router.put('/:id',             protect, updateClaimStatus);

module.exports = router;
