/**
 * Fraud detection engine for CIRS claim submissions.
 *
 * Checks submitted claims for suspicious patterns and returns
 * an array of string flags (empty array = clean).
 */

const Claim = require('../models/Claim');

const ONE_WEEK_MS  = 7  * 24 * 60 * 60 * 1000;
const ONE_MONTH_MS = 30 * 24 * 60 * 60 * 1000;

const HIGH_FREQUENCY_THRESHOLD  = 3; // claims in past 7 days
const REPEATED_FAILURE_THRESHOLD = 2; // rejections in past 30 days
const MIN_AVG_ANSWER_LENGTH      = 3; // characters

/**
 * Detect suspicious patterns in a claim submission.
 *
 * @param {ObjectId|string} claimantId   - MongoDB user ID of the claimant
 * @param {Object}          item         - Mongoose Item doc (needs .location)
 * @param {Array}           answers      - Submitted answers [{question, providedAnswer}]
 * @param {string}          [locationHint] - Optional location hint submitted by claimant
 * @returns {Promise<string[]>}          - Array of fraud flag strings (empty = clean)
 */
async function detectFraud(claimantId, item, answers, locationHint) {
  const flags = [];

  try {
    // ── 1. High claim frequency (> 3 claims in the past 7 days) ──────────────
    const weekAgo = new Date(Date.now() - ONE_WEEK_MS);
    const recentCount = await Claim.countDocuments({
      claimant: claimantId,
      createdAt: { $gte: weekAgo }
    });
    if (recentCount >= HIGH_FREQUENCY_THRESHOLD) {
      flags.push('high_claim_frequency');
    }

    // ── 2. Repeated failures (≥ 2 rejected claims in the past 30 days) ───────
    const monthAgo = new Date(Date.now() - ONE_MONTH_MS);
    const rejectedCount = await Claim.countDocuments({
      claimant:  claimantId,
      status:    'rejected',
      createdAt: { $gte: monthAgo }
    });
    if (rejectedCount >= REPEATED_FAILURE_THRESHOLD) {
      flags.push('repeated_failures');
    }

    // ── 3. Very poor answer quality (avg length < 3 chars) ───────────────────
    if (answers && answers.length > 0) {
      const avgLen = answers.reduce(
        (sum, a) => sum + (a.providedAnswer?.trim().length || 0), 0
      ) / answers.length;
      if (avgLen < MIN_AVG_ANSWER_LENGTH) {
        flags.push('low_quality_answers');
      }
    }

    // ── 4. Location mismatch (given hint shares NO words with item location) ──
    if (locationHint && item.location) {
      const norm = str => str.toLowerCase().replace(/[^\w\s]/g, ' ');
      const hintWords = new Set(norm(locationHint).split(/\s+/).filter(w => w.length > 2));
      const locWords  = new Set(norm(item.location).split(/\s+/).filter(w => w.length > 2));

      if (hintWords.size > 0 && locWords.size > 0) {
        const hasOverlap = [...hintWords].some(w => locWords.has(w));
        if (!hasOverlap) {
          flags.push('location_mismatch');
        }
      }
    }
  } catch (err) {
    // Never let fraud detection crash the main claim submission
    console.error('[FraudDetection] Error during fraud check:', err.message);
  }

  return flags;
}

/**
 * Human-readable labels for fraud flag strings.
 */
const FRAUD_FLAG_LABELS = {
  high_claim_frequency: 'High claim frequency (3+ claims this week)',
  repeated_failures:    'Repeated rejected claims (2+ this month)',
  low_quality_answers:  'Suspiciously short / low-quality answers',
  location_mismatch:    'Location hint does not match item location'
};

function formatFraudFlags(flags) {
  return flags.map(f => FRAUD_FLAG_LABELS[f] || f);
}

module.exports = { detectFraud, formatFraudFlags, FRAUD_FLAG_LABELS };
