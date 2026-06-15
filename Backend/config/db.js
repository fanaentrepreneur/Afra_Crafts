import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import User from '../models/User.js';

const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/afra-crafts';
    const conn = await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`MongoDB connected: ${conn.connection.host}`);
    await seedAdminUser();
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    process.exit(1);
  }
};

const seedAdminUser = async () => {
  try {
    const username = process.env.ADMIN_USERNAME?.trim().toLowerCase() || 'admin';
    const password = process.env.ADMIN_PASSWORD || 'craftadmin';
    const existing = await User.findOne({ username });
    if (!existing) {
      const hash = await bcrypt.hash(password, 10);
      await User.create({ username, fullName: 'Administrator', passwordHash: hash, role: 'admin' });
      console.log('Created default admin account:', username);
    }
  } catch (error) {
    console.error('Admin seed error:', error.message);
  }
};

export default connectDB;
