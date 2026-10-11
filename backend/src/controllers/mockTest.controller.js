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

/**
 * Helper: Evaluate answers and calculate score & breakdown
 */
const evaluateTestAnswers = (test, answers = {}) => {
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
      marksAwarded = q.marks !== undefined ? q.marks : (test.marksPerQuestion || 1);
      calculatedScore += marksAwarded;
      correctCount++;
    } else if (isSelected) {
      isCorrect = false;
      const negMarks = q.negativeMarks !== undefined ? q.negativeMarks : (test.negativeMarks !== undefined ? test.negativeMarks : 0.33);
      marksAwarded = -negMarks;
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
  const totalMarks = test.totalMarks || (test.questions.length * 1);
  const percentage = totalMarks > 0 ? Math.max(0, Math.round(((finalScore / totalMarks) * 100) * 100) / 100) : 0;
  const isPassed = percentage >= (test.passingPercentage || 40);

  return {
    score: finalScore,
    totalMarks,
    percentage,
    isPassed,
    correctCount,
    incorrectCount,
    unattemptedCount,
    evaluatedAnswers,
  };
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
    const test = await MockTest.findById(req.params.id)
      .select('-questions.correctOptionIndex -questions.explanation')
      .lean();

    if (!test) {
      return sendError(res, 404, 'Mock test not found.');
    }

    return sendSuccess(res, 200, 'Mock test fetched successfully.', { test });
  } catch (error) {
    console.error('Error fetching mock test:', error);
    return sendError(res, 500, 'Failed to fetch mock test.');
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
      return sendError(res, 400, 'Title is required.');
    }

    const validCategories = ['SSC', 'Banking', 'UPSC', 'Railway', 'GATE', 'State Government Exams', 'General / Other'];
    if (!category || !validCategories.includes(category)) {
      return sendError(res, 400, 'Exam category is required.');
    }

    const parsedDuration = parseInt(durationMinutes, 10);
    if (isNaN(parsedDuration) || parsedDuration < 1 || parsedDuration > 300) {
      return sendError(res, 400, 'Duration must be between 1 and 300 minutes.');
    }

    if (!Array.isArray(questions) || questions.length === 0) {
      return sendError(res, 400, 'At least one question is required to create a mock test.');
    }

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

// =========================================================================
// SESSION MANAGEMENT (SECURITY, RESUME SYSTEM & ACTIVITY TRACKING)
// =========================================================================

export const getSessionStatus = async (req, res) => {
  try {
    const testId = req.params.id;
    const test = await MockTest.findById(testId).lean();
    if (!test) return sendError(res, 404, 'Mock test not found.');

    const session = await MockTestAttempt.findOne({
      user: req.user._id,
      mockTest: testId,
      status: { $in: ['in_progress', 'interrupted'] },
    }).sort({ createdAt: -1 });

    if (!session) {
      return sendSuccess(res, 200, 'No active test session.', { hasActiveSession: false });
    }

    const now = Date.now();
    const deadlineTime = session.deadline ? new Date(session.deadline).getTime() : (new Date(session.startedAt).getTime() + (session.durationMinutes || 15) * 60 * 1000);
    const remainingSeconds = Math.max(0, Math.round((deadlineTime - now) / 1000));

    if (remainingSeconds <= 0) {
      // Auto-expire session
      const evaluation = evaluateTestAnswers(test, session.savedAnswers || {});
      session.status = 'expired';
      session.submittedAt = new Date(deadlineTime);
      session.score = evaluation.score;
      session.totalMarks = evaluation.totalMarks;
      session.percentage = evaluation.percentage;
      session.isPassed = evaluation.isPassed;
      session.correctCount = evaluation.correctCount;
      session.incorrectCount = evaluation.incorrectCount;
      session.unattemptedCount = evaluation.unattemptedCount;
      session.timeSpentSeconds = (session.durationMinutes || 15) * 60;
      session.answers = evaluation.evaluatedAnswers;
      session.activityEvents.push({
        type: 'test_expired',
        timestamp: new Date(deadlineTime),
        details: 'Time expired - test automatically finalized by server',
      });
      await session.save();

      return sendSuccess(res, 200, 'Session has expired.', {
        hasActiveSession: false,
        isExpired: true,
        attemptId: session._id,
      });
    }

    return sendSuccess(res, 200, 'Active test session found.', {
      hasActiveSession: true,
      session: {
        _id: session._id,
        status: session.status,
        startedAt: session.startedAt,
        deadline: session.deadline,
        remainingSeconds,
        durationMinutes: session.durationMinutes,
        resumeCount: session.resumeCount || 0,
        maxResumesAllowed: session.maxResumesAllowed || 4,
        resumesRemaining: Math.max(0, (session.maxResumesAllowed || 4) - (session.resumeCount || 0)),
        savedAnswers: session.savedAnswers || {},
        currentQuestionIndex: session.currentQuestionIndex || 0,
        tabSwitchCount: session.tabSwitchCount || 0,
        totalTimeAwaySeconds: session.totalTimeAwaySeconds || 0,
        fullscreenExitCount: session.fullscreenExitCount || 0,
        activityEvents: session.activityEvents || [],
      },
    });
  } catch (error) {
    console.error('Error in getSessionStatus:', error);
    return sendError(res, 500, 'Failed to check session status.');
  }
};

