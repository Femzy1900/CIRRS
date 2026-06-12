const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    required: [true, 'Please provide a rating between 1 and 5'],
  },
  message: {
    type: String,
    required: [true, 'Please write a short review'],
    trim: true,
    minlength: [10, 'Review must be at least 10 characters'],
    maxlength: [400, 'Review cannot exceed 400 characters'],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// One review per user
ReviewSchema.index({ user: 1 }, { unique: true });

module.exports = mongoose.model('Review', ReviewSchema);
