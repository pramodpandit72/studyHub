import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import mongoose from 'mongoose';
import env from '../src/config/env.js';
import MockTest from '../src/models/MockTest.js';
import MockTestAttempt from '../src/models/MockTestAttempt.js';
import { rrbMockTestData } from '../src/seeds/rrbMockTest.data.js';

describe('RRB TCS Style Full Mock Test Verification', () => {
  before(async () => {
    await mongoose.connect(env.MONGO_URI, { dbName: 'studyhub' });
  });

  after(async () => {
    await mongoose.disconnect();
  });

  test('1. RRB Mock Test seed data contains exactly 100 questions with 4 options each', () => {
    assert.strictEqual(rrbMockTestData.title, 'RRB — TCS Style Full Mock Test (Electronics Engineering - Diploma)');
    assert.strictEqual(rrbMockTestData.category, 'Railway');
    assert.strictEqual(rrbMockTestData.durationMinutes, 90);
    assert.strictEqual(rrbMockTestData.totalMarks, 100);
    assert.strictEqual(rrbMockTestData.hasNegativeMarking, true);
    assert.strictEqual(rrbMockTestData.negativeMarks, 0.33);
    assert.strictEqual(rrbMockTestData.questions.length, 100);

    rrbMockTestData.questions.forEach((q, index) => {
      assert.ok(q.questionText && q.questionText.trim().length > 0, `Q${index + 1} has valid text`);
      assert.strictEqual(q.options.length, 4, `Q${index + 1} has exactly 4 options`);
      assert.ok(q.correctOptionIndex >= 0 && q.correctOptionIndex <= 3, `Q${index + 1} has valid correctOptionIndex`);
      assert.ok(q.explanation && q.explanation.length > 0, `Q${index + 1} has explanation`);
    });
  });

  test('2. RRB Mock Test exists in MongoDB database with 100 questions', async () => {
    const testDoc = await MockTest.findOne({ title: /RRB.*TCS.*Style/i });
    assert.ok(testDoc, 'RRB Mock Test must exist in MongoDB');
    assert.strictEqual(testDoc.category, 'Railway');
    assert.strictEqual(testDoc.durationMinutes, 90);
    assert.strictEqual(testDoc.totalMarks, 100);
    assert.strictEqual(testDoc.questions.length, 100);
  });

  test('3. Answer key evaluation: submitting all correct answers yields 100% score', () => {
    const questions = rrbMockTestData.questions;
    let score = 0;
    let correctCount = 0;
    let incorrectCount = 0;

    questions.forEach((q, idx) => {
      const selectedOption = q.correctOptionIndex;
      if (selectedOption === q.correctOptionIndex) {
        score += q.marks;
        correctCount++;
      } else {
        score -= q.negativeMarks;
        incorrectCount++;
      }
    });

    assert.strictEqual(correctCount, 100);
    assert.strictEqual(incorrectCount, 0);
    assert.strictEqual(score, 100);
  });

  test('4. Negative marking penalty calculation: 1 wrong answer deducts exactly 0.33 marks', () => {
    const q = rrbMockTestData.questions[0];
    assert.strictEqual(q.marks, 1);
    assert.strictEqual(q.negativeMarks, 0.33);

    // If 90 correct and 10 incorrect:
    const correct = 90 * 1;
    const penalty = 10 * 0.33;
    const finalScore = Math.max(0, parseFloat((correct - penalty).toFixed(2)));
    assert.strictEqual(finalScore, 86.7);
  });
});
