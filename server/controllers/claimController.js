const Claim        = require('../models/Claim');
const Item         = require('../models/Item');
const User         = require('../models/User');
const Notification = require('../models/Notification');
const sendEmail    = require('../utils/sendEmail');

const { gradeAnswers, isPassing, calculateCompositeScore } = require('../utils/fuzzyMatch');
const { routeClaim }   = require('../utils/riskRouter');
const { detectFraud }  = require('../utils/fraudDetection');

// ─────────────────────────────────────────────────────────────────────────────
// Private helper: share finder contact details when a claim is approved
// ─────────────────────────────────────────────────────────────────────────────
async function approveAndShare({ claim, item, finder, claimantId, actorId, actorRole, reviewNote }) {
  // Mark item as claimed (awaiting physical handover)
  await Item.findByIdAndUpdate(item._id, { status: 'claimed' });

  // Update claim to approved
  claim.status     = 'approved';
  claim.passed     = true;
  if (reviewNote) claim.reviewNote = reviewNote;
  claim.auditLog.push({
    action:    'approved',
    actor:     actorId,
    actorRole,
    note:      reviewNote || `Approved by ${actorRole}`
  });
  await claim.save();

  const finderContact = {
    fullName: finder.fullName,
    email:    finder.email,
    phone:    finder.phone || null
  };

  // Notify finder
  await Notification.create({
    user:    finder._id,
    type:    'claim_approved',
    title:   'Your item has been claimed!',
    message: `A claim for "${item.title}" was approved. Contact details have been exchanged — please confirm the handover and mark as Resolved.`,
    link:    `/item/${item._id}`
  });

  // Notify claimant
  await Notification.create({
    user:    claimantId,
    type:    'claim_approved',
    title:   'Claim Approved!',
    message: `Your claim for "${item.title}" was approved. Check your email for the finder's contact details.`,
    link:    `/item/${item._id}`
  });

  // Email finder
  await sendEmail({
    email:   finder.email,
    subject: `"${item.title}" has been claimed — CIRS`,
    message: `Hello ${finder.fullName},\n\nA verified claim for "${item.title}" was approved.\n\nPlease arrange a safe handover on campus, then mark the item as Resolved to close this report.`
  }).catch(err => console.error('[Email] Finder notification failed:', err.message));

  // Email claimant with contact info
  const claimantUser = await User.findById(claimantId).select('email fullName').lean();
  if (claimantUser?.email) {
    await sendEmail({
      email:   claimantUser.email,
      subject: `Claim Approved! Contact details for "${item.title}" — CIRS`,
      message: `Congratulations ${claimantUser.fullName}!\n\nYour claim for "${item.title}" was APPROVED.\n\nFinder Contact:\nName:  ${finder.fullName}\nEmail: ${finder.email}\nPhone: ${finder.phone || 'Not provided'}\n\nPlease arrange a safe public meeting on campus to collect your item.`
    }).catch(err => console.error('[Email] Claimant notification failed:', err.message));
  }

  return finderContact;
}

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Submit a claim for a found item
// @route   POST /api/claims/:itemId
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
exports.submitClaim = async (req, res, next) => {
  try {
    const item = await Item.findById(req.params.itemId).populate('postedBy');

    if (!item) {
      res.status(404);
      throw new Error(`Item not found with id ${req.params.itemId}`);
    }

    if (item.status !== 'found' && item.status !== 'claimed') {
      res.status(400);
      throw new Error("Claims can only be submitted for items that are currently 'found'.");
    }

    if (!item.verificationQuestions || item.verificationQuestions.length === 0) {
      res.status(400);
      throw new Error('This item has no verification questions. Contact the finder directly.');
    }

    if (item.postedBy._id.toString() === req.user.id) {
      res.status(400);
      throw new Error('You cannot submit a claim for an item you reported.');
    }

    const existing = await Claim.findOne({ item: item._id, claimant: req.user.id });
    if (existing) {
      res.status(400);
      throw new Error('You have already submitted a claim for this item.');
    }

    // ── Grade answers ─────────────────────────────────────────────────────────
    const { answers: submitted, locationHint, reportedTime } = req.body;

    const gradeResult = gradeAnswers(submitted || [], item.verificationQuestions || []);
    const { gradedAnswers, score, totalQuestions } = gradeResult;

    // ── Composite score (answers + location + time + detail quality) ──────────
    const compositeScore = calculateCompositeScore(
      gradeResult,
      item,
      locationHint || '',
      reportedTime || null
    );

    // ── Fraud detection ────────────────────────────────────────────────────────
    const fraudFlags = await detectFraud(
      req.user.id,
      item,
      submitted || [],
      locationHint || ''
    );
    const isFlagged = fraudFlags.length > 0;

    // ── Risk-based routing ────────────────────────────────────────────────────
    const { route, status, reason } = routeClaim(item, compositeScore, fraudFlags);

    // isPassing is now only used as supplementary info — routing decides status
    const passed = status === 'approved';

    // ── Create the claim ───────────────────────────────────────────────────────
    const claim = await Claim.create({
      item:           item._id,
      claimant:       req.user.id,
      answers:        gradedAnswers,
      score,
      totalQuestions,
      compositeScore,
      passed,
      locationHint:   locationHint || '',
      reportedTime:   reportedTime ? new Date(reportedTime) : undefined,
      status,
      riskRoute:      route,
      routeReason:    reason,
      fraudFlags,
      isFlagged,
      auditLog: [{
        action:    passed ? 'auto_approved' : 'submitted',
        actorRole: 'system',
        note:      reason
      }]
    });

    // ── Build response ─────────────────────────────────────────────────────────
    const responseData = {
      claim,
      score,
      totalQuestions,
      compositeScore,
      passed,
      status,
      route,
      reason,
      finderContact: null
    };

    // ── AUTO approved: share contacts immediately ──────────────────────────────
    if (route === 'AUTO' && status === 'approved') {
      const finder = item.postedBy;
      responseData.finderContact = await approveAndShare({
        claim,
        item,
        finder,
        claimantId: req.user.id,
        actorId:    null,
        actorRole:  'system',
        reviewNote: reason
      });
    }
    // ── FINDER_REVIEW: notify finder to review this claim ─────────────────────
    else if (route === 'FINDER_REVIEW') {
      await Notification.create({
        user:    item.postedBy._id,
        type:    'claim_submitted',
        title:   'New claim awaiting your review',
        message: `Someone has submitted a claim for "${item.title}". Please review their answers and approve or reject the claim.`,
        link:    `/item/${item._id}`
      });

      // Notify claimant that it's under review
      await Notification.create({
        user:    req.user.id,
        type:    'claim_submitted',
        title:   'Claim submitted — awaiting finder review',
        message: `Your claim for "${item.title}" is under review. The finder will decide whether to approve or reject it.`,
        link:    `/item/${item._id}`
      });
    }
    // ── ADMIN_REVIEW: notify admins ───────────────────────────────────────────
    else if (route === 'ADMIN_REVIEW') {
      // Find all admins and notify them
      const admins = await User.find({ role: 'admin' }).select('_id').lean();
      await Notification.insertMany(
        admins.map(admin => ({
          user:    admin._id,
          type:    'claim_submitted',
          title:   isFlagged ? '⚠ Flagged claim requires admin review' : 'High-risk claim requires admin review',
          message: `A claim for "${item.title}" (${item.riskLevel} risk${isFlagged ? ', flagged' : ''}) requires your review.`,
          link:    `/item/${item._id}`
        }))
      );

      // Notify claimant
      await Notification.create({
        user:    req.user.id,
        type:    'claim_submitted',
        title:   'Claim submitted — under admin review',
        message: `Your claim for "${item.title}" is being reviewed by our team due to the nature of the item. You will be notified of the decision.`,
        link:    `/item/${item._id}`
      });
    }

    res.status(201).json({ success: true, data: responseData });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get all claims for an item (Finder / Admin)
// @route   GET /api/claims/item/:itemId
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
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
      .populate('claimant', 'fullName email profileImage phone')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: claims });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get current user's claim for a specific item
