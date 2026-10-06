import mongoose from 'mongoose';
import env from './env.js';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(env.MONGO_URI, {
      dbName: 'vimeet',
    });
    console.log(`MongoDB connected: ${conn.connection.host} | Database: ${conn.connection.name}`);

    // Drop legacy unique index on mobile if it exists
    try {
      const usersCol = conn.connection.collection('users');
      const indexes = await usersCol.indexes();
      if (indexes.some((idx) => idx.name === 'mobile_1')) {
        await usersCol.dropIndex('mobile_1');
        console.log('[DB] Dropped legacy unique index mobile_1 from users collection');
      }
    } catch {
      // Ignore if index doesn't exist
    }
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    process.exit(1);
  }
};

export default connectDB;
