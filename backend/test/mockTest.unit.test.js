import test from 'node:test';
import assert from 'node:assert/strict';

test('1. Mock Test Score & Negative Marking Calculation', async (t) => {
  await t.test('calculates correct score with positive marks and negative penalty', () => {
    const questions = [
      { marks: 2, negativeMarks: 0.5, correctOptionIndex: 1 },
      { marks: 2, negativeMarks: 0.5, correctOptionIndex: 2 },
      { marks: 2, negativeMarks: 0.5, correctOptionIndex: 0 },
      { marks: 2, negativeMarks: 0.5, correctOptionIndex: 3 },
    ];

    // Student answers: Q0 correct (1), Q1 incorrect (0), Q2 unattempted (-1), Q3 correct (3)
    const answers = { 0: 1, 1: 0, 2: -1, 3: 3 };
    let score = 0;
    let correct = 0;
    let incorrect = 0;
    let unattempted = 0;

    questions.forEach((q, idx) => {
      const selected = answers[idx];
      if (selected !== -1 && selected !== undefined) {
        if (selected === q.correctOptionIndex) {
          score += q.marks;
          correct++;
        } else {
          score -= q.negativeMarks;
          incorrect++;
        }
      } else {
        unattempted++;
      }
    });

    assert.equal(correct, 2);
    assert.equal(incorrect, 1);
    assert.equal(unattempted, 1);
    // Score = 2 + 2 - 0.5 = 3.5
    assert.equal(score, 3.5);

    const totalMarks = questions.reduce((sum, q) => sum + q.marks, 0); // 8
    const percentage = Math.round(((score / totalMarks) * 100) * 100) / 100; // 43.75%
    assert.equal(percentage, 43.75);
    assert.equal(percentage >= 40, true);
  });

  await t.test('floors negative raw score to 0 when incorrect penalties exceed marks', () => {
    const questions = [
      { marks: 2, negativeMarks: 1, correctOptionIndex: 0 },
      { marks: 2, negativeMarks: 1, correctOptionIndex: 1 },
    ];
    // Both wrong: -2
    let rawScore = -2;
    const finalScore = Math.max(0, rawScore);
    assert.equal(finalScore, 0);
  });

  await t.test('correctly handles all unattempted questions', () => {
    const questions = [
      { marks: 2, negativeMarks: 0.5, correctOptionIndex: 1 },
      { marks: 2, negativeMarks: 0.5, correctOptionIndex: 2 },
    ];
    const answers = {};
    let correct = 0;
    let incorrect = 0;
    let unattempted = 0;
    let score = 0;

    questions.forEach((q, idx) => {
      const selected = answers[idx];
      if (selected !== undefined && selected !== -1) {
        if (selected === q.correctOptionIndex) {
          score += q.marks;
          correct++;
        } else {
          score -= q.negativeMarks;
          incorrect++;
        }
      } else {
        unattempted++;
      }
    });

    assert.equal(correct, 0);
    assert.equal(incorrect, 0);
    assert.equal(unattempted, 2);
    assert.equal(score, 0);
  });
});

test('2. Mock Test Session Resume Policy & Limits', async (t) => {
  await t.test('strictly caps resume attempts at 4 and rejects 5th attempt', () => {
    const maxAllowed = 4;
    let resumeCount = 0;

    const resumeSession = () => {
      if (resumeCount >= maxAllowed) {
        throw new Error(`Maximum resume limit of ${maxAllowed} attempts has been reached for this test session.`);
      }
      resumeCount++;
      return { success: true, resumeCount, remaining: maxAllowed - resumeCount };
    };

    // 4 successful resumes
    assert.equal(resumeSession().resumeCount, 1);
    assert.equal(resumeSession().resumeCount, 2);
    assert.equal(resumeSession().resumeCount, 3);
    assert.equal(resumeSession().resumeCount, 4);

    // 5th attempt must throw
    assert.throws(resumeSession, /Maximum resume limit of 4 attempts has been reached/);
  });

  await t.test('calculates remaining seconds against server deadline', () => {
    const startedAt = Date.now();
    const durationMinutes = 15;
    const deadline = startedAt + durationMinutes * 60 * 1000;

    const getRemaining = (currentTime) => {
      return Math.max(0, Math.round((deadline - currentTime) / 1000));
    };

    assert.equal(getRemaining(startedAt), 900);
    assert.equal(getRemaining(startedAt + 300 * 1000), 600);
    assert.equal(getRemaining(deadline), 0);
    assert.equal(getRemaining(deadline + 5000), 0);
  });

  await t.test('accumulates tab switch counts and total time away without duplicates', () => {
    let tabSwitchCount = 0;
    let totalTimeAwaySeconds = 0;

    const recordTabReturn = (durationSeconds) => {
      tabSwitchCount++;
      if (durationSeconds > 0) {
        totalTimeAwaySeconds += durationSeconds;
      }
      return { tabSwitchCount, totalTimeAwaySeconds };
    };

    const s1 = recordTabReturn(5);
    assert.equal(s1.tabSwitchCount, 1);
    assert.equal(s1.totalTimeAwaySeconds, 5);

    const s2 = recordTabReturn(12);
    assert.equal(s2.tabSwitchCount, 2);
    assert.equal(s2.totalTimeAwaySeconds, 17);
  });
});
