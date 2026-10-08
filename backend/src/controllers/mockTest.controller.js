import MockTest from '../models/MockTest.js';
import MockTestAttempt from '../models/MockTestAttempt.js';
import { mockTestsSeedData } from '../seeds/mockTest.seed.js';
import { sendSuccess, sendError } from '../utils/response.js';

// Auto-seed mock tests if collection is empty
const ensureMockTestsSeeded = async () => {
  try {
    const count = await MockTest.countDocuments();
    if (count === 0) {
      await MockTest.insertMany(mockTestsSeedData);
      console.log('Auto-seeded initial mock tests collection with 6 tests.');
    }
  } catch (error) {
    console.error('Failed to auto-seed mock tests:', error);
  }
};

export const getMockTests = async (req, res) => {
  try {
    await ensureMockTestsSeeded();

    const { category } = req.query;
    const filter = {};
    if (category && category !== 'All') {
      filter.category = category;
    }

    const tests = await MockTest.find(filter).select('-questions.correctOptionIndex -questions.explanation').lean();

    const formattedTests = tests.map(test => ({
      _id: test._id,
      title: test.title,
      category: test.category,
      description: test.description,
      durationMinutes: test.durationMinutes,
      totalMarks: test.totalMarks || (test.questions?.length * 2),
      passingPercentage: test.passingPercentage || 40,
      difficulty: test.difficulty || 'Medium',
      questionsCount: test.questions?.length || 0,
      createdAt: test.createdAt,
    }));

    return sendSuccess(res, 200, 'Mock tests retrieved successfully.', { tests: formattedTests });
  } catch (error) {
    console.error('Error fetching mock tests:', error);
    return sendError(res, 500, 'Failed to fetch mock tests.');
  }
};

export const getMockTestById = async (req, res) => {
  try {
    await ensureMockTestsSeeded();

    const test = await MockTest.findById(req.params.id).lean();
    if (!test) {
      return sendError(res, 404, 'Mock test not found.');
    }

    // Sanitize questions: strip out correctOptionIndex and explanation so client cannot inspect active test answers
    const sanitizedQuestions = test.questions.map((q, index) => ({
      questionIndex: index,
      _id: q._id,
      questionText: q.questionText,
      options: q.options,
      marks: q.marks || 2,
      negativeMarks: q.negativeMarks || 0.5,
    }));

    const responseData = {
      _id: test._id,
      title: test.title,
      category: test.category,
      description: test.description,
      durationMinutes: test.durationMinutes,
      totalMarks: test.totalMarks || (test.questions.length * 2),
      passingPercentage: test.passingPercentage || 40,
      difficulty: test.difficulty || 'Medium',
      questionsCount: sanitizedQuestions.length,
      questions: sanitizedQuestions,
    };

    return sendSuccess(res, 200, 'Mock test details retrieved.', { test: responseData });
  } catch (error) {
    console.error('Error fetching mock test details:', error);
    return sendError(res, 500, 'Failed to fetch mock test details.');
  }
};

export const submitMockTest = async (req, res) => {
  try {
    const { answers = {}, timeSpentSeconds = 0 } = req.body;
    const test = await MockTest.findById(req.params.id);

    if (!test) {
      return sendError(res, 404, 'Mock test not found.');
    }

    let calculatedScore = 0;
    let correctCount = 0;
    let incorrectCount = 0;
    let unattemptedCount = 0;
    const evaluatedAnswers = [];

    test.questions.forEach((q, idx) => {
      // answers can be an object { 0: 1, 1: 2 } or array
      const selected = answers[idx] !== undefined ? answers[idx] : (answers[String(idx)] !== undefined ? answers[String(idx)] : -1);
      const isSelected = selected !== null && selected !== -1 && selected !== undefined;

      let isCorrect = false;
      let marksAwarded = 0;

      if (isSelected && Number(selected) === q.correctOptionIndex) {
        isCorrect = true;
        marksAwarded = q.marks || 2;
        calculatedScore += marksAwarded;
        correctCount++;
      } else if (isSelected) {
        isCorrect = false;
        marksAwarded = -(q.negativeMarks || 0.5);
        calculatedScore += marksAwarded;
        incorrectCount++;
      } else {
        isCorrect = false;
        marksAwarded = 0;
        unattemptedCount++;
      }

      evaluatedAnswers.push({
        questionIndex: idx,
        questionText: q.questionText,
        options: q.options,
        selectedOption: isSelected ? Number(selected) : -1,
        correctOption: q.correctOptionIndex,
        isCorrect,
        marksAwarded,
        explanation: q.explanation || '',
      });
    });

    const finalScore = Math.max(0, Math.round(calculatedScore * 100) / 100);
    const totalMarks = test.totalMarks || (test.questions.length * 2);
    const percentage = totalMarks > 0 ? Math.max(0, Math.round(((finalScore / totalMarks) * 100) * 100) / 100) : 0;
    const isPassed = percentage >= (test.passingPercentage || 40);

    const attempt = new MockTestAttempt({
      user: req.user._id,
      mockTest: test._id,
      score: finalScore,
      totalMarks,
      percentage,
      isPassed,
      correctCount,
      incorrectCount,
      unattemptedCount,
      timeSpentSeconds,
      answers: evaluatedAnswers,
    });

    await attempt.save();

    return sendSuccess(res, 201, 'Mock test submitted successfully.', {
      attempt: {
        _id: attempt._id,
        mockTestId: test._id,
        mockTestTitle: test.title,
        category: test.category,
        score: finalScore,
        totalMarks,
        percentage,
        isPassed,
        passingPercentage: test.passingPercentage || 40,
        correctCount,
        incorrectCount,
        unattemptedCount,
        totalQuestions: test.questions.length,
        timeSpentSeconds,
        answers: evaluatedAnswers,
        createdAt: attempt.createdAt,
      },
    });
  } catch (error) {
    console.error('Error submitting mock test:', error);
    return sendError(res, 500, 'Failed to submit mock test.');
  }
};

export const getAttemptResult = async (req, res) => {
  try {
    const attempt = await MockTestAttempt.findById(req.params.attemptId)
      .populate('mockTest', 'title category description durationMinutes passingPercentage')
      .lean();

    if (!attempt) {
      return sendError(res, 404, 'Test attempt result not found.');
    }

    if (attempt.user.toString() !== req.user._id.toString()) {
      return sendError(res, 403, 'Unauthorized to view this attempt result.');
    }

    return sendSuccess(res, 200, 'Attempt result fetched successfully.', { attempt });
  } catch (error) {
    console.error('Error fetching test attempt:', error);
    return sendError(res, 500, 'Failed to fetch test attempt.');
  }
};

export const getMyAttempts = async (req, res) => {
  try {
    const attempts = await MockTestAttempt.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .populate('mockTest', 'title category')
      .lean();

    return sendSuccess(res, 200, 'Past attempts retrieved.', { attempts });
  } catch (error) {
    console.error('Error fetching attempts:', error);
    return sendError(res, 500, 'Failed to fetch past attempts.');
  }
};