export const startTestSession = async (req, res) => {
  try {
    const testId = req.params.id;
    const test = await MockTest.findById(testId);
    if (!test) return sendError(res, 404, 'Mock test not found.');

    const now = Date.now();

    // Check for existing active session
    let existingSession = await MockTestAttempt.findOne({
      user: req.user._id,
      mockTest: testId,
      status: { $in: ['in_progress', 'interrupted'] },
    }).sort({ createdAt: -1 });

    if (existingSession) {
      const deadlineTime = existingSession.deadline
        ? new Date(existingSession.deadline).getTime()
        : (new Date(existingSession.startedAt).getTime() + (existingSession.durationMinutes || 15) * 60 * 1000);
      const remainingSeconds = Math.max(0, Math.round((deadlineTime - now) / 1000));

      if (remainingSeconds > 0) {
        return sendSuccess(res, 200, 'Active session already exists.', {
          session: {
            _id: existingSession._id,
            status: existingSession.status,
            startedAt: existingSession.startedAt,
            deadline: existingSession.deadline,
            remainingSeconds,
            durationMinutes: existingSession.durationMinutes,
            resumeCount: existingSession.resumeCount || 0,
            maxResumesAllowed: existingSession.maxResumesAllowed || 4,
            resumesRemaining: Math.max(0, (existingSession.maxResumesAllowed || 4) - (existingSession.resumeCount || 0)),
            savedAnswers: existingSession.savedAnswers || {},
            currentQuestionIndex: existingSession.currentQuestionIndex || 0,
            tabSwitchCount: existingSession.tabSwitchCount || 0,
            totalTimeAwaySeconds: existingSession.totalTimeAwaySeconds || 0,
            fullscreenExitCount: existingSession.fullscreenExitCount || 0,
            activityEvents: existingSession.activityEvents || [],
          },
          isExisting: true,
        });
      } else {
        // Expire old session
        const evalOld = evaluateTestAnswers(test, existingSession.savedAnswers || {});
        existingSession.status = 'expired';
        existingSession.submittedAt = new Date(deadlineTime);
        existingSession.score = evalOld.score;
        existingSession.totalMarks = evalOld.totalMarks;
        existingSession.percentage = evalOld.percentage;
        existingSession.isPassed = evalOld.isPassed;
        existingSession.correctCount = evalOld.correctCount;
        existingSession.incorrectCount = evalOld.incorrectCount;
        existingSession.unattemptedCount = evalOld.unattemptedCount;
        existingSession.timeSpentSeconds = (existingSession.durationMinutes || 15) * 60;
        existingSession.answers = evalOld.evaluatedAnswers;
        await existingSession.save();
      }
    }

    const durationMinutes = test.durationMinutes || 15;
    const deadline = new Date(now + durationMinutes * 60 * 1000);

    const newSession = new MockTestAttempt({
      user: req.user._id,
      mockTest: test._id,
      status: 'in_progress',
      startedAt: new Date(now),
      deadline,
      durationMinutes,
      resumeCount: 0,
      maxResumesAllowed: 4,
      resumes: [],
      activityEvents: [
        {
          type: 'test_started',
          timestamp: new Date(now),
          details: 'Test officially started after instructions confirmation',
        },
      ],
      tabSwitchCount: 0,
      totalTimeAwaySeconds: 0,
      fullscreenExitCount: 0,
      savedAnswers: {},
      currentQuestionIndex: 0,
    });

    await newSession.save();

    return sendSuccess(res, 201, 'Test session created successfully.', {
      session: {
        _id: newSession._id,
        status: newSession.status,
        startedAt: newSession.startedAt,
        deadline: newSession.deadline,
        remainingSeconds: durationMinutes * 60,
        durationMinutes,
        resumeCount: 0,
        maxResumesAllowed: 4,
        resumesRemaining: 4,
        savedAnswers: {},
        currentQuestionIndex: 0,
        tabSwitchCount: 0,
        totalTimeAwaySeconds: 0,
        fullscreenExitCount: 0,
        activityEvents: newSession.activityEvents,
      },
      isExisting: false,
    });
  } catch (error) {
    console.error('Error starting test session:', error);
    return sendError(res, 500, 'Failed to start test session.');
  }
};

