import mongoose from 'mongoose';
import env from './src/config/env.js';
import MockTest from './src/models/MockTest.js';
import { rrbMockTestData } from './src/seeds/rrbMockTest.data.js';

async function seed() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(env.MONGO_URI, { dbName: 'studyhub' });
    console.log('Connected.');

    const existing = await MockTest.findOne({ title: /RRB.*TCS.*Style/i });
    if (existing) {
      console.log('Existing RRB test found, updating with latest questions...');
      existing.title = rrbMockTestData.title;
      existing.category = rrbMockTestData.category;
      existing.description = rrbMockTestData.description;
      existing.durationMinutes = rrbMockTestData.durationMinutes;
      existing.totalMarks = rrbMockTestData.totalMarks;
      existing.passingPercentage = rrbMockTestData.passingPercentage;
      existing.difficulty = rrbMockTestData.difficulty;
      existing.hasNegativeMarking = rrbMockTestData.hasNegativeMarking;
      existing.negativeMarks = rrbMockTestData.negativeMarks;
      existing.marksPerQuestion = rrbMockTestData.marksPerQuestion;
      existing.optionsCount = rrbMockTestData.optionsCount;
      existing.questions = rrbMockTestData.questions;
      await existing.save();
      console.log(`Updated RRB test successfully: ${existing._id} (${existing.questions.length} questions)`);
    } else {
      console.log('Creating new RRB test...');
      const created = await MockTest.create(rrbMockTestData);
      console.log(`Created RRB test successfully: ${created._id} (${created.questions.length} questions)`);
    }

    const count = await MockTest.countDocuments();
    console.log(`Total mock tests in DB now: ${count}`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
}

seed();
