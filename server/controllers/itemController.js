const Item = require('../models/Item');
const Notification = require('../models/Notification');
const { runMatchingForItem } = require('../utils/matchItems');

// @desc    Get all items (with filtering, search, pagination)
// @route   GET /api/items
// @access  Public
exports.getItems = async (req, res, next) => {
  try {
    const { select, sort, page, limit, search, dateFrom, dateTo, ...rest } = req.query;

    // Build base filter from remaining query params (supports gt/gte/lt/lte/in)
    let queryStr = JSON.stringify(rest);
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, m => `$${m}`);
    const parsedQuery = JSON.parse(queryStr);

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

    // Populate postedBy so the matching engine can access email/fullName
    const populated = await Item.findById(item._id).populate('postedBy', 'email fullName _id');

    // Run bidirectional matching in background (don't await — don't block response)
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    runMatchingForItem(populated, clientUrl).then(count => {
      if (count > 0) console.log(`[MatchEngine] Found ${count} match(es) for item "${item.title}"`);
    });

    res.status(201).json({ success: true, data: item });
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
    });

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