export const saveSessionAnswer = async (req, res) => {
  try {
    const testId = req.params.id;
    const { questionIndex, selectedOption, currentQuestionIndex } = req.body;

    const saveQuery = {
      user: req.user._id,
      mockTest: testId,
      status: { $in: ['in_progress', 'interrupted'] },
    };
    if (req.body.sessionId) saveQuery._id = req.body.sessionId;
    const session = await MockTestAttempt.findOne(saveQuery).sort({ createdAt: -1 });

    if (!session) return sendError(res, 404, 'No active test session found.');

    const now = Date.now();
    if (session.deadline && new Date(session.deadline).getTime() < now) {
      return sendError(res, 400, 'Test time has expired. Cannot save further answers.');
    }

    if (!session.savedAnswers || typeof session.savedAnswers !== 'object') {
      session.savedAnswers = {};
    }

    if (selectedOption === null || selectedOption === -1 || selectedOption === undefined) {
      delete session.savedAnswers[String(questionIndex)];
      delete session.savedAnswers[questionIndex];
    } else {
      session.savedAnswers[String(questionIndex)] = Number(selectedOption);
    }

    if (currentQuestionIndex !== undefined) {
      session.currentQuestionIndex = Number(currentQuestionIndex);
    }

    session.markModified('savedAnswers');
    await session.save();

    return sendSuccess(res, 200, 'Answer saved successfully.', {
      savedAnswers: session.savedAnswers,
    });
  } catch (error) {
    console.error('Error saving session answer:', error);
    return sendError(res, 500, 'Failed to save session answer.');
  }
};

export const recordSessionActivity = async (req, res) => {
  try {
    const testId = req.params.id;
    const { type, leftAt, returnedAt, durationSeconds, details } = req.body;

    const saveQuery = {
      user: req.user._id,
      mockTest: testId,
      status: { $in: ['in_progress', 'interrupted'] },
    };
    if (req.body.sessionId) saveQuery._id = req.body.sessionId;
    const session = await MockTestAttempt.findOne(saveQuery).sort({ createdAt: -1 });

    if (!session) return sendError(res, 404, 'No active test session found.');

    const eventTimestamp = leftAt ? new Date(leftAt) : new Date();
    const returnTimestamp = returnedAt ? new Date(returnedAt) : undefined;
    const duration = Math.max(0, Math.round(Number(durationSeconds) || 0));

    session.activityEvents.push({
      type,
      timestamp: eventTimestamp,
      returnedAt: returnTimestamp,
      durationSeconds: duration,
      details: details || '',
    });

    if (type === 'tab_visible' || type === 'tab_hidden') {
      if (type === 'tab_visible') {
        session.tabSwitchCount = (session.tabSwitchCount || 0) + 1;
        if (duration > 0) {
          session.totalTimeAwaySeconds = (session.totalTimeAwaySeconds || 0) + duration;
        }
      }
    } else if (type === 'fullscreen_exit') {
      session.fullscreenExitCount = (session.fullscreenExitCount || 0) + 1;
    } else if (type === 'session_interrupted') {
      session.status = 'interrupted';
    }

    await session.save();

    return sendSuccess(res, 200, 'Activity recorded successfully.', {
      tabSwitchCount: session.tabSwitchCount,
      totalTimeAwaySeconds: session.totalTimeAwaySeconds,
      fullscreenExitCount: session.fullscreenExitCount,
    });
  } catch (error) {
    console.error('Error recording session activity:', error);
    return sendError(res, 500, 'Failed to record session activity.');
  }
};

