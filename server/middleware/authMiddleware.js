const { getAuth } = require('../config/firebase');
const User = require('../models/User');

// Verify Firebase ID token and attach MongoDB user to req
exports.protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    res.status(401);
    return next(new Error('Not authorized to access this route'));
  }

  try {
    // Verify Firebase token
    const decoded = await getAuth().verifyIdToken(token);
    req.firebaseUser = decoded; // { uid, email, email_verified, ... }

    // Find MongoDB user by Firebase UID
    req.user = await User.findOne({ firebaseUid: decoded.uid });

    if (!req.user) {
      res.status(401);
      return next(new Error('Account not found. Please log in again.'));
    }

    next();
  } catch (err) {
    res.status(401);
    return next(new Error('Not authorized to access this route'));
  }
};

// Grant access to specific roles (super admin always passes)
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (req.user.isSuperAdmin) return next();
    if (!roles.includes(req.user.role)) {
      res.status(403);
      return next(
        new Error(`User role '${req.user.role}' is not authorized to access this route`)
      );
    }
    next();
  };
};

// Super admin only
exports.requireSuperAdmin = (req, res, next) => {
  if (!req.user.isSuperAdmin) {
    res.status(403);
    return next(new Error('Only the super admin can perform this action'));
  }
  next();
};
