const Claim = require('../models/Claim');
const Item = require('../models/Item');
const User = require('../models/User');
const Notification = require('../models/Notification');
const sendEmail = require('../utils/sendEmail');
const { gradeAnswers, isPassing } = require('../utils/fuzzyMatch');

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

    if (item.status !== 'found' && item.status !== 'claimed') {
      res.status(400);
      throw new Error(`Claims can only be submitted for items that are currently 'found'.`);
    }

    // Require at least one verification question
    if (!item.verificationQuestions || item.verificationQuestions.length === 0) {
      res.status(400);
      throw new Error('This item has no verification questions. Contact the finder directly.');
    }

    // Prevent finder from claiming their own item
    if (item.postedBy._id.toString() === req.user.id) {
      res.status(400);
      throw new Error('You cannot submit a claim for an item you reported.');
    }

    // Prevent duplicate claims
    const existingClaim = await Claim.findOne({ item: item._id, claimant: req.user.id });
    if (existingClaim) {
      res.status(400);
      throw new Error('You have already submitted a claim for this item.');
    }

    // ── Grade answers with fuzzy matching ─────────────────────────────
    const { answers: submitted } = req.body;
    const { gradedAnswers, score, totalQuestions } = gradeAnswers(
      submitted || [],
      item.verificationQuestions || []
    );

    const passed = isPassing(score, totalQuestions, item.category);
    const autoStatus = passed ? 'approved' : 'rejected';

    // ── Create the claim ───────────────────────────────────────────────
    const claim = await Claim.create({
      item: item._id,
      claimant: req.user.id,
      answers: gradedAnswers,
      score,
      totalQuestions,
      passed,
      status: autoStatus,
    });

    // ── Build the response payload ─────────────────────────────────────
    const responseData = {
      claim,
      score,
      totalQuestions,
      passed,
    };

    // If passed, attach finder contact info directly in the response
    if (passed) {
      const finder = item.postedBy;
      responseData.finderContact = {
        fullName: finder.fullName,
        email: finder.email,
        phone: finder.phone || null,
      };

      // Notify finder that their item was successfully claimed
      await Notification.create({
        user: finder._id,
        type: 'claim_approved',
        title: 'Your item has been claimed!',
        message: `Someone answered your security questions correctly and claimed "${item.title}". Contact details have been exchanged — please confirm the handover and mark the item as Resolved.`,
        link: `/item/${item._id}`
      });

      // Mark item as claimed (awaiting physical handover confirmation by poster)
      await Item.findByIdAndUpdate(item._id, { status: 'claimed' });

      // Email the finder
      await sendEmail({
        email: finder.email,
        subject: `"${item.title}" has been claimed — CIRS`,
        message: `Hello ${finder.fullName},\n\nSomeone answered your security questions correctly and claimed "${item.title}".\n\nThey passed ${score}/${totalQuestions} questions.\n\nContact details have been shared with the claimant. Please arrange a safe handover on campus, then return to the item page and mark it as Resolved to close it out.`
      }).catch(err => console.error('Email send failed', err));

      // Email the claimant with finder contact info
      const claimant = await User.findById(req.user.id);
      if (claimant?.email) {
        await sendEmail({
          email: claimant.email,
          subject: `Ownership verified! Contact details for "${item.title}" — CIRS`,
          message: `Congratulations!\n\nYou passed the ownership verification for "${item.title}" (${score}/${totalQuestions} correct).\n\nFinder Contact Details:\nName: ${finder.fullName}\nEmail: ${finder.email}\nPhone: ${finder.phone || 'Not provided'}\n\nPlease arrange a safe public meeting on campus to collect your item.`
        }).catch(err => console.error('Email send failed', err));
      }

    } else {
      // Notify finder of failed claim attempt
      await Notification.create({
        user: item.postedBy._id,
        type: 'claim_submitted',
        title: 'Failed claim attempt on your item',
        message: `Someone tried to claim "${item.title}" but only got ${score}/${totalQuestions} answers correct. The claim was automatically rejected.`,
        link: `/item/${item._id}`
      });

      // Notify claimant of rejection
      await Notification.create({
        user: req.user.id,
        type: 'claim_rejected',
        title: 'Claim verification failed',
        message: `You answered ${score}/${totalQuestions} questions correctly for "${item.title}". The required minimum was not met. You may not resubmit.`,
        link: `/item/${item._id}`
      });
    }

    res.status(201).json({
      success: true,
      data: responseData,
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

    if (item.postedBy.toString() !== req.user.id && req.user.role !== 'admin') {
      res.status(403);
      throw new Error('Not authorized to view claims for this item');
    }

    const claims = await Claim.find({ item: req.params.itemId })
      .populate('claimant', 'fullName email profileImage phone');

    res.status(200).json({ success: true, data: claims });
  } catch (err) {
    next(err);
  }
};