export const resumeTestSession = async (req, res) => {
  try {
    const testId = req.params.id;
    const saveQuery = {
      user: req.user._id,
      mockTest: testId,
      status: { $in: ['in_progress', 'interrupted'] },
    };
    if (req.body.sessionId) saveQuery._id = req.body.sessionId;
    const session = await MockTestAttempt.findOne(saveQuery).sort({ createdAt: -1 });

    if (!session) return sendError(res, 404, 'No active test session available to resume.');

    const now = Date.now();
    const deadlineTime = session.deadline
      ? new Date(session.deadline).getTime()
      : (new Date(session.startedAt).getTime() + (session.durationMinutes || 15) * 60 * 1000);
    const remainingSeconds = Math.max(0, Math.round((deadlineTime - now) / 1000));

    if (remainingSeconds <= 0) {
      session.status = 'expired';
      session.submittedAt = new Date(deadlineTime);
      const test = await MockTest.findById(testId);
      const evalExpired = evaluateTestAnswers(test, session.savedAnswers || {});
      session.score = evalExpired.score;
      session.totalMarks = evalExpired.totalMarks;
      session.percentage = evalExpired.percentage;
      session.isPassed = evalExpired.isPassed;
      session.correctCount = evalExpired.correctCount;
      session.incorrectCount = evalExpired.incorrectCount;
      session.unattemptedCount = evalExpired.unattemptedCount;
      session.timeSpentSeconds = (session.durationMinutes || 15) * 60;
      session.answers = evalExpired.evaluatedAnswers;
      await session.save();
      return sendError(res, 400, 'Test duration has expired. This session can no longer be resumed.');
    }

    // STRICT RESUME POLICY: Maximum 4 resume attempts per session
    const currentResumes = session.resumeCount || 0;
    const maxAllowed = session.maxResumesAllowed || 4;

    if (currentResumes >= maxAllowed) {
      return sendError(res, 400, `Maximum resume limit of ${maxAllowed} attempts has been reached for this test session.`);
    }

    session.resumeCount = currentResumes + 1;
    session.status = 'in_progress';

    session.resumes.push({
      resumedAt: new Date(now),
      durationAwaySeconds: 0,
      details: `Resume attempt ${session.resumeCount} of ${maxAllowed}`,
    });

    session.activityEvents.push({
      type: 'test_resumed',
      timestamp: new Date(now),
      details: `User resumed the test (Attempt ${session.resumeCount} of ${maxAllowed})`,
    });

    await session.save();

    return sendSuccess(res, 200, 'Session resumed successfully.', {
      session: {
        _id: session._id,
        status: session.status,
        startedAt: session.startedAt,
        deadline: session.deadline,
        remainingSeconds,
        durationMinutes: session.durationMinutes,
        resumeCount: session.resumeCount,
        maxResumesAllowed: maxAllowed,
        resumesRemaining: Math.max(0, maxAllowed - session.resumeCount),
        savedAnswers: session.savedAnswers || {},
        currentQuestionIndex: session.currentQuestionIndex || 0,
        tabSwitchCount: session.tabSwitchCount || 0,
        totalTimeAwaySeconds: session.totalTimeAwaySeconds || 0,
        fullscreenExitCount: session.fullscreenExitCount || 0,
        activityEvents: session.activityEvents || [],
      },
    });
  } catch (error) {
    console.error('Error resuming test session:', error);
    return sendError(res, 500, 'Failed to resume test session.');
  }
};

