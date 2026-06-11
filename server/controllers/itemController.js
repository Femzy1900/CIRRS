const Item = require('../models/Item');
const Notification = require('../models/Notification');
const sendEmail = require('../utils/sendEmail');

// @desc    Get all items
// @route   GET /api/items
// @access  Public
exports.getItems = async (req, res, next) => {
  try {
    let query;
    const reqQuery = { ...req.query };

    // Fields to exclude from filtering
    const removeFields = ['select', 'sort', 'page', 'limit', 'search'];
    removeFields.forEach(param => delete reqQuery[param]);

    // Create query string
    let queryStr = JSON.stringify(reqQuery);
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);
    
    let parsedQuery = JSON.parse(queryStr);

    // Text search if provided
    if (req.query.search) {
      parsedQuery.$text = { $search: req.query.search };
    }

    query = Item.find(parsedQuery).populate({
      path: 'postedBy',
      select: 'fullName username profileImage'
    });

    // Sort
    if (req.query.sort) {
      const sortBy = req.query.sort.split(',').join(' ');
      query = query.sort(sortBy);
    } else {
      query = query.sort('-createdAt');
    }

    const items = await query;

    res.status(200).json({
      success: true,
      count: items.length,
      data: items
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
      select: 'fullName username profileImage email'
    });

    if (!item) {
      res.status(404);
      throw new Error(`Item not found with id of ${req.params.id}`);
    }

    res.status(200).json({
      success: true,
      data: item
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create new item
// @route   POST /api/items
// @access  Private
exports.createItem = async (req, res, next) => {
  try {
    // Add user to req.body
    req.body.postedBy = req.user.id;

    const item = await Item.create(req.body);

    // REAL-TIME MATCHING ALGORITHM
    if (item.status === 'found') {
      try {
        // Search for lost items in the same category that might match the text
        const matches = await Item.find({
          status: 'lost',
          category: item.category,
          $text: { $search: item.title + ' ' + item.description }
        }).populate('postedBy', 'email fullName');

        for (let match of matches) {
          if (match.postedBy && match.postedBy.email) {
            const matchUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/item/${item._id}`;
            const message = `Hello ${match.postedBy.fullName},\n\nGood news! Someone recently found an item that might match the "${match.title}" you reported as lost.\n\nPlease check the dashboard to view the found item.`;

            // In-app notification
            await Notification.create({
              user: match.postedBy._id,
              type: 'match_found',
              title: 'Potential Match Found!',
              message: `A recently reported found item may match your lost "${match.title}". Check it out!`,
              link: `/item/${item._id}`,
            });

            await sendEmail({
              email: match.postedBy.email,
              subject: 'Potential Match for your Lost Item! - CIRS',
              message,
              html: `
                <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto;">
                  <h1 style="color: #002147;">Potential Match Found!</h1>
                  <p>Hi ${match.postedBy.fullName},</p>
                  <p>Good news! Someone recently reported a found item that matches the category and keywords of your lost <strong>${match.title}</strong>.</p>
                  <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 25px 0; border: 1px solid #e2e8f0;">
                    <h3 style="margin-top: 0; color: #0f172a;">Found Item Details:</h3>
                    <p style="margin-bottom: 5px;"><strong>Title:</strong> ${item.title}</p>
                    <p style="margin-bottom: 5px;"><strong>Location:</strong> ${item.location}</p>
                    <p style="margin-bottom: 0;"><strong>Date:</strong> ${new Date(item.date).toLocaleDateString()}</p>
                  </div>
                  <p>Please click the button below to view the found item. If it is yours, you can submit a claim to answer the verification questions:</p>
                  <a href="${matchUrl}" style="background-color: #002147; color: #FFD700; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; margin-top: 15px;">View Found Item</a>
                  <p style="margin-top: 30px; font-size: 12px; color: #64748b;">If this is a mistake, please ignore this email.</p>
                </div>
              `
            });
          }
        }
      } catch (matchErr) {
        // Log error but don't fail the item creation request
        console.error("Matching algorithm error:", matchErr);
      }
    }

    res.status(201).json({
      success: true,
      data: item
    });
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

    // Make sure user is item owner or admin
    if (item.postedBy.toString() !== req.user.id && req.user.role !== 'admin') {
      res.status(403);
      throw new Error(`User ${req.user.id} is not authorized to update this item`);
    }

    item = await Item.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: item
    });
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

    // Make sure user is item owner or admin
    if (item.postedBy.toString() !== req.user.id && req.user.role !== 'admin') {
      res.status(403);
      throw new Error(`User ${req.user.id} is not authorized to delete this item`);
    }

    await item.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};
