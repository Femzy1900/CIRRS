const mongoose = require('mongoose');

const ComplaintSchema = new mongoose.Schema(
  {
    claimant: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true,
    },
    item: {
      type: mongoose.Schema.ObjectId,
      ref: 'Item',
      required: true,
    },
    // The claim linked to this complaint (null if claimant never submitted one)
    claim: {
      type: mongoose.Schema.ObjectId,
      ref: 'Claim',
      default: null,
    },
    message: {
      type: String,
      required: [true, 'Please provide a complaint message'],
      maxlength: [1000, 'Message cannot exceed 1000 characters'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'approved', 'dismissed'],
      default: 'pending',
    },
    adminNote: {
      type: String,
      default: '',
    },
    reviewedBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true }
);

// One complaint per claimant per item
ComplaintSchema.index({ claimant: 1, item: 1 }, { unique: true });

module.exports = mongoose.model('Complaint', ComplaintSchema);
