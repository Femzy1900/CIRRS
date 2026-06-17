const mongoose = require('mongoose');

const AuditEntrySchema = new mongoose.Schema({
  action:    { type: String, required: true }, // 'submitted'|'auto_approved'|'approved'|'rejected'|'escalated'|'disputed'
  actor:     { type: mongoose.Schema.ObjectId, ref: 'User' },
  actorRole: { type: String, default: 'system' }, // 'system' | 'finder' | 'admin'
  note:      { type: String },
  timestamp: { type: Date, default: Date.now }
}, { _id: false });

const ClaimSchema = new mongoose.Schema({
  item: {
    type: mongoose.Schema.ObjectId,
    ref: 'Item',
    required: true
  },
  claimant: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  answers: [{
    question:       { type: String, required: true },
    providedAnswer: { type: String, required: true },
    isCorrect:      { type: Boolean }
  }],

  // ── Scoring ────────────────────────────────────────────────────────────────
  score:          { type: Number, default: 0 },    // number of correct answers
  totalQuestions: { type: Number, default: 0 },
  // Weighted composite: answers 60% + location 15% + time proximity 10% + detail quality 15%
  compositeScore: { type: Number, default: 0 },    // 0–100
  passed:         { type: Boolean, default: false }, // true only when status === 'approved'

  // ── Optional context hints (improve composite score) ───────────────────────
  locationHint: { type: String, default: '' },   // "Where did you lose it?"
  reportedTime: { type: Date },                   // "When did you lose it?"

  // ── Status (state machine) ──────────────────────────────────────────────────
  // pending → under_review → approved / rejected / escalated / disputed
  // withdrawn: claimant retracted a pending claim to resubmit (max 1 withdrawal allowed)
  status: {
    type: String,
    enum: ['pending', 'under_review', 'approved', 'rejected', 'disputed', 'escalated', 'withdrawn'],
    default: 'pending'
  },

  // ── Resubmission tracking ───────────────────────────────────────────────────
  // Tracks which attempt this is (1 = first submission, 2 = after one withdrawal)
  attemptNumber: { type: Number, default: 1 },

  // ── Risk routing decision ───────────────────────────────────────────────────
  riskRoute:   { type: String, enum: ['AUTO', 'FINDER_REVIEW', 'ADMIN_REVIEW'] },
  routeReason: { type: String },

  // ── Fraud detection ────────────────────────────────────────────────────────
  fraudFlags: { type: [String], default: [] },
  isFlagged:  { type: Boolean, default: false },

  // ── Review note (finder/admin explanation of decision) ─────────────────────
  reviewNote: { type: String },

  // ── Full audit trail ────────────────────────────────────────────────────────
  auditLog: [AuditEntrySchema],

  createdAt: { type: Date, default: Date.now }
});

// Index for efficient lookups — uniqueness enforced in application code
// (allows multiple rows per pair to support withdrawal + resubmission)
ClaimSchema.index({ item: 1, claimant: 1 });

module.exports = mongoose.model('Claim', ClaimSchema);
