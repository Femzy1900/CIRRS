const express = require('express');
const {
  register,
  login,
  logout,
  getMe,
  updateProfile,
  deleteAccount,
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
router.put('/updateprofile', protect, updateProfile);
router.delete('/deleteaccount', protect, deleteAccount);
router.post('/forgotpassword', forgotPassword);
router.put('/resetpassword/:resettoken', resetPassword);
router.get('/verifyemail/:verificationtoken', verifyEmail);

module.exports = router;