// @route   GET /api/claims/my/:itemId
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
exports.getMyClaimForItem = async (req, res, next) => {
  try {
    const claim = await Claim.findOne({
      item:     req.params.itemId,
      claimant: req.user.id
    }).populate('item', 'title postedBy');

    if (!claim) {
      return res.status(200).json({ success: true, data: null });
    }

    // If approved, also return finder contact info
    let finderContact = null;
    if (claim.passed || claim.status === 'approved') {
      const item = await Item.findById(claim.item).populate('postedBy', 'fullName email phone');
      if (item?.postedBy) {
        finderContact = {
          fullName: item.postedBy.fullName,
          email:    item.postedBy.email,
          phone:    item.postedBy.phone || null
        };
      }
    }

    res.status(200).json({ success: true, data: { claim, finderContact } });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Update claim status (Finder can approve/reject/escalate their items;
//          Admin can approve/reject/mark-disputed any claim)
// @route   PUT /api/claims/:id
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
exports.updateClaimStatus = async (req, res, next) => {
  try {
    const claim = await Claim.findById(req.params.id)
      .populate({ path: 'item', populate: { path: 'postedBy' } })
      .populate('claimant');

    if (!claim) {
      res.status(404);
      throw new Error('Claim not found');
    }

    const isAdmin   = req.user.role === 'admin';
    const isFinder  = claim.item.postedBy._id.toString() === req.user.id;

    if (!isFinder && !isAdmin) {
      res.status(403);
      throw new Error('Not authorized to update this claim');
    }

    const { status, reviewNote } = req.body;
    const VALID_STATUSES = ['approved', 'rejected', 'escalated', 'disputed'];

    if (!VALID_STATUSES.includes(status)) {
      res.status(400);
      throw new Error(`Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`);
    }

    // Guard: cannot change a finalised claim
    if (['approved', 'rejected'].includes(claim.status)) {
      res.status(400);
      throw new Error(`This claim is already ${claim.status} and cannot be changed.`);
    }

    // Guard: only admin can mark as disputed
    if (status === 'disputed' && !isAdmin) {
      res.status(403);
      throw new Error('Only admins can mark a claim as disputed.');
    }

    // Guard: only finder can escalate (to push to admin)
    if (status === 'escalated' && !isFinder) {
      res.status(403);
      throw new Error('Only the finder can escalate a claim to admin review.');
    }

    const actorRole = isAdmin ? 'admin' : 'finder';

    // ── APPROVED ──────────────────────────────────────────────────────────────
    if (status === 'approved') {
      const finder = claim.item.postedBy;
      await approveAndShare({
        claim,
        item:       claim.item,
        finder,
        claimantId: claim.claimant._id,
        actorId:    req.user.id,
        actorRole,
        reviewNote
      });

      const updated = await Claim.findById(claim._id).populate('claimant', 'fullName email');
      return res.status(200).json({ success: true, data: updated });
    }

    // ── REJECTED ──────────────────────────────────────────────────────────────
    if (status === 'rejected') {
      claim.status = 'rejected';
      if (reviewNote) claim.reviewNote = reviewNote;
      claim.auditLog.push({
        action:    'rejected',
        actor:     req.user.id,
        actorRole,
        note:      reviewNote || `Rejected by ${actorRole}`
      });
      await claim.save();

      await Notification.create({
        user:    claim.claimant._id,
        type:    'claim_rejected',
        title:   'Claim Rejected',
        message: `Your claim for "${claim.item.title}" was rejected by the ${actorRole}.${reviewNote ? ` Note: "${reviewNote}"` : ''}`,
        link:    `/item/${claim.item._id}`
      });

      return res.status(200).json({ success: true, data: claim });
    }

    // ── ESCALATED (finder → admin) ────────────────────────────────────────────
    if (status === 'escalated') {
      claim.status     = 'escalated';
      claim.riskRoute  = 'ADMIN_REVIEW';
      if (reviewNote) claim.reviewNote = reviewNote;
      claim.auditLog.push({
        action:    'escalated',
        actor:     req.user.id,
        actorRole: 'finder',
        note:      reviewNote || 'Escalated by finder to admin review'
      });
      await claim.save();

      // Notify admins
      const admins = await User.find({ role: 'admin' }).select('_id').lean();
      await Notification.insertMany(
        admins.map(admin => ({
          user:    admin._id,
          type:    'claim_submitted',
          title:   'Claim escalated by finder — needs admin decision',
          message: `The finder escalated a claim for "${claim.item.title}" to admin. Your review is required.`,
          link:    `/item/${claim.item._id}`
        }))
      );

      // Notify claimant
      await Notification.create({
        user:    claim.claimant._id,
        type:    'claim_submitted',
        title:   'Claim escalated to admin review',
        message: `Your claim for "${claim.item.title}" has been escalated to admin review. You will be notified of the final decision.`,
        link:    `/item/${claim.item._id}`
      });

      return res.status(200).json({ success: true, data: claim });
    }

    // ── DISPUTED ──────────────────────────────────────────────────────────────
    if (status === 'disputed') {
      claim.status = 'disputed';
      if (reviewNote) claim.reviewNote = reviewNote;
      claim.auditLog.push({
        action:    'disputed',
        actor:     req.user.id,
        actorRole: 'admin',
        note:      reviewNote || 'Marked as disputed by admin'
      });
      await claim.save();

      return res.status(200).json({ success: true, data: claim });
    }

  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get all fraud-flagged claims (Admin only)
// @route   GET /api/claims/flagged
// @access  Private + Admin
// ─────────────────────────────────────────────────────────────────────────────
exports.getFlaggedClaims = async (req, res, next) => {
  try {
    const claims = await Claim.find({ isFlagged: true })
      .populate('claimant', 'fullName email username profileImage')
      .populate({ path: 'item', select: 'title category riskLevel location status' })
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: claims.length, data: claims });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get claim audit log (Admin / Finder of the item)
// @route   GET /api/claims/:id/audit
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
exports.getClaimAudit = async (req, res, next) => {
  try {
    const claim = await Claim.findById(req.params.id)
      .select('auditLog riskRoute routeReason fraudFlags isFlagged status compositeScore score totalQuestions')
      .populate({ path: 'item', select: 'title postedBy riskLevel' })
      .populate({ path: 'auditLog.actor', select: 'fullName role' });

    if (!claim) {
      res.status(404);
      throw new Error('Claim not found');
    }

    const isAdmin  = req.user.role === 'admin';
    const isFinder = claim.item?.postedBy?.toString() === req.user.id;

    if (!isAdmin && !isFinder) {
      res.status(403);
      throw new Error('Not authorized to view this audit log');
    }

    res.status(200).json({ success: true, data: claim });
  } catch (err) {
    next(err);
  }
};
