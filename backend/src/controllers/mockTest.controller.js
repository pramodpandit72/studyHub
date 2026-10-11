import MockTest from '../models/MockTest.js';
import MockTestAttempt from '../models/MockTestAttempt.js';
import { mockTestsSeedData } from '../seeds/mockTest.seed.js';
import { rrbMockTestData } from '../seeds/rrbMockTest.data.js';
import { sendSuccess, sendError } from '../utils/response.js';

// Auto-seed mock tests if collection is empty
const ensureMockTestsSeeded = async () => {
  try {
    const count = await MockTest.countDocuments();
    if (count === 0) {
      await MockTest.insertMany(mockTestsSeedData);
      console.log('Auto-seeded initial mock tests collection.');
    }
    const rrbExists = await MockTest.findOne({ title: /RRB.*TCS.*Style/i });
    if (!rrbExists) {
      await MockTest.create(rrbMockTestData);
      console.log('Auto-seeded RRB TCS Style Full Mock Test.');
    }
  } catch (error) {
    console.error('Failed to auto-seed mock tests:', error);
  }
};

export const getMockTests = async (req, res) => {
  try {
    await ensureMockTestsSeeded();

    const { category, myCreated } = req.query;
    const filter = {};
    if (myCreated === 'true' && req.user) {
      filter.createdBy = req.user._id;
    } else if (category && category !== 'All') {
      filter.category = category;
    }

    const tests = await MockTest.find(filter).sort({ createdAt: -1 }).select('-questions.correctOptionIndex -questions.explanation').lean();

    const formattedTests = tests.map(test => ({
      _id: test._id,
      title: test.title,
      category: test.category,
      description: test.description,
      durationMinutes: test.durationMinutes,
      totalMarks: test.totalMarks || (test.questions?.length * 2),
      passingPercentage: test.passingPercentage || 40,
      difficulty: test.difficulty || 'Medium',
      hasNegativeMarking: test.hasNegativeMarking !== false,
      negativeMarks: test.negativeMarks !== undefined ? test.negativeMarks : 0.5,
      marksPerQuestion: test.marksPerQuestion || 2,
      questionsCount: test.questions?.length || 0,
      createdBy: test.createdBy,
      createdByName: test.createdByName || '',
      isCustom: Boolean(test.isCustom),
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
      negativeMarks: q.negativeMarks !== undefined ? q.negativeMarks : 0.5,
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
      hasNegativeMarking: test.hasNegativeMarking !== false,
      negativeMarks: test.negativeMarks !== undefined ? test.negativeMarks : 0.5,
      marksPerQuestion: test.marksPerQuestion || 2,
      questionsCount: sanitizedQuestions.length,
      createdBy: test.createdBy,
      createdByName: test.createdByName || '',
      isCustom: Boolean(test.isCustom),
      questions: sanitizedQuestions,
    };

    return sendSuccess(res, 200, 'Mock test details retrieved.', { test: responseData });
  } catch (error) {
    console.error('Error fetching mock test details:', error);
    return sendError(res, 500, 'Failed to fetch mock test details.');
  }
};

export const createMockTest = async (req, res) => {
  try {
    const {
      title,
      category,
      description = '',
      durationMinutes = 15,
      passingPercentage = 40,
      difficulty = 'Medium',
      hasNegativeMarking = true,
      negativeMarks = 0.5,
      marksPerQuestion = 2,
      optionsCount = 4,
      questions = [],
    } = req.body;

    if (!title || !title.trim()) {
      return sendError(res, 400, 'Mock test title is required.');
    }

    if (!category) {
      return sendError(res, 400, 'Exam category is required.');
    }

    const parsedDuration = parseInt(durationMinutes, 10);
    if (isNaN(parsedDuration) || parsedDuration < 1 || parsedDuration > 300) {
      return sendError(res, 400, 'Duration must be between 1 and 300 minutes.');
    }

    if (!Array.isArray(questions) || questions.length === 0) {
      return sendError(res, 400, 'At least one question is required to create a mock test.');
    }

    // Validate each question
    const validatedQuestions = [];
    let calculatedTotalMarks = 0;

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.questionText || !q.questionText.trim()) {
        return sendError(res, 400, 'Question ' + (i + 1) + ' must have question text.');
      }

      if (!Array.isArray(q.options) || q.options.length < 2) {
        return sendError(res, 400, 'Question ' + (i + 1) + ' must have at least 2 options.');
      }

      const cleanOptions = q.options.map(opt => (opt !== undefined && opt !== null ? String(opt).trim() : ''));
      if (cleanOptions.some(opt => opt === '')) {
        return sendError(res, 400, 'Question ' + (i + 1) + ' has empty options. Please fill all option fields.');
      }

      const correctIndex = parseInt(q.correctOptionIndex, 10);
      if (isNaN(correctIndex) || correctIndex < 0 || correctIndex >= cleanOptions.length) {
        return sendError(res, 400, 'Question ' + (i + 1) + ' must have a valid correct answer option selected.');
      }

      const qMarks = q.marks !== undefined && !isNaN(Number(q.marks)) ? Math.max(0.5, Number(q.marks)) : Number(marksPerQuestion || 2);
      const qNegMarks = hasNegativeMarking
        ? (q.negativeMarks !== undefined && !isNaN(Number(q.negativeMarks)) ? Math.max(0, Number(q.negativeMarks)) : Number(negativeMarks || 0.5))
        : 0;

      calculatedTotalMarks += qMarks;

      validatedQuestions.push({
        questionText: q.questionText.trim(),
        options: cleanOptions,
        correctOptionIndex: correctIndex,
        marks: qMarks,
        negativeMarks: qNegMarks,
        explanation: q.explanation ? q.explanation.trim() : '',
      });
    }

    const newTest = await MockTest.create({
      title: title.trim(),
      category,
      description: description.trim(),
      durationMinutes: parsedDuration,
      totalMarks: Math.round(calculatedTotalMarks * 100) / 100,
      passingPercentage: Math.min(100, Math.max(1, parseInt(passingPercentage, 10) || 40)),
      difficulty,
      hasNegativeMarking: Boolean(hasNegativeMarking),
      negativeMarks: hasNegativeMarking ? Number(negativeMarks || 0.5) : 0,
      marksPerQuestion: Number(marksPerQuestion || 2),
      optionsCount: Number(optionsCount || 4),
      createdBy: req.user._id,
      createdByName: req.user.name || 'User',
      isCustom: true,
      questions: validatedQuestions,
    });

    return sendSuccess(res, 201, 'Mock test created successfully.', { test: newTest });
  } catch (error) {
    console.error('Error creating mock test:', error);
    return sendError(res, 500, error.message || 'Failed to create mock test.');
  }
};

export const deleteMockTest = async (req, res) => {
  try {
    const test = await MockTest.findById(req.params.id);
    if (!test) {
      return sendError(res, 404, 'Mock test not found.');
    }

    // Only allow deletion by test creator or admin
    if (test.createdBy && test.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'Admin') {
      return sendError(res, 403, 'You are not authorized to delete this mock test.');
    }

    await MockTest.findByIdAndDelete(req.params.id);
    return sendSuccess(res, 200, 'Mock test deleted successfully.');
  } catch (error) {
    console.error('Error deleting mock test:', error);
    return sendError(res, 500, 'Failed to delete mock test.');
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
        marksAwarded = -(q.negativeMarks !== undefined ? q.negativeMarks : 0.5);
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
