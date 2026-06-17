/**
 * Fuzzy answer comparison engine for CIRS verification.
 *
 * Rules:
 * - Case insensitive
 * - Punctuation insensitive  ("blue-bag" == "blue bag")
 * - Word-order insensitive   ("black leather bag" == "leather black bag")
 * - Small typo tolerance     (levenshtein <= 20% of length, min 1)
 * - Numbers are STRICT       ("500" != "1000", all digits in correct answer must be present)
 */

function levenshtein(a, b) {
  const m = a.length, n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }
  return dp[m][n];
}

function normalize(str) {
  return String(str)
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, ' ')   // punctuation → space
    .replace(/\s+/g, ' ')       // collapse spaces
    .trim();
}

/**
 * @param {string} provided  - the claimer's answer
 * @param {string} correct   - the finder's stored correct answer
 * @returns {boolean}
 */
function answersMatch(provided, correct) {
  const a = normalize(provided);
  const b = normalize(correct);

  if (!a || !b) return false;

  // ── Exact normalized match ──────────────────────────────────────
  if (a === b) return true;

  // ── Strict numeric check ────────────────────────────────────────
  // If the correct answer contains any digit, ALL those digits/numbers
  // must appear exactly (no fuzzy for money amounts, IDs, etc.)
  const numsInCorrect = b.match(/\d+/g) || [];
  if (numsInCorrect.length > 0) {
    const numsInProvided = a.match(/\d+/g) || [];
    const allNumsPresent = numsInCorrect.every(n => numsInProvided.includes(n));
    if (!allNumsPresent) return false;
    // After confirming numbers match, fall through to word-set check
  }

  // ── Word-set match (order-insensitive) ──────────────────────────
  const wordsA = a.split(' ').filter(w => w.length > 0);
  const wordsB = b.split(' ').filter(w => w.length > 0);
  const setA = new Set(wordsA);
  const setB = new Set(wordsB);

  // Every word in the correct answer is in the provided answer
  if ([...setB].every(w => setA.has(w))) return true;
  // Every word in the provided answer is in the correct answer
  if ([...setA].every(w => setB.has(w))) return true;

  // ── Levenshtein fuzzy (single-word or short answers only) ───────
  // Only apply if no digits in correct answer (numbers must be exact)
  if (numsInCorrect.length === 0 && a.length <= 30 && b.length <= 30) {
    const tolerance = Math.max(1, Math.floor(Math.min(a.length, b.length) * 0.25));
    if (levenshtein(a, b) <= tolerance) return true;
  }

  return false;
}

/**
 * Grade all claimer answers against the item's verification questions.
 *
 * @param {Array} submittedAnswers  [{question, providedAnswer}]
 * @param {Array} correctQuestions  [{question, answer}]
 * @returns {{ gradedAnswers, score, totalQuestions }}
 */
function gradeAnswers(submittedAnswers, correctQuestions) {
  let score = 0;
  const gradedAnswers = (submittedAnswers || []).map(ans => {
    const vq = correctQuestions.find(q => q.question === ans.question);
    if (!vq) return { ...ans, isCorrect: false };
    const correct = answersMatch(ans.providedAnswer, vq.answer);
    if (correct) score++;
    return { ...ans, isCorrect: correct };
  });
  return { gradedAnswers, score, totalQuestions: correctQuestions.length };
}

/**
 * Determine whether a score passes the threshold.
 * Money/Cards require ALL correct.  All other categories require ≥ ceil(2/3 * total), min 2.
 *
 * @param {number} score
 * @param {number} total
 * @param {string} category
 * @returns {boolean}
 */
function isPassing(score, total, category) {
  if (total === 0) return false;
  const strictCategories = ['money', 'cash', 'cards', 'atm'];
  const isStrict = strictCategories.some(c => category?.toLowerCase().includes(c));
  if (isStrict) return score === total; // must get ALL correct
  const threshold = Math.max(2, Math.ceil((2 / 3) * total));
  return score >= threshold;
}

// ─────────────────────────────────────────────────────────────────────────────
// Composite Score Engine
// Weights: answer accuracy 60% | location match 15% | time proximity 10% | detail quality 15%
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Compute word-overlap similarity between two location strings (0–100).
 */
function locationSimilarity(hint, itemLocation) {
  if (!hint || !itemLocation) return 50; // neutral when no hint given
  const norm = str => str.toLowerCase().replace(/[^\w\s]/g, ' ').trim();
  const hintWords = new Set(norm(hint).split(/\s+/).filter(w => w.length > 2));
  const locWords  = new Set(norm(itemLocation).split(/\s+/).filter(w => w.length > 2));
  if (hintWords.size === 0 || locWords.size === 0) return 50;
  let overlap = 0;
  for (const w of hintWords) { if (locWords.has(w)) overlap++; }
  return Math.round((overlap / Math.max(hintWords.size, locWords.size)) * 100);
}

/**
 * Score based on how close the claimant's reported time is to the item date (0–100).
 */
function timeProximityScore(reportedTime, itemDate) {
  if (!reportedTime || !itemDate) return 50; // neutral when not provided
  const diffHours = Math.abs(new Date(reportedTime) - new Date(itemDate)) / (1000 * 60 * 60);
  if (diffHours <= 24)  return 100;
  if (diffHours <= 72)  return 75;
  if (diffHours <= 168) return 45; // within 1 week
  if (diffHours <= 720) return 20; // within 30 days
  return 5;
}

/**
 * Score based on average length/detail of provided answers (0–100).
 */
function detailQualityScore(gradedAnswers) {
  if (!gradedAnswers || gradedAnswers.length === 0) return 0;
  const avgLen = gradedAnswers.reduce((s, a) => s + (a.providedAnswer?.trim().length || 0), 0) / gradedAnswers.length;
  if (avgLen >= 25) return 100;
  if (avgLen >= 12) return 75;
  if (avgLen >= 6)  return 45;
  if (avgLen >= 2)  return 20;
  return 5;
}

/**
 * Calculate a weighted composite score (0–100) for a claim.
 *
 * @param {Object} gradeResult  - { score, totalQuestions, gradedAnswers }
 * @param {Object} item         - Mongoose Item doc (needs .location, .date)
 * @param {string} locationHint - Optional hint from claimant
 * @param {Date}   reportedTime - Optional time from claimant
 * @returns {number} 0–100
 */
function calculateCompositeScore(gradeResult, item, locationHint, reportedTime) {
  const { score, totalQuestions, gradedAnswers } = gradeResult;

  const answerScore  = totalQuestions > 0 ? (score / totalQuestions) * 100 : 0;
  const locScore     = locationSimilarity(locationHint, item.location);
  const timeScore    = timeProximityScore(reportedTime, item.date);
  const detailScore  = detailQualityScore(gradedAnswers);

  const composite = Math.round(
    answerScore * 0.60 +
    locScore    * 0.15 +
    timeScore   * 0.10 +
    detailScore * 0.15
  );

  return Math.min(100, Math.max(0, composite));
}

module.exports = { answersMatch, gradeAnswers, isPassing, calculateCompositeScore };
