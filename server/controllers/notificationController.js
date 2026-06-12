const Notification = require('../models/Notification');

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
exports.getNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ user: req.user._id }).sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      data: notifications
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
exports.markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { read: true },
      { new: true }
    );

    if (!notification) {
      res.status(404);
      throw new Error('Notification not found');
    }

    res.status(200).json({
      success: true,
      data: notification
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Clear all notifications
// @route   DELETE /api/notifications
// @access  Private
exports.clearNotifications = async (req, res, next) => {
  try {
    await Notification.deleteMany({ user: req.user._id });
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};
