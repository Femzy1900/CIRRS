const mongoose = require('mongoose');

const VerificationQuestionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  answer: { type: String, required: true }
}, { _id: false });

const ItemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a title for the item'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Please add a description'],
    maxlength: [1000, 'Description cannot be more than 1000 characters']
  },
  category: {
    type: String,
    required: [true, 'Please select a category'],
    enum: ['Electronics', 'Documents', 'Personal Effects', 'Keys', 'Bags', 'Money', 'Cards', 'Other']
  },
  location: {
    type: String,
    required: [true, 'Please add the specific location']
  },
  date: {
    type: Date,
    required: [true, 'Please add the date it was lost/found'],
    default: Date.now
  },
  status: {
    type: String,
    enum: ['lost', 'found', 'claimed', 'resolved'],
    required: true
  },
  image: {
    type: String,
    default: 'https://images.unsplash.com/photo-1586769852044-692d6e3703a0?auto=format&fit=crop&w=800&q=80'
  },
  // Cloudinary public_id for the image (used to delete from Cloudinary when item is deleted)
  imagePublicId: {
    type: String,
    default: null
  },
  postedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  // Risk level is auto-assigned from category on every save/update
  riskLevel: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH'],
    default: 'LOW'
  },
  verificationQuestions: [VerificationQuestionSchema],
  contactInfo: {
    phone: String,
    email: String
  },
  // Tracks every "I Found This Item" request — used for dedup and daily-limit checks
  contactRequests: [
    {
      user: { type: mongoose.Schema.ObjectId, ref: 'User' },
      requestedAt: { type: Date, default: Date.now },
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// ── Auto-assign riskLevel on document.save() ──────────────────────────────
ItemSchema.pre('save', function () {
  assignRiskLevel(this.category, this);
});

// ── Auto-assign riskLevel on findOneAndUpdate() (e.g. edit post) ──────────
ItemSchema.pre('findOneAndUpdate', function () {
  const update   = this.getUpdate();
  const category = update?.category || update?.$set?.category;
  if (category) {
    const riskLevel = getRiskLevel(category);
    if (update.$set) {
      update.$set.riskLevel = riskLevel;
    } else {
      update.riskLevel = riskLevel;
    }
  }
});

function getRiskLevel(category) {
  const HIGH_RISK = ['Money', 'Cards'];
  const MED_RISK  = ['Electronics', 'Documents', 'Bags'];
  if (HIGH_RISK.includes(category))  return 'HIGH';
  if (MED_RISK.includes(category))  return 'MEDIUM';
  return 'LOW';
}

function assignRiskLevel(category, doc) {
  doc.riskLevel = getRiskLevel(category);
}

// Text index to enable search and matching algorithms
ItemSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('Item', ItemSchema);
