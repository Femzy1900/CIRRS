const Review = require('../models/Review');

// @desc    Get all reviews (public — for homepage display)
// @route   GET /api/reviews
// @access  Public
exports.getReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find()
      .populate('user', 'fullName profileImage')
      .sort('-createdAt')
      .limit(20);

    res.status(200).json({ success: true, count: reviews.length, data: reviews });
  } catch (err) {
    next(err);
  }
};

// @desc    Check if current user already has a review
// @route   GET /api/reviews/mine
// @access  Private
exports.getMyReview = async (req, res, next) => {
  try {
    const review = await Review.findOne({ user: req.user.id });
    res.status(200).json({ success: true, data: review || null });
  } catch (err) {
    next(err);
  }
};

// @desc    Create or update a review
// @route   POST /api/reviews
// @access  Private
exports.createReview = async (req, res, next) => {
  try {
    const { rating, message } = req.body;

    // Upsert — update if exists, create if not
    const review = await Review.findOneAndUpdate(
      { user: req.user.id },
      { rating, message, createdAt: Date.now() },
      { upsert: true, new: true, runValidators: true }
    );

    const populated = await review.populate('user', 'fullName profileImage');

    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete a review
// @route   DELETE /api/reviews/:id
// @access  Private (owner or admin)
exports.deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      res.status(404);
      throw new Error('Review not found');
    }

    if (review.user.toString() !== req.user.id && req.user.role !== 'admin') {
      res.status(403);
      throw new Error('Not authorized to delete this review');
    }

    await review.deleteOne();
    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    next(err);
  }
};
