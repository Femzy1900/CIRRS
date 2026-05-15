const express = require('express');
const {
  register,
  login,
  logout,
  getMe,
  forgotPassword,
  resetPassword,
  verifyEmail,
} = require('../controllers/authController');

const router = express.Router();

const { protect } = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.get('/logout', logout);
router.get('/me', protect, getMe);
router.post('/forgotpassword', forgotPassword);
router.put('/resetpassword/:resettoken', resetPassword);
router.get('/verifyemail/:verificationtoken', verifyEmail);

module.exports = router;
