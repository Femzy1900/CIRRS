const Complaint     = require('../models/Complaint');
const Claim         = require('../models/Claim');
const Item          = require('../models/Item');
const User          = require('../models/User');
const Notification  = require('../models/Notification');

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Submit a complaint/appeal to admin after a failed or rejected claim
// @route   POST /api/complaints
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
exports.submitComplaint = async (req, res, next) => {
  try {
    const { item: itemId, claim: claimId, message } = req.body;

    if (!message || !message.trim()) {
      res.status(400);
      throw new Error('A complaint message is required.');
    }

    const item = await Item.findById(itemId);
    if (!item) {
      res.status(404);
      throw new Error('Item not found.');
    }

    // Dedup: one complaint per claimant per item
    const existing = await Complaint.findOne({ claimant: req.user.id, item: itemId });
    if (existing) {
      res.status(409);
      throw new Error('You have already submitted a complaint for this item. Admins will review it shortly.');
    }

    const complaint = await Complaint.create({
      claimant: req.user.id,
      item:     itemId,
      claim:    claimId || null,
      message:  message.trim(),
    });

    // Notify all admins
    const admins = await User.find({ role: 'admin' }).select('_id').lean();
    if (admins.length > 0) {
      await Notification.insertMany(
        admins.map(admin => ({
          user:    admin._id,
          type:    'system',
          title:   '📋 New ownership complaint submitted',
          message: `A user has filed a complaint for item "${item.title}", claiming to be the rightful owner. Review it in the admin panel.`,
          link:    '/admin',
          meta:    { complaintId: complaint._id },
        }))
      );
    }

    res.status(201).json({ success: true, data: complaint });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get all complaints (Admin)
// @route   GET /api/complaints
// @access  Private + Admin
// ─────────────────────────────────────────────────────────────────────────────
exports.getComplaints = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;

    const complaints = await Complaint.find(filter)
      .populate('claimant', 'fullName username email profileImage')
      .populate('item',     'title location category status image')
      .populate('claim',    'score totalQuestions compositeScore status attemptNumber')
      .populate('reviewedBy', 'fullName username')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: complaints.length, data: complaints });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Admin reviews a complaint — approve or dismiss
// @route   PUT /api/complaints/:id
// @access  Private + Admin
// ─────────────────────────────────────────────────────────────────────────────
exports.reviewComplaint = async (req, res, next) => {
  try {
    const { action, adminNote } = req.body;

    if (!['approved', 'dismissed'].includes(action)) {
      res.status(400);
      throw new Error('Action must be "approved" or "dismissed".');
    }

    const complaint = await Complaint.findById(req.params.id)
      .populate('claimant', 'fullName email phone _id')
      .populate({ path: 'item', populate: { path: 'postedBy', select: 'fullName email phone _id' } })
      .populate('claim');

    if (!complaint) {
      res.status(404);
      throw new Error('Complaint not found.');
    }

    if (complaint.status !== 'pending') {
      res.status(400);
      throw new Error(`This complaint has already been ${complaint.status}.`);
    }

    complaint.status     = action;
    complaint.adminNote  = adminNote || '';
    complaint.reviewedBy = req.user.id;
    await complaint.save();

    if (action === 'approved') {
      // ── Manually approve the linked claim (if one exists) ────────────────
      if (complaint.claim) {
        const claim  = await Claim.findById(complaint.claim._id);
        const finder = complaint.item.postedBy;

        if (claim && !['approved', 'withdrawn'].includes(claim.status) && finder) {
          // Inline approval (mirrors approveAndShare logic)
          await Item.findByIdAndUpdate(complaint.item._id, { status: 'claimed' });

          claim.status = 'approved';
          claim.passed = true;
          if (adminNote) claim.reviewNote = `Admin override via complaint: ${adminNote}`;
          claim.auditLog.push({
            action:    'approved',
            actor:     req.user.id,
            actorRole: 'admin',
            note:      `Approved via complaint review. ${adminNote || ''}`.trim(),
          });
          await claim.save();

          const finderContact = {
            fullName: finder.fullName,
            email:    finder.email,
            phone:    finder.phone || null,
          };

          // Notify finder
          await Notification.create({
            user:    finder._id,
            type:    'claim_approved',
            title:   'Your item has been claimed (admin decision)',
            message: `Admin reviewed a complaint for "${complaint.item.title}" and approved the claimant's ownership. Please arrange a handover.`,
            link:    `/item/${complaint.item._id}`,
          });

          // Email claimant with contact info
          const sendEmail = require('../utils/sendEmail');
          await sendEmail({
            email:   complaint.claimant.email,
            subject: `Complaint Approved — Contact details for "${complaint.item.title}" — CIRS`,
            message: `Congratulations ${complaint.claimant.fullName}!\n\nAdmin reviewed your complaint for "${complaint.item.title}" and approved your ownership.\n\nFinder Contact:\nName:  ${finder.fullName}\nEmail: ${finder.email}\nPhone: ${finder.phone || 'Not provided'}\n\nPlease arrange a safe public meeting on campus to collect your item.`
          }).catch(err => console.error('[Complaint] Email to claimant failed:', err.message));
        }
      }

      // Notify claimant of approval
      await Notification.create({
        user:    complaint.claimant._id,
        type:    'claim_approved',
        title:   '✅ Complaint Approved!',
        message: `Admin reviewed your complaint for "${complaint.item.title}" and approved your ownership. Check your email for the finder's contact details.`,
        link:    `/item/${complaint.item._id}`,
        meta:    { adminNote: adminNote || '' },
      });
    } else {
      // Dismissed — notify claimant
      await Notification.create({
        user:    complaint.claimant._id,
        type:    'system',
        title:   'Complaint Reviewed',
        message: `Admin has reviewed your complaint for "${complaint.item.title}" and found it could not be resolved in your favour at this time.${adminNote ? ` Admin note: "${adminNote}"` : ''}`,
        link:    `/item/${complaint.item._id}`,
        meta:    { adminNote: adminNote || '' },
      });
    }

    res.status(200).json({ success: true, data: complaint });
  } catch (err) {
    next(err);
  }
};
