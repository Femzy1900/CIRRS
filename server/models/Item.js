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
    enum: ['lost', 'found', 'resolved'],
    required: true
  },
  image: {
    type: String,
    default: 'https://images.unsplash.com/photo-1586769852044-692d6e3703a0?auto=format&fit=crop&w=800&q=80'
  },
  postedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  verificationQuestions: [VerificationQuestionSchema],
  contactInfo: {
    phone: String,
    email: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Text index to enable search and matching algorithms
ItemSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('Item', ItemSchema);
