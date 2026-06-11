const Claim = require('../models/Claim');
const Item = require('../models/Item');
const User = require('../models/User');
const Notification = require('../models/Notification');
const sendEmail = require('../utils/sendEmail');

// @desc    Submit a claim for a found item
// @route   POST /api/claims/:itemId
// @access  Private
exports.submitClaim = async (req, res, next) => {
  try {
    const item = await Item.findById(req.params.itemId).populate('postedBy');

    if (!item) {
      res.status(404);
      throw new Error(`Item not found with id of ${req.params.itemId}`);
    }

    if (item.status !== 'found') {
      res.status(400);
      throw new Error(`You can only submit claims for 'found' items.`);
    }

    // Check if user already submitted a claim
    const existingClaim = await Claim.findOne({ item: item._id, claimant: req.user.id });
    if (existingClaim) {
      res.status(400);
      throw new Error(`You have already submitted a claim for this item.`);
    }

    // Auto-grade the answers (basic string comparison)
    let score = 0;
    const { answers } = req.body;
    
    if (answers && item.verificationQuestions) {
      answers.forEach(ans => {
        const matchingQuestion = item.verificationQuestions.find(vq => vq.question === ans.question);
        if (matchingQuestion) {
          if (matchingQuestion.answer.toLowerCase().trim() === ans.providedAnswer.toLowerCase().trim()) {
            ans.isCorrect = true;
            score++;
          } else {
            ans.isCorrect = false;
          }
        }
      });
    }

    const claim = await Claim.create({
      item: item._id,
      claimant: req.user.id,
      answers
    });

    // Notify the finder via email
    if (item.postedBy && item.postedBy.email) {
      const claimUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/item/${item._id}`;
      const message = `Hello ${item.postedBy.fullName},\n\nSomeone has submitted a claim for the "${item.title}" you found!\n\nPlease log in to review their answers to your security questions: ${claimUrl}`;
      
      await sendEmail({
        email: item.postedBy.email,
        subject: 'New Claim on your Found Item! - CIRS',
        message
      }).catch(err => console.error("Email send failed", err));
    }

    // Notify the finder via in-app Notification
    await Notification.create({
      user: item.postedBy._id || item.postedBy,
      type: 'claim_submitted',
      title: 'New Claim Submitted',
      message: `Someone submitted a claim for "${item.title}". Please review their answers.`,
      link: `/item/${item._id}`
    });

    res.status(201).json({
      success: true,
      data: claim
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get claims for an item (Finder only)
// @route   GET /api/claims/item/:itemId
// @access  Private
exports.getItemClaims = async (req, res, next) => {
  try {
    const item = await Item.findById(req.params.itemId);
    
    if (!item) {
      res.status(404);
      throw new Error('Item not found');
    }

    // Make sure user is the finder
    if (item.postedBy.toString() !== req.user.id && req.user.role !== 'admin') {
      res.status(403);
      throw new Error('Not authorized to view claims for this item');
    }

    const claims = await Claim.find({ item: req.params.itemId }).populate('claimant', 'fullName email profileImage');

    res.status(200).json({
      success: true,
      data: claims
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update claim status (Approve/Reject)
// @route   PUT /api/claims/:id
// @access  Private
exports.updateClaimStatus = async (req, res, next) => {
  try {
    const claim = await Claim.findById(req.params.id).populate('item').populate('claimant');

    if (!claim) {
      res.status(404);
      throw new Error('Claim not found');
    }

    // Make sure user is the finder
    if (claim.item.postedBy.toString() !== req.user.id && req.user.role !== 'admin') {
      res.status(403);
      throw new Error('Not authorized to update this claim');
    }

    const { status } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      res.status(400);
      throw new Error('Invalid status');
    }

    claim.status = status;
    await claim.save();

    // If approved, notify claimant with finder's contact info
    if (status === 'approved') {
      // Fetch finder's info
      const finder = await User.findById(claim.item.postedBy);
      
      await Notification.create({
        user: claim.claimant._id || claim.claimant,
        type: 'claim_approved',
        title: 'Claim Approved!',
        message: `Your claim for "${claim.item.title}" was approved by the finder.`,
        link: `/item/${claim.item._id}` // Link to the item where they can see contact info
      });

      if (claim.claimant && claim.claimant.email) {
        const message = `Good news!\n\nYour claim for "${claim.item.title}" was APPROVED by the finder.\n\nYou can now contact them to retrieve your item.\n\nFinder Name: ${finder.fullName}\nFinder Email: ${finder.email}\nPhone: ${finder.phone || 'N/A'}`;
        
        await sendEmail({
          email: claim.claimant.email,
          subject: 'Claim Approved! - CIRS',
          message
        }).catch(err => console.error(err));
      }
    } else if (status === 'rejected') {
      await Notification.create({
        user: claim.claimant._id || claim.claimant,
        type: 'claim_rejected',
        title: 'Claim Rejected',
        message: `Your claim for "${claim.item.title}" was rejected due to incorrect security answers.`,
        link: `/item/${claim.item._id}`
      });
    }

    res.status(200).json({
      success: true,
      data: claim
    });
  } catch (err) {
    next(err);
  }
};
