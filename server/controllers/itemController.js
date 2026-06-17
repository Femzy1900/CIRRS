const Item = require('../models/Item');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { runMatchingForItem } = require('../utils/matchItems');

// @desc    Get all items (with filtering, search, pagination)
// @route   GET /api/items
// @access  Public
exports.getItems = async (req, res, next) => {
  try {
    const { select, sort, page, limit, search, dateFrom, dateTo, ...rest } = req.query;

    // Whitelist allowed filter fields to prevent NoSQL injection via req.query
    const ALLOWED_FILTERS = ['status', 'category'];
    const safeRest = {};
    ALLOWED_FILTERS.forEach(key => {
      if (rest[key] !== undefined) safeRest[key] = rest[key];
    });

    // Build base filter — only from whitelisted fields
    let queryStr = JSON.stringify(safeRest);
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, m => `$${m}`);
    const parsedQuery = JSON.parse(queryStr);

    // 'active' is a pseudo-status: only show items still open (lost or found)
    // Applied after JSON parse so $in isn't double-prefixed to $$in
    if (parsedQuery.status === 'active') {
      parsedQuery.status = { $in: ['lost', 'found'] };
    }

    // Text search
    if (search) {
      parsedQuery.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
      ];
    }

    // Date range
    if (dateFrom || dateTo) {
      parsedQuery.date = {};
      if (dateFrom) parsedQuery.date.$gte = new Date(dateFrom);
      if (dateTo) {
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);
        parsedQuery.date.$lte = end;
      }
    }

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit) || 12));
    const skip = (pageNum - 1) * limitNum;

    const total = await Item.countDocuments(parsedQuery);

    let query = Item.find(parsedQuery)
      .populate({ path: 'postedBy', select: 'fullName username profileImage' })
      .skip(skip)
      .limit(limitNum);

    // Sort
    if (sort) {
      query = query.sort(sort.split(',').join(' '));
    } else {
      query = query.sort('-createdAt');
    }

    const items = await query;

    res.status(200).json({
      success: true,
      count: items.length,
      total,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      data: items,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single item
// @route   GET /api/items/:id
// @access  Public
exports.getItem = async (req, res, next) => {
  try {
    const item = await Item.findById(req.params.id).populate({
      path: 'postedBy',
      select: 'fullName username profileImage email',
    });

    if (!item) {
      res.status(404);
      throw new Error(`Item not found with id of ${req.params.id}`);
    }

    res.status(200).json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
};

// @desc    Create new item
// @route   POST /api/items
// @access  Private
exports.createItem = async (req, res, next) => {
  try {
    req.body.postedBy = req.user.id;
    const item = await Item.create(req.body);

    // Populate postedBy so the matching engine and client both get the full user object
    const populated = await Item.findById(item._id).populate('postedBy', 'email fullName username profileImage _id');

    // Run bidirectional matching in background (don't await — don't block response)
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    runMatchingForItem(populated, clientUrl).then(count => {
      if (count > 0) console.log(`[MatchEngine] Found ${count} match(es) for item "${item.title}"`);
    });

    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    next(err);
  }
};

// @desc    Update item
// @route   PUT /api/items/:id
// @access  Private
exports.updateItem = async (req, res, next) => {
  try {
    let item = await Item.findById(req.params.id);

    if (!item) {
      res.status(404);
      throw new Error(`Item not found with id of ${req.params.id}`);
    }

    if (item.postedBy.toString() !== req.user.id && req.user.role !== 'admin') {
      res.status(403);
      throw new Error(`Not authorized to update this item`);
    }

    item = await Item.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('postedBy', 'email fullName username profileImage _id');

    res.status(200).json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete item
// @route   DELETE /api/items/:id
// @access  Private
exports.deleteItem = async (req, res, next) => {
  try {
    const item = await Item.findById(req.params.id);

    if (!item) {
      res.status(404);
      throw new Error(`Item not found with id of ${req.params.id}`);
    }

    if (item.postedBy.toString() !== req.user.id && req.user.role !== 'admin') {
      res.status(403);
      throw new Error(`Not authorized to delete this item`);
    }

    await item.deleteOne();

    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    next(err);
  }
};

// @desc    Reveal contact info for a lost item poster (finder pressed "I found this")
// @route   POST /api/items/:id/contact
// @access  Private
exports.contactItem = async (req, res, next) => {
  try {
    const item = await Item.findById(req.params.id).populate('postedBy', 'fullName username email phone profileImage');

    if (!item) {
      res.status(404);
      throw new Error('Item not found');
    }

    if (item.status !== 'lost') {
      res.status(400);
      throw new Error('Contact can only be requested for lost items');
    }

    const posterId = item.postedBy?._id?.toString() || item.postedBy?.toString();
    if (posterId === req.user.id) {
      res.status(400);
      throw new Error('You cannot contact yourself');
    }

    // Get finder info for the notification message
    const finder = await User.findById(req.user.id).select('fullName username');
    const finderName = finder?.fullName || finder?.username || 'Someone';

    // Notify the poster
    await Notification.create({
      user: posterId,
      type: 'finder_contact',
      title: '📦 Someone found your item!',
      message: `${finderName} says they found your lost item: "${item.title}". Check their contact details to arrange return.`,
      link: `/item/${item._id}`,
    });

    // Return the poster's contact details
    const poster = item.postedBy;
    res.status(200).json({
      success: true,
      data: {
        fullName: poster.fullName || poster.username || 'Unknown',
        email: poster.email,
        phone: poster.phone || null,
      },
    });
  } catch (err) {
    next(err);
  }
};
