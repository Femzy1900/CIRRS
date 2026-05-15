const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const { fullName, username, email, password } = req.body;

    // Create user
    const user = await User.create({
      fullName,
      username,
      email,
      password,
    });

    // Get verification token
    const verificationToken = user.getVerificationToken();

    await user.save({ validateBeforeSave: false });

    // Create verification url
    const verificationUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/verify-email/${verificationToken}`;

    const message = `Welcome to CIRS, ${fullName}! \n\n Please verify your email by clicking the link below: \n\n ${verificationUrl}`;

    try {
      await sendEmail({
        email: user.email,
        subject: 'Email Verification - CIRS',
        message,
        html: `
          <h1>Verify your email</h1>
          <p>Hi ${fullName},</p>
          <p>Thank you for joining CIRS. Please click the button below to verify your email address:</p>
          <a href="${verificationUrl}" style="background-color: #002147; color: #FFD700; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Verify Email</a>
          <p>If you did not request this, please ignore this email.</p>
        `,
      });

      res.status(201).json({
        success: true,
        message: 'Verification email sent. Please check your inbox.',
      });
    } catch (err) {
      console.log(err);
      user.verificationToken = undefined;
      user.verificationExpire = undefined;

      await user.save({ validateBeforeSave: false });

      res.status(500);
      throw new Error('Verification email could not be sent');
    }
  } catch (err) {
    next(err);
  }
};

// @desc    Verify email
// @route   GET /api/auth/verifyemail/:verificationtoken
// @access  Public
exports.verifyEmail = async (req, res, next) => {
  try {
    // Get hashed token
    const verificationToken = crypto
      .createHash('sha256')
      .update(req.params.verificationtoken)
      .digest('hex');

    const user = await User.findOne({
      verificationToken,
      verificationExpire: { $gt: Date.now() },
    });

    if (!user) {
      res.status(400);
      throw new Error('Invalid or expired verification token');
    }

    // Set user to verified
    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationExpire = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Email verified successfully. You can now log in.',
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate email & password
    if (!email || !password) {
      res.status(400);
      throw new Error('Please provide an email and password');
    }

    // Check for user
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      res.status(401);
      throw new Error('Invalid credentials');
    }

    // Check if user is verified
    if (!user.isVerified) {
      res.status(401);
      throw new Error('Please verify your email to log in');
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      res.status(401);
      throw new Error('Invalid credentials');
    }

    sendTokenResponse(user, 200, res);
  } catch (err) {
    next(err);
  }
};

// @desc    Log user out / clear cookie
// @route   GET /api/auth/logout
// @access  Private
exports.logout = async (req, res, next) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  res.status(200).json({
    success: true,
    data: {},
  });
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Forgot password
// @route   POST /api/auth/forgotpassword
// @access  Public
exports.forgotPassword = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
      res.status(404);
      throw new Error('There is no user with that email');
    }

    // Get reset token
    const resetToken = user.getResetPasswordToken();

    await user.save({ validateBeforeSave: false });

    // Create reset url
    const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/resetpassword/${resetToken}`;

    const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please make a PUT request to: \n\n ${resetUrl}`;

    try {
      await sendEmail({
        email: user.email,
        subject: 'Password reset token',
        message,
      });

      res.status(200).json({ success: true, data: 'Email sent' });
    } catch (err) {
      console.log(err);
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;

      await user.save({ validateBeforeSave: false });

      res.status(500);
      throw new Error('Email could not be sent');
    }
  } catch (err) {
    next(err);
  }
};

// @desc    Reset password
// @route   PUT /api/auth/resetpassword/:resettoken
// @access  Public
exports.resetPassword = async (req, res, next) => {
  try {
    // Get hashed token
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.resettoken)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      res.status(400);
      throw new Error('Invalid token');
    }

    // Set new password
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    sendTokenResponse(user, 200, res);
  } catch (err) {
    next(err);
  }
};

// Get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
  // Create token
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d',
  });

  const options = {
    expires: new Date(
      Date.now() + (process.env.JWT_COOKIE_EXPIRE || 30) * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };

  if (process.env.NODE_ENV === 'production') {
    options.secure = true;
  }

  res.status(statusCode).cookie('token', token, options).json({
    success: true,
    token,
    user: {
      id: user._id,
      fullName: user.fullName,
      username: user.username,
      email: user.email,
      role: user.role,
      profileImage: user.profileImage
    }
  });
};
