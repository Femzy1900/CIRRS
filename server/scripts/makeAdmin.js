const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('../models/User');

// Load env variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const emailToPromote = 'adedokunfemi14@gmail.com';

const makeAdmin = async () => {
  try {
    if (!process.env.MONGO_URI) {
      console.error('MONGO_URI is not defined in the environment variables');
      process.exit(1);
    }

    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Database connected successfully.');

    const user = await User.findOne({ email: emailToPromote });

    if (!user) {
      console.log(`User with email "${emailToPromote}" not found in the database.`);
      console.log('Please ensure the user has signed up first.');
      process.exit(0);
    }

    user.role = 'admin';
    user.isVerified = true; // Auto-verify the admin as well for convenience
    await user.save();

    console.log(`Successfully promoted ${user.username} (${emailToPromote}) to admin!`);
    process.exit(0);
  } catch (error) {
    console.error('Error promoting user:', error);
    process.exit(1);
  }
};

makeAdmin();
