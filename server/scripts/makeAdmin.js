const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('../models/User');

dotenv.config({ path: path.join(__dirname, '../.env') });

const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL || 'adedokunfemi14@gmail.com';

const makeSuperAdmin = async () => {
  try {
    if (!process.env.MONGO_URI) {
      console.error('MONGO_URI is not defined');
      process.exit(1);
    }

    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected.\n');

    const user = await User.findOne({ email: SUPER_ADMIN_EMAIL });

    if (!user) {
      console.log(`⚠  No user found with email "${SUPER_ADMIN_EMAIL}".`);
      console.log('   Register with that email first (via the app), then run this script.\n');
      process.exit(0);
    }

    user.role = 'admin';
    user.isSuperAdmin = true;
    user.isVerified = true;
    await user.save();

    console.log(`✅  ${user.fullName} (${SUPER_ADMIN_EMAIL}) is now the SUPER ADMIN!`);
    console.log('   role         → admin');
    console.log('   isSuperAdmin → true');
    console.log('   isVerified   → true');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
};

makeSuperAdmin();
