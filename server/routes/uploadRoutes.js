const express = require('express');
const router = express.Router();
const { upload } = require('../config/cloudinary');
const { protect } = require('../middleware/authMiddleware');

// @desc    Upload an image
// @route   POST /api/upload
// @access  Private
router.post('/', protect, upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image uploaded' });
    }
    
    res.status(200).json({
      success: true,
      url:      req.file.path,       // Cloudinary secure URL
      publicId: req.file.filename,   // Cloudinary public_id (e.g. cirrs_items/abc123)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Image upload failed' });
  }
});

module.exports = router;
