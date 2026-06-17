/**
 * Risk-based claim routing engine for CIRS.
 *
 * Determines whether a claim should be:
 *   AUTO           – auto-approved immediately (LOW risk + high score + no fraud)
 *   FINDER_REVIEW  – sent to finder for manual decision
 *   ADMIN_REVIEW   – escalated to admin (HIGH risk or fraud flags)
 */

const AUTO_APPROVE_THRESHOLD = 75; // composite score needed for auto-approval on LOW risk items

// These categories always require manual finder approval — never auto-approved
const MONEY_CATEGORIES = ['Money', 'Cards'];

/**
 * @param {Object}   item           - Mongoose Item doc (needs .category, .riskLevel)
 * @param {number}   compositeScore - 0–100 weighted composite score
 * @param {string[]} fraudFlags     - Array of fraud flag strings (empty = clean)
 * @returns {{ route: 'AUTO'|'FINDER_REVIEW'|'ADMIN_REVIEW', status: string, reason: string }}
 */
function routeClaim(item, compositeScore, fraudFlags = []) {
  const { category, riskLevel } = item;
  const isFlagged = fraudFlags.length > 0;

  // ── Money / Cards: hardcoded FINDER_REVIEW, never auto-approved ─────────────
  if (MONEY_CATEGORIES.includes(category)) {
    return {
      route:  'FINDER_REVIEW',
      status: 'under_review',
      reason: `${category} items always require manual finder approval — contact details are never released automatically.`
    };
  }

  // ── Fraud flags detected → escalate to admin immediately ────────────────────
  if (isFlagged) {
    return {
      route:  'ADMIN_REVIEW',
      status: 'under_review',
      reason: `Suspicious activity detected (${fraudFlags.join(', ')}). Routed to admin for review.`
    };
  }

  // ── HIGH risk (Electronics, Documents, Bags + severe items) → admin review ──
  if (riskLevel === 'HIGH') {
    return {
      route:  'ADMIN_REVIEW',
      status: 'under_review',
      reason: 'High-risk item. Admin must review before releasing contact details.'
    };
  }

  // ── MEDIUM risk → finder review always ──────────────────────────────────────
  if (riskLevel === 'MEDIUM') {
    return {
      route:  'FINDER_REVIEW',
      status: 'under_review',
      reason: 'Medium-risk item. Finder must manually approve or reject this claim.'
    };
  }

  // ── LOW risk → auto-approve if score ≥ threshold, else finder review ─────────
  if (compositeScore >= AUTO_APPROVE_THRESHOLD) {
    return {
      route:  'AUTO',
      status: 'approved',
      reason: `Low-risk item with composite score ${compositeScore}/100 — auto-approved.`
    };
  }

  return {
    route:  'FINDER_REVIEW',
    status: 'under_review',
    reason: `Low-risk but composite score (${compositeScore}) is below auto-approve threshold (${AUTO_APPROVE_THRESHOLD}). Finder review required.`
  };
}

module.exports = { routeClaim, AUTO_APPROVE_THRESHOLD };
