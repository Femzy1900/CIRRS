const User = require('../models/User');
const Item = require('../models/Item');
const Claim = require('../models/Claim');
const Notification = require('../models/Notification');

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
exports.getUsers = async (req, res, next) => {
  try {
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      data: users
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update user role
// @route   PUT /api/admin/users/:id/role
// @access  Private/SuperAdmin only
exports.updateUserRole = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    // Prevent changing your own role
    if (user._id.toString() === req.user._id.toString()) {
      res.status(400);
      throw new Error('You cannot change your own role');
    }

    // Protect the super admin — no one can demote them
    if (user.isSuperAdmin) {
      res.status(403);
      throw new Error('The super admin role cannot be changed');
    }

    const { role } = req.body;
    if (!['user', 'admin'].includes(role)) {
      res.status(400);
      throw new Error('Invalid role specified');
    }

    user.role = role;
    await user.save();

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    // Prevent deleting yourself
    if (user._id.toString() === req.user._id.toString()) {
      res.status(400);
      throw new Error('You cannot delete your own account');
    }

    // Protect the super admin from deletion
    if (user.isSuperAdmin) {
      res.status(403);
      throw new Error('The super admin account cannot be deleted');
    }

    // Cascade delete: remove user's items, claims, and notifications
    const userItems = await Item.find({ postedBy: req.params.id }).select('_id');
    const itemIds = userItems.map(i => i._id);
    await Claim.deleteMany({ $or: [{ claimant: req.params.id }, { item: { $in: itemIds } }] });
    await Item.deleteMany({ postedBy: req.params.id });
    await Notification.deleteMany({ user: req.params.id });
    await User.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get admin dashboard stats
// @route   GET /api/admin/stats
// @access  Private/Admin
exports.getStats = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const adminCount = await User.countDocuments({ role: 'admin' });
    const verifiedUsers = await User.countDocuments({ isVerified: true });

    const totalItems = await Item.countDocuments();
    const lostItems = await Item.countDocuments({ status: 'lost' });
    const foundItems = await Item.countDocuments({ status: 'found' });
    
    // We'll consider a 'resolved' status in the future, for now mock recovered or use claims logic
    const recoveredItems = await Claim.countDocuments({ status: 'approved' });

    const totalClaims = await Claim.countDocuments();
    const pendingClaims = await Claim.countDocuments({ status: 'pending' });
    const approvedClaims = await Claim.countDocuments({ status: 'approved' });
    const rejectedClaims = await Claim.countDocuments({ status: 'rejected' });

    res.status(200).json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          admins: adminCount,
          verified: verifiedUsers
        },
        items: {
          total: totalItems,
          lost: lostItems,
          found: foundItems,
          recovered: recoveredItems
        },
        claims: {
          total: totalClaims,
          pending: pendingClaims,
          approved: approvedClaims,
          rejected: rejectedClaims
        }
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all claims
// @route   GET /api/admin/claims
// @access  Private/Admin
exports.getAllClaims = async (req, res, next) => {
  try {
    const claims = await Claim.find()
      .populate('claimant', 'fullName username email')
      .populate('item', 'title date')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: claims
    });
  } catch (err) {
    next(err);
  }
};