export const submitMockTest = async (req, res) => {
  try {
    const { answers = {}, timeSpentSeconds = 0 } = req.body;
    const test = await MockTest.findById(req.params.id);

    if (!test) {
      return sendError(res, 404, 'Mock test not found.');
    }

    // Look for active session first
    let session = await MockTestAttempt.findOne({
      user: req.user._id,
      mockTest: test._id,
      status: { $in: ['in_progress', 'interrupted'] },
    }).sort({ createdAt: -1 });

    // Idempotency check: if user already submitted this session
    if (!session) {
      const alreadySubmitted = await MockTestAttempt.findOne({
        user: req.user._id,
        mockTest: test._id,
        status: 'submitted',
      }).sort({ createdAt: -1 });

      // If submitted very recently (within 5 seconds), return existing result
      if (alreadySubmitted && (Date.now() - new Date(alreadySubmitted.submittedAt || alreadySubmitted.createdAt).getTime()) < 5000) {
        return sendSuccess(res, 200, 'Mock test already submitted.', {
          attempt: alreadySubmitted,
        });
      }
    }

    // Merge provided answers with session savedAnswers
    const mergedAnswers = { ...(session?.savedAnswers || {}), ...answers };
    const evaluation = evaluateTestAnswers(test, mergedAnswers);

    const now = Date.now();
    const actualTimeSpent = session?.startedAt
      ? Math.max(1, Math.round((now - new Date(session.startedAt).getTime()) / 1000))
      : (timeSpentSeconds || 60);

    if (session) {
      session.status = 'submitted';
      session.submittedAt = new Date(now);
      session.score = evaluation.score;
      session.totalMarks = evaluation.totalMarks;
      session.percentage = evaluation.percentage;
      session.isPassed = evaluation.isPassed;
      session.correctCount = evaluation.correctCount;
      session.incorrectCount = evaluation.incorrectCount;
      session.unattemptedCount = evaluation.unattemptedCount;
      session.timeSpentSeconds = actualTimeSpent;
      session.answers = evaluation.evaluatedAnswers;
      session.activityEvents.push({
        type: 'test_submitted',
        timestamp: new Date(now),
        details: 'Test officially submitted for final score evaluation',
      });
      await session.save();
    } else {
      // Create fresh submitted attempt
      session = new MockTestAttempt({
        user: req.user._id,
        mockTest: test._id,
        status: 'submitted',
        startedAt: new Date(now - actualTimeSpent * 1000),
        submittedAt: new Date(now),
        score: evaluation.score,
        totalMarks: evaluation.totalMarks,
        percentage: evaluation.percentage,
        isPassed: evaluation.isPassed,
        correctCount: evaluation.correctCount,
        incorrectCount: evaluation.incorrectCount,
        unattemptedCount: evaluation.unattemptedCount,
        timeSpentSeconds: actualTimeSpent,
        answers: evaluation.evaluatedAnswers,
        activityEvents: [
          {
            type: 'test_started',
            timestamp: new Date(now - actualTimeSpent * 1000),
            details: 'Test started',
          },
          {
            type: 'test_submitted',
            timestamp: new Date(now),
            details: 'Test submitted for evaluation',
          },
        ],
      });
      await session.save();
    }

    return sendSuccess(res, 201, 'Mock test submitted successfully.', {
      attempt: {
        _id: session._id,
        mockTestId: test._id,
        mockTestTitle: test.title,
        category: test.category,
        score: session.score,
        totalMarks: session.totalMarks,
        percentage: session.percentage,
        isPassed: session.isPassed,
        passingPercentage: test.passingPercentage || 40,
        correctCount: session.correctCount,
        incorrectCount: session.incorrectCount,
        unattemptedCount: session.unattemptedCount,
        totalQuestions: test.questions.length,
        timeSpentSeconds: session.timeSpentSeconds,
        startedAt: session.startedAt,
        submittedAt: session.submittedAt,
        tabSwitchCount: session.tabSwitchCount || 0,
        totalTimeAwaySeconds: session.totalTimeAwaySeconds || 0,
        fullscreenExitCount: session.fullscreenExitCount || 0,
        resumeCount: session.resumeCount || 0,
        maxResumesAllowed: session.maxResumesAllowed || 4,
        resumesRemaining: Math.max(0, (session.maxResumesAllowed || 4) - (session.resumeCount || 0)),
        activityEvents: session.activityEvents || [],
        answers: session.answers,
        createdAt: session.createdAt,
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

    const maxResumes = attempt.maxResumesAllowed || 4;
    const resumesUsed = attempt.resumeCount || 0;

    return sendSuccess(res, 200, 'Attempt result fetched successfully.', {
      attempt: {
        ...attempt,
        resumesRemaining: Math.max(0, maxResumes - resumesUsed),
        maxResumesAllowed: maxResumes,
        mockTestTitle: attempt.mockTest?.title,
        category: attempt.mockTest?.category,
      },
    });
  } catch (error) {
    console.error('Error fetching test attempt:', error);
    return sendError(res, 500, 'Failed to fetch test attempt.');
  }
};

export const getMyAttempts = async (req, res) => {
  try {
    const attempts = await MockTestAttempt.find({
      user: req.user._id,
      status: { $in: ['submitted', 'expired'] },
    })
      .sort({ createdAt: -1 })
      .populate('mockTest', 'title category')
      .lean();

    return sendSuccess(res, 200, 'Past attempts retrieved.', { attempts });
  } catch (error) {
    console.error('Error fetching attempts:', error);
    return sendError(res, 500, 'Failed to fetch past attempts.');
  }
};
