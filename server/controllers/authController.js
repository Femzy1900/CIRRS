const crypto = require('crypto');
const { getAuth } = require('../config/firebase');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL || 'adedokunfemi14@gmail.com';

// Helper: generate a unique username from a base string
const generateUsername = async (base) => {
  const cleaned = base.toLowerCase().replace(/[^a-z0-9]/g, '');
  let username = cleaned || 'user';
  let exists = await User.findOne({ username });
  let attempts = 0;
  while (exists && attempts < 10) {
    username = `${cleaned}${Math.floor(100 + Math.random() * 900)}`;
    exists = await User.findOne({ username });
    attempts++;
  }
  return username;
};

// @desc    Sync Firebase user with MongoDB (called after every login / register)
// @route   POST /api/auth/sync
// @access  Firebase token required (not yet in DB)
exports.syncUser = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      res.status(401);
      throw new Error('No token provided');
    }

    // Verify the Firebase token
    const decoded = await getAuth().verifyIdToken(token);
    const { uid, email, email_verified, name, picture } = decoded;

    const isSuperAdmin = email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();

    // 1. Try to find by Firebase UID
    let user = await User.findOne({ firebaseUid: uid });

    if (!user) {
      // 2. Try to find existing MongoDB account by email (migration / re-register)
      user = await User.findOne({ email });

      if (user) {
        // Link existing account to Firebase
        user.firebaseUid = uid;
        user.isVerified = email_verified;
        if (isSuperAdmin) {
          user.isSuperAdmin = true;
          user.role = 'admin';
        }
        await user.save();
      } else {
        // 3. Brand-new user — create MongoDB record
        const { fullName, username } = req.body;

        const finalFullName = fullName || name || email.split('@')[0];
        const baseForUsername = username || (name ? name.split(' ')[0] : email.split('@')[0]);
        const finalUsername = username
          ? username
          : await generateUsername(baseForUsername);

        user = await User.create({
          firebaseUid: uid,
          fullName: finalFullName,
          username: finalUsername,
          email,
          isVerified: email_verified,
          profileImage: picture || 'default-profile.png',
          role: isSuperAdmin ? 'admin' : 'user',
          isSuperAdmin,
        });
      }
    } else {
      // Already linked — just refresh verification status
      user.isVerified = email_verified;
      if (isSuperAdmin && !user.isSuperAdmin) {
        user.isSuperAdmin = true;
        user.role = 'admin';
      }
      await user.save();
    }

    res.status(200).json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

// @desc    Get current logged-in user from MongoDB
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    res.status(200).json({ success: true, data: req.user });
  } catch (err) {
    next(err);
  }
};

// @desc    Update user profile in MongoDB (and Firebase display name)
// @route   PUT /api/auth/updateprofile
// @access  Private
exports.updateProfile = async (req, res, next) => {
  try {
    const { fullName, username, phone, faculty, profileImage } = req.body;
    const user = req.user;

    if (fullName) user.fullName = fullName;
    if (username) user.username = username;
    if (phone !== undefined) user.phone = phone;
    if (faculty !== undefined) user.faculty = faculty;
    if (profileImage) user.profileImage = profileImage;

    await user.save();

    // Keep Firebase display name in sync
    if (fullName && req.firebaseUser?.uid) {
      await getAuth().updateUser(req.firebaseUser.uid, { displayName: fullName });
    }

    res.status(200).json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete account from both Firebase and MongoDB
// @route   DELETE /api/auth/deleteaccount
// @access  Private
exports.deleteAccount = async (req, res, next) => {
  try {
    const uid = req.firebaseUser.uid;
    const userId = req.user._id;

    // Delete from Firebase Auth
    await getAuth().deleteUser(uid);

    // Delete from MongoDB
    await User.findByIdAndDelete(userId);

    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    next(err);
  }
};
