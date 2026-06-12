const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');

const cleanup = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected...');
    
    const result = await User.deleteMany({ isVerified: false });
    console.log(`Cleaned up ${result.deletedCount} unverified users from previous failed attempts.`);
    
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

cleanup();