// @desc    Get the current user's claim for a specific item
// @route   GET /api/claims/my/:itemId
// @access  Private
exports.getMyClaimForItem = async (req, res, next) => {
  try {
    const claim = await Claim.findOne({
      item: req.params.itemId,
      claimant: req.user.id,
    }).populate('item', 'title postedBy');

    if (!claim) {
      return res.status(200).json({ success: true, data: null });
    }

    // If approved, also return finder contact info
    let finderContact = null;
    if (claim.passed) {
      const item = await Item.findById(claim.item).populate('postedBy', 'fullName email phone');
      if (item?.postedBy) {
        finderContact = {
          fullName: item.postedBy.fullName,
          email: item.postedBy.email,
          phone: item.postedBy.phone || null,
        };
      }
    }

    res.status(200).json({ success: true, data: { claim, finderContact } });
  } catch (err) {
    next(err);
  }
};

// @desc    Manual override: update claim status (Admin / Finder)
// @route   PUT /api/claims/:id
// @access  Private
exports.updateClaimStatus = async (req, res, next) => {
  try {
    const claim = await Claim.findById(req.params.id).populate('item').populate('claimant');

    if (!claim) {
      res.status(404);
      throw new Error('Claim not found');
    }

    if (claim.item.postedBy.toString() !== req.user.id && req.user.role !== 'admin') {
      res.status(403);
      throw new Error('Not authorized to update this claim');
    }

    const { status } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      res.status(400);
      throw new Error('Invalid status');
    }

    // Prevent overwriting an already-finalised approval
    if (claim.passed) {
      res.status(400);
      throw new Error('This claim has already been approved and the claimant notified. No further changes are allowed.');
    }

    claim.status = status;
    if (status === 'approved') claim.passed = true;
    await claim.save();

    if (status === 'approved') {
      await Item.findByIdAndUpdate(claim.item._id, { status: 'claimed' });

      const finder = await User.findById(claim.item.postedBy);

      await Notification.create({
        user: claim.claimant._id || claim.claimant,
        type: 'claim_approved',
        title: 'Claim Manually Approved!',
        message: `Your claim for "${claim.item.title}" was approved by the finder.`,
        link: `/item/${claim.item._id}`
      });

      if (claim.claimant?.email && finder) {
        await sendEmail({
          email: claim.claimant.email,
          subject: 'Claim Approved! — CIRS',
          message: `Good news!\n\nYour claim for "${claim.item.title}" was APPROVED.\n\nFinder Name: ${finder.fullName}\nFinder Email: ${finder.email}\nPhone: ${finder.phone || 'N/A'}`
        }).catch(err => console.error(err));
      }
    } else {
      await Notification.create({
        user: claim.claimant._id || claim.claimant,
        type: 'claim_rejected',
        title: 'Claim Rejected',
        message: `Your claim for "${claim.item.title}" was rejected.`,
        link: `/item/${claim.item._id}`
      });
    }

    res.status(200).json({ success: true, data: claim });
  } catch (err) {
    next(err);
  }
};
