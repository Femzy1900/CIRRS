const mongoose = require('mongoose');

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
    question: { type: String, required: true },
    providedAnswer: { type: String, required: true },
    isCorrect: { type: Boolean }
  }],
  score: {
    type: Number,
    default: 0
  },
  totalQuestions: {
    type: Number,
    default: 0
  },
  passed: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Prevent a user from submitting multiple claims for the same item
ClaimSchema.index({ item: 1, claimant: 1 }, { unique: true });

module.exports = mongoose.model('Claim', ClaimSchema);
